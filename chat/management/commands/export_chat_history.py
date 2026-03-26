"""
Команда для экспорта истории сообщений из БД в JSON файлы.

Использование:
    python manage.py export_chat_history
    python manage.py export_chat_history --channel general
"""

import json
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from chat.models import Channel, Message
from chat.history import save_message_to_history


class Command(BaseCommand):
    help = 'Экспорт истории сообщений из БД в JSON файлы'

    def add_arguments(self, parser):
        parser.add_argument(
            '--channel',
            type=str,
            help='Slug канала для экспорта (по умолчанию все каналы)',
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=1000,
            help='Максимальное количество сообщений на канал (по умолчанию 1000)',
        )

    def handle(self, *args, **options):
        channel_slug = options.get('channel')
        limit = options.get('limit')

        if channel_slug:
            channels = Channel.objects.filter(slug=channel_slug, is_active=True)
        else:
            channels = Channel.objects.filter(is_active=True)

        total_exported = 0

        for channel in channels:
            self.stdout.write(f'Экспорт канала: {channel.name} ({channel.slug})')

            messages = Message.objects.filter(
                channel=channel
            ).select_related('user', 'reply_to', 'reply_to__user').order_by('created_at')[:limit]

            exported = 0
            for msg in messages:
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
                    'liked': False,
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

                save_message_to_history(message_data, channel.slug)
                exported += 1

            self.stdout.write(self.style.SUCCESS(f'  Экспортировано сообщений: {exported}'))
            total_exported += exported

        self.stdout.write(self.style.SUCCESS(f'\nВсего экспортировано: {total_exported} сообщений'))

        # Показываем путь к директории с историей
        history_dir = Path(settings.BASE_DIR) / 'chat_history'
        self.stdout.write(f'История сохранена в: {history_dir}')
