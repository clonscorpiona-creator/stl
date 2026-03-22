# 🚀 Cloudflare Pages - Деплой БЕЗ Environment Variables

## Если возникают проблемы с env vars

Можно задеплоить frontend БЕЗ переменных окружения, а потом добавить их.

---

## Шаг 1: Создайте проект без env vars

1. Откройте: https://dash.cloudflare.com
2. **Workers & Pages** → **Create application** → **Pages**
3. **Connect to Git** → Выберите `clonscorpiona-creator/stl`
4. Настройки:
   ```
   Project name: stl-platform
   Production branch: master
   Build command: npm run build
   Build output directory: out
   ```
5. **НЕ добавляйте Environment Variables**
6. Нажмите **Save and Deploy**

---

## Шаг 2: Дождитесь первого деплоя

Сборка займёт 3-5 минут. Frontend соберётся с дефолтными значениями.

---

## Шаг 3: Добавьте переменные после деплоя

1. **Workers & Pages** → **stl-platform** → **Settings** → **Environment Variables**
2. Добавьте по одной:

   **Production:**
   ```
   NEXT_PUBLIC_API_URL = https://stl-api.onrender.com
   ```
   Сохраните.

   ```
   NEXT_PUBLIC_APP_URL = https://stl-platform.pages.dev
   ```
   Сохраните.

   ```
   NODE_ENV = production
   ```
   Сохраните.

---

## Шаг 4: Retry deployment

1. **Deployments** → Найдите последний deployment
2. **Retry deployment**

Теперь frontend пересоберётся с правильными переменными.

---

## Проверка

После успешного деплоя:

```bash
curl https://stl-platform.pages.dev
```

Или откройте в браузере: https://stl-platform.pages.dev

---

## Почему это работает?

Frontend может работать без env vars, используя дефолтные значения из `next.config.js`:

```javascript
env: {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
}
```

После добавления переменных и retry, они перезапишут дефолты.

---

## Следующий шаг

После успешного деплоя frontend, деплойте backend на Render.

См. `RENDER_DEPLOY_STEPS.md`
