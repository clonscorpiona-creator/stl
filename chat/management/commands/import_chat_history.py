"""
Команда для импорта истории сообщений из JSON файлов в БД.

Использование:
    python manage.py import_chat_history
    python manage.py import_chat_history --channel general
"""

import json
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from django.contrib.auth import get_user_model
from chat.models import Channel, Message

User = get_user_model()


class Command(BaseCommand):
    help = 'Импорт истории сообщений из JSON файлов в БД'

    def add_arguments(self, parser):
        parser.add_argument(
            '--channel',
            type=str,
            help='Slug канала для импорта (по умолчанию все каналы)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Режим проверки без записи в БД',
        )

    def handle(self, *args, **options):
        channel_slug = options.get('channel')
        dry_run = options.get('dry_run')

        history_dir = Path(settings.BASE_DIR) / 'chat_history'

        if not history_dir.exists():
            self.stdout.write(self.style.WARNING('Директория истории не существует'))
            return

        if channel_slug:
            json_files = [history_dir / f'{channel_slug}.json']
        else:
            json_files = list(history_dir.glob('*.json'))

        if not json_files:
            self.stdout.write(self.style.WARNING('Файлы истории не найдены'))
            return

        total_imported = 0

        for json_file in json_files:
            if not json_file.exists():
                self.stdout.write(self.style.WARNING(f'Файл не найден: {json_file}'))
                continue

            self.stdout.write(f'Импорт из файла: {json_file.name}')

            with open(json_file, 'r', encoding='utf-8') as f:
                history = json.load(f)

            channel_slug_from_file = history.get('channel_slug')
            channel = Channel.objects.filter(slug=channel_slug_from_file).first()

            if not channel:
                self.stdout.write(self.style.WARNING(f'Канал не найден: {channel_slug_from_file}'))
                continue

            messages = history.get('messages', [])
            imported = 0
            skipped = 0

            for msg_data in messages:
                msg_id = msg_data.get('id')

                # Проверяем, существует ли уже сообщение
                if Message.objects.filter(id=msg_id).exists():
                    skipped += 1
                    continue

                # Находим пользователя
                user_id = msg_data.get('user', {}).get('id')
                if not user_id:
                    skipped += 1
                    continue

                user = User.objects.filter(id=user_id).first()
                if not user:
                    skipped += 1
                    continue

                if not dry_run:
                    # Создаём сообщение
                    Message.objects.create(
                        id=msg_id,
                        channel=channel,
                        user=user,
                        content=msg_data.get('content', ''),
                        is_deleted=msg_data.get('is_deleted', False),
                        is_edited=msg_data.get('is_edited', False),
                        likes_count=msg_data.get('likes_count', 0),
                        created_at=msg_data.get('created_at'),
                        edited_at=msg_data.get('edited_at'),
                    )
                    imported += 1
                else:
                    imported += 1

            if dry_run:
                self.stdout.write(self.style.SUCCESS(f'  Найдено сообщений для импорта: {imported}'))
                self.stdout.write(f'  Пропущено (уже существуют): {skipped}')
            else:
                self.stdout.write(self.style.SUCCESS(f'  Импортировано: {imported}'))
                self.stdout.write(f'  Пропущено: {skipped}')

            total_imported += imported

        if dry_run:
            self.stdout.write(self.style.WARNING(f'\nРежим проверки. Всего найдено: {total_imported}'))
        else:
            self.stdout.write(self.style.SUCCESS(f'\nВсего импортировано: {total_imported} сообщений'))
