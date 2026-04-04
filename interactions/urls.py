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
    path('repost/<int:work_id>/', views.repost_toggle, name='repost'),
    path('save/<int:work_id>/', views.save_work_toggle, name='save'),
    path('unsave/<int:work_id>/', views.unsave_work, name='unsave'),
    path('notifications/', views.notifications_view, name='notifications'),
    path('notifications/<path:category_slug>/<str:notification_type>/', views.notifications_filtered_view, name='notifications_filtered'),

    # Project interactions
    path('project-like/<int:project_id>/', views.project_like_toggle, name='project_like'),
    path('project-comment/<int:project_id>/', views.project_comment_create, name='project_comment'),
    path('project-comment/edit/<int:comment_id>/', views.project_comment_edit, name='project_comment_edit'),
    path('project-comment/delete/<int:comment_id>/', views.project_comment_delete, name='project_comment_delete'),
    path('project-comment/like/<int:comment_id>/', views.project_comment_like_toggle, name='project_comment_like'),
]
