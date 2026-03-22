# 🔧 Решение проблем с Environment Variables

## Ошибка: "An error occurred while updating these environment variables"

---

## Для Cloudflare Pages

### Возможные причины:

1. **Неправильный формат значений**
   - Не используйте кавычки вокруг значений
   - Cloudflare автоматически обрабатывает значения

2. **Специальные символы**
   - Если в значении есть спецсимволы, попробуйте без них
   - Или используйте escape-последовательности

3. **Слишком длинные значения**
   - Проверьте, что значения не превышают лимит

### Решение:

**Вариант 1: Добавляйте по одной переменной**

Вместо добавления всех сразу, добавьте по одной:

1. `NEXT_PUBLIC_API_URL` = `https://stl-api.onrender.com`
2. Сохраните
3. `NEXT_PUBLIC_APP_URL` = `https://stl-platform.pages.dev`
4. Сохраните
5. `NODE_ENV` = `production`
6. Сохраните

**Вариант 2: Используйте Wrangler CLI**

```bash
wrangler pages project create stl-platform

# Установите переменные через CLI
wrangler pages deployment create out \
  --project-name=stl-platform \
  --branch=master
```

**Вариант 3: Пропустите env vars на первом деплое**

1. Создайте проект БЕЗ environment variables
2. Дождитесь первого деплоя
3. Потом добавьте переменные в Settings → Environment Variables
4. Retry deployment

### Минимальные переменные для старта:

Для первого деплоя достаточно:
```
NEXT_PUBLIC_API_URL=https://stl-api.onrender.com
```

Остальные можно добавить потом.

---

## Для Render

### Возможные причины:

1. **Blueprint уже применён**
   - Если Blueprint уже создал сервис, нельзя изменить некоторые переменные
   - Нужно редактировать через Dashboard

2. **Неправильный формат в YAML**
   - Проверьте `render-backend.yaml`

3. **Sync: false переменные**
   - Переменные с `sync: false` нужно добавлять вручную

### Решение:

**Вариант 1: Добавьте переменные после создания Blueprint**

1. Создайте Blueprint (Apply)
2. Дождитесь создания сервисов
3. Перейдите в Dashboard → stl-api → Environment
4. Добавьте вручную:
   ```
   RESEND_API_KEY=ваш_ключ
   NEXT_PUBLIC_API_URL=https://stl-api.onrender.com
   NEXT_PUBLIC_APP_URL=https://stl-platform.pages.dev
   ALLOWED_ORIGINS=https://stl-platform.pages.dev
   ```
5. Сохраните

**Вариант 2: Проверьте render-backend.yaml**

Убедитесь, что файл правильный:
```yaml
envVars:
  - key: RESEND_API_KEY
    sync: false
  - key: NEXT_PUBLIC_API_URL
    sync: false
```

`sync: false` означает, что вы добавите значения вручную.

**Вариант 3: Используйте Render CLI**

```bash
# Установите Render CLI
npm install -g @render/cli

# Авторизуйтесь
render login

# Установите переменные
render env set RESEND_API_KEY=ваш_ключ --service=stl-api
```

---

## Общие советы

### 1. Проверьте формат значений

❌ **Неправильно:**
```
NEXT_PUBLIC_API_URL="https://stl-api.onrender.com"
NEXT_PUBLIC_API_URL='https://stl-api.onrender.com'
```

✅ **Правильно:**
```
NEXT_PUBLIC_API_URL=https://stl-api.onrender.com
```

### 2. Проверьте спецсимволы

Если в значении есть:
- Пробелы
- Кавычки
- Символы `$`, `&`, `#`

Попробуйте упростить или escape.

### 3. Начните с минимума

Для первого деплоя используйте только критичные переменные:

**Cloudflare:**
```
NEXT_PUBLIC_API_URL=https://stl-api.onrender.com
```

**Render:**
```
RESEND_API_KEY=ваш_ключ
```

Остальные добавите после успешного деплоя.

---

## Что делать дальше

### Если ошибка на Cloudflare:

1. Попробуйте создать проект БЕЗ env vars
2. После первого деплоя добавьте переменные
3. Retry deployment

### Если ошибка на Render:

1. Создайте Blueprint без изменений
2. После создания сервиса добавьте env vars вручную через Dashboard
3. Сервис автоматически перезапустится

---

## Нужна помощь?

Напишите мне:
- На какой платформе ошибка (Cloudflare или Render)?
- Какие переменные пытаетесь добавить?
- Точный текст ошибки
- Скриншот (если возможно)

Я помогу разобраться!
