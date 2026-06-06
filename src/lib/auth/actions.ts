"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "./index";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type AuthActionResult =
  | { success: true }
  | { success: false; error: string };

export async function loginAction(
  _prev: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const headersList = await headers();
    await auth.api.signInEmail({
      body: parsed.data,
      headers: headersList,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid credentials";
    return { success: false, error: message };
  }

  redirect("/dashboard");
}

export async function registerAction(
  _prev: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const headersList = await headers();
    await auth.api.signUpEmail({
      body: parsed.data,
      headers: headersList,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Registration failed";
    return { success: false, error: message };
  }

  redirect("/dashboard");
}
