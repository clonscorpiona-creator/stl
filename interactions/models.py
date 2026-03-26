from django.db import models
from django.conf import settings
from core.models import Work, Collection


class Like(models.Model):
    """Лайки работ"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='likes')
    work = models.ForeignKey(Work, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Лайк'
        verbose_name_plural = 'Лайки'
        unique_together = ['user', 'work']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['work', '-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f'{self.user} liked {self.work}'

    def save(self, *args, **kwargs):
        is_new = not self.pk
        super().save(*args, **kwargs)
        if is_new:
            self._update_counts()

    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
        self._update_counts()

    def _update_counts(self):
        # Обновляем счётчик лайков у работы
        self.work.likes_count = Like.objects.filter(work=self.work).count()
        self.work.save(update_fields=['likes_count'])

        # Обновляем счётчик у автора
        from accounts.models import Profile
        profile = Profile.objects.filter(user=self.work.author).first()
        if profile:
            profile.likes_received = Like.objects.filter(work__author=self.work.author).count()
            profile.save(update_fields=['likes_received'])


class Comment(models.Model):
    """Комментарии к работам"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comments')
    work = models.ForeignKey(Work, on_delete=models.CASCADE, related_name='comments')
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='replies')
    content = models.TextField('Текст')
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Комментарий'
        verbose_name_plural = 'Комментарии'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['work', '-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f'Comment by {self.user} on {self.work}'

    def save(self, *args, **kwargs):
        is_new = not self.pk
        super().save(*args, **kwargs)
        if is_new:
            self._update_counts()

    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
        self._update_counts()

    def _update_counts(self):
        self.work.comments_count = Comment.objects.filter(work=self.work, is_deleted=False).count()
        self.work.save(update_fields=['comments_count'])


class Repost(models.Model):
    """Репосты работ"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reposts')
    work = models.ForeignKey(Work, on_delete=models.CASCADE, related_name='reposts')
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Репост'
        verbose_name_plural = 'Репосты'
        unique_together = ['user', 'work']
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user} reposted {self.work}'

    def save(self, *args, **kwargs):
        is_new = not self.pk
        super().save(*args, **kwargs)
        if is_new:
            self._update_counts()

    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
        self._update_counts()

    def _update_counts(self):
        self.work.reposts_count = Repost.objects.filter(work=self.work).count()
        self.work.save(update_fields=['reposts_count'])


class SavedWork(models.Model):
    """Сохранённые работы"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='saved_works')
    work = models.ForeignKey(Work, on_delete=models.CASCADE, related_name='saved_by')
    collection = models.ForeignKey(Collection, null=True, blank=True, on_delete=models.SET_NULL, related_name='saved_items')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Сохранённая работа'
        verbose_name_plural = 'Сохранённые работы'
        unique_together = ['user', 'work']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f'{self.user} saved {self.work}'

    def save(self, *args, **kwargs):
        is_new = not self.pk
        super().save(*args, **kwargs)
        if is_new:
            self._update_counts()

    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
        self._update_counts()

    def _update_counts(self):
        self.work.saves_count = SavedWork.objects.filter(work=self.work).count()
        self.work.save(update_fields=['saves_count'])


class Notification(models.Model):
    """Уведомления"""
    TYPE_CHOICES = [
        ('like', 'Лайк'),
        ('comment', 'Комментарий'),
        ('follow', 'Подписка'),
        ('repost', 'Репост'),
        ('save', 'Сохранение'),
        ('mention', 'Упоминание'),
    ]

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='activity_notifications'
    )
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    work = models.ForeignKey(Work, null=True, blank=True, on_delete=models.CASCADE)
    comment = models.ForeignKey(Comment, null=True, blank=True, on_delete=models.CASCADE)
    text = models.TextField(blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Уведомление'
        verbose_name_plural = 'Уведомления'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['recipient', 'is_read', '-created_at']),
        ]

    def __str__(self):
        return f'{self.type} notification for {self.recipient}'
