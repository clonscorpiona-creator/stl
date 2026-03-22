# 🔧 Build Error Fix

## Проблема
Build command fails with Prisma error on Cloudflare Pages.

## Причина
Cloudflare Pages (frontend) не должен запускать `prisma generate`, так как:
- Frontend не использует Prisma напрямую
- Нет доступа к DATABASE_URL во время сборки
- Prisma нужен только для backend API

## Решение

### ✅ Исправлено в package.json

**Было:**
```json
"build": "prisma generate && next build"
```

**Стало:**
```json
"build": "next build"
"build:backend": "prisma generate && next build"
```

### 📝 Обновлённые инструкции

#### Cloudflare Pages
Build command: `npm run build` (без Prisma)

#### Render Backend
Build command: `npm run build:backend` (с Prisma)

---

## Что делать сейчас

### Если деплоите на Cloudflare Pages:

1. **Откройте Cloudflare Dashboard**
2. Если проект уже создан:
   - Pages → stl-platform → Settings → Builds & deployments
   - Build command: `npm run build`
   - Retry deployment

3. Если создаёте новый проект:
   - Build command: `npm run build`
   - Build output: `out`

### Если деплоите на Render:

Render использует `render-backend.yaml`, который уже обновлён.
Просто создайте Blueprint - всё будет работать.

---

## Проверка

После исправления:
```bash
# Frontend build (без Prisma)
npm run build

# Backend build (с Prisma)
npm run build:backend
```

Оба должны работать без ошибок.
