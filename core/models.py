from django.db import models
from django.utils.text import slugify
from django.contrib.auth import get_user_model
from taggit.managers import TaggableManager

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

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            while Work.objects.filter(slug=slug, author=self.author).exists():
                slug = f'{base_slug}-{counter}'
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        """Получить URL работы"""
        if self.author and self.slug:
            return f'/works/{self.author.username}/{self.slug}/'
        return None


class WorkImage(models.Model):
    """Изображения работы (галерея)"""
    work = models.ForeignKey(Work, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField('Изображение', upload_to='works/images/')
    order = models.PositiveIntegerField(default=0)
    caption = models.CharField('Подпись', max_length=200, blank=True)

    class Meta:
        verbose_name = 'Изображение'
        verbose_name_plural = 'Изображения'
        ordering = ['order']

    def __str__(self):
        return f'Image {self.order} for {self.work.title}'


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
