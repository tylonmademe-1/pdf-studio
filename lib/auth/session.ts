import { cookies } from "next/headers";
import * as crypto from "node:crypto";
import { createSession, findSession, deleteSession, findUserById, DbUser } from "../db";

export const SESSION_COOKIE_NAME = "pdf_studio_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function createAuthSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;

  await createSession(userId, token, expiresAt);

  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: Boolean(process.env.NEXT_PUBLIC_APP_URL?.startsWith("https")),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return token;
}

export async function getCurrentUser(): Promise<Omit<DbUser, "password_hash"> | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const session = await findSession(token);
    if (!session) return null;

    if (Date.now() > session.expiresAt) {
      await deleteSession(token);
      return null;
    }

    const user = await findUserById(session.userId);
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at,
    };
  } catch {
    return null;
  }
}

export async function clearAuthSession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      await deleteSession(token);
      cookieStore.delete(SESSION_COOKIE_NAME);
    }
  } catch {
    // Ignore errors on clearing
  }
}
