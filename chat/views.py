"""
Views для чата.

Оптимизация:
- Минимальный HTML, контент загружается через API
- WebSocket для реального времени
"""

from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from .models import Channel, ChannelMember


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
    from .models import ChannelBan
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
