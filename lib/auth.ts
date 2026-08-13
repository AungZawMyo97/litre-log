import { validatePassword as validatePasswordRules } from "@/lib/i18n/auth-messages";
import { my } from "@/lib/i18n/my";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";

const SESSION_COOKIE = "litre_log_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is required.");
  }
  return new TextEncoder().encode(secret);
}

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function validatePassword(password: string): string | null {
  return validatePasswordRules(password);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  let payload: Awaited<ReturnType<typeof jwtVerify>>["payload"];
  try {
    ({ payload } = await jwtVerify(token, getSecret()));
  } catch {
    await destroySession();
    return null;
  }

  if (!payload.sub || typeof payload.sub !== "string") {
    await destroySession();
    return null;
  }

  try {
    const [user] = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    if (!user) {
      await destroySession();
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function registerUser(input: {
  email: string;
  password: string;
  name?: string;
}) {
  const passwordError = validatePassword(input.password);
  if (passwordError) {
    throw new Error(passwordError);
  }

  const email = input.email.toLowerCase().trim();
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    throw new Error(my.errors.emailExists);
  }

  const passwordHash = await hashPassword(input.password);
  const [user] = await db
    .insert(users)
    .values({
      email,
      name: input.name?.trim() || null,
      passwordHash,
    })
    .returning({ id: users.id, email: users.email, name: users.name });

  return user;
}

export async function loginUser(email: string, password: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);

  if (!user) {
    throw new Error(my.errors.invalidCredentials);
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new Error(my.errors.invalidCredentials);
  }

  return { id: user.id, email: user.email, name: user.name };
}
