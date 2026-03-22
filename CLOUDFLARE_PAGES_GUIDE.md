# 🚀 Cloudflare Pages - Подробная инструкция

## Шаг 1: Откройте Cloudflare Dashboard

1. Откройте в браузере: **https://dash.cloudflare.com**

2. Если нет аккаунта:
   - Нажмите **Sign Up**
   - Введите email и пароль
   - Подтвердите email

3. Если есть аккаунт - войдите (Log In)

## Шаг 2: Найдите раздел Pages

После входа в Dashboard:

1. **В левом меню** найдите раздел **Workers & Pages**
   - Это может быть в боковом меню слева
   - Или в верхнем меню

2. Кликните на **Workers & Pages**

3. Вы увидите страницу с вкладками:
   - **Overview**
   - **Workers**
   - **Pages** ← нажмите сюда

## Шаг 3: Создайте проект Pages

1. На странице Pages нажмите кнопку **Create application**
   - Или **Create a project**
   - Или **+ Create** (может быть справа вверху)

2. Выберите **Pages** (если спросит Workers или Pages)

3. Выберите **Connect to Git**

## Шаг 4: Подключите GitHub

1. Вы увидите экран "Connect to Git"

2. Нажмите **Connect GitHub**
   - Если GitHub уже подключен - пропустите этот шаг

3. Откроется окно GitHub:
   - Нажмите **Authorize Cloudflare Pages**
   - Введите пароль GitHub если попросит

4. GitHub спросит: "Where do you want to install Cloudflare Pages?"
   - Выберите **Only select repositories**
   - Найдите в списке: **clonscorpiona-creator/stl**
   - Поставьте галочку
   - Нажмите **Install & Authorize**

## Шаг 5: Выберите репозиторий

1. Вернётесь на Cloudflare

2. Увидите список репозиториев

3. Найдите **clonscorpiona-creator/stl**

4. Нажмите **Begin setup** (или **Select**)

## Шаг 6: Настройте сборку

На странице "Set up builds and deployments":

### Project name:
```
stl-platform
```
(или любое другое имя)

### Production branch:
```
master
```

### Framework preset:
Выберите из списка: **Next.js**

### Build command:
```
npm run build
```

### Build output directory:
```
out
```

### Root directory:
Оставьте пустым (или `/`)

## Шаг 7: Environment Variables

Прокрутите вниз до раздела **Environment variables**

Нажмите **Add variable** и добавьте:

**Переменная 1:**
- Variable name: `NEXT_PUBLIC_API_URL`
- Value: `https://ваш-render-url.onrender.com`
  (замените на реальный URL вашего Render сервиса)

**Переменная 2:**
- Variable name: `NEXT_PUBLIC_APP_URL`
- Value: `https://stl-platform.pages.dev`
  (или ваш custom domain)

**Переменная 3:**
- Variable name: `NODE_ENV`
- Value: `production`

## Шаг 8: Запустите деплой

1. Нажмите **Save and Deploy** внизу страницы

2. Cloudflare начнёт сборку:
   - Installing dependencies...
   - Building application...
   - Deploying...

3. Процесс займёт 3-5 минут

4. Вы увидите логи сборки в реальном времени

## Шаг 9: Проверьте результат

После завершения деплоя:

1. Вы увидите сообщение: **Success! Your site is live!**

2. URL будет вида: `https://stl-platform.pages.dev`

3. Нажмите на URL или **Visit site**

4. Откроется ваш сайт

## Troubleshooting

### Не вижу "Workers & Pages" в меню

**Решение:**
- Обновите страницу (F5)
- Или найдите в верхнем меню раздел с иконкой молнии ⚡
- Или перейдите напрямую: https://dash.cloudflare.com/?to=/:account/workers-and-pages

### Не вижу кнопку "Create application"

**Решение:**
- Убедитесь, что вы на вкладке **Pages**
- Кнопка может называться:
  - "Create a project"
  - "+ Create"
  - "Get started"

### GitHub не показывает мой репозиторий

**Решение:**
1. Вернитесь на GitHub
2. Settings → Applications → Cloudflare Pages
3. Configure → Repository access
4. Добавьте репозиторий clonscorpiona-creator/stl

### Ошибка при сборке

**Проверьте:**
- Build command: `npm run build`
- Build output: `out`
- Environment variables настроены

**Посмотрите логи:**
- Найдите ошибку (красный текст)
- Скопируйте и покажите мне

### Сайт не открывается (404)

**Возможные причины:**
1. Сборка ещё не завершилась - подождите
2. Ошибка при сборке - проверьте логи
3. Неправильный build output - должен быть `out`

## Альтернативный путь

Если не можете найти через меню:

1. Откройте напрямую: **https://dash.cloudflare.com/pages**

2. Или: **https://pages.cloudflare.com**

3. Нажмите **Sign in** и войдите

4. Вы сразу попадёте на страницу Pages

## Что дальше?

После успешного деплоя на Cloudflare:

1. ✅ Frontend работает на https://stl-platform.pages.dev
2. ⏭️ Проверьте, что API запросы идут на Render
3. ⏭️ Проверьте авторизацию
4. ⏭️ Проверьте CORS (не должно быть ошибок в консоли)

## Полезные ссылки

- **Cloudflare Pages Dashboard:** https://dash.cloudflare.com/pages
- **Документация:** https://developers.cloudflare.com/pages/
- **GitHub Integration:** https://developers.cloudflare.com/pages/get-started/git-integration/

---

**Если возникнут проблемы - покажите мне скриншот или опишите, что видите на экране.**
