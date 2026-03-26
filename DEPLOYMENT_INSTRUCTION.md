# Инструкция по деплою STL Platform на Render

## Подготовленные файлы

- `render-django.yaml` - конфигурация для Render
- `requirements.txt` - зависимости Python
- `config/settings.py` - обновлен для поддержки production

## Шаг 1: Push в GitHub

```bash
git add .
git commit -m "Prepare for deployment to Render"
git push origin main
```

## Шаг 2: Создание Blueprint на Render

1. Зайдите на https://render.com
2. Нажмите **"New +"** → **"Blueprint"**
3. Подключите ваш GitHub репозиторий
4. Выберите файл `render-django.yaml`

## Шаг 3: Настройка переменных окружения

В Render Dashboard для сервиса `stl-django` установите:

| Ключ | Значение |
|------|----------|
| `ALLOWED_HOSTS` | `stl-django.onrender.com,*.onrender.com` |
| `CSRF_TRUSTED_ORIGINS` | `https://stl-django.onrender.com` |
| `DEBUG` | `False` |

## Шаг 4: Деплой

1. Нажмите **"Apply"** в Blueprint
2. Дождитесь создания базы данных и веб-сервиса
3. Проверьте логи на наличие ошибок

## Структура deploy

```
render-django.yaml
├── stl-django-db (PostgreSQL)
│   ├── Free план
│   └── 1GB диск
│
└── stl-django (Web Service)
    ├── Python 3.14.3
    ├── Build: pip install && migrate && collectstatic
    └── Start: daphne (ASGI server)
```

## Проверка после деплоя

1. Откройте `https://stl-django.onrender.com`
2. Проверьте вход/регистрацию
3. Проверьте работу чата
4. Проверьте загрузку файлов

## База данных

После первого деплоя создайте суперпользователя:

```bash
# В Render Dashboard → Shell
python manage.py createsuperuser
```

## Медиа файлы

Для хранения медиа файлов в production рекомендуется подключить S3:

1. Создайте bucket на AWS S3 или Cloudflare R2
2. Добавьте `django-storages` в requirements.txt
3. Настройте `AWS_STORAGE_BUCKET_NAME` и другие переменные

## Troubleshooting

### Ошибка "Database not found"
- Убедитесь, что база данных создалась
- Проверьте DATABASE_URL в переменных

### Ошибка "Static files not found"
- Проверьте, что `collectstatic` прошел успешно
- Проверьте логи сборки

### WebSocket не подключается
- Убедитесь, что daphne запущен
- Проверьте ALLOWED_HOSTS
