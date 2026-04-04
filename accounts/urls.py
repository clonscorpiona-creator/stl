from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('create-admin/', views.create_admin_view, name='create_admin'),
    path('deploy-update/', views.deploy_update_view, name='deploy_update'),
    path('profile/test/', views.profile_test, name='profile_test'),
    path('portfolio/', views.portfolio_page, name='portfolio'),
    path('portfolio/<str:username>/', views.portfolio_page, name='portfolio_user'),
    path('profile/<str:username>/follow/', views.follow_toggle, name='follow'),
    path('profile/<str:username>/followers/', views.followers_list, name='followers'),
    path('profile/<str:username>/following/', views.following_list, name='following'),
    path('profile/<str:username>/', views.profile_view, name='profile'),
    path('edit/', views.edit_profile, name='edit'),
    path('favorite-categories/', views.favorite_categories, name='favorite_categories'),
    path('users/', views.users_list, name='users_list'),
    path('favorite-categories/<int:category_id>/toggle/', views.toggle_favorite_category, name='toggle_favorite_category'),

    # Проекты пользователя
    path('profile/<str:username>/projects/', views.user_projects, name='user_projects'),

    # Предупреждения и баны
    path('warning/<int:user_id>/give/', views.give_warning, name='warning_give'),
    path('warning/<int:warning_id>/remove/', views.remove_warning, name='warning_remove'),
    path('ban/<int:user_id>/toggle/', views.toggle_ban, name='ban_toggle'),
]
