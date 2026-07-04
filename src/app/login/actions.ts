"use server"

import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { z } from "zod"

import { feathersFetch } from "@/lib/api"
import { createSession } from "@/lib/session"

export type LoginState =
  | {
      error?: string
      fieldErrors?: { email?: string; password?: string }
    }
  | undefined

const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

function str(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : ""
}

function raw(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : ""
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const t = await getTranslations("Auth.errors")

  const parsed = LoginSchema.safeParse({
    email: str(formData.get("email")).toLowerCase(),
    password: raw(formData.get("password")),
  })

  if (!parsed.success) {
    return { error: t("invalidCredentials") }
  }

  const auth = await feathersFetch<{ accessToken?: string }>("/authentication", {
    method: "POST",
    body: JSON.stringify({
      strategy: "local",
      email: parsed.data.email,
      password: parsed.data.password,
    }),
  })

  if (!auth.ok || !auth.data?.accessToken) {
    return { error: t("invalidCredentials") }
  }

  await createSession(auth.data.accessToken)
  redirect("/")
}
