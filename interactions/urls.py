from django.urls import path
from . import views

app_name = 'interactions'

urlpatterns = [
    # Page views
    path('like/<int:work_id>/', views.like_toggle, name='like'),
    path('comment/<int:work_id>/', views.comment_create, name='comment'),
    path('comment/delete/<int:comment_id>/', views.comment_delete, name='comment_delete'),
    path('repost/<int:work_id>/', views.repost_create, name='repost'),
    path('save/<int:work_id>/', views.save_work, name='save'),
    path('unsave/<int:work_id>/', views.unsave_work, name='unsave'),
    path('notifications/', views.notifications_view, name='notifications'),
]
