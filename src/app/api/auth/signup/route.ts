import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { SignUpSchema } from "@/lib/validation/schemas";
import { hashPassword, createSession } from "@/server/auth/session";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = SignUpSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email already registered." }, { status: 409 });
    }

    const passwordHash = await hashPassword(validated.password);
    const user = await prisma.user.create({
      data: {
        email: validated.email.toLowerCase(),
        passwordHash,
        name: validated.name || validated.email.split("@")[0],
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
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
      },
    });

    await createSession(user.id);

    return NextResponse.json({ user, message: "Account created successfully" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create account." },
      { status: 400 }
    );
  }
}
