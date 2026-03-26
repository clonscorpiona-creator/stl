"""
Модуль для сохранения истории чата в JSON файлы.

Каждый канал имеет свой файл истории в формате:
chat_history/<channel_slug>.json

Структура файла:
{
    "channel_slug": "general",
    "messages": [...],
    "last_updated": "2026-03-26T12:00:00Z"
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

    # Добавляем новое сообщение
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
        if 'messages' in history:
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
    """Получить все сообщения канала."""
    history = load_channel_history(channel_slug, limit=None)
    return history.get('messages', [])


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
