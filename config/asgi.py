"""
ASGI config for config project.

WebSocket support for Django Channels.

Архитектура:
- WebSocket consumer для реального времени
- Session middleware для авторизации через Django session
- InMemory channel layer для разработки (Redis для production)
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.urls import path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

django_asgi_app = get_asgi_application()

# Импортируем WebSocket роутинг и middleware после инициализации Django
from chat import routing as chat_routing
from chat.middleware import WebSocketAuthMiddlewareStack

application = ProtocolTypeRouter({
    # HTTP запросы обрабатываются стандартным Django ASGI
    "http": django_asgi_app,

    # WebSocket подключения с кастомной авторизацией
    "websocket": AllowedHostsOriginValidator(
        WebSocketAuthMiddlewareStack(
            URLRouter(
                chat_routing.websocket_urlpatterns
            )
        )
    ),
})
