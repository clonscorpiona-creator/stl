# 🚀 Альтернатива: Полный деплой на Render (Frontend + Backend)

## Почему это проще?

- ✅ Один сервис вместо двух
- ✅ Нет проблем с Vercel adapter
- ✅ Нет проблем с CORS
- ✅ Нет необходимости в environment variables для API URL
- ✅ Всё работает из коробки

---

## Шаг 1: Подготовка кода

Код уже готов! Используем standalone mode для Render.

---

## Шаг 2: Создание сервиса на Render

### Вариант A: Через Blueprint (Рекомендуется)

1. **Откройте:** https://dashboard.render.com

2. **New +** → **Blueprint**

3. **Выберите репозиторий:** clonscorpiona-creator/stl

4. **Branch:** master

5. **Blueprint file:** render-backend.yaml будет найден автоматически

6. **Добавьте environment variables:**
   ```
   RESEND_API_KEY=ваш_ключ_resend
   NEXT_PUBLIC_APP_URL=https://stl-api.onrender.com
   NEXT_PUBLIC_API_URL=https://stl-api.onrender.com
   NEXT_PUBLIC_BASE_URL=https://stl-api.onrender.com
   ALLOWED_ORIGINS=https://stl-api.onrender.com
   NEXT_OUTPUT_MODE=standalone
   ```

7. **Apply**

### Вариант B: Вручную

1. **New +** → **Web Service**

2. **Connect repository:** clonscorpiona-creator/stl

3. **Настройки:**
   - Name: `stl-platform`
   - Region: `Frankfurt`
   - Branch: `master`
   - Runtime: `Node`
   - Build Command: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build:backend`
   - Start Command: `npm start`

4. **Plan:** Free

5. **Environment Variables:**
   ```
   NODE_ENV=production
   DATABASE_URL=(будет добавлен автоматически после создания БД)
   SESSION_SECRET=(сгенерируется автоматически)
   RESEND_API_KEY=ваш_ключ
   NEXT_PUBLIC_APP_URL=https://stl-platform.onrender.com
   NEXT_PUBLIC_API_URL=https://stl-platform.onrender.com
   NEXT_PUBLIC_BASE_URL=https://stl-platform.onrender.com
   ALLOWED_ORIGINS=https://stl-platform.onrender.com
   NEXT_OUTPUT_MODE=standalone
   ```

6. **Create Web Service**

---

## Шаг 3: Добавление PostgreSQL

1. **В том же проекте:** New + → PostgreSQL

2. **Настройки:**
   - Name: `stl-db`
   - Region: `Frankfurt`
   - Plan: `Free`

3. **Create Database**

4. **Подключение к Web Service:**
   - Откройте Web Service (stl-platform)
   - Environment → Add Environment Variable
   - Key: `DATABASE_URL`
   - Value: Internal Database URL из PostgreSQL сервиса

---

## Шаг 4: Мониторинг деплоя

### Build займёт 10-15 минут:

1. **Installing dependencies** (~3 мин)
2. **Generating Prisma Client** (~1 мин)
3. **Running migrations** (~1 мин)
4. **Building Next.js** (~5-8 мин)
5. **Starting server** (~1 мин)

### Проверка логов:

- Dashboard → stl-platform → Logs
- Следите за процессом сборки
- Ищите ошибки (красным цветом)

---

## Шаг 5: Проверка работы

### Health Check:

```bash
curl https://stl-platform.onrender.com/api/health
```

Ожидаемый ответ:
```json
{
  "status": "ok",
  "database": "connected",
  "initialized": true,
  "userCount": 0
}
```

### Открытие сайта:

https://stl-platform.onrender.com

---

## Преимущества этого подхода

1. **Проще настроить:**
   - Один сервис вместо двух
   - Меньше environment variables
   - Нет проблем с CORS

2. **Надёжнее:**
   - Next.js standalone mode стабилен
   - Нет зависимости от Cloudflare adapter
   - Прямое подключение к БД

3. **Дешевле:**
   - Free tier на Render
   - Один сервис = меньше ресурсов

4. **Быстрее:**
   - Нет задержек на proxy
   - API и frontend на одном сервере

---

## Недостатки

1. **Медленнее чем Cloudflare Pages:**
   - Render free tier может "засыпать" после 15 минут неактивности
   - Первый запрос после сна займёт 30-60 секунд

2. **Меньше CDN:**
   - Cloudflare Pages использует глобальный CDN
   - Render использует один регион (Frankfurt)

---

## Troubleshooting

### Build падает с ошибкой памяти:

- Render Free tier: 512MB RAM
- Next.js build может требовать больше
- Решение: Upgrade на Starter plan ($7/месяц)

### Database connection fails:

- Проверьте DATABASE_URL
- Убедитесь что PostgreSQL сервис запущен
- Проверьте что migrations прошли успешно

### Health check timeout:

- Подождите 2-3 минуты после деплоя
- Render free tier медленно стартует
- Проверьте логи на ошибки

---

## Следующие шаги после успешного деплоя

1. ✅ Проверьте health endpoint
2. ✅ Откройте сайт в браузере
3. ✅ Попробуйте зарегистрироваться
4. ✅ Проверьте что API работает
5. ✅ Настройте custom domain (опционально)

---

**Готовы попробовать этот вариант?**
