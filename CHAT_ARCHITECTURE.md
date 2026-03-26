# Архитектура чата STL Platform

## Схема интеграции

```
┌─────────────────────────────────────────────────────────────────┐
│                     STL Platform (Django)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   core/     │  │  accounts/  │  │       chat/ ⭐          │ │
│  │  Лента      │  │  Профиль    │  │  ┌───────────────────┐  │ │
│  │  Работы     │  │  Регистрация│  │  │ WebSocket Consumer│  │ │
│  └─────────────┘  └─────────────┘  │  │ - connect           │  │ │
│                                      │  │ - disconnect        │  │ │
│  ┌─────────────────────────────┐    │  │ - receive (message) │  │ │
│  │      base.html              │    │  │ - handle_like       │  │ │
│  │  ┌───────────────────────┐  │    │  │ - handle_delete     │  │ │
│  │  │  Навигация            │  │    │  └───────────────────┘  │  │ │
│  │  │  💬 Чат <─────────────┼────┼────│  HTTP API             │  │ │
│  │  └───────────────────────┘  │    │  │ - /api/channels/    │  │ │
│  └─────────────────────────────┘    │  │ - /api/messages/    │  │ │
│                                      │  │ - /api/moderation/  │  │ │
│  ┌─────────────────────────────┐    │  └───────────────────────┘  │ │
│  │  context_processors.py      │    │  ┌───────────────────────┐  │ │
│  │  chat_context() ────────────┼────┤  │ history.py            │  │ │
│  │  - chat_enabled             │    │  │ - save_message()      │  │ │
│  │  - chat_channels            │    │  │ - load_history()      │  │ │
│  │  - chat_is_moderator        │    │  │ - export/import       │  │ │
│  └─────────────────────────────┘    │  └───────────────────────┘  │ │
│                                      └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  chat_history/│
                    │  general.json │
                    │  other.json   │
                    └───────────────┘
```

## Поток авторизации WebSocket

```
┌──────────────┐                          ┌──────────────────┐
│  Browser     │                          │  Django Server   │
│              │                          │                  │
│  sessionid   │  ──────────────────────> │  Session DB      │
│  in Cookie   │      HTTP Request        │  ┌────────────┐  │
│              │                          │  │session_key │  │
│              │  <────────────────────── │  │user_id     │  │
│  Set-Cookie  │      Set-Cookie          │  └────────────┘  │
│  sessionid   │                          │                  │
│              │                          │                  │
│  WebSocket   │ ───────────────────────> │  middleware.py   │
│  Connection  │     Cookie: sessionid    │  ┌────────────┐  │
│              │                          │  │1. Parse    │  │
│              │ <──────────────────────  │  │   cookies  │  │
│  Auth OK     │     user scope           │  │2. Get user │  │
│              │                          │  │   from DB  │  │
│              │                          │  │3. Set      │  │
│  chat_room   │ ───────────────────────> │  │   scope    │  │
│  (JS)        │     WebSocket send       │  └────────────┘  │
│              │     {type: 'message'}    │                  │
└──────────────┘                          └──────────────────┘
```

## Компоненты и связи

### 1. middleware.py (Критично для авторизации)
```python
WebSocketAuthMiddleware
├── Извлекает cookies из заголовка
├── Парсит sessionid
├── Загружает сессию из БД
├── Получает user_id из сессии
└── Устанавливает scope['user']
```

### 2. consumers.py (WebSocket логика)
```python
ChatConsumer
├── connect() - проверка авторизации
├── receive() - обработка сообщений
├── handle_message() - отправка в группу
├── handle_like() - лайки
└── handle_delete() - удаление
```

### 3. history.py (Сохранение истории)
```python
Функции:
├── save_message_to_history()
├── load_channel_history()
├── delete_message_in_history()
├── add_reaction_to_history()
└── export/import команды
```

### 4. context_processors.py (Интеграция с сайтом)
```python
chat_context(request)
├── chat_enabled
├── chat_channels (список)
├── chat_current_channel
├── chat_is_moderator
└── chat_is_member
```

## Точки интеграции в сайт

| Файл | Изменения | Назначение |
|------|-----------|------------|
| `templates/base.html` | Кнопка "💬 Чат" | Навигация в чат |
| `config/settings.py` | `chat.context_processors` | Контекст для шаблонов |
| `config/asgi.py` | `WebSocketAuthMiddleware` | Авторизация WebSocket |
| `chat/` app | Полная интеграция | Основная логика чата |

## Исправленные проблемы авторизации

### Было (проблема):
```python
# Стандартный AuthMiddlewareStack
from channels.auth import AuthMiddlewareStack

application = ProtocolTypeRouter({
    "websocket": AuthMiddlewareStack(
        URLRouter(...)
    )
})
# Проблема: не всегда корректно работает с кастомной User моделью
```

### Стало (решение):
```python
# Кастомный middleware
from chat.middleware import WebSocketAuthMiddlewareStack

application = ProtocolTypeRouter({
    "websocket": WebSocketAuthMiddlewareStack(
        URLRouter(...)
    )
})
# Решение: явное извлечение sessionid и загрузка пользователя
```

## Команды для работы с чатом

```bash
# Экспорт истории из БД в файлы
python manage.py export_chat_history --channel general --limit 1000

# Импорт из файлов в БД (проверка)
python manage.py import_chat_history --dry-run

# Импорт из файлов в БД (реальный)
python manage.py import_chat_history

# Запуск сервера
python manage.py runserver
```

## Production checklist

- [ ] Заменить InMemory channel layer на Redis
- [ ] Включить SESSION_COOKIE_SECURE=True
- [ ] Включить CSRF_COOKIE_SECURE=True
- [ ] Настроить Nginx для WebSocket (proxy_set_header Upgrade)
- [ ] Использовать Daphne/Uvicorn вместо runserver
- [ ] Настроить логирование WebSocket подключений
