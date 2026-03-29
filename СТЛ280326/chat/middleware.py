"""
Middleware для WebSocket авторизации.

Проблема стандартного AuthMiddlewareStack:
- Не всегда корректно извлекает сессию из cookies
- Может не работать с кастомными User моделями

Решение:
- Явное извлечение sessionid из cookies
- Принудительная загрузка сессии и пользователя
- Интеграция с Django session middleware
"""

import asyncio
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from channels.layers import get_channel_layer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.sessions.models import Session
from django.contrib.sessions.backends.db import SessionStore
from django.utils import timezone
from django.contrib.auth.models import AnonymousUser
from urllib.parse import parse_qs, unquote

User = get_user_model()


@database_sync_to_async
def get_user_from_session_key(session_key):
    """
    Получить пользователя из ключа сессии.

    Args:
        session_key: Ключ сессии из cookies

    Returns:
        User или None
    """
    try:
        session = Session.objects.get(
            session_key=session_key,
            expire_date__gt=timezone.now()
        )
        uid = session.get_decoded().get('_auth_user_id')
        if uid:
            return User.objects.get(pk=uid)
    except (Session.DoesNotExist, User.DoesNotExist, KeyError, ValueError):
        pass
    return None


async def get_user_from_cookies(cookies_str):
    """
    Извлечь пользователя из cookie строки.

    Args:
        cookies_str: Строка cookies

    Returns:
        User или AnonymousUser
    """
    # Парсим cookies
    cookie_dict = {}
    if cookies_str:
        for cookie in cookies_str.split(';'):
            if '=' in cookie:
                key, value = cookie.strip().split('=', 1)
                cookie_dict[key] = unquote(value)

    session_key = cookie_dict.get('sessionid')
    if session_key:
        user = await get_user_from_session_key(session_key)
        if user:
            return user

    return AnonymousUser()


class WebSocketAuthMiddleware(BaseMiddleware):
    """
    Кастомный middleware для авторизации WebSocket подключений.

    Извлекает sessionid из cookies и аутентифицирует пользователя.
    Поддерживает как заголовок Cookie, так и query параметр ?token=
    """

    async def __call__(self, scope, receive, send):
        # Определяем тип подключения
        headers = dict(scope.get('headers', []))
        query_string = scope.get('query_string', b'').decode()

        # Пытаемся получить cookies из заголовка
        cookie_header = headers.get(b'cookie', b'').decode()

        # Также проверяем query string для токена (альтернативный метод)
        if not cookie_header and query_string:
            query_params = parse_qs(query_string)
            token = query_params.get('token', [None])[0]
            if token:
                # Токен может быть sessionid
                user = await get_user_from_session_key(token)
                scope['user'] = user if user else AnonymousUser()
                return await super().__call__(scope, receive, send)

        # Получаем пользователя из cookies
        if cookie_header:
            user = await get_user_from_cookies(cookie_header)
            scope['user'] = user
        else:
            scope['user'] = AnonymousUser()

        return await super().__call__(scope, receive, send)


class TokenAuthMiddleware(BaseMiddleware):
    """
    Middleware для авторизации через токен в query string.

    Использование:
        ws://localhost:8000/ws/chat/general/?token=<sessionid>

    Это полезно когда WebSocket клиент не может отправить cookies.
    """

    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode()

        if query_string:
            query_params = parse_qs(query_string)
            token = query_params.get('token', [None])[0]

            if token:
                user = await get_user_from_session_key(token)
                scope['user'] = user if user else AnonymousUser()
                return await super().__call__(scope, receive, send)

        scope['user'] = AnonymousUser()
        return await super().__call__(scope, receive, send)


def WebSocketAuthMiddlewareStack(inner):
    """
    Обёртка для применения middleware.

    Usage:
        WebSocketAuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        )
    """
    return WebSocketAuthMiddleware(inner)


def TokenAuthMiddlewareStack(inner):
    """
    Обёртка для TokenAuthMiddleware.

    Usage:
        TokenAuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        )
    """
    return TokenAuthMiddleware(inner)
