# Инструкция по деплою на Render

## Быстрый старт (2 способа)

### Способ 1: Через веб-интерфейс Render (рекомендуется)

1. **Зайдите на https://render.com** и войдите в аккаунт

2. **Создайте новый Web Service:**
   - Нажмите **"New +"** → **"Web Service"**
   - Выберите **"Connect a repository"**
   - Подключите ваш GitHub репозиторий с проектом `stl`

3. **Настройте сервис:**
   - **Name:** `stl-django` (или любое другое имя)
   - **Region:** Frankfurt (Германия)
   - **Branch:** `master`
   - **Root Directory:** оставьте пустым
   - **Runtime:** `Python 3`
   - **Build Command:**
     ```
     pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
     ```
   - **Start Command:**
     ```
     daphne -b 0.0.0.0 -p $PORT config.asgi:application
     ```

4. **Добавьте переменные окружения:**
   - `SECRET_KEY` — сгенерируйте случайную строку (например, через https://randomkeygen.com/)
   - `DEBUG` — `false`
   - `ALLOWED_HOSTS` — `*` (или ваш домен)
   - `CSRF_TRUSTED_ORIGINS` — `https://your-app.onrender.com`

5. **Создайте базу данных:**
   - В Render нажмите **"New +"** → **"PostgreSQL"**
   - Name: `stl-django-db`
   - Region: Frankfurt
   - Plan: Free
   - После создания скопируйте **Internal Database URL**
   - Добавьте в переменные окружения веб-сервиса:
     - `DATABASE_URL` — значение Internal Database URL

6. **Нажмите "Create Web Service"**

---

### Способ 2: Через render.yaml (автоматически)

1. **Переименуйте файл:**
   ```
   render-deploy.yaml → render.yaml
   ```

2. **Войдите на https://render.com**

3. **Создайте Blueprint:**
   - Нажмите **"New +"** → **"Blueprint"**
   - Подключите репозиторий
   - Render автоматически применит `render.yaml`

---

## Переменные окружения (обязательно!)

После создания сервиса добавьте в настройках:

| Ключ | Значение |
|------|----------|
| `SECRET_KEY` | (сгенерируйте случайную строку) |
| `DEBUG` | `false` |
| `ALLOWED_HOSTS` | `*` |
| `CSRF_TRUSTED_ORIGINS` | `https://your-app.onrender.com` |
| `DATABASE_URL` | (из PostgreSQL сервиса) |

---

## После деплоя

1. **Проверьте логи** — в панели Render вкладка "Logs"
2. **Откройте сайт** — ссылка вида `https://stl-django.onrender.com`
3. **Создайте суперпользователя:**
   ```bash
   # В Render Shell или локально с подключением к БД
   python manage.py createsuperuser
   ```

---

## Важно!

- **Бесплатный тариф** — сервис "засыпает" через 15 минут бездействия
- **Первый запуск** — может занять 2-3 минуты
- **Миграции** — применяются автоматически при билде
- **Статика** — собирается через `collectstatic`

---

## Если что-то не работает

1. Проверьте логи в панели Render
2. Убедитесь, что `DATABASE_URL` настроен правильно
3. Проверьте `SECRET_KEY` — должен быть уникальным
4. Для WebSocket (чат) убедитесь, что используется Daphne
