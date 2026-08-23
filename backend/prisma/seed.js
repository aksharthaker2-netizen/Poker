// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ACHIEVEMENTS = [
  { key: 'FIRST_WIN', title: 'First Win', description: 'Win your first hand.' },
  { key: 'WIN_STREAK_5', title: '5 Win Streak', description: 'Win 5 hands in a row.' },
  { key: 'HANDS_100', title: 'Century Club', description: 'Play 100 hands.' },
  {
    key: 'BEAT_5_BOTS',
    title: 'Beat 5 Bots',
    description: 'Win a hand at a table with 5 or more AI bots seated.'
  },
  {
    key: 'BEAT_9_BOTS',
    title: 'Beat 9 Bots',
    description: 'Win a hand at a full table of 9 AI bots.'
  }
];

async function main() {
  for (const achievement of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { key: achievement.key },
      create: achievement,
      update: achievement // keeps title/description in sync if you edit them here later
    });
  }
  console.log(`Seeded ${ACHIEVEMENTS.length} achievements.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());