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
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator
from django.urls import path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

django_asgi_app = get_asgi_application()

# Импортируем WebSocket роутинг после инициализации Django
from chat import routing as chat_routing

application = ProtocolTypeRouter({
    # HTTP запросы обрабатываются стандартным Django ASGI
    "http": django_asgi_app,

    # WebSocket подключения
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                chat_routing.websocket_urlpatterns
            )
        )
    ),
})
