"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# Импортируем API views напрямую для добавления в urlpatterns
from interactions import api as interactions_api

from core import views as core_views

urlpatterns = [
    # Admin theme page (must be before admin/ to avoid conflict)
    path('admin/theme/', core_views.admin_theme_page, name='admin_theme'),

    path('admin/', admin.site.urls),
    path('auth/', include('accounts.urls')),
    path('', include('core.urls')),
    path('interactions/', include('interactions.urls')),
    path('chat/', include('chat.urls')),

    # Interactions API endpoints (добавлены напрямую)
    path('interactions/api/like/<int:work_id>/', interactions_api.like_api, name='api_like'),
    path('interactions/api/save/<int:work_id>/', interactions_api.save_work_api, name='api_save'),
    path('interactions/api/comment/<int:work_id>/', interactions_api.comment_api, name='api_comment'),
    path('interactions/api/notifications/', interactions_api.notifications_api, name='api_notifications'),
    path('interactions/api/follow/<str:username>/', interactions_api.follow_api, name='api_follow'),
]

# Всегда добавляем медиа-файлы для разработки (даже если DEBUG=False через env)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
