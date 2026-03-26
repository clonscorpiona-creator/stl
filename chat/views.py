"""
Views для чата.

Оптимизация:
- Минимальный HTML, контент загружается через API
- WebSocket для реального времени
"""

from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from .models import Channel, ChannelMember, ChannelBan, Message


@login_required
def chat_room(request, slug):
    """
    Страница чата для конкретного канала.

    Загружает минимальный HTML, всё остальное через API/WebSocket.
    """
    channel = get_object_or_404(Channel, slug=slug, is_active=True)

    # Проверка доступа
    if not channel.is_public:
        member = ChannelMember.objects.filter(channel=channel, user=request.user).first()
        if not member and not request.user.is_staff:
            from django.http import HttpResponseForbidden
            return HttpResponseForbidden('Access denied')

    # Проверка бана
    ban = ChannelBan.objects.filter(channel=channel, user=request.user).first()
    if ban and ban.is_active():
        from django.http import HttpResponseForbidden
        return HttpResponseForbidden(f'Banned: {ban.reason}')

    is_member = ChannelMember.objects.filter(channel=channel, user=request.user).exists()
    is_moderator = channel.moderators.filter(id=request.user.id).exists()

    return render(request, 'chat/room.html', {
        'channel': channel,
        'is_member': is_member,
        'is_moderator': is_moderator,
    })


@login_required
def chat_index(request):
    """
    Главная страница чата - список каналов.
    """
    channels = Channel.objects.filter(is_active=True, is_public=True)
    return render(request, 'chat/index.html', {'channels': channels})


@login_required
def test_auth(request, slug):
    """
    Страница для тестирования WebSocket авторизации.
    """
    channel = get_object_or_404(Channel, slug=slug, is_active=True)
    return render(request, 'chat/test_auth.html', {'channel': channel})


@login_required
def chat_admin(request, slug):
    """
    Админ-панель канала для модераторов и администраторов.
    """
    channel = get_object_or_404(Channel, slug=slug, is_active=True)

    # Проверка прав
    is_moderator = channel.moderators.filter(id=request.user.id).exists()
    if not is_moderator and not request.user.is_staff:
        messages.error(request, 'У вас нет прав доступа к управлению этим каналом')
        return redirect('chat:room', slug=slug)

    # Получаем статистику
    members_count = ChannelMember.objects.filter(channel=channel).count()
    banned_count = ChannelBan.objects.filter(channel=channel).count()
    messages_count = Message.objects.filter(channel=channel).count()

    # Получаем последних участников
    recent_members = ChannelMember.objects.filter(
        channel=channel
    ).select_related('user').order_by('-joined_at')[:20]

    # Получаем последние сообщения
    recent_messages = Message.objects.filter(
        channel=channel
    ).select_related('user').order_by('-created_at')[:20]

    # Получаем забаненных
    banned_users = ChannelBan.objects.filter(
        channel=channel
    ).select_related('user', 'moderator').order_by('-created_at')[:20]

    return render(request, 'chat/admin.html', {
        'channel': channel,
        'is_moderator': is_moderator,
        'stats': {
            'members': members_count,
            'banned': banned_count,
            'messages': messages_count,
        },
        'recent_members': recent_members,
        'recent_messages': recent_messages,
        'banned_users': banned_users,
    })
