# 🚀 Быстрый старт деплоя на Render

## Что уже готово

✅ Конфигурация Render (`render.yaml`)
✅ PostgreSQL настроен в Prisma
✅ Переменные окружения обновлены
✅ Скрипты сборки созданы
✅ Документация подготовлена

## Что нужно сделать

### 1. Создайте PostgreSQL миграции

**Вариант А: Локальный PostgreSQL (быстрее)**

```bash
# Установите PostgreSQL и создайте базу
createdb stl_dev

# Обновите .env
DATABASE_URL="postgresql://postgres:password@localhost:5432/stl_dev"

# Создайте миграции
npx prisma migrate dev --name init
```

**Вариант Б: Без локального PostgreSQL**

Следуйте инструкциям в `MIGRATION_GUIDE.md` (способ 2)

### 2. Закоммитьте изменения

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 3. Деплой на Render

1. Зайдите на [render.com](https://render.com)
2. Нажмите **New +** → **Blueprint**
3. Подключите ваш GitHub репозиторий
4. Render автоматически создаст сервисы из `render.yaml`

### 4. Настройте переменные окружения

В Render Dashboard → stl-platform → Environment добавьте:

```
NEXT_PUBLIC_APP_URL=https://your-app.onrender.com
NEXT_PUBLIC_BASE_URL=https://your-app.onrender.com
RESEND_API_KEY=your_resend_api_key
```

### 5. Дождитесь деплоя

Render автоматически:
- Установит зависимости
- Сгенерирует Prisma Client
- Применит миграции
- Соберёт Next.js приложение
- Запустит сервер

⏱️ Первый деплой займёт 5-10 минут

## Полезные ссылки

- 📖 Полная инструкция: `DEPLOYMENT.md`
- 🔄 Гайд по миграциям: `MIGRATION_GUIDE.md`
- 🛠️ Скрипты: `scripts/`

## Поддержка

Если возникли проблемы:
1. Проверьте логи в Render Dashboard
2. Убедитесь, что все переменные окружения установлены
3. Проверьте, что миграции созданы и закоммичены

## Бесплатный план

⚠️ На бесплатном плане Render:
- Сервис засыпает после 15 минут неактивности
- Первый запрос после сна занимает ~30 секунд
- 750 часов работы в месяц

💡 Используйте [UptimeRobot](https://uptimerobot.com) для пинга каждые 5 минут
