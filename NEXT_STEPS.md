# 🚀 Следующие шаги для деплоя

Ваш проект готов к деплою! Все изменения закоммичены.

## Шаг 1: Настройте GitHub репозиторий

```bash
# Создайте репозиторий на GitHub, затем:
git remote add origin https://github.com/ваш-username/stl.git
git push -u origin master
```

## Шаг 2: Деплой Backend на Render

1. Зайдите на [render.com](https://render.com) и войдите
2. Нажмите **New +** → **Blueprint**
3. Подключите ваш GitHub репозиторий
4. Render автоматически найдёт `render-backend.yaml`
5. Настройте переменные окружения:
   - `RESEND_API_KEY` - ваш ключ от Resend
   - `NEXT_PUBLIC_API_URL` - будет `https://stl-api.onrender.com`
   - `NEXT_PUBLIC_APP_URL` - будет `https://stl-platform.pages.dev`
   - `ALLOWED_ORIGINS` - `https://stl-platform.pages.dev,https://*.stl-platform.pages.dev`
6. Нажмите **Apply** и дождитесь деплоя

## Шаг 3: Деплой Frontend на Cloudflare Pages

### Вариант A: Через Dashboard (проще)

1. Зайдите на [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Pages** → **Create a project** → **Connect to Git**
3. Выберите ваш репозиторий
4. Настройки сборки:
   - Framework: **Next.js**
   - Build command: `npm run build`
   - Build output: `out`
5. Environment variables:
   - `NEXT_PUBLIC_API_URL` = `https://stl-api.onrender.com`
   - `NEXT_PUBLIC_APP_URL` = `https://stl-platform.pages.dev`
   - `NODE_ENV` = `production`
6. **Save and Deploy**

### Вариант B: Через CLI

```bash
# Установите Wrangler
npm install -g wrangler

# Авторизуйтесь
wrangler login

# Создайте проект
wrangler pages project create stl-platform

# Соберите и задеплойте
npm run build
wrangler pages deploy out
```

## Шаг 4: Проверка

После деплоя проверьте:

```bash
# Backend API
curl https://stl-api.onrender.com/api/health

# Frontend
# Откройте в браузере: https://stl-platform.pages.dev
```

## Важные заметки

✅ **PostgreSQL миграции** - уже созданы и будут применены автоматически при деплое на Render

✅ **CORS настроен** - frontend на Cloudflare сможет обращаться к backend на Render

✅ **Environment variables** - не забудьте настроить их в обеих платформах

⚠️ **Render Free Tier** - засыпает после 15 минут неактивности (первый запрос будет медленным)

⚠️ **Resend API Key** - получите на [resend.com](https://resend.com) для отправки email

## Полная документация

- `SPLIT_DEPLOYMENT.md` - подробная инструкция по split deployment
- `MIGRATION_GUIDE.md` - информация о миграциях PostgreSQL
- `README.md` - общая информация о проекте

## Нужна помощь?

Если возникнут проблемы при деплое, проверьте:
1. Логи в Render Dashboard
2. Логи в Cloudflare Pages
3. Network tab в браузере (для CORS ошибок)
