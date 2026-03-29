from django.urls import path
from . import views

app_name = 'interactions'

urlpatterns = [
    # Page views
    path('like/<int:work_id>/', views.like_toggle, name='like'),
    path('comment/<int:work_id>/', views.comment_create, name='comment'),
    path('comment/delete/<int:comment_id>/', views.comment_delete, name='comment_delete'),
    path('comment/delete-permanent/<int:comment_id>/', views.comment_delete_permanently, name='comment_delete_permanent'),
    path('comment/edit/<int:comment_id>/', views.comment_edit, name='comment_edit'),
    path('comment/like/<int:comment_id>/', views.comment_like_toggle, name='comment_like'),
    path('repost/<int:work_id>/', views.repost_create, name='repost'),
    path('save/<int:work_id>/', views.save_work, name='save'),
    path('unsave/<int:work_id>/', views.unsave_work, name='unsave'),
    path('notifications/', views.notifications_view, name='notifications'),
    path('notifications/<path:category_slug>/<str:notification_type>/', views.notifications_filtered_view, name='notifications_filtered'),
]
