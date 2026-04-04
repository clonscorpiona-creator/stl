from django.urls import path
from . import views
from . import api

app_name = 'core'

urlpatterns = [
    # Page views
    path('', views.home_view, name='home'),
    path('feed/', views.feed_view, name='feed'),
    path('buttons-test/', views.buttons_test_view, name='buttons_test'),
    path('works/', views.works_all_view, name='work_list'),
    path('drafts/', views.drafts_view, name='drafts'),
    path('new-works/', views.new_works_and_comments, name='new_works'),
    path('works/<str:username>/<str:slug>/', views.work_detail_view, name='work_detail'),
    path('works/create/', views.create_work, name='work_create'),
    path('works/<str:username>/<str:slug>/edit/', views.edit_work, name='work_edit'),
    path('works/<str:username>/<str:slug>/delete/', views.delete_work, name='work_delete'),
    path('works/<str:username>/<str:slug>/publish/', views.publish_work, name='work_publish'),
    path('works/<str:username>/<str:slug>/unpublish/', views.unpublish_work, name='work_unpublish'),
    path('tags/', views.tag_list_view, name='tag_list'),
    path('tags/<str:slug>/', views.tag_detail_view, name='tag_detail'),
    path('collections/', views.collection_list, name='collection_list'),
    path('collections/create/', views.collection_create, name='collection_create'),
    path('collections/<str:username>/<str:slug>/', views.collection_detail_view, name='collection_detail'),
    path('collections/<str:slug>/add/<int:work_id>/', views.collection_add_work, name='collection_add'),
    path('collections/<str:slug>/remove/<int:work_id>/', views.collection_remove_work, name='collection_remove'),

    # SPA route
    path('app/', views.spa_view, name='spa'),

    # API endpoints
    path('api/works/', api.works_list_api, name='api_works'),
    path('api/works/<int:work_id>/', api.work_detail_api, name='api_work_detail'),
    path('api/feed/', api.feed_api, name='api_feed'),
    path('api/home/', api.home_api, name='api_home'),
    path('api/categories/', api.categories_api, name='api_categories'),
    path('api/tags/', api.tags_api, name='api_tags'),
    path('api/new-works-count/', api.new_works_count_api, name='api_new_works_count'),
    path('api/mark-works-viewed/', api.mark_works_viewed_api, name='api_mark_works_viewed'),
    path('api/notifications-count/', api.notifications_count_api, name='api_notifications_count'),
    path('api/notifications-detailed/', api.notifications_detailed_api, name='api_notifications_detailed'),
    path('api/mark-notifications-viewed/', api.mark_notifications_viewed_api, name='api_mark_notifications_viewed'),
    path('api/mark-notification-viewed/<int:notification_id>/', api.mark_notification_viewed_api, name='api_mark_notification_viewed'),

    # Work frames API
    path('api/works/<int:work_id>/frames/', api.get_work_frames_api, name='api_work_frames'),
    path('api/works/<int:work_id>/extract-frame/', api.extract_frame_api, name='api_extract_frame'),
    path('api/frames/<int:frame_id>/set-cover/', api.set_cover_from_frame_api, name='api_set_cover'),
    path('api/frames/<int:frame_id>/delete/', api.delete_frame_api, name='api_delete_frame'),

    # Admin recommendation API
    path('api/works/<int:work_id>/toggle-recommend/', api.toggle_admin_recommend_api, name='api_toggle_recommend'),

    # Admin work moderation API
    path('api/works/<int:work_id>/delete/', api.delete_work_api, name='api_delete_work'),

    # Icon set switcher (staff only)
    path('icon-set/<str:set_slug>/', views.switch_icon_set, name='switch_icon_set'),

    # Theme switcher API (staff only)
    path('api/theme/switch/', views.switch_theme, name='switch_theme'),
    path('api/theme/get/', views.get_theme, name='get_theme'),

    # Hero bg switcher API (staff only)
    path('api/set-hero-bg/', views.set_hero_bg, name='set_hero_bg'),

    # Admin theme page (staff only)
    path('admin/theme/', views.admin_theme_page, name='admin_theme'),
]
