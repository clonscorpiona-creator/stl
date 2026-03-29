from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.text import slugify
from django.db.models import Count


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

    # Роли пользователя
    is_moderator = models.BooleanField('Модератор', default=False)
    is_senior_moderator = models.BooleanField('Старший модератор', default=False)

    # Предупреждения и баны
    warning_count = models.PositiveIntegerField(default=0)
    is_banned = models.BooleanField(default=False)
    banned_at = models.DateTimeField(null=True, blank=True)
    banned_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='banned_users')
    ban_reason = models.TextField(blank=True)

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


class Warning(models.Model):
    """Предупреждение пользователю"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='warnings')
    moderator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='warnings_given')
    reason = models.TextField('Причина')
    is_yellow = models.BooleanField(default=True)  # True = желтое, False = красное
    created_at = models.DateTimeField(auto_now_add=True)
    work = models.ForeignKey('core.Work', null=True, blank=True, on_delete=models.SET_NULL)
    comment = models.ForeignKey('interactions.Comment', null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Предупреждение'
        verbose_name_plural = 'Предупреждения'

    def __str__(self):
        return f'Warning for {self.user.username} - {self.reason[:30]}'

    def save(self, *args, **kwargs):
        is_new = not self.pk
        super().save(*args, **kwargs)
        if is_new:
            self._update_warning_count()

    def delete(self, *args, **kwargs):
        user = self.user
        super().delete(*args, **kwargs)
        # Пересчитываем предупреждения
        user.profile.warning_count = Warning.objects.filter(user=user).count()
        user.profile.save(update_fields=['warning_count'])

    def _update_warning_count(self):
        self.user.profile.warning_count = Warning.objects.filter(user=self.user).count()

        # Автоматический бан при 4 предупреждениях
        if self.user.profile.warning_count >= 4 and not self.user.profile.is_banned:
            self.user.profile.is_banned = True
            self.user.profile.banned_at = self.created_at
            self.user.profile.banned_by = self.moderator  # Записываем модератора
            self.user.profile.ban_reason = 'Автоматический бан после 4 предупреждений'
            self.user.profile.save(update_fields=['is_banned', 'banned_at', 'banned_by', 'ban_reason'])
        else:
            self.user.profile.save(update_fields=['warning_count'])


class UserCategoryView(models.Model):
    """Отслеживание просмотров категорий пользователем"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='category_views')
    category = models.ForeignKey('core.Category', null=True, blank=True, on_delete=models.CASCADE)
    works_count = models.PositiveIntegerField(default=0)  # Количество работ на момент просмотра
    last_viewed_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Просмотр категории'
        verbose_name_plural = 'Просмотры категорий'
        unique_together = ['user', 'category']
        indexes = [
            models.Index(fields=['user', 'category']),
            models.Index(fields=['user', '-last_viewed_at']),
        ]

    def __str__(self):
        category_name = self.category.name if self.category else 'Все категории'
        return f'{self.user.username} - {category_name}'

    @classmethod
    def update_view(cls, user, category=None):
        """Обновить просмотр категории пользователем"""
        view, created = cls.objects.get_or_create(user=user, category=category)
        if not created:
            # Обновляем счетчик работ
            view.works_count = cls.get_works_count(category)
            view.last_viewed_at = view.last_viewed_at  # keep original
            view.save(update_fields=['works_count', 'updated_at'])
        else:
            view.works_count = cls.get_works_count(category)
            view.save(update_fields=['works_count'])
        return view

    @staticmethod
    def get_works_count(category):
        """Получить текущее количество опубликованных работ в категории"""
        from core.models import Work
        if category is None:
            return Work.objects.filter(status='published').count()
        return Work.objects.filter(status='published', category=category).count()

    @classmethod
    def get_new_works_count(cls, user, category=None):
        """
        Получить количество новых работ с момента последнего просмотра.
        Возвращает 0, если количество работ уменьшилось или не изменилось.
        """
        try:
            view = cls.objects.get(user=user, category=category)
            current_count = cls.get_works_count(category)
            diff = current_count - view.works_count
            return max(0, diff) if diff > 0 else 0
        except cls.DoesNotExist:
            # Если пользователь ещё не просматривал эту категорию
            return 0

    @classmethod
    def get_total_new_works(cls, user):
        """
        Получить общее количество новых работ по всем просмотренным категориям.
        Возвращает 0, если количество работ уменьшилось.
        """
        views = cls.objects.filter(user=user)
        total_new = 0

        for view in views:
            current_count = cls.get_works_count(view.category)
            diff = current_count - view.works_count
            if diff > 0:
                total_new += diff

        return max(0, total_new)


class UserFavoriteCategory(models.Model):
    """
    Любимые категории пользователя для получения уведомлений.

    Если пользователь выбрал категории, уведомления о новых работах
    приходят только по этим категориям. Если категории не выбраны,
    уведомления не отправляются.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorite_categories')
    category = models.ForeignKey('core.Category', on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)
    notify_new_works = models.BooleanField('Новые работы', default=True)
    notify_new_comments = models.BooleanField('Новые комментарии', default=True)

    class Meta:
        verbose_name = 'Любимая категория'
        verbose_name_plural = 'Любимые категории'
        unique_together = ['user', 'category']
        indexes = [
            models.Index(fields=['user', 'category']),
        ]

    def __str__(self):
        return f'{self.user.username} - {self.category.name}'

    @classmethod
    def get_user_favorite_category_ids(cls, user):
        """Получить ID любимых категорий пользователя"""
        return cls.objects.filter(user=user).values_list('category_id', flat=True)

    @classmethod
    def user_has_favorites(cls, user):
        """Проверить, есть ли у пользователя выбранные категории"""
        return cls.objects.filter(user=user).exists()

    @classmethod
    def should_notify_user(cls, user, category_id):
        """
        Проверить, нужно ли уведомлять пользователя о новой работе в категории.

        Если у пользователя нет выбранных категорий - не уведомлять.
        Если категория не в списке любимых - не уведомлять.
        """
        # Если у пользователя нет ни одной любимой категории - не уведомляем
        if not cls.user_has_favorites(user):
            return False

        # Проверяем, есть ли категория в любимых
        return cls.objects.filter(user=user, category_id=category_id).exists()
