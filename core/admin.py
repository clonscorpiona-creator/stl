from django.contrib import admin
from .models import Category, Work, WorkImage, Collection, CollectionItem


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'parent']
    list_filter = ['parent']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Work)
class WorkAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'category', 'status', 'views_count', 'likes_count', 'created_at']
    list_filter = ['status', 'category', 'created_at']
    search_fields = ['title', 'description', 'author__username']
    prepopulated_fields = {'slug': ('title',)}
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    list_editable = ['status']

    fieldsets = (
        ('Основное', {
            'fields': ('author', 'title', 'slug', 'description', 'category')
        }),
        ('Медиа', {
            'fields': ('cover',)
        }),
        ('Статус', {
            'fields': ('status', 'moderation_comment', 'moderated_by')
        }),
        ('Статистика', {
            'fields': ('views_count', 'likes_count', 'comments_count', 'reposts_count', 'saves_count'),
            'classes': ('readonly',)
        }),
        ('Даты', {
            'fields': ('created_at', 'updated_at', 'published_at'),
            'classes': ('readonly',)
        }),
    )

    readonly_fields = ['views_count', 'likes_count', 'comments_count', 'reposts_count', 'saves_count', 'created_at', 'updated_at', 'published_at']

    def save_model(self, request, obj, form, change):
        if not change:
            obj.moderated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(WorkImage)
class WorkImageAdmin(admin.ModelAdmin):
    list_display = ['work', 'order', 'caption']
    list_filter = ['work__category']
    ordering = ['order']


@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'is_public', 'created_at']
    list_filter = ['is_public', 'created_at']
    search_fields = ['title', 'author__username']
    prepopulated_fields = {'slug': ('title',)}


@admin.register(CollectionItem)
class CollectionItemAdmin(admin.ModelAdmin):
    list_display = ['collection', 'work', 'added_at']
    list_filter = ['collection', 'added_at']
    ordering = ['-added_at']
