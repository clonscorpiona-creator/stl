from django.contrib import admin
from django.urls import path
from django.shortcuts import render, redirect
from django.contrib.admin.views.decorators import staff_member_required
from .models import Category, Work, WorkImage, WorkVideo, WorkFrame, Collection, CollectionItem, NewWorksSettings, IconSet


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'parent']
    list_filter = ['parent']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}


class WorkFrameInline(admin.TabularInline):
    """Кадры видео для работы"""
    model = WorkFrame
    extra = 0
    max_num = 10
    fields = ['frame_image', 'frame_time', 'video', 'order']
    readonly_fields = ['frame_image', 'frame_time', 'video', 'order']

    def has_add_permission(self, request, obj=None):
        # Проверка на максимальное количество (10)
        if obj and obj.frames.count() >= 10:
            return False
        return True


@admin.register(Work)
class WorkAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'category', 'status', 'is_admin_recommended', 'views_count', 'likes_count', 'created_at']
    list_filter = ['status', 'category', 'is_admin_recommended', 'created_at']
    search_fields = ['title', 'description', 'author__username']
    prepopulated_fields = {'slug': ('title',)}
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    list_editable = ['status', 'is_admin_recommended']

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
        ('Рекомендации', {
            'fields': ('is_admin_recommended', 'recommended_at', 'recommended_by'),
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

    readonly_fields = ['views_count', 'likes_count', 'comments_count', 'reposts_count', 'saves_count', 'created_at', 'updated_at', 'published_at', 'recommended_at', 'recommended_by']

    def save_model(self, request, obj, form, change):
        if not change:
            obj.moderated_by = request.user
        super().save_model(request, obj, form, change)

    inlines = [WorkFrameInline]


@admin.register(WorkImage)
class WorkImageAdmin(admin.ModelAdmin):
    list_display = ['work', 'order', 'caption']
    list_filter = ['work__category']
    ordering = ['order']


@admin.register(WorkVideo)
class WorkVideoAdmin(admin.ModelAdmin):
    list_display = ['work', 'order', 'caption', 'duration']
    list_filter = ['work__category']
    ordering = ['order']


@admin.register(WorkFrame)
class WorkFrameAdmin(admin.ModelAdmin):
    list_display = ['work', 'frame_time', 'order', 'created_at']
    list_filter = ['work__category', 'created_at']
    search_fields = ['work__title', 'work__author__username']
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


@admin.register(IconSet)
class IconSetAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'is_active', 'description', 'updated_at']
    list_filter = ['is_active']
    search_fields = ['name', 'description']
    ordering = ['name']

    fieldsets = (
        ('Основное', {
            'fields': ('name', 'slug', 'description')
        }),
        ('Статус', {
            'fields': ('is_active',),
            'description': 'Активируйте нужный набор иконок. Только один набор может быть активным.'
        }),
    )

    def save_model(self, request, obj, form, change):
        # Если этот набор активен, деактивируем все остальные
        if obj.is_active:
            IconSet.objects.exclude(pk=obj.pk).update(is_active=False)
        super().save_model(request, obj, form, change)
