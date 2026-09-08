import fs from "fs";
import path from "path";
import { prisma } from "../src/server/db";
import { ImportExportService } from "../src/server/services/import-export.service";
import { hashPassword } from "../src/server/auth/session";

async function main() {
  console.log("==========================================");
  console.log("   MCQ QUIZ MANAGER — DATA MIGRATION      ");
  console.log("==========================================");

  const filePath = path.join(process.cwd(), "mcq_backup_new.json");
  if (!fs.existsSync(filePath)) {
    console.error(`Error: Backup file not found at ${filePath}`);
    process.exit(1);
  }

  console.log(`Reading ${filePath}...`);
  const rawData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  // Ensure a default user exists for CLI migration
  let user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found in database. Creating default user (demo@mcqmanager.com)...");
    const passwordHash = await hashPassword("password123");
    user = await prisma.user.create({
      data: {
        email: "demo@mcqmanager.com",
        passwordHash,
        name: "Demo Admin",
        preference: {
          create: {
            theme: "system",
            defaultQuizMode: "PRACTICE",
            defaultQuestionCount: 20,
          },
        },
      },
    });
    console.log(`Created default user: ${user.email} (password: password123)`);
  } else {
    console.log(`Using existing user: ${user.email} (${user.id})`);
  }

  console.log("\nStarting intelligent import with date header parsing...");
  const startTime = Date.now();
  const summary = await ImportExportService.importBackupJson(user.id, rawData);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("\n==========================================");
  console.log("           IMPORT SUMMARY REPORT          ");
  console.log("==========================================");
  console.log(`✅ Successfully Imported: ${summary.imported} questions`);
  console.log(`📅 Date Headers Extracted: ${summary.dateHeadersFound} dates`);
  console.log(`📁 Topics Created:        ${summary.topicsCreated.join(", ")}`);
  console.log(`🔄 Duplicates Merged:     ${summary.duplicates}`);
  console.log(`⚠️ Invalid (skipped):      ${summary.invalid}`);
  console.log(`⏭️ Dividers Skipped:      ${summary.skipped}`);
  console.log(`⏱️ Elapsed Time:          ${elapsed}s`);
  console.log("==========================================");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
