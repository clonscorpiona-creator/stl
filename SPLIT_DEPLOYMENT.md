# 🚀 Split Deployment: Backend (Render) + Frontend (Cloudflare Pages)

## Архитектура

```
┌─────────────────────────────────────────┐
│   Cloudflare Pages (Frontend)          │
│   - Next.js Static/SSR                  │
│   - React Components                    │
│   - Client-side routing                 │
│   - Edge caching                        │
└──────────────┬──────────────────────────┘
               │ API Calls
               ▼
┌─────────────────────────────────────────┐
│   Render (Backend API)                  │
│   - Next.js API Routes                  │
│   - PostgreSQL Database                 │
│   - Prisma ORM                          │
│   - Authentication (Iron Session)       │
│   - Email Service (Resend)              │
└─────────────────────────────────────────┘
```

## Преимущества

✅ **Производительность**: Cloudflare Edge Network для быстрой доставки контента
✅ **Масштабируемость**: Разделение нагрузки между frontend и backend
✅ **Надёжность**: Независимое масштабирование компонентов
✅ **Стоимость**: Cloudflare Pages бесплатен, Render Free tier для API

## Часть 1: Backend на Render

### Шаг 1: Создайте PostgreSQL миграции

```bash
# Локально с PostgreSQL
npx prisma migrate dev --name init

# Или следуйте MIGRATION_GUIDE.md
```

### Шаг 2: Деплой Backend на Render

1. **Создайте Blueprint на Render**
   - Зайдите на [render.com](https://render.com)
   - New + → Blueprint
   - Выберите `render-backend.yaml`
   - Подключите GitHub репозиторий

2. **Настройте переменные окружения**

   В Render Dashboard → stl-api → Environment:

   ```env
   RESEND_API_KEY=your_actual_resend_key
   NEXT_PUBLIC_API_URL=https://stl-api.onrender.com
   NEXT_PUBLIC_APP_URL=https://stl-platform.pages.dev
   NEXT_PUBLIC_BASE_URL=https://stl-api.onrender.com
   ALLOWED_ORIGINS=https://stl-platform.pages.dev,https://*.stl-platform.pages.dev
   ```

3. **Дождитесь деплоя**

   Render автоматически:
   - Установит зависимости
   - Применит миграции
   - Соберёт приложение
   - Запустит API сервер

4. **Проверьте API**

   ```bash
   curl https://stl-api.onrender.com/api/health
   ```

   Должен вернуть: `{"status":"ok",...}`

### Шаг 3: Настройте CORS

Backend автоматически настроен для CORS через `next.config.js`.
Убедитесь, что `ALLOWED_ORIGINS` содержит URL Cloudflare Pages.

## Часть 2: Frontend на Cloudflare Pages

### Шаг 1: Установите Wrangler CLI

```bash
npm install -g wrangler

# Авторизуйтесь
wrangler login
```

### Шаг 2: Создайте проект на Cloudflare Pages

**Вариант A: Через Dashboard (Рекомендуется)**

1. Зайдите на [dash.cloudflare.com](https://dash.cloudflare.com)
2. Pages → Create a project
3. Connect to Git → Выберите ваш репозиторий
4. Build settings:
   ```
   Framework preset: Next.js
   Build command: npm run build
   Build output directory: out
   Root directory: /
   ```

5. Environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://stl-api.onrender.com
   NEXT_PUBLIC_APP_URL=https://stl-platform.pages.dev
   NODE_ENV=production
   ```

6. Deploy

**Вариант B: Через CLI**

```bash
# Из корня проекта
wrangler pages project create stl-platform

# Деплой
npm run build
wrangler pages deploy out
```

### Шаг 3: Настройте переменные окружения

В Cloudflare Pages Dashboard → Settings → Environment Variables:

**Production:**
```env
NEXT_PUBLIC_API_URL=https://stl-api.onrender.com
NEXT_PUBLIC_APP_URL=https://stl-platform.pages.dev
NEXT_PUBLIC_BASE_URL=https://stl-api.onrender.com
NODE_ENV=production
```

**Preview (опционально):**
```env
NEXT_PUBLIC_API_URL=https://stl-api.onrender.com
NEXT_PUBLIC_APP_URL=https://preview.stl-platform.pages.dev
NODE_ENV=production
```

### Шаг 4: Настройте Custom Domain (опционально)

1. Cloudflare Pages → Custom domains
2. Добавьте ваш домен
3. Cloudflare автоматически настроит DNS

## Проверка работоспособности

### 1. Проверьте Backend API

```bash
# Health check
curl https://stl-api.onrender.com/api/health

# Stats API
curl https://stl-api.onrender.com/api/stats
```

### 2. Проверьте Frontend

Откройте: `https://stl-platform.pages.dev`

Проверьте:
- ✅ Страница загружается
- ✅ API запросы работают (откройте DevTools → Network)
- ✅ Авторизация работает
- ✅ Данные загружаются из Render API

### 3. Проверьте CORS

В браузере DevTools → Console не должно быть ошибок CORS.

## Автоматический деплой

### Render (Backend)

Автоматически деплоит при push в `main`:

```bash
git add .
git commit -m "Update backend"
git push origin main
```

### Cloudflare Pages (Frontend)

Автоматически деплоит при push в `main`:

```bash
git add .
git commit -m "Update frontend"
git push origin main
```

## Troubleshooting

### CORS ошибки

**Проблема**: `Access-Control-Allow-Origin` ошибка

**Решение**:
1. Проверьте `ALLOWED_ORIGINS` в Render
2. Убедитесь, что URL Cloudflare Pages добавлен
3. Проверьте `next.config.js` headers

### API запросы не работают

**Проблема**: Frontend не может подключиться к API

**Решение**:
1. Проверьте `NEXT_PUBLIC_API_URL` в Cloudflare Pages
2. Убедитесь, что Render API доступен
3. Проверьте Network tab в DevTools

### Сессии не работают

**Проблема**: Авторизация не сохраняется

**Решение**:
1. Убедитесь, что cookies настроены правильно
2. Проверьте `sameSite` и `secure` настройки в iron-session
3. Возможно нужно использовать JWT вместо сессий для cross-domain

### Render засыпает

**Проблема**: Первый запрос медленный (cold start)

**Решение**:
1. Используйте [UptimeRobot](https://uptimerobot.com) для пинга каждые 5 минут
2. Или перейдите на платный план Render ($7/мес)

## Мониторинг

### Render
- Логи: Dashboard → stl-api → Logs
- Метрики: Dashboard → stl-api → Metrics
- База данных: Dashboard → stl-db → Info

### Cloudflare Pages
- Analytics: Pages → stl-platform → Analytics
- Логи: Pages → stl-platform → Functions → Logs
- Performance: Web Analytics

## Стоимость

### Бесплатный план

**Render:**
- 750 часов/месяц веб-сервиса
- PostgreSQL: 1GB, 97 часов/месяц
- Засыпает после 15 минут неактивности

**Cloudflare Pages:**
- Unlimited requests
- Unlimited bandwidth
- 500 builds/месяц
- Не засыпает

### Платные планы

**Render:**
- Starter: $7/мес (не засыпает)
- Standard: $25/мес (больше ресурсов)

**Cloudflare Pages:**
- Free: достаточно для большинства проектов
- Pro: $20/мес (больше builds, приоритетная поддержка)

## Альтернативная конфигурация

### Вариант: Monolithic на Render + Cloudflare CDN

Если split deployment слишком сложен:

1. Деплойте всё приложение на Render
2. Используйте Cloudflare как CDN перед Render
3. Настройте Cloudflare DNS на Render URL

Это проще, но менее масштабируемо.

## Следующие шаги

1. ✅ Деплойте backend на Render
2. ✅ Получите API URL
3. ✅ Деплойте frontend на Cloudflare Pages
4. ✅ Настройте переменные окружения
5. ✅ Проверьте работоспособность
6. ✅ Настройте custom domain (опционально)

## Полезные ссылки

- [Render Documentation](https://render.com/docs)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
