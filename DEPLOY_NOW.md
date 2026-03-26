# 🚀 ДЕПЛОЙ STL PLATFORM - БЫСТРЫЙ СТАРТ

## ✅ Всё готово к деплою!

Файлы закоммичены и отправлены в GitHub.

---

## 📋 Шаг 1: Откройте Render

1. Перейдите на https://render.com
2. Войдите через GitHub
3. Нажмите **"New +"** → **"Blueprint"**

---

## 📋 Шаг 2: Подключите репозиторий

1. Найдите ваш репозиторий: **`clonscorpiona-creator/stl`**
2. Нажмите **"Connect"**
3. Render автоматически найдет файл `render-django.yaml`

---

## 📋 Шаг 3: Запустите деплой

1. Нажмите **"Apply"** в окне Blueprint
2. Render создаст:
   - 🗄️ PostgreSQL базу данных (`stl-django-db`)
   - 🌐 Django веб-сервис (`stl-django`)

**Время деплоя:** ~3-5 минут

---

## 📋 Шаг 4: Настройте домены

После создания сервиса откройте **Environment** и добавьте:

| Ключ | Значение |
|------|----------|
| `ALLOWED_HOSTS` | `stl-django.onrender.com,*.onrender.com` |
| `CSRF_TRUSTED_ORIGINS` | `https://stl-django.onrender.com` |

Нажмите **"Save Changes"**

---

## 📋 Шаг 5: Создайте суперпользователя

1. В Render Dashboard откройте **stl-django** → **Shell**
2. Выполните:
```bash
python manage.py createsuperuser
```
3. Введите username, email, password

---

## 📋 Шаг 6: Проверьте работу

Откройте в браузере:
```
https://stl-django.onrender.com
```

Проверьте:
- ✅ Вход/регистрация работают
- ✅ Чат открывается
- ✅ Загрузка файлов работает
- ✅ WebSocket подключается

---

## 🔧 Если что-то пошло не так

### Смотрим логи
В Render Dashboard → **stl-django** → **Logs**

### Перезапускаем сервис
В Render Dashboard → **stl-django** → **Manual Deploy** → **Deploy**

### Ошибка базы данных
Убедитесь, что `DATABASE_URL` автоматически подключен к `stl-django-db`

---

## 📊 Ссылки

- **Render Dashboard:** https://dashboard.render.com
- **Ваши сервисы:** https://dashboard.render.com/services
- **Документация Render:** https://render.com/docs

---

## 💡 Важно!

На бесплатном тарифе Render:
- Сервис "засыпает" через 15 минут бездействия
- Первый запрос после "сна" может занимать до 30 секунд
- База данных работает 24/7

Для production рекомендуется перейти на платный тариф ($7/мес).

---

**Готово! 🎉**
