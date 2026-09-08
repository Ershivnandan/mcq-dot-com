import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getSessionsCol, getUsersCol, toObjectId } from "@/server/db";

export const SESSION_COOKIE_NAME = "mcq_session_token";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  const sessions = await getSessionsCol();
  await sessions.insertOne({
    userId,
    token,
    expiresAt,
    createdAt: new Date(),
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return token;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    try {
      const sessions = await getSessionsCol();
      await sessions.deleteMany({ token });
    } catch {
      // Ignore
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) return null;

    const sessions = await getSessionsCol();
    const session = await sessions.findOne({ token });

    if (!session || session.expiresAt < new Date()) {
      if (session && session._id) {
        await sessions.deleteOne({ _id: session._id }).catch(() => {});
      }
      return null;
    }

    const users = await getUsersCol();
    const user = await users.findOne({ _id: toObjectId(session.userId) });

    if (!user) return null;

    return {
      id: user._id ? user._id.toString() : user.id || "",
      email: user.email,
      name: user.name,
      image: user.image || null,
    };
  } catch (error: any) {
    if (error?.digest === "DYNAMIC_SERVER_USAGE" || error?.message?.includes("Dynamic server usage")) {
      throw error;
    }
    console.error("Error retrieving session user:", error);
    return null;
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}
