# 🚀 Деплой на Render - Пошаговая инструкция

## Текущий статус
✅ Код на GitHub: https://github.com/clonscorpiona-creator/stl
❌ Backend на Render: Не задеплоен (404 ошибка)

## Шаги для деплоя

### 1. Зайдите на Render

Откройте: https://dashboard.render.com

Если нет аккаунта:
- Sign Up (можно через GitHub)
- Подтвердите email

### 2. Создайте Blueprint

1. Нажмите **New +** (синяя кнопка справа вверху)
2. Выберите **Blueprint**
3. Подключите GitHub:
   - Если первый раз: нажмите "Connect GitHub"
   - Авторизуйте Render в GitHub
   - Выберите репозиторий: **clonscorpiona-creator/stl**

### 3. Render найдёт конфигурацию

Render автоматически обнаружит файл `render-backend.yaml` и покажет:
- ✅ Web Service: **stl-api**
- ✅ PostgreSQL: **stl-db**

### 4. Настройте Environment Variables

Перед деплоем нажмите на **stl-api** и добавьте переменные:

**Обязательные:**
```
RESEND_API_KEY=re_xxxxxxxxxx
```
Получите на https://resend.com (бесплатно, нужна регистрация)

**Автоматические (уже настроены в yaml):**
- DATABASE_URL - подключится автоматически из stl-db
- SESSION_SECRET - сгенерируется автоматически
- NODE_ENV=production

**Для split deployment:**
```
NEXT_PUBLIC_API_URL=https://stl-api.onrender.com
NEXT_PUBLIC_APP_URL=https://stl-platform.pages.dev
ALLOWED_ORIGINS=https://stl-platform.pages.dev,https://*.stl-platform.pages.dev
```

### 5. Нажмите Apply

Render начнёт деплой:
1. Создаст PostgreSQL базу данных (1-2 минуты)
2. Установит зависимости (2-3 минуты)
3. Применит миграции Prisma (1 минута)
4. Соберёт приложение (2-3 минуты)
5. Запустит сервер

**Общее время: 5-10 минут**

### 6. Дождитесь завершения

В логах вы увидите:
```
==> Building...
==> Installing dependencies...
==> Running prisma generate...
==> Running prisma migrate deploy...
==> Building Next.js...
==> Starting server...
==> Your service is live 🎉
```

### 7. Проверьте API

После деплоя выполните:
```bash
curl https://stl-api.onrender.com/api/health
```

Должен вернуть:
```json
{
  "status": "ok",
  "database": "connected",
  "initialized": true,
  "userCount": 0
}
```

## Troubleshooting

### Ошибка: "RESEND_API_KEY not set"
- Добавьте RESEND_API_KEY в Environment Variables
- Получите ключ на https://resend.com

### Ошибка: "Migration failed"
- Проверьте логи миграций
- Убедитесь, что DATABASE_URL подключен
- Миграции находятся в prisma/migrations/

### Ошибка: "Build failed"
- Проверьте логи сборки
- Убедитесь, что package.json корректен
- Проверьте, что все зависимости установлены

### Render засыпает (Free tier)
- Первый запрос после 15 минут будет медленным (cold start)
- Решение: UptimeRobot для пинга каждые 5 минут
- Или платный план ($7/мес) без sleep

## Что дальше?

После успешного деплоя на Render:
1. ✅ Backend работает на https://stl-api.onrender.com
2. ⏭️ Деплой Frontend на Cloudflare Pages
3. ⏭️ Настройка environment variables на Cloudflare
4. ⏭️ Проверка работоспособности

См. DEPLOYMENT_CHECKLIST.md для полного чеклиста.
