# STL Chat - Документация

## Архитектура

Чат встроен в платформу STL как отдельное приложение Django с поддержкой WebSocket для реального времени.

### Компоненты

```
chat/
├── api.py              # HTTP API для истории, лайков, модерации
├── consumers.py        # WebSocket consumer для реального времени
├── routing.py          # WebSocket URL маршрутизация
├── middleware.py       # Кастомный AuthMiddleware для WebSocket
├── history.py          # Сохранение истории в JSON файлы
├── context_processors.py  # Контекст чата для шаблонов
├── models.py           # Модели: Channel, Message, ChannelMember, etc.
├── views.py            # Django views для страниц чата
├── urls.py             # URL маршруты
└── templates/chat/     # HTML шаблоны
    ├── index.html      # Список каналов
    ├── room.html       # Комната чата
    └── admin.html      # Админ-панель модератора
```

### Интеграция с сайтом

#### 1. Навигация
Кнопка "💬 Чат" добавлена в `templates/base.html` в навигационную панель.

#### 2. Контекстный процессор
`chat.context_processors.chat_context` добавляет переменные:
- `chat_enabled` - включён ли чат
- `chat_channels` - список каналов
- `chat_current_channel` - текущий канал (если в чате)
- `chat_is_moderator` - является ли модератором
- `chat_is_member` - является ли участником

#### 3. Авторизация
Чат использует стандартную Django сессию для авторизации:
- HTTP API: стандартный `@login_required` декоратор
- WebSocket: кастомный `WebSocketAuthMiddleware` извлекает `sessionid` из cookies

## Авторизация в WebSocket

### Проблема
Стандартный `AuthMiddlewareStack` может некорректно работать с кастомной моделью пользователя.

### Решение
Кастомный middleware в `chat/middleware.py`:
1. Извлекает `sessionid` из Cookie заголовка
2. Находит сессию в БД
3. Получает `_auth_user_id` из декодированной сессии
4. Загружает пользователя

### Альтернативный метод
Авторизация через query параметр:
```javascript
const sessionid = document.cookie.split('sessionid=')[1]?.split(';')[0];
const ws = new WebSocket(`ws://localhost:8000/ws/chat/general/?token=${sessionid}`);
```

## Сохранение истории

### Файлы истории
Каждый канал имеет свой JSON файл:
```
chat_history/
├── general.json    # История канала "general"
├── off topic.json  # История канала "offtopic"
└── ...
```

### Структура файла
```json
{
  "channel_slug": "general",
  "messages": [
    {
      "id": 1,
      "content": "Привет!",
      "is_deleted": false,
      "likes_count": 0,
      "user": {
        "id": 1,
        "username": "admin",
        "is_moderator": true
      },
      "created_at": "2026-03-26T12:00:00Z"
    }
  ],
  "last_updated": "2026-03-26T12:00:00Z"
}
```

### Команды управления
```bash
# Экспорт из БД в файлы
python manage.py export_chat_history

# Импорт из файлов в БД
python manage.py import_chat_history

# Режим проверки импорта
python manage.py import_chat_history --dry-run
```

## API Endpoints

### Каналы
- `GET /chat/api/channels/` - список каналов
- `GET /chat/api/channels/<slug>/` - информация о канале + сообщения
- `POST /chat/api/channels/<slug>/join/` - присоединиться
- `POST /chat/api/channels/<slug>/leave/` - покинуть
- `GET /chat/api/channels/<slug>/members/` - участники

### Сообщения
- `POST /chat/api/channels/<slug>/messages/` - отправить сообщение
- `POST /chat/api/messages/<id>/like/` - лайк/анлайк
- `POST /chat/api/messages/<id>/delete/` - удалить

### Модерация (только для модераторов)
- `POST /chat/api/channels/<slug>/ban/` - забанить
- `POST /chat/api/channels/<slug>/unban/` - разбанить
- `POST /chat/api/channels/<slug>/mute/` - заглушить
- `POST /chat/api/channels/<slug>/unmute/` - разглушить
- `POST /chat/api/channels/<slug>/promote/` - назначить модератором

## WebSocket Protocol

### Подключение
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/chat/general/');
```

### Сообщения клиента
```javascript
// Отправка сообщения
ws.send(JSON.stringify({
    type: 'message',
    content: 'Привет!'
}));

// Лайк
ws.send(JSON.stringify({
    type: 'like',
    message_id: 123
}));

// Удаление
ws.send(JSON.stringify({
    type: 'delete',
    message_id: 123
}));
```

### Сообщения сервера
```javascript
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    switch(data.type) {
        case 'connected':
            // Успешное подключение
            break;
        case 'message':
            // Новое сообщение
            console.log(data.message);
            break;
        case 'like_update':
            // Обновление лайка
            console.log(`Message ${data.message_id}: ${data.count} likes`);
            break;
        case 'message_deleted':
            // Сообщение удалено
            break;
        case 'error':
            // Ошибка
            console.error(data.message);
            break;
    }
};
```

## Админ-панель

### Доступ
- URL: `/chat/<slug>/admin/`
- Только для модераторов канала и администраторов

### Функции
- Статистика канала (сообщения, участники, забаненные)
- Последние сообщения с кнопкой удаления
- Участники с действиями (promote, mute, ban)
- Забаненные пользователи с кнопкой unban

### Кнопка в чате
В шапке чата отображается кнопка "⚙️ Админка" для модераторов.

## Отладка

### Логирование
WebSocket consumer выводит логи в консоль:
```
[WebSocket] Connect attempt - User: admin, Authenticated: True
[WebSocket] Connected - User: admin
[WebSocket] Disconnected
```

### Проверка авторизации
```python
# В Django shell
from django.contrib.sessions.models import Session
from django.utils import timezone

# Проверка сессии
session = Session.objects.get(session_key='...')
print(session.get_decoded())
print(session.expire_date > timezone.now())
```

### Очистка истории
```javascript
// В браузере
localStorage.removeItem('chat_state_general');
location.reload();
```

## Production развёртывание

### Требования
- Redis для channel layer (вместо InMemory)
- Daphne или Uvicorn для ASGI
- Nginx для reverse proxy

### Настройки CHANNEL_LAYERS
```python
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [('127.0.0.1', 6379)],
        },
    },
}
```

### Безопасность
```python
# settings.py
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SAMESITE = 'Lax'
```
