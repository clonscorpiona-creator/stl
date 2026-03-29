"""
Модуль для сохранения истории чата в JSON файлы.

Каждый канал имеет свой файл истории в формате:
chat_history/<channel_slug>.json

Структура файла:
{
    "channel_slug": "general",
    "channel_name": "General",
    "messages": [...],
    "reactions": [...],
    "last_updated": "2026-03-26T12:00:00Z"
}

Подробная информация о сообщении:
{
    "id": 1,
    "content": "Текст сообщения",
    "is_deleted": false,
    "is_edited": false,
    "reply_to": {"id": 0, "username": "user", "content": "..."},
    "user": {
        "id": 1,
        "username": "username",
        "avatar": "/path/to/avatar.jpg",
        "is_moderator": false,
        "is_staff": false
    },
    "created_at": "2026-03-26T12:00:00Z",
    "edited_at": null,
    "likes_count": 0,
    "likes": [{"user_id": 1, "username": "user", "created_at": "..."}],
    "replies": [{"id": 2, "content": "...", "user": "user2"}]
}
"""

import json
import os
from pathlib import Path
from django.conf import settings
from django.utils import timezone


# Директория для хранения истории чатов
HISTORY_DIR = Path(settings.BASE_DIR) / 'chat_history'


def get_history_file_path(channel_slug: str) -> Path:
    """Получить путь к файлу истории для канала."""
    HISTORY_DIR.mkdir(exist_ok=True)
    return HISTORY_DIR / f'{channel_slug}.json'


def save_message_to_history(message_data: dict, channel_slug: str) -> None:
    """
    Сохранить сообщение в файл истории канала.

    Args:
        message_data: Сериализованные данные сообщения
        channel_slug: Slug канала
    """
    file_path = get_history_file_path(channel_slug)

    # Загружаем существующую историю
    history = load_channel_history(channel_slug)

    # Проверяем, нет ли уже такого сообщения (защита от дублей)
    existing_ids = {m.get('id') for m in history['messages']}
    if message_data.get('id') not in existing_ids:
        history['messages'].append(message_data)
        history['last_updated'] = timezone.now().isoformat()

        # Сохраняем обратно
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(history, f, ensure_ascii=False, indent=2)


def load_channel_history(channel_slug: str, limit: int = 100) -> dict:
    """
    Загрузить историю канала из файла.

    Args:
        channel_slug: Slug канала
        limit: Максимальное количество сообщений для возврата

    Returns:
        Dict с историей сообщений
    """
    file_path = get_history_file_path(channel_slug)

    if not file_path.exists():
        return {
            'channel_slug': channel_slug,
            'messages': [],
            'last_updated': None,
        }

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            history = json.load(f)

        # Ограничиваем количество сообщений
        if 'messages' in history and limit is not None:
            history['messages'] = history['messages'][-limit:]

        return history
    except (json.JSONDecodeError, IOError) as e:
        print(f'Error loading history for {channel_slug}: {e}')
        return {
            'channel_slug': channel_slug,
            'messages': [],
            'last_updated': None,
        }


def get_all_messages(channel_slug: str) -> list:
    """Получить все сообщения канала из файла истории."""
    history = load_channel_history(channel_slug, limit=None)
    return history.get('messages', [])


def load_messages_from_db(channel_slug: str, limit: int = 100) -> list:
    """
    Загрузить сообщения из базы данных с полной информацией.

    Args:
        channel_slug: Slug канала
        limit: Максимальное количество сообщений

    Returns:
        List с сообщениями
    """
    from .models import Channel, Message, MessageLike
    from django.contrib.auth import get_user_model

    User = get_user_model()

    channel = Channel.objects.filter(slug=channel_slug, is_active=True).first()
    if not channel:
        return []

    messages = Message.objects.filter(
        channel=channel
    ).select_related('user', 'reply_to', 'reply_to__user').prefetch_related('likes').order_by('-created_at')[:limit]

    result = []
    for msg in reversed(messages):
        # Получаем лайки с информацией о пользователях
        likes = []
        for like in msg.likes.all():
            likes.append({
                'user_id': like.user.id,
                'username': like.user.username,
                'created_at': like.created_at.isoformat() if hasattr(like, 'created_at') else None,
            })

        # Получаем информацию об ответе
        reply_to_data = None
        if msg.reply_to:
            reply_to_data = {
                'id': msg.reply_to.id,
                'username': msg.reply_to.user.username,
                'content': msg.reply_to.content[:100] if not msg.reply_to.is_deleted else '[Сообщение удалено]',
            }

        message_data = {
            'id': msg.id,
            'content': msg.content if not msg.is_deleted else '[Сообщение удалено]',
            'is_deleted': msg.is_deleted,
            'is_edited': msg.is_edited,
            'likes_count': msg.likes_count,
            'liked': False,  # Заполняется отдельно для текущего пользователя
            'likes': likes,
            'reply_to': reply_to_data,
            'user': {
                'id': msg.user.id,
                'username': msg.user.username,
                'avatar': msg.user.avatar.url if msg.user.avatar else None,
                'is_moderator': channel.moderators.filter(id=msg.user.id).exists(),
                'is_staff': msg.user.is_staff,
            },
            'created_at': msg.created_at.isoformat(),
            'edited_at': msg.edited_at.isoformat() if msg.edited_at else None,
        }

        result.append(message_data)

    return result


def update_message_in_history(message_id: int, updated_data: dict, channel_slug: str) -> None:
    """
    Обновить сообщение в истории.

    Args:
        message_id: ID сообщения
        updated_data: Новые данные для сообщения
        channel_slug: Slug канала
    """
    file_path = get_history_file_path(channel_slug)
    history = load_channel_history(channel_slug, limit=None)

    for i, msg in enumerate(history['messages']):
        if msg.get('id') == message_id:
            history['messages'][i].update(updated_data)
            break

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(history, f, ensure_ascii=False, indent=2)


def delete_message_in_history(message_id: int, channel_slug: str) -> None:
    """
    Удалить сообщение из истории (мягкое удаление).

    Args:
        message_id: ID сообщения
        channel_slug: Slug канала
    """
    file_path = get_history_file_path(channel_slug)
    history = load_channel_history(channel_slug, limit=None)

    for msg in history['messages']:
        if msg.get('id') == message_id:
            msg['is_deleted'] = True
            msg['content'] = '[Сообщение удалено]'
            break

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(history, f, ensure_ascii=False, indent=2)


def add_reaction_to_history(message_id: int, user_id: int, channel_slug: str, liked: bool) -> None:
    """
    Добавить/удалить реакцию на сообщение.

    Args:
        message_id: ID сообщения
        user_id: ID пользователя
        channel_slug: Slug канала
        liked: True если лайк добавлен, False если удален
    """
    file_path = get_history_file_path(channel_slug)
    history = load_channel_history(channel_slug, limit=None)

    for msg in history['messages']:
        if msg.get('id') == message_id:
            if 'likes' not in msg:
                msg['likes'] = []

            user_like = next((l for l in msg['likes'] if l['user_id'] == user_id), None)

            if liked and not user_like:
                msg['likes'].append({'user_id': user_id})
                msg['likes_count'] = len(msg['likes'])
            elif not liked and user_like:
                msg['likes'].remove(user_like)
                msg['likes_count'] = len(msg['likes'])

            break

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(history, f, ensure_ascii=False, indent=2)


def clear_channel_history(channel_slug: str) -> None:
    """
    Очистить историю канала.

    Args:
        channel_slug: Slug канала
    """
    file_path = get_history_file_path(channel_slug)
    if file_path.exists():
        file_path.unlink()


def export_channel_history(channel_slug: str) -> str:
    """
    Экспортировать историю канала в читаемый формат.

    Args:
        channel_slug: Slug канала

    Returns:
        Строка с экспортированной историей
    """
    history = load_channel_history(channel_slug, limit=None)

    lines = [f"История канала: {channel_slug}"]
    lines.append("=" * 50)
    lines.append("")

    for msg in history['messages']:
        timestamp = msg.get('created_at', 'Unknown')
        username = msg.get('user', {}).get('username', 'Unknown')
        content = msg.get('content', '')
        likes = msg.get('likes_count', 0)

        status = '[DELETED]' if msg.get('is_deleted') else ''
        lines.append(f"[{timestamp}] {username}: {content} {status} (❤️ {likes})")

    return "\n".join(lines)
