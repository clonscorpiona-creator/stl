# ⚡ Быстрый старт деплоя

## 📋 Что нужно сделать (2 шага)

### 1️⃣ Render (Backend + Database)
**Время:** 5-10 минут

1. Откройте: https://dashboard.render.com
2. New + → **Blueprint**
3. Выберите репозиторий: `clonscorpiona-creator/stl`
4. Apply
5. Добавьте переменные в **stl-api → Environment:**
   ```
   RESEND_API_KEY=ваш_ключ
   NEXT_PUBLIC_API_URL=https://stl-api.onrender.com
   NEXT_PUBLIC_APP_URL=https://stl-platform.pages.dev
   ALLOWED_ORIGINS=https://stl-platform.pages.dev
   ```

**Проверка:** https://stl-api.onrender.com/api/health

---

### 2️⃣ Cloudflare Pages (Frontend)
**Время:** 5-10 минут

1. Откройте: https://dash.cloudflare.com
2. **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
3. Выберите: `clonscorpiona-creator/stl`
4. Настройки:
   ```
   Project name: stl-platform
   Build command: npm run build
   Build output: out
   ```
5. Environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://stl-api.onrender.com
   NEXT_PUBLIC_APP_URL=https://stl-platform.pages.dev
   NODE_ENV=production
   ```
6. **Save and Deploy**

**Проверка:** https://stl-platform.pages.dev

---

## ✅ Готово!

После деплоя:
- Frontend: https://stl-platform.pages.dev
- Backend: https://stl-api.onrender.com

---

## 📚 Подробные инструкции

- **Render:** См. `RENDER_DEPLOY_STEPS.md`
- **Cloudflare:** См. `CLOUDFLARE_PAGES_GUIDE.md`
- **Полный гайд:** См. `NEXT_STEPS_RU.md`
- **Проблемы:** См. `RENDER_TROUBLESHOOTING.md`

---

## 🔍 Проверка статуса

Запустите:
```bash
./check-deployment.sh
```

Или вручную:
```bash
curl https://stl-api.onrender.com/api/health
curl https://stl-platform.pages.dev
```
