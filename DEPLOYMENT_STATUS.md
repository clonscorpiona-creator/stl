# 📊 Статус деплоя STL Platform

Последнее обновление: 2026-03-22

## ✅ Завершено

- [x] Код на GitHub: https://github.com/clonscorpiona-creator/stl
- [x] PostgreSQL миграции созданы
- [x] Backend конфигурация (render-backend.yaml)
- [x] Frontend конфигурация (wrangler.toml)
- [x] CORS настроен
- [x] Документация создана (13 файлов)

## ⏳ В процессе / Требует действий

### Backend (Render)
- [ ] Создать аккаунт на Render (если нет)
- [ ] Подключить GitHub репозиторий
- [ ] Создать Blueprint из render-backend.yaml
- [ ] Настроить Environment Variables:
  - [ ] RESEND_API_KEY (получить на resend.com)
  - [ ] NEXT_PUBLIC_API_URL
  - [ ] NEXT_PUBLIC_APP_URL
  - [ ] ALLOWED_ORIGINS
- [ ] Дождаться деплоя (5-10 минут)
- [ ] Проверить: curl https://stl-api.onrender.com/api/health

**Инструкция:** RENDER_DEPLOY_STEPS.md

### Frontend (Cloudflare Pages)
- [ ] Создать аккаунт на Cloudflare (если нет)
- [ ] Подключить GitHub репозиторий
- [ ] Настроить Build settings:
  - Build command: `npm run build`
  - Build output: `out`
- [ ] Настроить Environment Variables:
  - [ ] NEXT_PUBLIC_API_URL
  - [ ] NEXT_PUBLIC_APP_URL
  - [ ] NODE_ENV=production
- [ ] Дождаться деплоя (3-5 минут)
- [ ] Проверить: https://stl-platform.pages.dev

**Инструкция:** SPLIT_DEPLOYMENT.md (Часть 2)

## 🔗 Полезные ссылки

- **GitHub Repo:** https://github.com/clonscorpiona-creator/stl
- **Render Dashboard:** https://dashboard.render.com
- **Cloudflare Dashboard:** https://dash.cloudflare.com
- **Resend (Email API):** https://resend.com

## 📚 Документация

1. **RENDER_DEPLOY_STEPS.md** - Пошаговая инструкция для Render
2. **SPLIT_DEPLOYMENT.md** - Полная инструкция split deployment
3. **DEPLOYMENT_CHECKLIST.md** - Чеклист всех шагов
4. **READY_TO_DEPLOY.md** - Краткое руководство
5. **GITHUB_SETUP.md** - Настройка GitHub (завершено)
6. **QUICK_GITHUB_PUSH.md** - Troubleshooting GitHub push

## ⚠️ Важные заметки

### Render Free Tier
- Засыпает после 15 минут неактивности
- Первый запрос после пробуждения медленный (30-60 сек)
- Решение: UptimeRobot или платный план ($7/мес)

### Resend API Key
- Обязателен для отправки email (регистрация, сброс пароля)
- Бесплатный план: 100 emails/день
- Регистрация: https://resend.com

### CORS
- Уже настроен в next.config.js
- ALLOWED_ORIGINS должен содержать URL Cloudflare Pages
- Проверьте в DevTools → Console на наличие CORS ошибок

## 🎯 Следующий шаг

**Зайдите на https://dashboard.render.com и создайте Blueprint**

Следуйте инструкциям в RENDER_DEPLOY_STEPS.md
