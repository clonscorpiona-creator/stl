# 🚀 Cloudflare Pages - Пошаговая настройка

## Настройки для Cloudflare Pages Dashboard

### 1. Build Configuration

Когда создаёте проект на Cloudflare Pages, укажите:

**Framework preset:**
```
Next.js
```

**Build command:**
```
npm run build
```

**Build output directory:**
```
out
```

---

### 2. Environment Variables

Перейдите в Settings → Environment Variables и добавьте:

**Production (и Preview):**

```
NODE_ENV=production
NEXT_OUTPUT_MODE=export
NEXT_PUBLIC_API_URL=https://stl-api.onrender.com
NEXT_PUBLIC_APP_URL=https://stl-platform.pages.dev
NEXT_PUBLIC_BASE_URL=https://stl-api.onrender.com
```

**Важно:** Добавляйте переменные по одной, сохраняя каждую отдельно.

---

### 3. Root Directory

Если спрашивает Root directory:
```
(оставьте пустым или укажите /)
```

---

### 4. Node Version

Если нужно указать версию Node.js:
```
NODE_VERSION=20
```

---

## Полная последовательность действий

### Шаг 1: Создание проекта

1. Откройте: https://dash.cloudflare.com
2. Workers & Pages → Create application → Pages → Connect to Git
3. Выберите репозиторий: **clonscorpiona-creator/stl**
4. Нажмите "Begin setup"

### Шаг 2: Настройка сборки

**Project name:**
```
stl-platform
```

**Production branch:**
```
master
```

**Framework preset:**
```
Next.js
```

**Build command:**
```
npm run build
```

**Build output directory:**
```
out
```

### Шаг 3: Environment Variables

Нажмите "Add variable" и добавьте по одной:

1. `NODE_ENV` = `production`
2. `NEXT_OUTPUT_MODE` = `export`
3. `NEXT_PUBLIC_API_URL` = `https://stl-api.onrender.com`
4. `NEXT_PUBLIC_APP_URL` = `https://stl-platform.pages.dev`
5. `NEXT_PUBLIC_BASE_URL` = `https://stl-api.onrender.com`

### Шаг 4: Deploy

Нажмите **"Save and Deploy"**

Build займёт 5-10 минут.

---

## Если build падает

### Проверьте логи:

1. Откройте failed deployment
2. Посмотрите "Build log"
3. Найдите строку с ошибкой (обычно красным цветом)

### Частые проблемы:

**"Module not found":**
- Убедитесь, что используется последний коммит (dfc091b4)
- Retry deployment

**"Build exceeded memory limit":**
- Это ограничение Cloudflare Free tier
- Попробуйте ещё раз (иногда помогает)

**"Command failed":**
- Проверьте, что все env переменные добавлены
- Особенно важна `NEXT_OUTPUT_MODE=export`

---

## После успешного деплоя

Ваш сайт будет доступен по адресу:
```
https://stl-platform.pages.dev
```

Но API routes работать не будут, пока не задеплоите backend на Render.

---

## Важные замечания

1. **Static Export:** Cloudflare Pages использует статический экспорт Next.js
2. **API Routes:** API routes будут проксироваться на Render backend
3. **Environment Variables:** Обязательно установите `NEXT_OUTPUT_MODE=export`
4. **Build Output:** Должна быть директория `out`, не `.next`

---

**Последний коммит с исправлениями:** dfc091b4
