# 🔧 Troubleshooting: Render Deployment

## Проблема
Сервер на Render запущен, но API endpoints возвращают 404.

```bash
curl https://stl-api.onrender.com/
# {"error":false,"message":"Server is running"}

curl https://stl-api.onrender.com/api/health
# 404 Not Found
```

## Диагностика

### 1. Проверьте логи в Render Dashboard

1. Зайдите на https://dashboard.render.com
2. Откройте сервис **stl-api**
3. Перейдите в **Logs**
4. Найдите ошибки в логах сборки или запуска

Ищите:
- ❌ Build errors
- ❌ Migration errors
- ❌ Port binding errors
- ❌ Module not found errors

### 2. Проверьте Environment Variables

В Render Dashboard → stl-api → Environment:

**Обязательные:**
- `DATABASE_URL` - должен быть подключен автоматически
- `NODE_ENV=production`
- `RESEND_API_KEY` - ваш ключ от Resend

**Для split deployment:**
- `NEXT_PUBLIC_API_URL=https://stl-api.onrender.com`
- `NEXT_PUBLIC_APP_URL=https://stl-platform.pages.dev`
- `ALLOWED_ORIGINS=https://stl-platform.pages.dev`

### 3. Проверьте Build Command

В render-backend.yaml должно быть:
```yaml
buildCommand: npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

В логах должно быть:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
```

### 4. Проверьте Start Command

Должно быть:
```yaml
startCommand: npm start
```

В логах должно быть:
```
> next start
ready - started server on 0.0.0.0:10000
```

### 5. Возможные причины 404

#### A. Next.js не запустился
**Симптомы:** Сервер отвечает, но не Next.js
**Решение:** Проверьте логи запуска, возможно ошибка при старте Next.js

#### B. Неправильный output mode
**Проверьте next.config.js:**
```javascript
output: process.env.NEXT_OUTPUT_MODE || 'standalone',
```

**Для Render должно быть:** `standalone`

#### C. Миграции не применились
**Проверьте логи:**
```
Running prisma migrate deploy...
✓ Applied 1 migration
```

Если ошибка - база данных не инициализирована

#### D. PORT не настроен
Render использует переменную `PORT` (обычно 10000)
Next.js должен слушать на `0.0.0.0:$PORT`

### 6. Быстрые проверки

```bash
# Проверьте, что сервер отвечает
curl https://stl-api.onrender.com/

# Проверьте health endpoint
curl https://stl-api.onrender.com/api/health

# Проверьте другие endpoints
curl https://stl-api.onrender.com/api/stats
```

### 7. Решение: Пересоздать деплой

Если ничего не помогает:

1. В Render Dashboard → stl-api
2. **Manual Deploy** → **Clear build cache & deploy**
3. Дождитесь завершения (5-10 минут)
4. Проверьте логи

### 8. Альтернатива: Проверьте конфигурацию

Возможно, нужно добавить в render-backend.yaml:

```yaml
services:
  - type: web
    name: stl-api
    env: node
    buildCommand: npm install && npx prisma generate && npx prisma migrate deploy && npm run build
    startCommand: npm start
    envVars:
      - key: PORT
        value: 10000
```

## Что проверить в логах

### Build logs (должно быть):
```
✓ npm install completed
✓ prisma generate completed
✓ prisma migrate deploy completed
✓ next build completed
```

### Start logs (должно быть):
```
> next start
ready - started server on 0.0.0.0:10000
```

### Runtime logs (НЕ должно быть):
```
❌ Error: Cannot find module
❌ Error: ECONNREFUSED (database)
❌ Error: Port already in use
```

## Следующие шаги

1. Откройте Render Dashboard
2. Проверьте логи сервиса stl-api
3. Найдите ошибки
4. Исправьте конфигурацию
5. Пересоздайте деплой

Если нужна помощь - скопируйте ошибки из логов.
