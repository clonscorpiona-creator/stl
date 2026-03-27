"""
WebSocket потребители для чата.

Архитектура:
- AsyncWebsocketConsumer для асинхронной обработки
- Группы каналов для рассылки сообщений участникам
- Авторизация через Django session

Оптимизация:
- Асинхронные операции для неблокирующего I/O
- Групповая рассылка только активным подключением
- Минимальный размер сообщений
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import Channel, ChannelMember, ChannelBan, Message, MessageLike, ChannelOnline
from .history import save_message_to_history, delete_message_in_history, add_reaction_to_history
from .messages_storage import save_message_to_storage

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket потребитель для чата в реальном времени.

    Методы:
    - connect: подключение пользователя к каналу
    - disconnect: отключение от канала
    - receive: получение сообщения от клиента
    - send_message: отправка сообщения в группу
    """

    async def connect(self):
        """
        Подключение к WebSocket.

        Проверки:
        - Авторизация пользователя
        - Доступ к каналу
        - Отсутствие бана
        """
        self.slug = self.scope['url_route']['kwargs']['slug']
        self.room_group_name = f'chat_{self.slug}'

        # Проверка авторизации
        user = self.scope.get("user")
        print(f'[WebSocket] Connect attempt - User: {user}, Authenticated: {user.is_authenticated if user else False}')

        if not user or not user.is_authenticated:
            print(f'[WebSocket] Rejected - Not authenticated')
            await self.close()
            return

        self.user = user
        print(f'[WebSocket] Connected - User: {self.user.username}')

        # Проверка доступа к каналу
        channel = await self.get_channel()
        if not channel:
            await self.close()
            return

        # Проверка бана
        is_banned = await self.check_ban(channel)
        if is_banned:
            await self.close()
            return

        # Присоединяемся к группе канала
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Обновляем онлайн-статус
        await self.update_online_status()

        # Отправляем приветственное сообщение
        await self.send(text_data=json.dumps({
            'type': 'connected',
            'channel': self.slug,
        }))

        # Отправляем список онлайн-пользователей
        await self.send_online_users()

    async def disconnect(self, close_code):
        """
        Отключение от WebSocket.

        Очищаем группу канала и удаляем онлайн-статус.
        """
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

        # Удаляем онлайн-статус
        await self.remove_online_status()

    async def receive(self, text_data):
        """
        Получение сообщения от клиента.

        Обработка:
        - Новое сообщение
        - Лайк сообщения
        - Удаление сообщения
        """
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
            return

        action = data.get('type')

        if action == 'message':
            await self.handle_message(data)
        elif action == 'like':
            await self.handle_like(data)
        elif action == 'delete':
            await self.handle_delete(data)

    async def handle_message(self, data):
        """Обработка нового сообщения"""
        content = data.get('content', '').strip()
        reply_to_id = data.get('reply_to')
        image_url = data.get('image_url')
        file_url = data.get('file_url')
        file_type = data.get('file_type')
        file_name = data.get('file_name')

        if not content and not image_url and not file_url:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Content, image or file required'
            }))
            return

        if content and len(content) > 5000:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Content too long'
            }))
            return

        # Проверка mute
        is_muted = await self.check_mute()
        if is_muted:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'You are muted'
            }))
            return

        # Сохраняем сообщение
        message = await self.create_message(content, reply_to_id, image_url, file_url, file_type, file_name)

        if message:
            # Отправляем сообщение всем в группе
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message,
                }
            )

    async def handle_like(self, data):
        """Обработка лайка"""
        message_id = data.get('message_id')
        if not message_id:
            return

        result = await self.toggle_like(message_id)

        if result:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'like_update',
                    'message_id': message_id,
                    'liked': result['liked'],
                    'count': result['count'],
                    'user_id': self.user.id,
                }
            )

    async def handle_delete(self, data):
        """Удаление сообщения"""
        message_id = data.get('message_id')
        if not message_id:
            return

        result = await self.delete_message(message_id)

        if result:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'message_deleted',
                    'message_id': message_id,
                }
            )

    async def chat_message(self, event):
        """
        Отправка сообщения в WebSocket.

        Вызывается через group_send.
        """
        message = event['message']

        await self.send(text_data=json.dumps({
            'type': 'message',
            'message': message,
        }))

    async def like_update(self, event):
        """Обновление лайков"""
        await self.send(text_data=json.dumps({
            'type': 'like_update',
            'message_id': event['message_id'],
            'liked': event['liked'],
            'count': event['count'],
            'user_id': event['user_id'],
        }))

    async def message_deleted(self, event):
        """Сообщение удалено"""
        await self.send(text_data=json.dumps({
            'type': 'message_deleted',
            'message_id': event['message_id'],
        }))

    # Database методы (синхронные, вызываются через database_sync_to_async)

    @database_sync_to_async
    def get_channel(self):
        """Получить канал по slug"""
        return Channel.objects.filter(slug=self.slug, is_active=True).first()

    @database_sync_to_async
    def check_ban(self, channel):
        """Проверка бана"""
        ban = ChannelBan.objects.filter(channel=channel, user=self.user).first()
        return ban and ban.is_active()

    @database_sync_to_async
    def check_mute(self):
        """Проверка mute"""
        member = ChannelMember.objects.filter(channel__slug=self.slug, user=self.user).first()
        return member and member.is_muted

    @database_sync_to_async
    def create_message(self, content, reply_to_id=None, image_url=None, file_url=None, file_type=None, file_name=None):
        """Создание сообщения"""
        channel = Channel.objects.filter(slug=self.slug, is_active=True).first()
        if not channel:
            return None

        # Проверка доступа
        if not channel.is_public:
            member = ChannelMember.objects.filter(channel=channel, user=self.user).first()
            if not member and not self.user.is_staff:
                return None

        # Проверка ответа
        reply_to = None
        if reply_to_id:
            reply_to = Message.objects.filter(id=reply_to_id, channel=channel).first()

        # Создаем сообщение
        message = Message.objects.create(
            channel=channel,
            user=self.user,
            content=content if content else ('[Изображение]' if image_url else '[Файл]'),
            reply_to=reply_to,
            has_image=bool(image_url),
            has_file=bool(file_url),
            file_type=file_type or '',
            file_name=file_name or '',
        )

        # Если есть изображение, обновляем поле image
        if image_url:
            message.image = image_url
        if file_url:
            # Сохраняем относительный путь (убираем /media/ если есть)
            message.file = file_url.replace('/media/', '', 1) if file_url.startswith('/media/') else file_url
        message.save()

        # Сериализуем сообщение с информацией об ответе
        from .api import serialize_message
        message_data = serialize_message(message, self.user)

        # Сохраняем в файл истории (JSON)
        save_message_to_history(message_data, channel.slug)

        # Сохраняем в текстовое хранилище (формат базы данных)
        timestamp = timezone.now().isoformat()
        attachments = image_url or file_url or ''
        save_message_to_storage(
            username=self.user.username,
            content=content if content else f'[Файл: {file_name}]',
            timestamp=timestamp,
            attachments=attachments,
            channel_slug=channel.slug
        )

        return message_data

    @database_sync_to_async
    def toggle_like(self, message_id):
        """Лайк/анлайк сообщения"""
        message = Message.objects.filter(id=message_id).first()
        if not message:
            return None

        like, created = MessageLike.objects.get_or_create(
            message=message,
            user=self.user
        )

        if not created:
            like.delete()
            liked = False
        else:
            liked = True

        message.likes_count = MessageLike.objects.filter(message=message).count()
        message.save(update_fields=['likes_count'])

        # Сохраняем реакцию в историю
        add_reaction_to_history(message.id, self.user.id, message.channel.slug, liked)

        return {'liked': liked, 'count': message.likes_count}

    @database_sync_to_async
    def delete_message(self, message_id):
        """Удаление сообщения"""
        message = Message.objects.filter(id=message_id).first()
        if not message:
            return None

        # Проверка прав
        is_author = message.user == self.user
        channel = message.channel
        is_moderator = channel.moderators.filter(id=self.user.id).exists()

        if not (is_author or is_moderator or self.user.is_staff):
            return None

        message.delete()  # Мягкое удаление

        # Сохраняем удаление в историю
        delete_message_in_history(message.id, message.channel.slug)

        return True

    @database_sync_to_async
    def update_online_status(self):
        """Обновить онлайн-статус пользователя в канале"""
        channel = Channel.objects.filter(slug=self.slug, is_active=True).first()
        if channel:
            ChannelOnline.objects.update_or_create(
                user=self.user,
                channel=channel,
            )

    @database_sync_to_async
    def remove_online_status(self):
        """Удалить онлайн-статус пользователя"""
        channel = Channel.objects.filter(slug=self.slug, is_active=True).first()
        if channel:
            ChannelOnline.objects.filter(user=self.user, channel=channel).delete()

    @database_sync_to_async
    def get_online_users(self):
        """Получить список онлайн-пользователей в канале"""
        from django.utils import timezone
        from datetime import timedelta

        channel = Channel.objects.filter(slug=self.slug, is_active=True).first()
        if not channel:
            return []

        # Считаем онлайн тех, у кого last_activity в последние 5 минут
        five_minutes_ago = timezone.now() - timedelta(minutes=5)
        online_users = ChannelOnline.objects.filter(
            channel=channel,
            last_activity__gte=five_minutes_ago
        ).select_related('user')[:50]

        return [
            {
                'id': ou.user.id,
                'username': ou.user.username,
                'avatar': ou.user.avatar.url if ou.user.avatar else None,
            }
            for ou in online_users
        ]

    async def send_online_users(self):
        """Отправить список онлайн-пользователей"""
        online_users = await self.get_online_users()
        await self.send(text_data=json.dumps({
            'type': 'online_users',
            'users': online_users,
        }))

    async def online_status_update(self, event):
        """Обновление статуса онлайн-пользователя (рассылка группе)"""
        await self.send(text_data=json.dumps({
            'type': 'online_users',
            'users': event.get('users', []),
        }))
