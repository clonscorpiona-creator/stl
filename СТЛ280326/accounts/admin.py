from django.contrib import admin
from .models import Profile, Follow, Warning


@admin.register(Warning)
class WarningAdmin(admin.ModelAdmin):
    list_display = ['user', 'moderator', 'reason', 'is_yellow', 'created_at', 'get_warning_count']
    list_filter = ['is_yellow', 'created_at', 'user']
    search_fields = ['user__username', 'reason', 'moderator__username']
    ordering = ['-created_at']
    readonly_fields = ['created_at']

    def get_warning_count(self, obj):
        return obj.user.profile.warning_count
    get_warning_count.short_description = 'Всего предупреждений'


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'display_name', 'followers_count', 'following_count', 'works_count', 'warning_count', 'is_banned', 'is_verified', 'is_pro', 'is_moderator', 'is_senior_moderator']
    list_filter = ['is_verified', 'is_pro', 'is_banned', 'is_moderator', 'is_senior_moderator']
    search_fields = ['user__username', 'display_name']
    ordering = ['-followers_count']

    fieldsets = (
        ('Основное', {
            'fields': ('user', 'display_name', 'slug')
        }),
        ('Статистика', {
            'fields': ('followers_count', 'following_count', 'works_count', 'likes_received')
        }),
        ('Настройки', {
            'fields': ('is_verified', 'is_pro', 'is_moderator', 'is_senior_moderator')
        }),
        ('Предупреждения и баны', {
            'fields': ('warning_count', 'is_banned', 'banned_at', 'banned_by', 'ban_reason')
        }),
    )

    readonly_fields = ['warning_count', 'banned_at', 'banned_by', 'ban_reason']


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ['follower', 'following', 'created_at']
    list_filter = ['created_at']
    search_fields = ['follower__username', 'following__username']
    ordering = ['-created_at']
