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

from .models import Channel, ChannelMember, ChannelBan, Message, MessageLike

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
        if not self.scope.get("user") or not self.scope["user"].is_authenticated:
            await self.close()
            return

        self.user = self.scope["user"]

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

        # Отправляем приветственное сообщение
        await self.send(text_data=json.dumps({
            'type': 'connected',
            'channel': self.slug,
        }))

    async def disconnect(self, close_code):
        """
        Отключение от WebSocket.

        Очищаем группу канала.
        """
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

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

        if not content or len(content) > 5000:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid message content'
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
        message = await self.create_message(content)

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
    def create_message(self, content):
        """Создание сообщения"""
        channel = Channel.objects.filter(slug=self.slug, is_active=True).first()
        if not channel:
            return None

        # Проверка доступа
        if not channel.is_public:
            member = ChannelMember.objects.filter(channel=channel, user=self.user).first()
            if not member and not self.user.is_staff:
                return None

        message = Message.objects.create(
            channel=channel,
            user=self.user,
            content=content
        )

        return {
            'id': message.id,
            'content': message.content,
            'is_deleted': False,
            'is_edited': False,
            'likes_count': 0,
            'liked': False,
            'user': {
                'id': self.user.id,
                'username': self.user.username,
                'avatar': self.user.avatar.url if self.user.avatar else None,
                'is_moderator': channel.moderators.filter(id=self.user.id).exists(),
            },
            'created_at': message.created_at.isoformat(),
            'edited_at': None,
        }

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
        return True
