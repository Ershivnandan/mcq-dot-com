import { prisma } from "../src/server/db";
import { hashPassword } from "../src/server/auth/session";

async function main() {
  console.log("Seeding initial development database...");

  // Seed demo user
  const email = "test@example.com";
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const passwordHash = await hashPassword("password123");
    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: "Test Learner",
        preference: {
          create: {
            theme: "system",
            defaultQuizMode: "PRACTICE",
            defaultQuestionCount: 20,
            shuffleOptions: true,
            shuffleQuestions: true,
            spacedRepetition: true,
          },
        },
      },
    });
    console.log(`Created test user: ${email} with password: password123`);
  }

  // Seed demo topics
  const topics = ["JavaScript", "Computer Science", "General Knowledge"];
  for (const name of topics) {
    await prisma.topic.upsert({
      where: { userId_name: { userId: user.id, name } },
      create: {
        userId: user.id,
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
      },
      update: {},
    });
  }

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
