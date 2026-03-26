# Архитектура хранения данных чата

## Обзор

Система чата использует гибридный подход к хранению данных:
1. **База данных (SQLite)** - основное хранилище сообщений
2. **JSON файлы** - резервное хранение и история для быстрого доступа

## Структура данных

### База данных (db.sqlite3)

#### Таблица `chat_message`

| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER | Уникальный идентификатор |
| channel_id | INTEGER | Ссылка на канал |
| user_id | INTEGER | Автор сообщения |
| content | TEXT | Текст сообщения |
| reply_to_id | INTEGER | Ссылка на родительское сообщение (ответ) |
| is_deleted | BOOLEAN | Флаг удаления |
| is_edited | BOOLEAN | Флаг редактирования |
| likes_count | INTEGER | Счётчик лайков |
| created_at | DATETIME | Время создания |
| edited_at | DATETIME | Время редактирования |

#### Таблица `chat_messagelike`

| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER | Уникальный идентификатор |
| message_id | INTEGER | Ссылка на сообщение |
| user_id | INTEGER | Пользователь, поставивший лайк |
| created_at | DATETIME | Время лайка |

#### Таблица `chat_channel`

| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER | Уникальный идентификатор |
| name | VARCHAR | Название канала |
| slug | VARCHAR | URL-идентификатор |
| description | TEXT | Описание |
| is_public | BOOLEAN | Публичный доступ |
| messages_count | INTEGER | Счётчик сообщений |

### JSON файлы истории (chat_history/)

Каждый канал имеет свой файл: `chat_history/<channel_slug>.json`

#### Структура файла

```json
{
  "channel_slug": "general",
  "channel_name": "General",
  "messages": [
    {
      "id": 1,
      "content": "Текст сообщения",
      "is_deleted": false,
      "is_edited": false,
      "likes_count": 5,
      "liked": false,
      "likes": [
        {"user_id": 1, "username": "admin"},
        {"user_id": 2, "username": "user"}
      ],
      "reply_to": {
        "id": 0,
        "username": "user",
        "content": "Цитата ответа"
      },
      "user": {
        "id": 1,
        "username": "admin",
        "avatar": "/media/avatars/...",
        "is_moderator": false,
        "is_staff": true
      },
      "created_at": "2026-03-26T12:00:00Z",
      "edited_at": null
    }
  ],
  "reactions": [],
  "last_updated": "2026-03-26T12:00:00Z"
}
```

## Поток данных

### 1. Инициализация чата (клиент)

```
1. Загрузка страницы → templates/chat/room.html
2. Загрузка сохранённого состояния из localStorage
3. WebSocket подключение → connectWebSocket()
4. HTTP запрос к API → loadMessages()
   GET /chat/api/channels/{slug}/
5. merge с localStorage (защита от дублей по ID)
6. Отрисовка сообщений → renderMessages()
```

### 2. Отправка сообщения

```
Клиент → WebSocket → consumers.py
                  ↓
        create_message(content, reply_to_id)
                  ↓
        Message.objects.create(...)
                  ↓
        save_message_to_history(message_data, slug)
                  ↓
        chat_history/{slug}.json
                  ↓
        group_send → все клиенты в канале
```

### 3. Лайк сообщения

```
Клиент → WebSocket/API → toggle_like()
                     ↓
        MessageLike.objects.get_or_create()
                     ↓
        message.likes_count = count()
                     ↓
        add_reaction_to_history(message_id, user_id, slug, liked)
                     ↓
        chat_history/{slug}.json (обновление likes)
```

### 4. Ответ на сообщение

```
Клиент → replyToMessage(id, username)
       ↓
       Цитата над полем ввода
       ↓
       sendMessage() с reply_to
       ↓
       WebSocket: {type: 'message', content: '...', reply_to: ID}
       ↓
       create_message(content, reply_to_id)
       ↓
       Message.objects.create(..., reply_to=parent_message)
```

## API Endpoints

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/chat/api/channels/` | GET | Список каналов |
| `/chat/api/channels/<slug>/` | GET | Канал + сообщения (пагинация) |
| `/chat/api/channels/<slug>/messages/` | POST | Отправка сообщения |
| `/chat/api/messages/<id>/like/` | POST | Лайк/анлайк |
| `/chat/api/messages/<id>/delete/` | POST | Удаление сообщения |
| `/chat/api/messages/<id>/edit/` | POST | Редактирование сообщения |
| `/chat/api/channels/<slug>/members/` | GET | Участники канала |
| `/chat/api/session-status/` | GET | Проверка сессии |

## Управление историей

### Экспорт из БД в JSON

```bash
python manage.py export_chat_history
python manage.py export_chat_history --channel general
python manage.py export_chat_history --channel general --limit 500
```

### Импорт из JSON в БД

```bash
python manage.py import_chat_history --dry-run
python manage.py import_chat_history
```

### Очистка истории

```bash
python manage.py shell -c "
from chat.history import clear_channel_history
clear_channel_history('general')
"
```

## Резервное копирование

### Сохранение базы данных

```bash
# Копирование SQLite
cp db.sqlite3 db.backup.sqlite3

# Экспорт в JSON
python manage.py dumpdata chat.Channel chat.Message chat.MessageLike > chat_backup.json
```

### Восстановление

```bash
# Из SQLite backup
cp db.backup.sqlite3 db.sqlite3

# Из JSON
python manage.py loaddata chat_backup.json
```

## Оптимизация

### Индексы в БД

```python
# chat/models.py
class Meta:
    indexes = [
        models.Index(fields=['channel', '-created_at']),  # Для загрузки сообщений
        models.Index(fields=['user', '-created_at']),     # Для профиля пользователя
        models.Index(fields=['is_deleted']),              # Для фильтрации удалённых
    ]
```

### select_related / prefetch_related

```python
# Загрузка сообщений с данными
Message.objects.filter(
    channel=channel
).select_related(
    'user', 'reply_to', 'reply_to__user'
).prefetch_related(
    'likes', 'likes__user'
).order_by('-created_at')
```

### Кэширование

```python
from django.core.cache import cache

# Кэширование списка каналов
channels = cache.get('channels_list')
if not channels:
    channels = Channel.objects.filter(is_public=True)
    cache.set('channels_list', channels, 300)  # 5 минут
```

## Безопасность

### Проверка прав доступа

1. **Авторизация**: `@login_required` декораторы
2. **Бан**: `ChannelBan.objects.filter(channel=channel, user=user)`
3. **Mute**: `ChannelMember.objects.filter(channel=channel, user=user, is_muted=True)`
4. **Модерация**: `channel.moderators.filter(id=user.id)`

### Валидация данных

```python
# Длина сообщения
if not content or len(content) > 5000:
    return JsonResponse({'error': 'Invalid content'}, status=400)

# Проверка CSRF
headers = {
    'X-CSRFToken': window.CHAT.csrf,
    'Content-Type': 'application/json',
}
```

## Мониторинг

### Логирование

```python
# consumers.py
print(f'[WebSocket] Connect attempt - User: {user}, Authenticated: {user.is_authenticated}')
print(f'[WebSocket] Connected - User: {self.user.username}')
```

### Статистика

```bash
python manage.py shell -c "
from chat.models import Message, Channel
print('Каналов:', Channel.objects.count())
print('Сообщений:', Message.objects.count())
"
```
