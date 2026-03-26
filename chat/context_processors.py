"""
Контекстные процессоры для чата.

Добавляют переменные чата в каждый шаблон:
- chat_enabled: включён ли чат
- chat_channels: список доступных каналов
- unread_count: количество непрочитанных сообщений
"""

from django.core.cache import cache
from .models import Channel, ChannelMember, Message


def chat_context(request):
    """
    Добавляет контекст чата во все шаблоны.

    Возвращает:
        dict с переменными:
        - chat_enabled: bool
        - chat_channels: список каналов
        - chat_unread_count: количество непрочитанных
        - chat_is_moderator: bool (для текущего канала)
    """
    context = {
        'chat_enabled': True,
        'chat_channels': [],
        'chat_unread_count': 0,
        'chat_current_channel': None,
        'chat_is_moderator': False,
        'chat_is_member': False,
    }

    if not request.user.is_authenticated:
        return context

    # Получаем публичные каналы для отображения в навигации
    channels = Channel.objects.filter(
        is_active=True,
        is_public=True
    )[:10]  # Максимум 10 каналов

    context['chat_channels'] = [
        {
            'name': ch.name,
            'slug': ch.slug,
            'messages_count': ch.messages_count,
        }
        for ch in channels
    ]

    # Проверяем, находится ли пользователь в чате (по URL)
    if hasattr(request, 'resolver_match') and request.resolver_match:
        view_name = request.resolver_match.view_name
        if view_name and view_name.startswith('chat:'):
            slug = request.resolver_match.kwargs.get('slug')
            if slug:
                # Получаем текущий канал
                channel = Channel.objects.filter(slug=slug, is_active=True).first()
                if channel:
                    context['chat_current_channel'] = {
                        'name': channel.name,
                        'slug': channel.slug,
                        'description': channel.description,
                    }

                    # Проверяем членство и модерацию
                    member = ChannelMember.objects.filter(
                        channel=channel,
                        user=request.user
                    ).first()

                    context['chat_is_member'] = member is not None
                    context['chat_is_moderator'] = (
                        member.is_moderator if member else False
                    ) or request.user.is_staff

    return context
