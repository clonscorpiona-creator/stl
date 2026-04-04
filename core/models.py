from django.db import models
from django.utils.text import slugify
from django.contrib.auth import get_user_model
from django.utils import timezone
from taggit.managers import TaggableManager
from .utils import custom_upload_to


class NewWorksSettings(models.Model):
    """
    Настройки функционала "Новые работы и комментарии".

    Хранит конфигурацию для функции отслеживания новых работ
    и комментариев из просмотренных категорий пользователя.
    """
    # Основные настройки
    enabled = models.BooleanField('Включено', default=True)
    refresh_interval = models.PositiveIntegerField('Интервал обновления (сек)', default=10, help_text='Как часто обновлять счетчик новых работ (в секундах)')
    max_new_works_display = models.PositiveIntegerField('Макс. новых работ', default=50, help_text='Максимальное количество новых работ для отображения')
    max_comments_display = models.PositiveIntegerField('Макс. комментариев', default=20, help_text='Максимальное количество комментариев для отображения')

    # Настройки отображения
    show_in_header = models.BooleanField('Показывать в шапке', default=True)
    show_in_notifications = models.BooleanField('Показывать в уведомлениях', default=True)
    badge_color = models.CharField('Цвет бейджа', max_length=20, default='#ef4444', help_text='Hex цвет для бейджа уведомлений')

    # Настройки отслеживания
    track_categories = models.BooleanField('Отслеживать категории', default=True)
    track_comments = models.BooleanField('Отслеживать комментарии', default=True)
    comment_lookback_hours = models.PositiveIntegerField('Период комментариев (часы)', default=24, help_text='За сколько часов показывать новые комментарии')

    # Даты
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Настройки новых работ'
        verbose_name_plural = 'Настройки новых работ и комментариев'

    def __str__(self):
        status = 'Включено' if self.enabled else 'Отключено'
        return f'Настройки новых работ ({status})'

    @classmethod
    def get_settings(cls):
        """Получить текущие настройки (синглтон)"""
        instance = cls.objects.first()
        if not instance:
            instance = cls.objects.create()
        return instance

User = get_user_model()


class Category(models.Model):
    """Категории работ"""
    name = models.CharField('Название', max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField('Иконка (класс)', max_length=50, blank=True)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='children')

    class Meta:
        verbose_name = 'Категория'
        verbose_name_plural = 'Категории'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Work(models.Model):
    """Работа/проект в портфолио"""
    STATUS_CHOICES = [
        ('draft', 'Черновик'),
        ('published', 'Опубликовано'),
        ('moderation', 'На модерации'),
        ('rejected', 'Отклонено'),
    ]

    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='works')
    title = models.CharField('Название', max_length=200)
    slug = models.SlugField(blank=True)
    description = models.TextField('Описание', blank=True)

    # Медиа
    cover = models.ImageField('Обложка', upload_to='works/covers/', null=True, blank=True)

    # Категории и теги
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.SET_NULL, related_name='works')
    tags = TaggableManager()

    # Статус
    status = models.CharField('Статус', max_length=20, choices=STATUS_CHOICES, default='moderation')

    # Статистика
    views_count = models.PositiveIntegerField(default=0)
    likes_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    reposts_count = models.PositiveIntegerField(default=0)
    saves_count = models.PositiveIntegerField(default=0)

    # Модерация
    moderated_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='moderated_works')
    moderated_at = models.DateTimeField(null=True, blank=True)
    moderation_comment = models.TextField(blank=True)

    # Рекомендации администрации
    is_admin_recommended = models.BooleanField('Рекомендует администрация', default=False)
    recommended_at = models.DateTimeField(null=True, blank=True)
    recommended_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='recommended_works')

    # Блокировка работы
    is_blocked = models.BooleanField('Заблокировано', default=False)
    blocked_at = models.DateTimeField(null=True, blank=True)
    blocked_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='blocked_works')
    block_reason = models.TextField('Причина блокировки', blank=True)

    # Даты
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Работа'
        verbose_name_plural = 'Работы'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['-likes_count']),
            models.Index(fields=['-views_count']),
        ]

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        """Получить URL работы"""
        if self.author and self.slug:
            return f'/works/{self.author.username}/{self.slug}/'
        return None

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            if not base_slug:
                # Fallback для нелатинских заголовков (кириллица и др.)
                base_slug = f'work-{timezone.now().timestamp()}'
            slug = base_slug
            counter = 1
            while Work.objects.filter(slug=slug, author=self.author).exists():
                slug = f'{base_slug}-{counter}'
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)


class WorkImage(models.Model):
    """Изображения работы (галерея)"""
    work = models.ForeignKey(Work, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField('Изображение', upload_to=custom_upload_to)
    order = models.PositiveIntegerField(default=0)
    caption = models.CharField('Подпись', max_length=200, blank=True)

    class Meta:
        verbose_name = 'Изображение'
        verbose_name_plural = 'Изображения'
        ordering = ['order']

    def __str__(self):
        return f'Image {self.order} for {self.work.title}'


class WorkVideo(models.Model):
    """Видео работы"""
    work = models.ForeignKey(Work, on_delete=models.CASCADE, related_name='videos')
    video = models.FileField('Видео', upload_to=custom_upload_to)
    order = models.PositiveIntegerField(default=0)
    caption = models.CharField('Подпись', max_length=200, blank=True)
    duration = models.PositiveIntegerField('Длительность (сек)', null=True, blank=True)

    class Meta:
        verbose_name = 'Видео'
        verbose_name_plural = 'Видео'
        ordering = ['order']

    def __str__(self):
        return f'Video {self.order} for {self.work.title}'


class WorkAudio(models.Model):
    """Аудио работы"""
    work = models.ForeignKey(Work, on_delete=models.CASCADE, related_name='audio_files')
    audio = models.FileField('Аудио', upload_to=custom_upload_to)
    order = models.PositiveIntegerField(default=0)
    title = models.CharField('Название', max_length=200, blank=True)

    class Meta:
        verbose_name = 'Аудио'
        verbose_name_plural = 'Аудио'
        ordering = ['order']

    def __str__(self):
        return f'Audio {self.order} for {self.work.title}'


class WorkFrame(models.Model):
    """Выбранные кадры из видео работы"""
    work = models.ForeignKey(Work, on_delete=models.CASCADE, related_name='frames')
    video = models.ForeignKey(WorkVideo, on_delete=models.CASCADE, related_name='frames', null=True, blank=True)
    frame_time = models.FloatField('Время кадра (сек)', null=True, blank=True)
    frame_image = models.ImageField('Кадр', upload_to='works/frames/', null=True, blank=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']
        verbose_name = 'Кадр видео'
        verbose_name_plural = 'Кадры видео'

    def __str__(self):
        return f'Frame at {self.frame_time}s for {self.work.title}'


class Collection(models.Model):
    """Подборки работ (как в Pinterest)"""
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='collections')
    title = models.CharField('Название', max_length=100)
    slug = models.SlugField(blank=True)
    description = models.TextField(blank=True)
    cover = models.ImageField('Обложка', upload_to='collections/', null=True, blank=True)
    is_public = models.BooleanField('Публичная', default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Подборка'
        verbose_name_plural = 'Подборки'
        unique_together = ['author', 'slug']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            while Collection.objects.filter(slug=slug, author=self.author).exists():
                slug = f'{base_slug}-{counter}'
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)


class CollectionItem(models.Model):
    """Элемент подборки"""
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE, related_name='items')
    work = models.ForeignKey(Work, on_delete=models.CASCADE, related_name='in_collections')
    added_at = models.DateTimeField(auto_now_add=True)
    note = models.TextField('Заметка', blank=True)

    class Meta:
        verbose_name = 'Элемент подборки'
        verbose_name_plural = 'Элементы подборок'
        unique_together = ['collection', 'work']
        ordering = ['-added_at']

    def __str__(self):
        return f'{self.work.title} in {self.collection.title}'


class IconSet(models.Model):
    """
    Наборы иконок для сайта.
    Переключение между наборами через админ-панель.
    """
    name = models.CharField('Название', max_length=50, unique=True)
    slug = models.SlugField('Слаг', unique=True, help_text='Имя папки с иконками (например: default, business, minimal)')
    is_active = models.BooleanField('Активный набор', default=False, help_text='Только один набор может быть активным')
    description = models.CharField('Описание', max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Набор иконок'
        verbose_name_plural = 'Наборы иконок'
        ordering = ['name']

    def __str__(self):
        status = ' (Активный)' if self.is_active else ''
        return f'{self.name}{status}'

    def save(self, *args, **kwargs):
        # Если этот набор активен, деактивируем все остальные
        if self.is_active:
            IconSet.objects.exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)

    @classmethod
    def get_active_set(cls):
        """Получить активный набор иконок"""
        instance = cls.objects.filter(is_active=True).first()
        if not instance:
            # По умолчанию используем 'default'
            instance = cls.objects.filter(slug='default').first()
        return instance


class Project(models.Model):
    """Проект в стиле Behance (многостраничный проект с шагами)"""
    STATUS_CHOICES = [
        ('draft', 'Черновик'),
        ('published', 'Опубликовано'),
        ('moderation', 'На модерации'),
    ]

    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects')
    title = models.CharField('Название', max_length=200)
    slug = models.SlugField(blank=True)
    description = models.TextField('Описание', blank=True)
    cover = models.ImageField('Обложка', upload_to='projects/covers/', null=True, blank=True)
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.SET_NULL, related_name='projects')
    status = models.CharField('Статус', max_length=20, choices=STATUS_CHOICES, default='moderation')
    views_count = models.PositiveIntegerField(default=0)
    likes_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    bg_color = models.CharField('Цвет фона', max_length=20, default='#FFFFFF')
    bg_image = models.ImageField('Фоновое изображение', upload_to='projects/bg/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Проект'
        verbose_name_plural = 'Проекты'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['-likes_count']),
        ]

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        if self.author and self.slug:
            return f'/projects/{self.author.username}/{self.slug}/'
        return None

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            if not base_slug:
                base_slug = f'project-{timezone.now().timestamp()}'
            slug = base_slug
            counter = 1
            while Project.objects.filter(slug=slug, author=self.author).exists():
                slug = f'{base_slug}-{counter}'
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)


class ProjectStep(models.Model):
    """Шаг проекта (отдельная страница/секция)"""
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='steps')
    image = models.ImageField('Изображение', upload_to='projects/steps/', null=True, blank=True)
    title = models.CharField('Заголовок', max_length=200, blank=True)
    description = models.TextField('Описание', blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'Шаг проекта'
        verbose_name_plural = 'Шаги проекта'
        ordering = ['order']

    def __str__(self):
        return f'{self.title or "Step"} — {self.project.title}'


class ProjectLike(models.Model):
    """Лайк проекта"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='project_likes')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Лайк проекта'
        verbose_name_plural = 'Лайки проектов'
        unique_together = ['user', 'project']

    def __str__(self):
        return f'{self.user} likes {self.project}'

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self._update_counter()

    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
        self._update_counter()

    def _update_counter(self):
        count = ProjectLike.objects.filter(project=self.project).count()
        self.project.likes_count = count
        self.project.save(update_fields=['likes_count'])


class ProjectComment(models.Model):
    """Комментарий к проектуу"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='project_comments')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='comments')
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='replies')
    content = models.TextField('Комментарий')
    is_deleted = models.BooleanField(default=False)
    likes_count = models.PositiveIntegerField(default=0)
    is_edited = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Комментарий к проекту'
        verbose_name_plural = 'Комментарии к проектам'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user} — {self.project}'

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            self.project.comments_count += 1
            self.project.save(update_fields=['comments_count'])

    def delete(self, *args, **kwargs):
        pid = self.project.pk
        super().delete(*args, **kwargs)
        Project.objects.filter(pk=pid).update(comments_count=models.F('comments_count') - 1)


class ProjectCommentLike(models.Model):
    """Лайк комментарияк проектуу"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='project_comment_likes')
    comment = models.ForeignKey(ProjectComment, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Лайк комментария к проекту'
        verbose_name_plural = 'Лайки комментариев к проектам'
        unique_together = ['user', 'comment']

    def __str__(self):
        return f'{self.user} likes comment {self.comment.pk}'

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self._update_counter()

    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
        self._update_counter()

    def _update_counter(self):
        count = ProjectCommentLike.objects.filter(comment=self.comment).count()
        self.comment.likes_count = count
        self.comment.save(update_fields=['likes_count'])
