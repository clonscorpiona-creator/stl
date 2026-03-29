from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/<str:username>/', views.profile_view, name='profile'),
    path('profile/<str:username>/follow/', views.follow_toggle, name='follow'),
    path('edit/', views.edit_profile, name='edit'),
    path('warning/<int:user_id>/', views.give_warning, name='warning_give'),
    path('warning/<int:warning_id>/remove/', views.remove_warning, name='warning_remove'),
    path('user/<int:user_id>/toggle-ban/', views.toggle_ban, name='toggle_ban'),
]
