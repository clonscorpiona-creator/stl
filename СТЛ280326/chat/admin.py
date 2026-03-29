"""
Админ-панель для чата.

Оптимизация:
- list_select_related для уменьшения SQL запросов
- search_fields для быстрого поиска
- list_filter для фильтрации
"""

from django.contrib import admin
from .models import Channel, ChannelMember, ChannelBan, Message, MessageLike


@admin.register(Channel)
class ChannelAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'is_public', 'is_active', 'messages_count', 'members_count', 'created_at']
    list_filter = ['is_public', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    filter_horizontal = ['moderators']


@admin.register(ChannelMember)
class ChannelMemberAdmin(admin.ModelAdmin):
    list_display = ['user', 'channel', 'is_moderator', 'is_muted', 'joined_at']
    list_filter = ['is_moderator', 'is_muted', 'channel']
    search_fields = ['user__username', 'user__email', 'channel__name']
    list_select_related = ['user', 'channel']


@admin.register(ChannelBan)
class ChannelBanAdmin(admin.ModelAdmin):
    list_display = ['user', 'channel', 'moderator', 'created_at', 'expires_at', 'is_active_banner']
    list_filter = ['channel', 'created_at']
    search_fields = ['user__username', 'moderator__username', 'reason']
    list_select_related = ['user', 'channel', 'moderator']

    def is_active_banner(self, obj):
        return obj.is_active()
    is_active_banner.boolean = True
    is_active_banner.short_description = 'Активен'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'channel', 'content_preview', 'likes_count', 'is_deleted', 'created_at']
    list_filter = ['is_deleted', 'has_image', 'channel', 'created_at']
    search_fields = ['content', 'user__username', 'channel__name']
    list_select_related = ['user', 'channel']
    readonly_fields = ['likes_count', 'created_at', 'edited_at']

    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Сообщение'


@admin.register(MessageLike)
class MessageLikeAdmin(admin.ModelAdmin):
    list_display = ['user', 'message', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'message__content']
    list_select_related = ['user', 'message']
