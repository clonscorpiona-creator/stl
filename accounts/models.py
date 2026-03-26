from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.text import slugify


class User(AbstractUser):
    """Расширенная модель пользователя"""
    email = models.EmailField(unique=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    bio = models.TextField('О себе', blank=True)
    website = models.URLField(blank=True)
    location = models.CharField('Город', max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'

    def __str__(self):
        return self.username


class Profile(models.Model):
    """Профиль пользователя - портфолио"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    display_name = models.CharField('Отображаемое имя', max_length=100, blank=True)
    slug = models.SlugField(unique=True, blank=True)

    # Статистика
    followers_count = models.PositiveIntegerField(default=0)
    following_count = models.PositiveIntegerField(default=0)
    works_count = models.PositiveIntegerField(default=0)
    likes_received = models.PositiveIntegerField(default=0)

    # Настройки
    is_verified = models.BooleanField('Проверенный', default=False)
    is_pro = models.BooleanField('Pro аккаунт', default=False)

    class Meta:
        verbose_name = 'Профиль'
        verbose_name_plural = 'Профили'

    def __str__(self):
        return self.display_name or self.user.username

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.display_name or self.user.username)
            slug = base_slug
            counter = 1
            while Profile.objects.filter(slug=slug).exists():
                slug = f'{base_slug}-{counter}'
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)


class Follow(models.Model):
    """Подписки на авторов"""
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following')
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followers')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Подписка'
        verbose_name_plural = 'Подписки'
        unique_together = ['follower', 'following']
        constraints = [
            models.CheckConstraint(
                condition=~models.Q(follower=models.F('following')),
                name='no_self_follow'
            )
        ]

    def __str__(self):
        return f'{self.follower} -> {self.following}'

    def save(self, *args, **kwargs):
        is_new = not self.pk
        super().save(*args, **kwargs)
        if is_new:
            self._update_counts()

    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
        self._update_counts()

    def _update_counts(self):
        # Обновляем счётчики у подписчика и подписанного
        follower_profile = Profile.objects.filter(user=self.follower).first()
        following_profile = Profile.objects.filter(user=self.following).first()

        if follower_profile:
            follower_profile.following_count = Follow.objects.filter(follower=self.follower).count()
            follower_profile.save()

        if following_profile:
            following_profile.followers_count = Follow.objects.filter(following=self.following).count()
            following_profile.save()
