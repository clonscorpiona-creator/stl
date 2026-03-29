from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/<str:username>/follow/', views.follow_toggle, name='follow'),
    path('profile/<str:username>/followers/', views.followers_list, name='followers'),
    path('profile/<str:username>/following/', views.following_list, name='following'),
    path('profile/<str:username>/', views.profile_view, name='profile'),
    path('edit/', views.edit_profile, name='edit'),
    path('favorite-categories/', views.favorite_categories, name='favorite_categories'),
    path('favorite-categories/<int:category_id>/toggle/', views.toggle_favorite_category, name='toggle_favorite_category'),

    # Предупреждения и баны
    path('warning/<int:user_id>/give/', views.give_warning, name='warning_give'),
    path('warning/<int:warning_id>/remove/', views.remove_warning, name='warning_remove'),
    path('ban/<int:user_id>/toggle/', views.toggle_ban, name='ban_toggle'),
]
