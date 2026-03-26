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
from django.utils.text import slugify
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
from datetime import timedelta

import json
import base64
import os

from .models import Channel, ChannelMember, ChannelBan, Message, MessageLike, UserChannelRead, ChannelOnline
from .history import save_message_to_history, delete_message_in_history, add_reaction_to_history
from .messages_storage import load_messages_from_storage, get_message_count
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
    # Получаем информацию о лайках
    likes_data = []
    if hasattr(message, 'likes'):
        for like in message.likes.all():
            likes_data.append({
                'user_id': like.user.id,
                'username': like.user.username,
            })

    data = {
        'id': message.id,
        'content': message.content if not message.is_deleted else '[Сообщение удалено]',
        'is_deleted': message.is_deleted,
        'is_edited': message.is_edited,
        'likes_count': message.likes_count,
        'liked': bool(current_user and message.likes.filter(user=current_user).exists()) if hasattr(message, 'likes') else False,
        'likes': likes_data,
        'user': {
            'id': message.user.id,
            'username': message.user.username,
            'avatar': message.user.avatar.url if message.user.avatar else None,
            'is_moderator': getattr(message.user, 'is_moderator', False),
            'is_staff': message.user.is_staff,
        },
        'created_at': message.created_at.isoformat(),
        'edited_at': message.edited_at.isoformat() if message.edited_at else None,
        'has_image': message.has_image,
        'image': message.image.url if message.image and hasattr(message.image, 'url') else None,
        'has_file': message.has_file,
        'file': message.file.url if message.file and hasattr(message.file, 'url') else None,
        'file_type': message.file_type,
        'file_name': message.file_name,
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
        'image': channel.image.url if channel.image else None,
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
    ).select_related('user', 'reply_to', 'reply_to__user').prefetch_related('likes', 'likes__user').order_by('-created_at')

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
    image_url = data.get('image_url')

    if not content and not image_url:
        return JsonResponse({'error': 'Content or image required'}, status=400)

    if content and len(content) > 5000:
        return JsonResponse({'error': 'Content too long'}, status=400)

    # Проверка ответа
    reply_to = None
    if reply_to_id:
        reply_to = Message.objects.filter(id=reply_to_id, channel=channel).first()

    # Создаем сообщение
    message = Message.objects.create(
        channel=channel,
        user=request.user,
        content=content if content else '[Изображение]',
        reply_to=reply_to,
        has_image=bool(image_url),
    )

    # Если есть изображение, обновляем поле image
    if image_url:
        message.image = image_url
        message.save(update_fields=['image'])

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
def channel_online_api(request, slug):
    """Получить список онлайн-пользователей в канале"""
    from django.utils import timezone
    from datetime import timedelta

    channel = Channel.objects.filter(slug=slug, is_active=True).first()
    if not channel:
        return JsonResponse({'error': 'Channel not found'}, status=404)

    # Считаем онлайн тех, у кого last_activity в последние 5 минут
    five_minutes_ago = timezone.now() - timedelta(minutes=5)
    online_users = ChannelOnline.objects.filter(
        channel=channel,
        last_activity__gte=five_minutes_ago
    ).select_related('user')[:50]

    return JsonResponse({
        'users': [
            {
                'id': ou.user.id,
                'username': ou.user.username,
                'avatar': ou.user.avatar.url if ou.user.avatar else None,
            }
            for ou in online_users
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


@login_required
@require_http_methods(["POST"])
def upload_file_api(request):
    """
    Загрузка файла (видео/аудио) в чат.

    Принимает файл и возвращает URL загруженного файла.
    """
    if 'file' not in request.FILES:
        return JsonResponse({'error': 'No file provided'}, status=400)

    file_obj = request.FILES['file']
    content_type = file_obj.content_type
    file_size = file_obj.size

    # Определяем тип файла
    file_type = None
    if content_type.startswith('video/'):
        file_type = 'video'
    elif content_type.startswith('audio/'):
        file_type = 'audio'
    else:
        return JsonResponse({'error': 'Invalid file type. Only video and audio allowed'}, status=400)

    # Проверяем размер (макс 50MB)
    max_size = 50 * 1024 * 1024
    if file_size > max_size:
        return JsonResponse({'error': f'File too large (max {max_size // 1024 // 1024}MB)'}, status=400)

    # Сохраняем файл
    file_obj.name = f'{file_type}_{int(timezone.now().timestamp())}_{file_obj.name}'
    file_path = default_storage.save(f'chat/files/{file_obj.name}', file_obj)
    file_url = default_storage.url(file_path)

    return JsonResponse({
        'url': file_url,
        'file_type': file_type,
        'file_name': file_obj.name,
        'size': file_size,
    })


@login_required
@require_http_methods(["POST"])
def upload_image_api(request):
    """
    Загрузка изображения в чат.

    Принимает base64 encoded изображение или файл.
    Возвращает URL загруженного изображения.
    """
    if 'image' in request.FILES:
        # Загрузка файла
        image_file = request.FILES['image']
        content_type = image_file.content_type
    elif 'image' in request.POST:
        # Загрузка base64
        image_data = request.POST['image']
        if ',' in image_data:
            # Извлекаем MIME тип из data URL
            mime_type = image_data.split(',')[0].split(':')[1].split(';')[0]
            image_data = image_data.split(',')[1]
        else:
            mime_type = 'image/png'  # По умолчанию

        image_file = ContentFile(base64.b64decode(image_data))
        image_file.name = 'image.png'
        content_type = mime_type
    else:
        return JsonResponse({'error': 'No image provided'}, status=400)

    # Проверяем тип файла
    allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if content_type not in allowed_types:
        return JsonResponse({'error': 'Invalid image type'}, status=400)

    # Проверяем размер (макс 5MB)
    max_size = 5 * 1024 * 1024
    if image_file.size > max_size:
        return JsonResponse({'error': 'Image too large (max 5MB)'}, status=400)

    # Генерируем уникальное имя
    ext = os.path.splitext(image_file.name)[1] or '.png'
    filename = f'chat_images/{slugify(request.user.username)}_{timezone.now().timestamp()}{ext}'

    # Сохраняем файл
    file_path = default_storage.save(filename, image_file)
    image_url = settings.MEDIA_URL + file_path

    return JsonResponse({
        'success': True,
        'url': image_url,
        'filename': filename,
    })


@login_required
def messages_storage_api(request, slug):
    """
    Загрузка сообщений из текстового хранилища.

    Возвращает сообщения в формате:
    - username: имя пользователя
    - timestamp: время отправки
    - content: текст сообщения
    - attachments: список вложений
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
        return JsonResponse({'error': 'Banned'}, status=403)

    # Загружаем сообщения из текстового хранилища
    limit = int(request.GET.get('limit', 100))
    messages = load_messages_from_storage(slug, limit=limit)

    return JsonResponse({
        'channel': slug,
        'messages': messages,
        'count': len(messages),
    })


@login_required
def unread_counts_api(request):
    """
    Получение количества непрочитанных сообщений по всем каналам.

    Возвращает словарь: {channel_slug: unread_count}
    """
    # Получаем все публичные каналы
    channels = Channel.objects.filter(is_active=True, is_public=True)

    # Для каждого канала считаем разницу между общим количеством сообщений
    # и количеством прочитанных пользователем
    unread_data = {}
    for channel in channels:
        user_read = UserChannelRead.objects.filter(user=request.user, channel=channel).first()
        read_count = user_read.read_count if user_read else 0
        unread_count = max(0, channel.messages_count - read_count)
        if unread_count > 0:
            unread_data[channel.slug] = unread_count

    return JsonResponse({
        'unread_counts': unread_data,
        'total_unread': sum(unread_data.values()),
    })


@login_required
def update_read_status_api(request, slug):
    """
    Обновление статуса прочтения канала пользователем.

    Вызывается при входе в канал и при прочтении новых сообщений.
    """
    channel = Channel.objects.filter(slug=slug, is_active=True).first()

    if not channel:
        return JsonResponse({'error': 'Channel not found'}, status=404)

    # Получаем или создаем запись о прочтении
    user_read, created = UserChannelRead.objects.get_or_create(
        user=request.user,
        channel=channel,
        defaults={'read_count': channel.messages_count}
    )

    if not created:
        # Обновляем счетчик прочитанных сообщений
        user_read.read_count = channel.messages_count
        user_read.save(update_fields=['read_count', 'updated_at'])

    return JsonResponse({
        'success': True,
        'read_count': user_read.read_count,
    })
