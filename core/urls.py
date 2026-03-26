from django.urls import path
from . import views
from . import api

app_name = 'core'

urlpatterns = [
    # Page views
    path('', views.home_view, name='home'),
    path('feed/', views.feed_view, name='feed'),
    path('works/', views.work_list_view, name='work_list'),
    path('works/<str:username>/<str:slug>/', views.work_detail_view, name='work_detail'),
    path('works/create/', views.create_work, name='work_create'),
    path('works/<str:username>/<str:slug>/edit/', views.edit_work, name='work_edit'),
    path('works/<str:username>/<str:slug>/delete/', views.delete_work, name='work_delete'),
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
]
