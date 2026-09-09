import { NextResponse } from "next/server";
import { getUsersCol, getUserPreferencesCol, ensureIndexes } from "@/server/db";
import { SignUpSchema } from "@/lib/validation/schemas";
import { hashPassword, createSession } from "@/server/auth/session";
import { QuizMode, Theme } from "@/typings";

export async function POST(req: Request) {
  try {
    await ensureIndexes();
    const body = await req.json();
    const validated = SignUpSchema.parse(body);

    const usersCol = await getUsersCol();
    const existingUser = await usersCol.findOne({
      email: validated.email.toLowerCase(),
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email already registered." }, { status: 409 });
    }

    const passwordHash = await hashPassword(validated.password);
    const now = new Date();
    const name = validated.name || validated.email.split("@")[0];

    const insertResult = await usersCol.insertOne({
      email: validated.email.toLowerCase(),
      passwordHash,
      name,
      image: null,
      createdAt: now,
      updatedAt: now,
    });

    const userId = insertResult.insertedId.toString();

    // Create user default preference
    const prefsCol = await getUserPreferencesCol();
    await prefsCol.insertOne({
      userId,
      theme: Theme.SYSTEM,
      defaultQuizMode: QuizMode.PRACTICE,
      defaultQuestionCount: 20,
      shuffleOptions: true,
      shuffleQuestions: true,
      spacedRepetition: true,
      createdAt: now,
      updatedAt: now,
    });

    await createSession(userId);

    const user = {
      id: userId,
      email: validated.email.toLowerCase(),
      name,
      image: null,
    };

    return NextResponse.json({ user, message: "Account created successfully" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create account." },
      { status: 400 }
    );
  }
}
