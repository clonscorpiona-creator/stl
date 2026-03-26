"""
Модели для системы чата STL Platform.

Архитектура:
- Каналы (тематические) с публичным/приватным доступом
- Сообщения с поддержкой лайков и вложений
- Система модерации с баном пользователей
- WebSocket для реального времени через Django Channels
"""

from django.db import models
from django.conf import settings
from django.utils.text import slugify


class Channel(models.Model):
    """
    Тематический канал для обсуждений.

    Оптимизация:
    - Индексы на slug и is_public для быстрого доступа
    - Счётчики обновляются атомарно через F()
    """
    name = models.CharField('Название', max_length=100)
    slug = models.SlugField(unique=True, blank=True)
    description = models.TextField('Описание', blank=True)

    # Доступ
    is_public = models.BooleanField('Публичный', default=True)
    is_active = models.BooleanField('Активен', default=True)

    # Модерация
    moderators = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='moderated_channels',
        blank=True
    )

    # Счётчики
    messages_count = models.PositiveIntegerField(default=0)
    members_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Канал'
        verbose_name_plural = 'Каналы'
        ordering = ['-messages_count']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['is_public', 'is_active']),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Channel.objects.filter(slug=slug).exists():
                slug = f'{base_slug}-{counter}'
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)


class ChannelMember(models.Model):
    """
    Участник канала.

    Оптимизация:
    - unique_together для быстрой проверки членства
    - created_at для сортировки "кто раньше пришёл"
    """
    channel = models.ForeignKey(Channel, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    # Роль
    is_moderator = models.BooleanField('Модератор', default=False)
    is_muted = models.BooleanField('Заглушен', default=False)

    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Участник канала'
        verbose_name_plural = 'Участники каналов'
        unique_together = ['channel', 'user']
        indexes = [
            models.Index(fields=['user', 'is_moderator']),
        ]

    def __str__(self):
        return f'{self.user} в {self.channel}'


class ChannelBan(models.Model):
    """
    Бан пользователя в канале.

    Оптимизация:
    - Индекс на user для быстрой проверки при отправке
    - expires_at для авто-разбана
    """
    channel = models.ForeignKey(Channel, on_delete=models.CASCADE, related_name='bans')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    moderator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='bans_given'
    )

    reason = models.TextField('Причина', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField('Истекает', null=True, blank=True)

    class Meta:
        verbose_name = 'Бан в канале'
        verbose_name_plural = 'Баны в каналах'
        unique_together = ['channel', 'user']
        ordering = ['-created_at']

    def __str__(self):
        return f'Бан {self.user} в {self.channel}'

    def is_active(self):
        """Проверка активности бана"""
        if self.expires_at is None:
            return True
        from django.utils import timezone
        return timezone.now() < self.expires_at


class Message(models.Model):
    """
    Сообщение в канале.

    Оптимизация:
    - select_related для channel и user
    - prefetch_related для likes
    - Индексы на created_at для пагинации
    - Счётчик лайков обновляется через F()
    """
    channel = models.ForeignKey(Channel, on_delete=models.CASCADE, related_name='messages')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chat_messages')

    content = models.TextField('Текст сообщения')

    # Вложения
    has_image = models.BooleanField(default=False)
    image = models.ImageField(upload_to='chat/images/', null=True, blank=True)

    # Статусы
    is_deleted = models.BooleanField(default=False)
    is_edited = models.BooleanField(default=False)

    # Счётчики
    likes_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    edited_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Сообщение'
        verbose_name_plural = 'Сообщения'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['channel', '-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['is_deleted']),
        ]

    def __str__(self):
        return f'{self.user}: {self.content[:50]}'

    def delete(self, *args, **kwargs):
        # Мягкое удаление
        self.is_deleted = True
        self.content = '[Сообщение удалено]'
        self.save(update_fields=['is_deleted', 'content'])

        # Обновляем счётчик
        Channel.objects.filter(pk=self.channel_id).update(
            messages_count=models.F('messages_count') - 1
        )

    def save(self, *args, **kwargs):
        is_new = not self.pk

        if self.is_edited and not self.edited_at:
            from django.utils import timezone
            self.edited_at = timezone.now()

        super().save(*args, **kwargs)

        # Обновляем счётчик канала при создании
        if is_new:
            Channel.objects.filter(pk=self.channel_id).update(
                messages_count=models.F('messages_count') + 1
            )


class MessageLike(models.Model):
    """
    Лайк сообщения.

    Оптимизация:
    - get_or_create для toggle
    - unique_together для предотвращения дублей
    """
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Лайк сообщения'
        verbose_name_plural = 'Лайки сообщений'
        unique_together = ['message', 'user']
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user} liked {self.message}'

    def save(self, *args, **kwargs):
        is_new = not self.pk
        super().save(*args, **kwargs)

        if is_new:
            Message.objects.filter(pk=self.message_id).update(
                likes_count=models.F('likes_count') + 1
            )

    def delete(self, *args, **kwargs):
        message_id = self.message_id
        super().delete(*args, **kwargs)
        Message.objects.filter(pk=message_id).update(
            likes_count=models.F('likes_count') - 1
        )
