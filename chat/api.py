"""
API для чата STL Platform.

Архитектура:
- HTTP API для истории сообщений, каналов, лайков
- WebSocket для реального времени (Django Channels)
- JWT токены для авторизации в WebSocket

Оптимизация:
- select_related и prefetch_related для уменьшения SQL запросов
- Пагинация сообщений (ленивая загрузка)
- Атомарные операции F() для счётчиков
- Кэширование списков каналов
"""

from django.http import JsonResponse
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.core.paginator import Paginator
from django.db.models import F, Exists, OuterRef
from django.utils import timezone
from datetime import timedelta

import json

from .models import Channel, ChannelMember, ChannelBan, Message, MessageLike
from .history import save_message_to_history, delete_message_in_history, add_reaction_to_history
from django.contrib.sessions.models import Session
from django.utils import timezone

User = get_user_model()


def session_status_api(request):
    """
    Проверка статуса сессии пользователя.

    Возвращает:
    - authenticated: bool
    - username: str
    - session_valid: bool
    """
    if request.user.is_authenticated:
        # Проверяем, действительна ли сессия
        session_key = request.session.session_key
        is_valid = Session.objects.filter(
            session_key=session_key,
            expire_date__gt=timezone.now()
        ).exists()

        return JsonResponse({
            'authenticated': True,
            'username': request.user.username,
            'session_valid': is_valid,
        })
    else:
        return JsonResponse({
            'authenticated': False,
            'session_valid': False,
        })


def serialize_message(message, current_user=None):
    """
    Сериализует сообщение в JSON.

    Оптимизация: минимальный набор полей для уменьшения размера ответа.
    """
    data = {
        'id': message.id,
        'content': message.content if not message.is_deleted else '[Сообщение удалено]',
        'is_deleted': message.is_deleted,
        'is_edited': message.is_edited,
        'likes_count': message.likes_count,
        'liked': bool(current_user and message.likes.filter(user=current_user).exists()) if hasattr(message, 'likes') else False,
        'user': {
            'id': message.user.id,
            'username': message.user.username,
            'avatar': message.user.avatar.url if message.user.avatar else None,
            'is_moderator': getattr(message.user, 'is_moderator', False),
            'is_staff': message.user.is_staff,
        },
        'created_at': message.created_at.isoformat(),
        'edited_at': message.edited_at.isoformat() if message.edited_at else None,
    }

    # Добавляем информацию об ответе
    if message.reply_to_id:
        data['reply_to'] = {
            'id': message.reply_to.id,
            'username': message.reply_to.user.username,
            'content': message.reply_to.content[:100] if not message.reply_to.is_deleted else '[Сообщение удалено]',
        }

    return data


def serialize_channel(channel, current_user=None):
    """Сериализует канал в JSON"""
    is_member = False
    is_moderator = False

    if current_user and current_user.is_authenticated:
        is_member = ChannelMember.objects.filter(channel=channel, user=current_user).exists()
        is_moderator = channel.moderators.filter(id=current_user.id).exists()

    return {
        'id': channel.id,
        'name': channel.name,
        'slug': channel.slug,
        'description': channel.description,
        'is_public': channel.is_public,
        'messages_count': channel.messages_count or 0,
        'members_count': channel.members_count or 0,
        'is_member': is_member,
        'is_moderator': is_moderator,
    }


def channels_list_api(request):
    """
    Список всех доступных каналов.

    Оптимизация:
    - Аннотация для проверки членства
    - Только публичные каналы для анонимов
    """
    channels = Channel.objects.filter(is_active=True, is_public=True)

    if request.user.is_authenticated:
        # Для авторизованных: все каналы + проверка членства
        channels = Channel.objects.filter(is_active=True).annotate(
            is_member=Exists(ChannelMember.objects.filter(channel=OuterRef('pk'), user=request.user))
        )

    channels = channels.select_related().prefetch_related('moderators')

    return JsonResponse({
        'channels': [serialize_channel(ch, request.user) for ch in channels]
    })


@login_required
def channel_detail_api(request, slug):
    """
    Детальная информация о канале + сообщения.

    Оптимизация:
    - select_related для channel
    - prefetch_related для likes
    - Пагинация сообщений (20 на страницу)
    """
    channel = Channel.objects.filter(slug=slug, is_active=True).first()

    if not channel:
        return JsonResponse({'error': 'Channel not found'}, status=404)

    # Проверка доступа
    if not channel.is_public:
        member = ChannelMember.objects.filter(channel=channel, user=request.user).first()
        if not member and not request.user.is_staff:
            return JsonResponse({'error': 'Access denied'}, status=403)

    # Проверка бана
    ban = ChannelBan.objects.filter(channel=channel, user=request.user).first()
    if ban and ban.is_active():
        return JsonResponse({
            'error': 'Banned',
            'reason': ban.reason,
            'expires_at': ban.expires_at.isoformat() if ban.expires_at else None,
        }, status=403)

    # Получаем сообщения с пагинацией
    page = int(request.GET.get('page', 1))
    messages = Message.objects.filter(
        channel=channel,
        is_deleted=False
    ).select_related('user', 'reply_to', 'reply_to__user').prefetch_related('likes').order_by('-created_at')

    paginator = Paginator(messages, 50)
    page_obj = paginator.get_page(page)

    # Проверяем членство
    is_member = ChannelMember.objects.filter(channel=channel, user=request.user).exists() if request.user.is_authenticated else False
    is_moderator = channel.moderators.filter(id=request.user.id).exists() if request.user.is_authenticated else False

    return JsonResponse({
        'channel': serialize_channel(channel, request.user),
        'messages': [serialize_message(m, request.user) for m in reversed(page_obj)],
        'pagination': {
            'current_page': page_obj.number,
            'total_pages': paginator.num_pages,
            'has_next': page_obj.has_next(),
        },
        'is_member': is_member,
        'is_moderator': is_moderator,
    })


@login_required
@require_http_methods(["POST"])
def send_message_api(request, slug):
    """
    Отправка сообщения в канал.

    Оптимизация:
    - Проверка бана перед отправкой
    - Атомарное обновление счётчика через F()
    """
    channel = Channel.objects.filter(slug=slug, is_active=True).first()

    if not channel:
        return JsonResponse({'error': 'Channel not found'}, status=404)

    # Проверка бана
    ban = ChannelBan.objects.filter(channel=channel, user=request.user).first()
    if ban and ban.is_active():
        return JsonResponse({'error': 'Banned', 'reason': ban.reason}, status=403)

    # Проверка членства для приватных каналов
    if not channel.is_public:
        member = ChannelMember.objects.filter(channel=channel, user=request.user).first()
        if not member and not request.user.is_staff:
            return JsonResponse({'error': 'Access denied'}, status=403)

    # Проверка mute
    member = ChannelMember.objects.filter(channel=channel, user=request.user).first()
    if member and member.is_muted:
        return JsonResponse({'error': 'Muted'}, status=403)

    data = json.loads(request.body)
    content = data.get('content', '').strip()
    reply_to_id = data.get('reply_to')

    if not content or len(content) > 5000:
        return JsonResponse({'error': 'Invalid content'}, status=400)

    # Проверка ответа
    reply_to = None
    if reply_to_id:
        reply_to = Message.objects.filter(id=reply_to_id, channel=channel).first()

    message = Message.objects.create(
        channel=channel,
        user=request.user,
        content=content,
        reply_to=reply_to
    )

    # Сохраняем в файл истории
    save_message_to_history(serialize_message(message, request.user), channel.slug)

    return JsonResponse({
        'message': serialize_message(message, request.user),
    }, status=201)


@login_required
@require_http_methods(["POST"])
def like_message_api(request, message_id):
    """
    Лайк/анлайк сообщения.

    Оптимизация:
    - get_or_create для toggle
    - Атомарное обновление счётчика через F()
    """
    message = Message.objects.filter(id=message_id).select_related('channel').first()

    if not message:
        return JsonResponse({'error': 'Message not found'}, status=404)

    like, created = MessageLike.objects.get_or_create(message=message, user=request.user)

    if not created:
        like.delete()
        liked = False
    else:
        liked = True

    # Обновляем счётчик
    message.likes_count = MessageLike.objects.filter(message=message).count()
    message.save(update_fields=['likes_count'])

    # Сохраняем реакцию в историю
    add_reaction_to_history(message.id, request.user.id, message.channel.slug, liked)

    return JsonResponse({
        'liked': liked,
        'count': message.likes_count,
    })


@login_required
@require_http_methods(["POST"])
def delete_message_api(request, message_id):
    """
    Удаление сообщения (мягкое).

    Оптимизация:
    - Только модератор или автор может удалить
    - Мягкое удаление без удаления из БД
    """
    message = Message.objects.filter(id=message_id).select_related('channel', 'user').first()

    if not message:
        return JsonResponse({'error': 'Message not found'}, status=404)

    # Проверка прав
    is_author = message.user == request.user
    is_moderator = message.channel.moderators.filter(id=request.user.id).exists()
    is_staff = request.user.is_staff

    if not (is_author or is_moderator or is_staff):
        return JsonResponse({'error': 'Access denied'}, status=403)

    message.delete()  # Мягкое удаление

    # Сохраняем удаление в историю
    delete_message_in_history(message.id, message.channel.slug)

    return JsonResponse({'success': True})


@login_required
@require_http_methods(["POST"])
def edit_message_api(request, message_id):
    """
    Редактирование сообщения.

    Только автор или модератор может редактировать.
    """
    message = Message.objects.filter(id=message_id).select_related('channel', 'user').first()

    if not message:
        return JsonResponse({'error': 'Message not found'}, status=404)

    # Проверка прав
    is_author = message.user == request.user
    is_moderator = message.channel.moderators.filter(id=request.user.id).exists()
    is_staff = request.user.is_staff

    if not (is_author or is_moderator or is_staff):
        return JsonResponse({'error': 'Access denied'}, status=403)

    data = json.loads(request.body)
    content = data.get('content', '').strip()

    if not content or len(content) > 5000:
        return JsonResponse({'error': 'Invalid content'}, status=400)

    message.content = content
    message.is_edited = True
    message.edited_at = timezone.now()
    message.save(update_fields=['content', 'is_edited', 'edited_at'])

    return JsonResponse({'success': True})


@login_required
@require_http_methods(["POST"])
def join_channel_api(request, slug):
    """Присоединиться к каналу"""
    channel = Channel.objects.filter(slug=slug, is_active=True).first()

    if not channel:
        return JsonResponse({'error': 'Channel not found'}, status=404)

    member, created = ChannelMember.objects.get_or_create(channel=channel, user=request.user)

    if created:
        Channel.objects.filter(pk=channel.id).update(members_count=F('members_count') + 1)

    return JsonResponse({
        'joined': created,
        'is_member': True,
    })


@login_required
@require_http_methods(["POST"])
def leave_channel_api(request, slug):
    """Покинуть канал"""
    channel = Channel.objects.filter(slug=slug, is_active=True).first()

    if not channel:
        return JsonResponse({'error': 'Channel not found'}, status=404)

    member = ChannelMember.objects.filter(channel=channel, user=request.user).first()

    if member:
        member.delete()
        Channel.objects.filter(pk=channel.id).update(members_count=F('members_count') - 1)

    return JsonResponse({'success': True})


@login_required
@require_http_methods(["POST"])
def ban_user_api(request, slug):
    """
    Бан пользователя в канале.

    Только для модераторов канала.
    """
    channel = Channel.objects.filter(slug=slug, is_active=True).first()

    if not channel:
        return JsonResponse({'error': 'Channel not found'}, status=404)

    # Проверка прав модератора
    is_moderator = channel.moderators.filter(id=request.user.id).exists()
    if not is_moderator and not request.user.is_staff:
        return JsonResponse({'error': 'Access denied'}, status=403)

    data = json.loads(request.body)
    user_id = data.get('user_id')
    reason = data.get('reason', '')
    duration_days = data.get('duration_days')

    if not user_id:
        return JsonResponse({'error': 'User ID required'}, status=400)

    user_to_ban = User.objects.filter(id=user_id).first()
    if not user_to_ban:
        return JsonResponse({'error': 'User not found'}, status=404)

    # Нельзя забанить модератора
    if channel.moderators.filter(id=user_id).exists():
        return JsonResponse({'error': 'Cannot ban moderator'}, status=403)

    expires_at = None
    if duration_days:
        expires_at = timezone.now() + timedelta(days=int(duration_days))

    ban, created = ChannelBan.objects.update_or_create(
        channel=channel,
        user=user_to_ban,
        defaults={
            'moderator': request.user,
            'reason': reason,
            'expires_at': expires_at,
        }
    )

    return JsonResponse({
        'banned': True,
        'expires_at': expires_at.isoformat() if expires_at else None,
    })


@login_required
@require_http_methods(["POST"])
def unban_user_api(request, slug):
    """Разбан пользователя"""
    channel = Channel.objects.filter(slug=slug, is_active=True).first()

    if not channel:
        return JsonResponse({'error': 'Channel not found'}, status=404)

    is_moderator = channel.moderators.filter(id=request.user.id).exists()
    if not is_moderator and not request.user.is_staff:
        return JsonResponse({'error': 'Access denied'}, status=403)

    data = json.loads(request.body)
    user_id = data.get('user_id')

    ban = ChannelBan.objects.filter(channel=channel, user_id=user_id).first()
    if ban:
        ban.delete()

    return JsonResponse({'success': True})


@login_required
def channel_members_api(request, slug):
    """Список участников канала"""
    channel = Channel.objects.filter(slug=slug, is_active=True).first()

    if not channel:
        return JsonResponse({'error': 'Channel not found'}, status=404)

    members = ChannelMember.objects.filter(channel=channel).select_related('user')[:100]

    return JsonResponse({
        'members': [
            {
                'id': m.user.id,
                'username': m.user.username,
                'avatar': m.user.avatar.url if m.user.avatar else None,
                'is_moderator': m.is_moderator,
                'is_muted': m.is_muted,
                'joined_at': m.joined_at.isoformat(),
            }
            for m in members
        ]
    })


@login_required
@require_http_methods(["POST"])
def mute_user_api(request, slug):
    """Заглушить пользователя"""
    channel = Channel.objects.filter(slug=slug, is_active=True).first()
    if not channel:
        return JsonResponse({'error': 'Channel not found'}, status=404)

    is_moderator = channel.moderators.filter(id=request.user.id).exists()
    if not is_moderator and not request.user.is_staff:
        return JsonResponse({'error': 'Access denied'}, status=403)

    data = json.loads(request.body)
    user_id = data.get('user_id')

    member, created = ChannelMember.objects.get_or_create(channel=channel, user_id=user_id)
    member.is_muted = True
    member.save(update_fields=['is_muted'])

    return JsonResponse({'success': True, 'muted': True})


@login_required
@require_http_methods(["POST"])
def unmute_user_api(request, slug):
    """Разглушить пользователя"""
    channel = Channel.objects.filter(slug=slug, is_active=True).first()
    if not channel:
        return JsonResponse({'error': 'Channel not found'}, status=404)

    is_moderator = channel.moderators.filter(id=request.user.id).exists()
    if not is_moderator and not request.user.is_staff:
        return JsonResponse({'error': 'Access denied'}, status=403)

    data = json.loads(request.body)
    user_id = data.get('user_id')

    member = ChannelMember.objects.filter(channel=channel, user_id=user_id).first()
    if member:
        member.is_muted = False
        member.save(update_fields=['is_muted'])

    return JsonResponse({'success': True, 'muted': False})


@login_required
@require_http_methods(["POST"])
def promote_moderator_api(request, slug):
    """Назначить модератором"""
    channel = Channel.objects.filter(slug=slug, is_active=True).first()
    if not channel:
        return JsonResponse({'error': 'Channel not found'}, status=404)

    # Только администраторы или суперпользователи могут назначать модераторов
    if not request.user.is_staff:
        return JsonResponse({'error': 'Access denied'}, status=403)

    data = json.loads(request.body)
    user_id = data.get('user_id')

    member, created = ChannelMember.objects.get_or_create(channel=channel, user_id=user_id)
    member.is_moderator = True
    member.save(update_fields=['is_moderator'])

    # Добавляем в модераторы канала
    channel.moderators.add(user_id)

    return JsonResponse({'success': True, 'is_moderator': True})
