# 🚀 Деплой на Render - Пошаговая инструкция

## Вариант 1: Простой деплой (рекомендуется)

Используем SQLite + один веб-сервис (быстрее и проще)

### Шаг 1: Создайте новый Web Service

1. Откройте https://dashboard.render.com
2. Нажмите **"New +"** → **"Web Service"**
3. Нажмите **"Connect a repository"**
4. Выберите репозиторий: **`clonscorpiona-creator/stl`**

### Шаг 2: Настройте сервис

Заполните поля:

| Поле | Значение |
|------|----------|
| **Name** | `stl-platform` |
| **Region** | Frankfurt (Germany) |
| **Root Directory** | (оставьте пустым) |
| **Environment** | `Python` |
| **Build Command** | `pip install -r requirements.txt && python manage.py collectstatic --noinput --clear` |
| **Start Command** | `python manage.py runserver 0.0.0.0:$PORT` |

### Шаг 3: Добавьте переменные окружения

Нажмите **"Advanced"** → **"Add Environment Variable"**:

```
DEBUG = false
ALLOWED_HOSTS = *
CSRF_TRUSTED_ORIGINS = https://*.onrender.com
SECRET_KEY = stl-secret-key-change-this-12345
```

### Шаг 4: Выберите тариф

- **Plan**: Free
- **Instance Type**: Static

### Шаг 5: Запустите деплой

Нажмите **"Create Web Service"**

**Время деплоя:** 3-5 минут

---

## Вариант 2: Полный деплой с PostgreSQL

Используем `render-django.yaml` с отдельной базой данных

### Шаг 1: Откройте Blueprint

1. https://dashboard.render.com/blueprints
2. **"New +"** → **"Blueprint"**
3. Подключите репозиторий `clonscorpiona-creator/stl`

### Шаг 2: Примените конфигурацию

1. Render найдет файл `render-django.yaml`
2. Нажмите **"Apply"**
3. Дождитесь создания БД и сервиса

### Шаг 3: Настройте переменные

Добавьте в Environment сервиса `stl-django`:

```
ALLOWED_HOSTS = stl-django.onrender.com,*.onrender.com
CSRF_TRUSTED_ORIGINS = https://stl-django.onrender.com
```

---

## ✅ Проверка после деплоя

1. Откройте `https://stl-platform.onrender.com` (или ваш URL)
2. Проверьте:
   - ✅ Главная страница загружается
   - ✅ Вход/регистрация работают
   - ✅ Чат открывается

---

## 🔧 Создание суперпользователя

После деплоя откройте **Shell** в Dashboard сервиса:

```bash
python manage.py createsuperuser
```

Введите:
- Username: `admin`
- Email: `your@email.com`
- Password: (введите дважды)

---

## ⚠️ Важно!

### Бесплатный тариф Render:
- Сервис "засыпает" через 15 мин бездействия
- Первый запрос после "сна" занимает ~30 секунд
- База данных SQLite сохраняется между перезапусками

### Для production:
- Рекомендуется тариф **Standard ($7/мес)**
- Подключите постоянный домен
- Настройте HTTPS

---

## 📊 Ссылки

- **Ваши сервисы:** https://dashboard.render.com/services
- **Логи сервиса:** Dashboard → Service → Logs
- **Консоль (Shell):** Dashboard → Service → Shell
