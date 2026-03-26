# 🎨 STL Platform

**Сообщество творческих людей** — платформа для художников, дизайнеров и 3D-специалистов.

## 🚀 Быстрый старт

### Django версия (быстрый прототип)

```bash
# Установите зависимости
pip install django pillow django-taggit

# Примените миграции
python manage.py migrate

# Создайте суперпользователя
python manage.py createsuperuser

# Запустите сервер
python manage.py runserver
```

Откройте [http://localhost:8000](http://localhost:8000)

Админ-панель: [http://localhost:8000/admin](http://localhost:8000/admin)

### Node.js версия (продакшен)

```bash
# Установите зависимости
npm install

# Настройте базу данных
cp .env.example .env

# Создайте базу данных
npx prisma db push

# Запустите dev-сервер
npm run dev
```

Откройте [http://localhost:3001](http://localhost:3001)

## 📦 Технологии

### Django (прототип)
- **Backend**: Django 6.0, Python 3.14
- **Database**: SQLite
- **Auth**: Django Auth
- **Media**: Pillow

### Node.js (продакшен)
- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: Iron Session
- **Styling**: CSS Modules

## 🎨 Макеты

Платформа поддерживает 5 различных визуальных тем:

1. **Кофейная тема** (по умолчанию) - тёплые коричневые тона
2. **Современная синяя** - профессиональный синий дизайн
3. **Тёплый уют** - bakery-inspired бежевые тона
4. **Минималистичная** - чистый оливковый дизайн
5. **Минималистичная оливковая** - чёрно-оливковая палитра

Переключение между темами доступно через компонент `PageLayoutSwitcher`.

## 🗄️ База данных

### Модели

- **User** - пользователи и художники
- **Work** - портфолио работ
- **Channel** - чаты и каналы
- **Inquiry** - заказы и запросы
- **NewsPost** - новости платформы
- **Notification** - уведомления
- **ColorPalette** - цветовые палитры
- **Song** - музыкальная библиотека

### Команды Prisma

```bash
# Генерация клиента
npm run prisma:generate

# Применение изменений схемы (dev)
npm run prisma:push

# Создание миграции
npx prisma migrate dev --name migration_name

# Prisma Studio (GUI)
npm run prisma:studio

# Seed данных
npm run prisma:seed
```

## 🌐 Деплой на Render

### Подготовка

1. **Создайте PostgreSQL миграции**
   ```bash
   # Следуйте инструкциям в MIGRATION_GUIDE.md
   npx prisma migrate dev --name init
   ```

2. **Закоммитьте изменения**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

3. **Деплой на Render**
   - Следуйте инструкциям в `RENDER_QUICKSTART.md`
   - Полная документация в `DEPLOYMENT.md`

### Автоматический деплой

Render автоматически деплоит при каждом push в `main` ветку.

## 📁 Структура проекта

```
stl/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── components/        # React компоненты
│   ├── auth/             # Страницы авторизации
│   ├── admin/            # Админ-панель
│   ├── artists/          # Страницы художников
│   ├── chat/             # Чат
│   └── globals.css       # Глобальные стили
├── prisma/
│   ├── schema.prisma     # Схема базы данных
│   ├── migrations/       # SQL миграции
│   └── seed.ts          # Seed данные
├── scripts/              # Утилиты и скрипты
├── render.yaml          # Конфигурация Render
└── package.json
```

## 🔧 Скрипты

```bash
npm run dev              # Запуск dev-сервера (порт 3001)
npm run build           # Сборка для production
npm start               # Запуск production сервера
npm run lint            # Линтинг кода
npm run prisma:generate # Генерация Prisma Client
npm run prisma:push     # Применение схемы к БД
npm run prisma:studio   # Открыть Prisma Studio
npm run prisma:seed     # Заполнить БД тестовыми данными
```

## 🔐 Переменные окружения

Создайте `.env` файл на основе `.env.example`:

```env
# Database
DATABASE_URL="file:./dev.db"  # SQLite для разработки
# DATABASE_URL="postgresql://..." # PostgreSQL для production

# Session
SESSION_SECRET="your-secret-key"

# Email (Resend)
RESEND_API_KEY="your-resend-api-key"

# App URLs
NEXT_PUBLIC_APP_URL="http://localhost:3001"
NEXT_PUBLIC_BASE_URL="http://localhost:3001"

# Environment
NODE_ENV="development"
```

## 👥 Роли пользователей

- **USER** - обычный пользователь
- **ARTIST** - художник с портфолио
- **MODERATOR** - модератор контента
- **ADMIN** - администратор платформы

## 📝 Направления творчества

- Графический дизайн
- Моушн-дизайн
- 3D-моделинг
- Визуализация
- 3D-печать
- WEB-дизайн

## 🛠️ Разработка

### Требования

- Node.js 20+
- npm или yarn
- PostgreSQL (для production) или SQLite (для dev)

### Рекомендации

- Используйте TypeScript для типобезопасности
- Следуйте структуре CSS Modules
- Используйте Prisma для работы с БД
- Тестируйте на разных разрешениях экрана

## 📚 Документация

- `DEPLOYMENT.md` - Полная инструкция по деплою
- `MIGRATION_GUIDE.md` - Гайд по миграциям БД
- `RENDER_QUICKSTART.md` - Быстрый старт на Render
- `scripts/` - Утилиты для деплоя

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

Проект разработан для сообщества СТЛ.

## 👨‍💻 Разработчики

- **CERDEX** - Основной разработчик
- **Claude (Anthropic)** - AI-ассистент

## 🔗 Полезные ссылки

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Render Documentation](https://render.com/docs)
- [Resend Documentation](https://resend.com/docs)

---

**Версия**: 1.0.0
**Дата создания**: 2026-03-22
