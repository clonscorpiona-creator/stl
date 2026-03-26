"""
Модуль для хранения сообщений чата в текстовых файлах.

Каждая комната чата имеет свой файл: chat/messages_storage/<channel_slug>.txt

Формат записи (TSV - tab separated values):
username<TAB>timestamp<TAB>content<TAB>attachments

Пример:
admin	2026-03-26T12:00:00Z	Привет всем!
user1	2026-03-26T12:01:00Z	Как дела?	image.jpg|document.pdf
"""

import os
from pathlib import Path
from datetime import datetime
from django.conf import settings
from django.utils import timezone

# Директория для хранения сообщений
STORAGE_DIR = Path(settings.BASE_DIR) / 'chat' / 'messages_storage'


def get_storage_file_path(channel_slug: str) -> Path:
    """Получить путь к файлу сообщений для канала."""
    STORAGE_DIR.mkdir(exist_ok=True)
    return STORAGE_DIR / f'{channel_slug}.txt'


def save_message_to_storage(username: str, content: str, timestamp: str,
                            attachments: str = '', channel_slug: str = '') -> None:
    """
    Сохранить сообщение в файл хранилища.

    Формат: username\ttimestamp\tcontent\tattachments\n

    Args:
        username: Имя пользователя
        content: Текст сообщения
        timestamp: Время отправки (ISO формат)
        attachments: Вложения (разделённые |)
        channel_slug: Slug канала
    """
    file_path = get_storage_file_path(channel_slug)

    # Форматируем строку для записи
    line = f"{username}\t{timestamp}\t{content}\t{attachments}\n"

    # Дописываем в конец файла
    with open(file_path, 'a', encoding='utf-8') as f:
        f.write(line)


def load_messages_from_storage(channel_slug: str, limit: int = 100) -> list:
    """
    Загрузить сообщения из файла хранилища.

    Args:
        channel_slug: Slug канала
        limit: Максимальное количество сообщений

    Returns:
        List с сообщениями в формате:
        {
            'username': str,
            'timestamp': str,
            'content': str,
            'attachments': list
        }
    """
    file_path = get_storage_file_path(channel_slug)

    if not file_path.exists():
        return []

    messages = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        # Берём последние N сообщений
        lines = lines[-limit:]

        for line in lines:
            line = line.strip()
            if not line:
                continue

            parts = line.split('\t')
            if len(parts) >= 3:
                username = parts[0]
                timestamp = parts[1]
                content = parts[2]
                attachments = parts[3].split('|') if len(parts) > 3 and parts[3] else []

                messages.append({
                    'username': username,
                    'timestamp': timestamp,
                    'content': content,
                    'attachments': attachments,
                })

    except (IOError, UnicodeDecodeError) as e:
        print(f'Error loading messages from {file_path}: {e}')
        return []

    return messages


def get_message_count(channel_slug: str) -> int:
    """Получить количество сообщений в канале."""
    file_path = get_storage_file_path(channel_slug)

    if not file_path.exists():
        return 0

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return sum(1 for line in f if line.strip())
    except IOError:
        return 0


def search_messages(channel_slug: str, query: str) -> list:
    """
    Поиск сообщений по тексту.

    Args:
        channel_slug: Slug канала
        query: Поисковый запрос

    Returns:
        List с найденными сообщениями
    """
    all_messages = load_messages_from_storage(channel_slug, limit=None)

    query_lower = query.lower()
    return [
        msg for msg in all_messages
        if query_lower in msg['content'].lower() or query_lower in msg['username'].lower()
    ]


def clear_channel_storage(channel_slug: str) -> None:
    """
    Очистить хранилище сообщений канала.

    Args:
        channel_slug: Slug канала
    """
    file_path = get_storage_file_path(channel_slug)
    if file_path.exists():
        file_path.unlink()


def export_channel_messages(channel_slug: str) -> str:
    """
    Экспортировать сообщения канала в читаемый формат.

    Args:
        channel_slug: Slug канала

    Returns:
        Строка с экспортированными сообщениями
    """
    messages = load_messages_from_storage(channel_slug, limit=None)

    lines = [f"Сообщения канала: {channel_slug}"]
    lines.append("=" * 60)
    lines.append("")

    for msg in messages:
        timestamp = msg['timestamp']
        username = msg['username']
        content = msg['content']
        attachments = msg['attachments']

        att_str = f" [Вложения: {', '.join(attachments)}]" if attachments else ""
        lines.append(f"[{timestamp}] {username}: {content}{att_str}")

    return "\n".join(lines)
