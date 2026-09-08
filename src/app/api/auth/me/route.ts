import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { prisma } from "@/server/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ user: null });
  }

  const preference = await prisma.userPreference.findUnique({
    where: { userId: user.id },
  });

  return NextResponse.json({
    user,
    preference: preference || { theme: "system" },
  });
}
