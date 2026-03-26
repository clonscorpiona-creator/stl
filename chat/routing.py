"""
WebSocket роутинг для чата.

Архитектура:
- URLRouter для маршрутизации WebSocket подключений
- ChatConsumer для обработки сообщений в реальном времени
"""

from django.urls import path
from . import consumers

websocket_urlpatterns = [
    # Основное WebSocket подключение для чата
    # ws://localhost:8000/ws/chat/<channel_slug>/
    path("ws/chat/<str:slug>/", consumers.ChatConsumer.as_asgi()),
]
