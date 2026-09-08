import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { getUserPreferencesCol, formatDoc } from "@/server/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ user: null });
  }

  const prefsCol = await getUserPreferencesCol();
  const preference = await prefsCol.findOne({ userId: user.id });

  return NextResponse.json({
    user,
    preference: formatDoc(preference) || { theme: "system" },
  });
}
