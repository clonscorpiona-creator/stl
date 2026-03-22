import { PrismaClient, Direction, WorkStatus, InquiryStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...');

  // Очищаем существующие данные
  await prisma.inquiryMessage.deleteMany({});
  await prisma.inquiry.deleteMany({});
  await prisma.workComment.deleteMany({});
  await prisma.workLike.deleteMany({});
  await prisma.workTag.deleteMany({});
  await prisma.workMedia.deleteMany({});
  await prisma.work.deleteMany({});
  await prisma.userDirection.deleteMany({});
  await prisma.channelMessage.deleteMany({});
  await prisma.channelBan.deleteMany({});
  await prisma.channel.deleteMany({});
  await prisma.emailVerificationToken.deleteMany({});
  await prisma.userBlock.deleteMany({});
  await prisma.newsPost.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('✅ База данных очищена');

  const password = await bcrypt.hash('password123', 10);

  // Создаем пользователей
  const user1 = await prisma.user.upsert({
    where: { email: 'anna@example.com' },
    update: {},
    create: {
      email: 'anna@example.com',
      username: 'anna_art',
      displayName: 'Анна Иванова',
      passwordHash: password,
      emailVerifiedAt: new Date(),
      bio: 'Иллюстратор и концепт-художник. Работаю в digital и traditional медиа.',
      howToWork: 'Принимаю заказы на иллюстрации, концепт-арт персонажей и окружения. Сроки обсуждаются индивидуально.',
      theme: 'LIGHT',
      role: 'USER',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'dmitry@example.com' },
    update: {},
    create: {
      email: 'dmitry@example.com',
      username: 'dmitry_3d',
      displayName: 'Дмитрий Петров',
      passwordHash: password,
      emailVerifiedAt: new Date(),
      bio: '3D художник, специализируюсь на архитектурной визуализации.',
      howToWork: 'Создаю фотореалистичные визуализации интерьеров и экстерьеров. Работаю в 3ds Max + Corona.',
      theme: 'DARK',
      role: 'USER',
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'maria@example.com' },
    update: {},
    create: {
      email: 'maria@example.com',
      username: 'maria_motion',
      displayName: 'Мария Сидорова',
      passwordHash: password,
      emailVerifiedAt: new Date(),
      bio: 'Motion designer. Создаю анимацию для рекламы и соцсетей.',
      howToWork: 'Разрабатываю motion graphics, анимированные логотипы, рекламные ролики.',
      theme: 'LIGHT',
      role: 'USER',
    },
  });

  const user4 = await prisma.user.upsert({
    where: { email: 'alex@example.com' },
    update: {},
    create: {
      email: 'alex@example.com',
      username: 'alex_design',
      displayName: 'Алексей Смирнов',
      passwordHash: password,
      emailVerifiedAt: new Date(),
      bio: 'Графический дизайнер, создаю айдентику и упаковку.',
      theme: 'LIGHT',
      role: 'USER',
    },
  });

  const user5 = await prisma.user.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      email: 'client@example.com',
      username: 'client_user',
      displayName: 'Заказчик Тестовый',
      passwordHash: password,
      emailVerifiedAt: new Date(),
      bio: 'Ищу художников для проектов.',
      theme: 'LIGHT',
      role: 'USER',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@stl.com' },
    update: {},
    create: {
      email: 'admin@stl.com',
      username: 'admin',
      displayName: 'Администратор СТЛ',
      passwordHash: password,
      emailVerifiedAt: new Date(),
      bio: 'Администратор платформы СТЛ',
      theme: 'LIGHT',
      role: 'ADMIN',
    },
  });

  console.log('✅ Пользователи созданы');

  // Добавляем направления
  await prisma.userDirection.createMany({
    data: [
      { userId: user1.id, direction: Direction.ILLUSTRATION_2D },
      { userId: user1.id, direction: Direction.GRAPHIC_DESIGN },
      { userId: user2.id, direction: Direction.VISUALIZATION_3D },
      { userId: user2.id, direction: Direction.MODELING_3D },
      { userId: user3.id, direction: Direction.MOTION },
      { userId: user3.id, direction: Direction.GRAPHIC_DESIGN },
      { userId: user4.id, direction: Direction.GRAPHIC_DESIGN },
    ],
  });

  console.log('✅ Направления добавлены');

  // Создаем каналы чата
  await prisma.channel.createMany({
    data: [
      {
        slug: 'general',
        title: 'Общий',
        description: 'Общение на любые темы, знакомство с участниками сообщества',
        isReadonly: false,
      },
      {
        slug: 'announcements',
        title: 'Объявления',
        description: 'Важные новости и обновления платформы',
        isReadonly: true,
      },
      {
        slug: '2d-illustration',
        title: '2D Иллюстрация',
        description: 'Обсуждение техник рисования, концепт-арта и иллюстрации',
        isReadonly: false,
      },
      {
        slug: '3d-visualization',
        title: '3D Визуализация',
        description: 'Архитектурная визуализация, моделирование, рендеринг',
        isReadonly: false,
      },
      {
        slug: 'motion-design',
        title: 'Motion Design',
        description: 'Анимация, motion graphics, видеомонтаж',
        isReadonly: false,
      },
      {
        slug: 'web-design',
        title: 'WEB-дизайн',
        description: 'UI/UX дизайн, веб-разработка, интерфейсы',
        isReadonly: false,
      },
    ],
  });

  console.log('✅ Каналы чата созданы');

  // Создаем теги
  const tag1 = await prisma.tag.upsert({
    where: { slug: 'fantasy' },
    update: {},
    create: { slug: 'fantasy', title: 'Фэнтези' },
  });

  const tag2 = await prisma.tag.upsert({
    where: { slug: 'portrait' },
    update: {},
    create: { slug: 'portrait', title: 'Портрет' },
  });

  const tag3 = await prisma.tag.upsert({
    where: { slug: 'landscape' },
    update: {},
    create: { slug: 'landscape', title: 'Пейзаж' },
  });

  const tag4 = await prisma.tag.upsert({
    where: { slug: 'character' },
    update: {},
    create: { slug: 'character', title: 'Персонаж' },
  });

  const tag5 = await prisma.tag.upsert({
    where: { slug: 'interior' },
    update: {},
    create: { slug: 'interior', title: 'Интерьер' },
  });

  console.log('✅ Теги созданы');

  // Создаем работы
  const work1 = await prisma.work.create({
    data: {
      userId: user1.id,
      title: 'Лесная фея',
      description: 'Концепт персонажа для фэнтези игры',
      direction: Direction.ILLUSTRATION_2D,
      status: WorkStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  const work2 = await prisma.work.create({
    data: {
      userId: user1.id,
      title: 'Горный пейзаж',
      description: 'Digital painting, создано в Procreate',
      direction: Direction.ILLUSTRATION_2D,
      status: WorkStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  const work3 = await prisma.work.create({
    data: {
      userId: user2.id,
      title: 'Современная гостиная',
      description: 'Визуализация интерьера в скандинавском стиле',
      direction: Direction.VISUALIZATION_3D,
      status: WorkStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  console.log('✅ Работы созданы');

  // Добавляем теги к работам
  await prisma.workTag.createMany({
    data: [
      { workId: work1.id, tagId: tag1.id },
      { workId: work1.id, tagId: tag4.id },
      { workId: work2.id, tagId: tag3.id },
      { workId: work3.id, tagId: tag5.id },
    ],
  });

  // Добавляем лайки
  await prisma.workLike.createMany({
    data: [
      { userId: user2.id, workId: work1.id },
      { userId: user3.id, workId: work1.id },
      { userId: user1.id, workId: work3.id },
    ],
  });

  console.log('✅ Лайки добавлены');

  // Добавляем комментарии
  await prisma.workComment.createMany({
    data: [
      {
        workId: work1.id,
        userId: user2.id,
        text: 'Отличная работа! Очень нравится стиль.',
      },
      {
        workId: work3.id,
        userId: user1.id,
        text: 'Прекрасная визуализация, очень реалистично!',
      },
    ],
  });

  console.log('✅ Комментарии добавлены');

  // Создаем заявки
  const inquiry1 = await prisma.inquiry.create({
    data: {
      creatorUserId: user5.id,
      recipientUserId: user1.id,
      direction: Direction.ILLUSTRATION_2D,
      subject: 'Иллюстрация для книги',
      status: InquiryStatus.ACTIVE,
    },
  });

  const inquiry2 = await prisma.inquiry.create({
    data: {
      creatorUserId: user5.id,
      recipientUserId: user2.id,
      direction: Direction.VISUALIZATION_3D,
      subject: 'Визуализация квартиры',
      status: InquiryStatus.NEW,
    },
  });

  console.log('✅ Заявки созданы');

  // Добавляем сообщения в заявки
  await prisma.inquiryMessage.createMany({
    data: [
      {
        inquiryId: inquiry1.id,
        senderUserId: user5.id,
        text: 'Здравствуйте! Мне нужна иллюстрация для обложки книги в жанре фэнтези. Можете взяться за такой проект?',
      },
      {
        inquiryId: inquiry1.id,
        senderUserId: user1.id,
        text: 'Здравствуйте! Да, конечно. Расскажите подробнее о проекте - какой формат, сроки, бюджет?',
      },
      {
        inquiryId: inquiry2.id,
        senderUserId: user5.id,
        text: 'Добрый день! Нужна визуализация двухкомнатной квартиры. Есть планировка. Сколько будет стоить?',
      },
    ],
  });

  console.log('✅ Сообщения в заявках добавлены');

  // Создаем новости о функциях платформы
  const news1 = await prisma.newsPost.create({
    data: {
      slug: 'welcome-to-stl',
      title: 'Добро пожаловать в СТЛ!',
      content: `Рады приветствовать вас на платформе "Сообщество творческих людей"!

СТЛ — это место, где художники, дизайнеры и креативные специалисты могут делиться своими работами, находить заказчиков и общаться с коллегами.

Платформа создана для того, чтобы объединить творческое сообщество и упростить процесс поиска исполнителей для проектов.

Присоединяйтесь к нам и станьте частью растущего сообщества!`,
      status: 'PUBLISHED',
      publishedAt: new Date('2026-03-18'),
      authorId: admin.id,
    },
  });

  const news2 = await prisma.newsPost.create({
    data: {
      slug: 'portfolio-system-launched',
      title: 'Запущена система портфолио',
      content: `Теперь все пользователи могут создавать и публиковать свои работы!

Новые возможности:
- Загрузка работ с описанием и тегами
- Модерация работ перед публикацией
- Система лайков и комментариев
- Фильтрация по направлениям творчества
- Поиск работ по ключевым словам

Делитесь своим творчеством и получайте обратную связь от сообщества!`,
      status: 'PUBLISHED',
      publishedAt: new Date('2026-03-19T10:00:00'),
      authorId: admin.id,
    },
  });

  const news3 = await prisma.newsPost.create({
    data: {
      slug: 'inquiry-system-available',
      title: 'Система заявок для заказчиков',
      content: `Запущена система заявок, которая позволяет заказчикам напрямую связываться с исполнителями.

Как это работает:
- Заказчик находит подходящего специалиста в каталоге
- Отправляет заявку с описанием проекта
- Общается с исполнителем в личных сообщениях
- Обсуждает детали и условия работы

Система заявок делает процесс поиска исполнителей простым и удобным!`,
      status: 'PUBLISHED',
      publishedAt: new Date('2026-03-19T14:00:00'),
      authorId: admin.id,
    },
  });

  const news4 = await prisma.newsPost.create({
    data: {
      slug: 'chat-channels-launched',
      title: 'Запущены каналы для общения',
      content: `Теперь на платформе доступны тематические каналы для общения!

Доступные каналы:
- Общий чат для всех участников
- Каналы по направлениям: 2D, 3D, Motion, Web
- Возможность отправки стикеров
- Модерация сообщений

Общайтесь с коллегами, делитесь опытом и находите единомышленников!`,
      status: 'PUBLISHED',
      publishedAt: new Date('2026-03-19T16:00:00'),
      authorId: admin.id,
    },
  });

  const news5 = await prisma.newsPost.create({
    data: {
      slug: 'realtime-features',
      title: 'Добавлены функции реального времени',
      content: `Платформа стала еще удобнее благодаря WebSocket-технологиям!

Новые возможности:
- Мгновенная доставка сообщений в чате
- Уведомления в реальном времени
- Обновление статусов без перезагрузки страницы

Все изменения отображаются моментально, что делает работу с платформой более комфортной.`,
      status: 'PUBLISHED',
      publishedAt: new Date('2026-03-20T09:00:00'),
      authorId: admin.id,
    },
  });

  const news6 = await prisma.newsPost.create({
    data: {
      slug: 'advanced-search-and-stats',
      title: 'Расширенный поиск и статистика',
      content: `Добавлены новые инструменты для работы с платформой!

Расширенный поиск:
- Поиск работ по тексту и направлениям
- Фильтрация результатов
- Пагинация для удобного просмотра

Статистика пользователя:
- Количество опубликованных работ
- Статистика лайков и комментариев
- Распределение работ по направлениям

Эти инструменты помогут лучше ориентироваться на платформе!`,
      status: 'PUBLISHED',
      publishedAt: new Date('2026-03-20T11:00:00'),
      authorId: admin.id,
    },
  });

  const news7 = await prisma.newsPost.create({
    data: {
      slug: 'pdf-export-feature',
      title: 'Экспорт портфолио в PDF',
      content: `Теперь вы можете экспортировать свое портфолио в PDF-файл!

Эта функция позволяет:
- Создать профессиональное портфолио одним кликом
- Скачать PDF с информацией о себе и своих работах
- Отправить портфолио потенциальным заказчикам

Функция доступна в разделе профиля. Попробуйте прямо сейчас!`,
      status: 'PUBLISHED',
      publishedAt: new Date('2026-03-20T13:00:00'),
      authorId: admin.id,
    },
  });

  const news8 = await prisma.newsPost.create({
    data: {
      slug: 'color-palette-generator',
      title: 'Генератор цветовых палитр для дизайнеров',
      content: `Специально для графических дизайнеров мы добавили генератор цветовых палитр!

Возможности генератора:
- Создание палитр по различным алгоритмам (комплементарные, аналогичные, монохромные, триадные)
- Ручное редактирование цветов
- Сохранение палитр в профиле
- Публичные и приватные палитры
- Копирование hex-кодов

Инструмент доступен в разделе "Палитры" в главном меню.`,
      status: 'PUBLISHED',
      publishedAt: new Date('2026-03-20T15:00:00'),
      authorId: admin.id,
    },
  });

  console.log('✅ Новости созданы');

  // Создаем песни для музыкального плеера
  await prisma.song.createMany({
    data: [
      {
        title: 'Lofi Study Beat',
        artist: 'Chill Beats',
        album: 'Focus Music',
        coverUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400',
        fileUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        duration: 360,
        uploadedById: admin.id,
      },
      {
        title: 'Creative Flow',
        artist: 'Ambient Sounds',
        album: 'Work & Create',
        coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
        fileUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        duration: 420,
        uploadedById: admin.id,
      },
      {
        title: 'Design Inspiration',
        artist: 'Electronic Vibes',
        album: 'Creative Sessions',
        coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
        fileUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        duration: 300,
        uploadedById: admin.id,
      },
      {
        title: 'Coding Rhythm',
        artist: 'Tech Beats',
        album: 'Developer Playlist',
        coverUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400',
        fileUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
        duration: 380,
        uploadedById: admin.id,
      },
    ],
  });

  console.log('✅ Песни добавлены');

  console.log('\n🎉 Готово!');
  console.log('\n📝 Тестовые аккаунты (пароль: password123):');
  console.log('   admin@stl.com - Администратор');
  console.log('   anna@example.com - Иллюстратор');
  console.log('   dmitry@example.com - 3D художник');
  console.log('   maria@example.com - Motion designer');
  console.log('   alex@example.com - Графический дизайнер');
  console.log('   client@example.com - Заказчик');
}

main()
  .catch((e) => {
    console.error('Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
