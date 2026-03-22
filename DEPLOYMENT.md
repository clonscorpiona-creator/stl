# Деплой STL Platform на Render

## Подготовка к деплою

### 1. Создание миграций базы данных (локально)

Перед деплоем необходимо создать миграции для PostgreSQL:

```bash
# Переключитесь на PostgreSQL в schema.prisma (уже сделано)
# Создайте миграции
npx prisma migrate dev --name init
```

Это создаст папку `prisma/migrations` с SQL-миграциями.

### 2. Подготовка репозитория

Убедитесь, что все изменения закоммичены в Git:

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

## Деплой на Render

### Шаг 1: Создание аккаунта

1. Зайдите на [render.com](https://render.com)
2. Зарегистрируйтесь или войдите через GitHub

### Шаг 2: Подключение репозитория

1. Нажмите **"New +"** → **"Blueprint"**
2. Подключите ваш GitHub репозиторий
3. Render автоматически обнаружит `render.yaml` и создаст сервисы

### Шаг 3: Настройка переменных окружения

После создания сервисов, добавьте переменные окружения в веб-сервис:

1. Перейдите в **Dashboard** → **stl-platform** → **Environment**
2. Добавьте переменные:

```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app-name.onrender.com
NEXT_PUBLIC_BASE_URL=https://your-app-name.onrender.com
RESEND_API_KEY=your_actual_resend_api_key
SESSION_SECRET=автоматически_сгенерирован
DATABASE_URL=автоматически_подключен_из_базы
```

**Важно:**
- `DATABASE_URL` автоматически подключается из PostgreSQL сервиса
- `SESSION_SECRET` автоматически генерируется
- Замените `your-app-name` на реальное имя вашего приложения
- Получите `RESEND_API_KEY` на [resend.com](https://resend.com)

### Шаг 4: Запуск деплоя

1. Render автоматически начнёт деплой после подключения репозитория
2. Процесс деплоя займёт 5-10 минут
3. Следите за логами в разделе **Logs**

## Процесс деплоя

Render выполнит следующие команды:

```bash
# Build Command
npm install
npx prisma generate
npx prisma migrate deploy
npm run build

# Start Command
npm start
```

## После деплоя

### Проверка работоспособности

1. Откройте URL вашего приложения: `https://your-app-name.onrender.com`
2. Проверьте подключение к базе данных
3. Попробуйте зарегистрировать тестового пользователя

### Seed данных (опционально)

Если нужно заполнить базу начальными данными:

1. Перейдите в **Shell** вашего веб-сервиса
2. Выполните:
```bash
npm run prisma:seed
```

## Обновление приложения

Render автоматически деплоит при каждом push в main ветку:

```bash
git add .
git commit -m "Update application"
git push origin main
```

## Мониторинг

- **Логи**: Dashboard → stl-platform → Logs
- **Метрики**: Dashboard → stl-platform → Metrics
- **База данных**: Dashboard → stl-db → Info

## Бесплатный план Render

**Ограничения:**
- Веб-сервис засыпает после 15 минут неактивности
- Первый запрос после сна занимает ~30 секунд
- 750 часов работы в месяц (достаточно для одного сервиса)
- PostgreSQL: 1GB хранилища, 97 часов работы в месяц

**Рекомендации:**
- Используйте [UptimeRobot](https://uptimerobot.com) для пинга каждые 5 минут (предотвращает засыпание)
- Для production используйте платный план ($7/месяц)

## Troubleshooting

### Ошибка миграций

```bash
# В Shell сервиса
npx prisma migrate deploy --preview-feature
```

### Ошибка подключения к БД

Проверьте, что `DATABASE_URL` правильно подключен:
1. Dashboard → stl-platform → Environment
2. Убедитесь, что `DATABASE_URL` имеет значение из базы данных

### Приложение не запускается

1. Проверьте логи: Dashboard → Logs
2. Убедитесь, что все переменные окружения установлены
3. Проверьте, что миграции применились успешно

## Полезные команды

```bash
# Просмотр логов
render logs -s stl-platform

# Перезапуск сервиса
render restart -s stl-platform

# Открыть shell
render shell -s stl-platform
```

## Дополнительная настройка

### Custom Domain

1. Dashboard → stl-platform → Settings → Custom Domain
2. Добавьте ваш домен
3. Настройте DNS записи согласно инструкциям Render

### SSL сертификат

Render автоматически предоставляет бесплатный SSL сертификат от Let's Encrypt.

## Поддержка

- [Документация Render](https://render.com/docs)
- [Render Community](https://community.render.com)
- [Prisma Docs](https://www.prisma.io/docs)
