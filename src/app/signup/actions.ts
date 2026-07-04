"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import { feathersFetch, type FeathersErrorBody } from "@/lib/api"
import { createSession } from "@/lib/session"

type FieldName = "name" | "email" | "password" | "confirmPassword"

export type SignupState =
  | {
      error?: string
      fieldErrors?: Partial<Record<FieldName, string>>
    }
  | undefined

const SignupSchema = z
  .object({
    name: z.string().min(2, "Please enter your full name."),
    email: z.email("Please enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters long."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  })

function str(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : ""
}

function raw(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : ""
}

export async function signup(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const parsed = SignupSchema.safeParse({
    name: str(formData.get("name")),
    email: str(formData.get("email")).toLowerCase(),
    password: raw(formData.get("password")),
    confirmPassword: raw(formData.get("confirmPassword")),
  })

  if (!parsed.success) {
    const fieldErrors: Partial<Record<FieldName, string>> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as FieldName | undefined
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return { fieldErrors }
  }

  const { name, email, password } = parsed.data

  // 1. Create the user (the users service leaves `create` unauthenticated).
  const created = await feathersFetch<FeathersErrorBody>("/users", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  })

  if (!created.ok) {
    if (
      created.status === 409 ||
      /duplicate|e11000|exists|unique/i.test(created.data?.message ?? "")
    ) {
      return { fieldErrors: { email: "This email is already registered." } }
    }
    return { error: "Something went wrong. Please try again." }
  }

  // 2. Log in to obtain a token.
  const auth = await feathersFetch<{ accessToken?: string }>("/authentication", {
    method: "POST",
    body: JSON.stringify({ strategy: "local", email, password }),
  })

  if (!auth.ok || !auth.data?.accessToken) {
    return { error: "Account created, but sign-in failed. Please log in." }
  }

  await createSession(auth.data.accessToken)
  redirect("/")
}
