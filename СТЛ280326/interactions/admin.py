from django.contrib import admin
from .models import Like, Comment, Repost, SavedWork, Notification


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ['user', 'work', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'work__title']
    ordering = ['-created_at']


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['user', 'work', 'parent', 'is_deleted', 'created_at']
    list_filter = ['is_deleted', 'created_at']
    search_fields = ['user__username', 'work__title', 'content']
    ordering = ['-created_at']


@admin.register(Repost)
class RepostAdmin(admin.ModelAdmin):
    list_display = ['user', 'work', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'work__title']
    ordering = ['-created_at']


@admin.register(SavedWork)
class SavedWorkAdmin(admin.ModelAdmin):
    list_display = ['user', 'work', 'collection', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'work__title']
    ordering = ['-created_at']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['recipient', 'actor', 'type', 'work', 'is_read', 'created_at']
    list_filter = ['type', 'is_read', 'created_at']
    search_fields = ['recipient__username', 'actor__username', 'work__title']
    ordering = ['-created_at']
