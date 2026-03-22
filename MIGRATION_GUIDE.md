# STL Platform - Миграция с SQLite на PostgreSQL

## Зачем нужна миграция?

Render не поддерживает SQLite в production. PostgreSQL — это надёжная реляционная база данных, которая лучше подходит для production-окружения.

## Два способа создания миграций

### Способ 1: Локальная PostgreSQL (Рекомендуется)

#### Установка PostgreSQL

**Windows:**
1. Скачайте PostgreSQL с [postgresql.org](https://www.postgresql.org/download/windows/)
2. Установите с настройками по умолчанию
3. Запомните пароль для пользователя `postgres`

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Создание локальной базы данных

```bash
# Подключитесь к PostgreSQL
psql -U postgres

# Создайте базу данных
CREATE DATABASE stl_dev;

# Создайте пользователя (опционально)
CREATE USER stl_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE stl_dev TO stl_user;

# Выйдите
\q
```

#### Обновите .env

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/stl_dev"
```

#### Создайте миграции

```bash
# Сгенерируйте Prisma Client для PostgreSQL
npx prisma generate

# Создайте начальную миграцию
npx prisma migrate dev --name init

# Примените seed данные (опционально)
npm run prisma:seed
```

Это создаст папку `prisma/migrations` с SQL-файлами.

### Способ 2: Использование Render PostgreSQL

Если у вас нет локального PostgreSQL:

#### Шаг 1: Первый деплой (с ошибкой миграций)

```bash
git add .
git commit -m "Initial Render setup"
git push origin main
```

Деплой завершится с ошибкой миграций — это нормально.

#### Шаг 2: Получите DATABASE_URL из Render

1. Зайдите в Render Dashboard
2. Откройте сервис `stl-db` (PostgreSQL)
3. Скопируйте **Internal Database URL**

#### Шаг 3: Создайте миграции локально

```bash
# Временно обновите .env с URL из Render
DATABASE_URL="postgresql://stl_db_user:xxx@xxx.render.com/stl_db"

# Создайте миграции
npx prisma migrate dev --name init
```

#### Шаг 4: Закоммитьте и задеплойте

```bash
git add prisma/migrations
git commit -m "Add PostgreSQL migrations"
git push origin main
```

Render автоматически задеплоит с миграциями.

## Проверка миграций

После создания миграций проверьте:

```bash
# Просмотрите созданные файлы
ls -la prisma/migrations/

# Должна быть папка вида: 20260322000000_init/
# Внутри: migration.sql
```

## Откат к SQLite (если нужно)

Если хотите вернуться к SQLite для локальной разработки:

```bash
# В schema.prisma измените:
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

# В .env:
DATABASE_URL="file:./dev.db"

# Пересоздайте клиент
npx prisma generate
npx prisma db push
```

## Troubleshooting

### Ошибка: "Can't reach database server"

Проверьте:
- PostgreSQL запущен: `sudo systemctl status postgresql` (Linux)
- Правильный пароль в DATABASE_URL
- Порт 5432 не занят другим процессом

### Ошибка: "Database does not exist"

```bash
# Создайте базу данных
createdb stl_dev
```

### Ошибка: "Migration failed"

```bash
# Сбросьте миграции и начните заново
rm -rf prisma/migrations
npx prisma migrate dev --name init
```

## Следующие шаги

После успешного создания миграций:

1. ✅ Закоммитьте изменения в Git
2. ✅ Следуйте инструкциям в DEPLOYMENT.md
3. ✅ Деплойте на Render

```bash
git add .
git commit -m "Add PostgreSQL migrations for Render"
git push origin main
```
