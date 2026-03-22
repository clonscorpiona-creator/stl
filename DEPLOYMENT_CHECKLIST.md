# ✅ Чеклист деплоя STL Platform

## Подготовка (Завершено ✅)

- [x] Миграция с SQLite на PostgreSQL
- [x] Создание PostgreSQL миграций
- [x] Настройка render-backend.yaml для Render
- [x] Настройка wrangler.toml для Cloudflare Pages
- [x] Настройка CORS в next.config.js
- [x] Создание .env шаблонов
- [x] Применение шрифта Montserrat ко всем макетам
- [x] Адаптивный дизайн для мобильных устройств
- [x] Коммит всех изменений в Git

## GitHub (Следующий шаг)

- [ ] Создать репозиторий на GitHub
- [ ] Добавить remote: `git remote add origin https://github.com/username/stl.git`
- [ ] Запушить код: `git push -u origin master`

**Инструкция**: См. `GITHUB_SETUP.md`

## Render Backend

- [ ] Зайти на [render.com](https://render.com)
- [ ] New + → Blueprint
- [ ] Подключить GitHub репозиторий
- [ ] Render найдёт `render-backend.yaml` автоматически
- [ ] Настроить Environment Variables:
  - [ ] `RESEND_API_KEY` - получить на [resend.com](https://resend.com)
  - [ ] `NEXT_PUBLIC_API_URL` = `https://stl-api.onrender.com`
  - [ ] `NEXT_PUBLIC_APP_URL` = `https://stl-platform.pages.dev`
  - [ ] `ALLOWED_ORIGINS` = `https://stl-platform.pages.dev,https://*.stl-platform.pages.dev`
- [ ] Нажать Apply
- [ ] Дождаться деплоя (5-10 минут)
- [ ] Проверить: `curl https://stl-api.onrender.com/api/health`

**Инструкция**: См. `SPLIT_DEPLOYMENT.md` (Часть 1)

## Cloudflare Pages Frontend

- [ ] Зайти на [dash.cloudflare.com](https://dash.cloudflare.com)
- [ ] Pages → Create a project → Connect to Git
- [ ] Выбрать репозиторий
- [ ] Build settings:
  - [ ] Framework: Next.js
  - [ ] Build command: `npm run build`
  - [ ] Build output: `out`
- [ ] Environment Variables:
  - [ ] `NEXT_PUBLIC_API_URL` = `https://stl-api.onrender.com`
  - [ ] `NEXT_PUBLIC_APP_URL` = `https://stl-platform.pages.dev`
  - [ ] `NODE_ENV` = `production`
- [ ] Save and Deploy
- [ ] Дождаться деплоя (3-5 минут)
- [ ] Открыть: `https://stl-platform.pages.dev`

**Инструкция**: См. `SPLIT_DEPLOYMENT.md` (Часть 2)

## Проверка работоспособности

- [ ] Backend API работает: `https://stl-api.onrender.com/api/health`
- [ ] Frontend загружается: `https://stl-platform.pages.dev`
- [ ] API запросы работают (проверить в DevTools → Network)
- [ ] Авторизация работает
- [ ] Нет CORS ошибок в консоли

## Опционально

- [ ] Настроить custom domain на Cloudflare Pages
- [ ] Настроить UptimeRobot для пинга Render (чтобы не засыпал)
- [ ] Перейти на платный план Render ($7/мес) для отключения sleep

## Документация

- `SPLIT_DEPLOYMENT.md` - Полная инструкция по split deployment
- `MIGRATION_GUIDE.md` - Информация о PostgreSQL миграциях
- `NEXT_STEPS.md` - Краткое руководство по следующим шагам
- `GITHUB_SETUP.md` - Настройка GitHub репозитория
- `README.md` - Общая информация о проекте

## Полезные команды

```bash
# Проверить статус Git
git status

# Посмотреть коммиты
git log --oneline -5

# Проверить remote
git remote -v

# Локальная разработка
npm run dev

# Сборка проекта
npm run build

# Prisma команды
npx prisma generate
npx prisma migrate deploy
npx prisma studio
```

## Troubleshooting

Если что-то не работает, проверьте:

1. **CORS ошибки** - проверьте `ALLOWED_ORIGINS` в Render
2. **API не отвечает** - проверьте логи в Render Dashboard
3. **Frontend не загружается** - проверьте логи в Cloudflare Pages
4. **База данных не работает** - проверьте миграции в Render
5. **Render засыпает** - настройте UptimeRobot или платный план

Подробнее в `SPLIT_DEPLOYMENT.md` → Troubleshooting
