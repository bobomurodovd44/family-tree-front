"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { z } from "zod"

import { feathersFetch } from "@/lib/api"
import { getToken } from "@/lib/session"

export type FamilyFormState =
  | {
      ok?: boolean
      error?: string
      fieldError?: string
    }
  | undefined

const NameSchema = z.string().trim().min(2).max(120)

export async function createFamily(
  _prev: FamilyFormState,
  formData: FormData
): Promise<FamilyFormState> {
  const t = await getTranslations("Families")

  const token = await getToken()
  if (!token) return { error: t("errors.generic") }

  const parsed = NameSchema.safeParse(formData.get("name"))
  if (!parsed.success) {
    return { fieldError: t("errors.nameMin") }
  }

  const res = await feathersFetch("/families", {
    method: "POST",
    token,
    body: JSON.stringify({ name: parsed.data }),
  })

  if (!res.ok) {
    return { error: t("errors.generic") }
  }

  revalidatePath("/", "layout")
  return { ok: true }
}

export async function updateFamily(
  id: string,
  formData: FormData
): Promise<FamilyFormState> {
  const t = await getTranslations("Families")

  const token = await getToken()
  if (!token) return { error: t("errors.generic") }

  const parsed = NameSchema.safeParse(formData.get("name"))
  if (!parsed.success) {
    return { fieldError: t("errors.nameMin") }
  }

  const res = await feathersFetch(`/families/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ name: parsed.data }),
  })

  if (!res.ok) {
    return { error: t("errors.generic") }
  }

  revalidatePath("/", "layout")
  return { ok: true }
}

export async function deleteFamily(id: string): Promise<void> {
  const token = await getToken()
  if (!token) return

  await feathersFetch(`/families/${id}`, { method: "DELETE", token })
  revalidatePath("/", "layout")
}
