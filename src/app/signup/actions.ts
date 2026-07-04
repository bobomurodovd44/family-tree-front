"use server"

import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
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
    name: z.string().min(2),
    email: z.email(),
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "passwordsNoMatch",
  })

function str(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : ""
}

function raw(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : ""
}

export async function signup(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const t = await getTranslations("Auth.errors")

  const parsed = SignupSchema.safeParse({
    name: str(formData.get("name")),
    email: str(formData.get("email")).toLowerCase(),
    password: raw(formData.get("password")),
    confirmPassword: raw(formData.get("confirmPassword")),
  })

  if (!parsed.success) {
    // Map each failing field to a localized message.
    const messageByField: Record<FieldName, string> = {
      name: t("nameMin"),
      email: t("emailInvalid"),
      password: t("passwordMin"),
      confirmPassword: t("passwordsNoMatch"),
    }
    const fieldErrors: Partial<Record<FieldName, string>> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as FieldName | undefined
      if (key && !fieldErrors[key]) fieldErrors[key] = messageByField[key]
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
      return { fieldErrors: { email: t("emailTaken") } }
    }
    return { error: t("generic") }
  }

  // 2. Log in to obtain a token.
  const auth = await feathersFetch<{ accessToken?: string }>("/authentication", {
    method: "POST",
    body: JSON.stringify({ strategy: "local", email, password }),
  })

  if (!auth.ok || !auth.data?.accessToken) {
    return { error: t("createdButLoginFailed") }
  }

  await createSession(auth.data.accessToken)
  redirect("/")
}
