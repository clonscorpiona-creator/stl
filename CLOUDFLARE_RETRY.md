# 🔄 Как перезапустить деплой на Cloudflare Pages

## Проблема решена ✅

Build error исправлен. Теперь frontend собирается без Prisma.

---

## Вариант 1: Retry последнего деплоя (быстрее)

Если вы уже создали проект на Cloudflare:

1. Откройте: https://dash.cloudflare.com
2. **Workers & Pages** → **stl-platform**
3. Перейдите на вкладку **Deployments**
4. Найдите последний failed deployment
5. Нажмите **"Retry deployment"** или **"View details"** → **"Retry deployment"**

Cloudflare автоматически подтянет новый код из GitHub и пересоберёт.

---

## Вариант 2: Обновить Build Settings

Если Retry не помогает:

1. **Workers & Pages** → **stl-platform** → **Settings** → **Builds & deployments**
2. Проверьте настройки:
   ```
   Build command: npm run build
   Build output directory: out
   Root directory: /
   ```
3. Если что-то не так - исправьте и сохраните
4. Вернитесь в **Deployments** → **Retry deployment**

---

## Вариант 3: Создать новый проект (если нужно)

Если проект ещё не создан или хотите начать заново:

1. **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
2. Выберите: `clonscorpiona-creator/stl`
3. Настройки:
   ```
   Project name: stl-platform
   Production branch: master
   Build command: npm run build
   Build output directory: out
   ```
4. Environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://stl-api.onrender.com
   NEXT_PUBLIC_APP_URL=https://stl-platform.pages.dev
   NODE_ENV=production
   ```
5. **Save and Deploy**

---

## Что изменилось

**Было (ошибка):**
```json
"build": "prisma generate && next build"
```

**Стало (работает):**
```json
"build": "next build"
```

Frontend больше не пытается запустить Prisma, который ему не нужен.

---

## Проверка после деплоя

Когда деплой завершится:

```bash
curl https://stl-platform.pages.dev
```

Или откройте в браузере: https://stl-platform.pages.dev

Должна загрузиться главная страница платформы.

---

## Если всё ещё ошибка

1. Проверьте логи сборки в Cloudflare Dashboard
2. Убедитесь, что переменные окружения установлены
3. Проверьте, что используется ветка `master` (где исправление)

---

## Следующий шаг

После успешного деплоя frontend, деплойте backend на Render.

См. `RENDER_DEPLOY_STEPS.md`
