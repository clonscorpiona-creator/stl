# 🚀 Следующие шаги для деплоя

## Текущий статус

✅ **Готово:**
- Код загружен на GitHub
- Миграции PostgreSQL созданы
- Конфигурация Render (render-backend.yaml)
- Конфигурация Cloudflare (wrangler.toml)
- Все переменные окружения подготовлены

❌ **Нужно сделать:**
- Создать сервис на Render
- Создать проект на Cloudflare Pages

---

## Шаг 1: Деплой Backend на Render (5-10 минут)

### 1.1 Откройте Render Dashboard
Перейдите на: https://dashboard.render.com

### 1.2 Создайте Blueprint
1. Нажмите **"New +"** (правый верхний угол)
2. Выберите **"Blueprint"**
3. Подключите ваш GitHub репозиторий: `clonscorpiona-creator/stl`
4. Render автоматически найдёт файл `render-backend.yaml`
5. Нажмите **"Apply"**

### 1.3 Настройте переменные окружения
После создания сервиса, перейдите в **stl-api → Environment** и добавьте:

```
RESEND_API_KEY=re_ваш_ключ_resend
NEXT_PUBLIC_API_URL=https://stl-api.onrender.com
NEXT_PUBLIC_APP_URL=https://stl-platform.pages.dev
ALLOWED_ORIGINS=https://stl-platform.pages.dev,https://*.stl-platform.pages.dev
```

### 1.4 Дождитесь деплоя
- Render автоматически установит зависимости
- Применит миграции базы данных
- Соберёт приложение
- Запустит сервер

**Проверка:** Откройте https://stl-api.onrender.com/api/health
Должен вернуть: `{"status":"ok"}`

---

## Шаг 2: Деплой Frontend на Cloudflare Pages (5-10 минут)

### 2.1 Откройте Cloudflare Dashboard
Перейдите на: https://dash.cloudflare.com

### 2.2 Найдите Workers & Pages
1. В левом меню найдите **"Workers & Pages"**
2. Нажмите на него

### 2.3 Создайте проект
1. Нажмите **"Create application"** (синяя кнопка справа)
2. Выберите вкладку **"Pages"**
3. Нажмите **"Connect to Git"**

### 2.4 Подключите GitHub
1. Выберите **"GitHub"**
2. Авторизуйте Cloudflare (если ещё не сделали)
3. Выберите репозиторий: `clonscorpiona-creator/stl`
4. Нажмите **"Begin setup"**

### 2.5 Настройте сборку
```
Project name: stl-platform
Production branch: master
Framework preset: Next.js
Build command: npm run build
Build output directory: out
Root directory: /
```

### 2.6 Добавьте переменные окружения
Нажмите **"Add environment variable"** и добавьте:

```
NEXT_PUBLIC_API_URL=https://stl-api.onrender.com
NEXT_PUBLIC_APP_URL=https://stl-platform.pages.dev
NODE_ENV=production
```

### 2.7 Деплой
1. Нажмите **"Save and Deploy"**
2. Дождитесь окончания сборки (3-5 минут)

**Проверка:** Откройте https://stl-platform.pages.dev

---

## Шаг 3: Проверка работоспособности

### 3.1 Проверьте Backend
```bash
curl https://stl-api.onrender.com/api/health
```
Ожидается: `{"status":"ok","timestamp":"...","database":"connected"}`

### 3.2 Проверьте Frontend
Откройте: https://stl-platform.pages.dev

Проверьте в DevTools → Network:
- Запросы к API должны работать
- Не должно быть CORS ошибок

### 3.3 Проверьте базу данных
```bash
curl https://stl-api.onrender.com/api/stats
```
Должен вернуть статистику платформы.

---

## Если что-то не работает

### Backend возвращает 404
- Проверьте, что сервис `stl-api` запущен в Render Dashboard
- Проверьте логи: Dashboard → stl-api → Logs
- Убедитесь, что миграции применились успешно

### Frontend не загружается
- Проверьте статус сборки: Cloudflare Pages → stl-platform → Deployments
- Проверьте логи сборки
- Убедитесь, что переменные окружения установлены

### CORS ошибки
- Проверьте `ALLOWED_ORIGINS` в Render
- Убедитесь, что URL Cloudflare Pages правильный
- Проверьте `NEXT_PUBLIC_API_URL` в Cloudflare

---

## Полезные ссылки

- **Render Dashboard:** https://dashboard.render.com
- **Cloudflare Dashboard:** https://dash.cloudflare.com
- **GitHub Repo:** https://github.com/clonscorpiona-creator/stl
- **Подробная инструкция Cloudflare:** См. `CLOUDFLARE_PAGES_GUIDE.md`
- **Подробная инструкция Render:** См. `RENDER_DEPLOY_STEPS.md`
- **Troubleshooting:** См. `RENDER_TROUBLESHOOTING.md`

---

## Время выполнения

- **Render:** 5-10 минут (первый деплой может занять до 15 минут)
- **Cloudflare:** 5-10 минут
- **Всего:** 15-20 минут

После завершения оба сервиса будут автоматически деплоиться при каждом push в `master`.
