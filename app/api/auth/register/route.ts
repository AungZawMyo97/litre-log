import { NextResponse } from "next/server";
import { z } from "zod";
import { registerUser, createSession } from "@/lib/auth";
import { my } from "@/lib/i18n/my";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = registerSchema.parse(await request.json());
    const user = await registerUser(body);
    await createSession(user);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : my.errors.registrationFailed;
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
