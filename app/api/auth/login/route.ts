import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, loginUser } from "@/lib/auth";
import { my } from "@/lib/i18n/my";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());
    const user = await loginUser(body.email, body.password);
    await createSession(user);
    return NextResponse.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : my.errors.loginFailed;
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
