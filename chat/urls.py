from django.urls import path
from . import api, views

app_name = 'chat'

urlpatterns = [
    # Pages
    path('', views.chat_index, name='index'),
    path('<str:slug>/', views.chat_room, name='room'),
    path('<str:slug>/admin/', views.chat_admin, name='admin'),
    path('<str:slug>/test-auth/', views.test_auth, name='test_auth'),

    # API
    path('api/session-status/', api.session_status_api, name='api_session_status'),
    path('api/channels/', api.channels_list_api, name='api_channels'),
    path('api/channels/<str:slug>/', api.channel_detail_api, name='api_channel_detail'),
    path('api/channels/<str:slug>/join/', api.join_channel_api, name='api_join_channel'),
    path('api/channels/<str:slug>/leave/', api.leave_channel_api, name='api_leave_channel'),
    path('api/channels/<str:slug>/members/', api.channel_members_api, name='api_channel_members'),

    # Messages
    path('api/channels/<str:slug>/messages/', api.send_message_api, name='api_send_message'),
    path('api/messages/<int:message_id>/like/', api.like_message_api, name='api_like_message'),
    path('api/messages/<int:message_id>/delete/', api.delete_message_api, name='api_delete_message'),

    # Moderation
    path('api/channels/<str:slug>/ban/', api.ban_user_api, name='api_ban_user'),
    path('api/channels/<str:slug>/unban/', api.unban_user_api, name='api_unban_user'),
    path('api/channels/<str:slug>/mute/', api.mute_user_api, name='api_mute_user'),
    path('api/channels/<str:slug>/unmute/', api.unmute_user_api, name='api_unmute_user'),
    path('api/channels/<str:slug>/promote/', api.promote_moderator_api, name='api_promote_moderator'),
]
