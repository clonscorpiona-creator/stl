import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding chat data...");

  // Создаем каналы
  const channels = [
    { slug: "2d-graphics", title: "2D-графика", description: "Обсуждение иллюстрации и 2D-дизайна" },
    { slug: "3d-modeling", title: "3D-моделирование", description: "Моделинг, скульптинг, текстурирование" },
    { slug: "motion-design", title: "Моушн-дизайн", description: "Анимация и motion-графика" },
    { slug: "visualization", title: "Визуализация", description: "Archviz и product render" },
    { slug: "3d-printing", title: "3D-печать", description: "Подготовка моделей и печать" },
    { slug: "web-design", title: "WEB-дизайн", description: "Дизайн сайтов и интерфейсов" },
    { slug: "general", title: "Общий", description: "Общие темы и знакомства" }
  ];

  for (const ch of channels) {
    await prisma.channel.upsert({
      where: { slug: ch.slug },
      update: {},
      create: ch
    });
  }

  console.log(`Created ${channels.length} channels`);

  // Создаем стикеры (эмодзи-стикеры)
  const stickers = [
    { id: "thumbs-up", title: "👍", src: "👍", order: 1 },
    { id: "fire", title: "🔥", src: "🔥", order: 2 },
    { id: "heart", title: "❤️", src: "❤️", order: 3 },
    { id: "star", title: "⭐", src: "⭐", order: 4 },
    { id: "rocket", title: "🚀", src: "🚀", order: 5 },
    { id: "clap", title: "👏", src: "👏", order: 6 },
    { id: "eyes", title: "👀", src: "👀", order: 7 },
    { id: "thinking", title: "🤔", src: "🤔", order: 8 },
    { id: "party", title: "🎉", src: "🎉", order: 9 },
    { id: "cool", title: "😎", src: "😎", order: 10 }
  ];

  for (const st of stickers) {
    await prisma.sticker.upsert({
      where: { id: st.id },
      update: {},
      create: st
    });
  }

  console.log(`Created ${stickers.length} stickers`);
  console.log("Chat seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
