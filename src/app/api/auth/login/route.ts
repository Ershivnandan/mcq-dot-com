import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { LoginSchema } from "@/lib/validation/schemas";
import { verifyPassword, createSession } from "@/server/auth/session";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = LoginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const isValid = await verifyPassword(validated.password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    await createSession(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
      message: "Logged in successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to log in." },
      { status: 400 }
    );
  }
}
