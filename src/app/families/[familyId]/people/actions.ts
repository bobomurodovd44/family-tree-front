"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { z } from "zod"

import { feathersFetch } from "@/lib/api"
import { getToken } from "@/lib/session"
import type { Person } from "@/lib/people"

export type PersonFormState =
  | {
      ok?: boolean
      error?: string
      fieldErrors?: Record<string, string>
    }
  | undefined

// Empty form fields arrive as "" — treat those as "not provided".
const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().max(max).optional()
  )

const PartialDate = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z
    .string()
    .regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, "invalidDate")
    .optional()
)

const PersonSchema = z.object({
  firstName: z.string().trim().min(1, "firstNameRequired").max(120),
  middleName: optionalText(120),
  lastName: optionalText(120),
  nickname: optionalText(120),
  gender: z.enum(["male", "female"]),
  birthDate: PartialDate,
  deathDate: PartialDate,
  maritalStatus: z.enum(["single", "married", "divorced", "widowed"]).optional(),
  birthPlace: optionalText(200),
  deathPlace: optionalText(200),
  profession: optionalText(200),
  clan: optionalText(120),
  tribe: optionalText(120),
  nationality: optionalText(120),
  bio: optionalText(20000),
  privacy: z.enum(["public", "family", "private"]).default("family"),
})

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
])

/** Upload an image File to the backend uploads service; returns the stored S3 key. */
async function uploadPhoto(file: File, token: string): Promise<string | null> {
  if (!IMAGE_TYPES.has(file.type)) return null
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64")
  const { ok, data } = await feathersFetch<{ key: string }>("/uploads", {
    method: "POST",
    token,
    body: JSON.stringify({
      file: base64,
      contentType: file.type,
      filename: file.name,
    }),
  })
  return ok ? (data?.key ?? null) : null
}

/**
 * Create (personId = null) or update a person. Handles the optional photo: a newly-picked
 * file is uploaded to S3 first and its key attached; an explicit "remove" clears it.
 * `familyId` and `personId` are bound in the form component.
 */
export async function savePerson(
  familyId: string,
  personId: string | null,
  _prev: PersonFormState,
  formData: FormData
): Promise<PersonFormState> {
  const t = await getTranslations("People")

  const token = await getToken()
  if (!token) return { error: t("errors.generic") }

  const parsed = PersonSchema.safeParse({
    firstName: formData.get("firstName"),
    middleName: formData.get("middleName"),
    lastName: formData.get("lastName"),
    nickname: formData.get("nickname"),
    gender: formData.get("gender"),
    maritalStatus: formData.get("maritalStatus") || undefined,
    birthDate: formData.get("birthDate"),
    deathDate: formData.get("deathDate"),
    birthPlace: formData.get("birthPlace"),
    deathPlace: formData.get("deathPlace"),
    profession: formData.get("profession"),
    clan: formData.get("clan"),
    tribe: formData.get("tribe"),
    nationality: formData.get("nationality"),
    bio: formData.get("bio"),
    privacy: formData.get("privacy") ?? "family",
  })

  if (!parsed.success) {
    // issue.message carries our i18n key (e.g. "firstNameRequired", "invalidDate"); the key is
    // dynamic so we bypass next-intl's compile-time key checking here.
    const tError = t as unknown as (key: string) => string
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0])
      if (!fieldErrors[key]) {
        fieldErrors[key] = tError(`errors.${issue.message}`)
      }
    }
    return { error: t("errors.checkFields"), fieldErrors }
  }

  // Build the payload, dropping undefined fields so we never store empty strings.
  const payload: Record<string, unknown> = { ...parsed.data }
  for (const key of Object.keys(payload)) {
    if (payload[key] === undefined) delete payload[key]
  }
  if (!personId) payload.familyId = familyId

  // Photo: upload a new file, or clear on explicit removal.
  const photo = formData.get("photo")
  if (photo instanceof File && photo.size > 0) {
    const key = await uploadPhoto(photo, token)
    if (!key) return { error: t("errors.photoFailed") }
    payload.mainPhotoKey = key
  } else if (formData.get("removePhoto") === "true") {
    payload.mainPhotoKey = ""
  }

  const res = personId
    ? await feathersFetch<Person>(`/people/${personId}`, {
        method: "PATCH",
        token,
        body: JSON.stringify(payload),
      })
    : await feathersFetch<Person>("/people", {
        method: "POST",
        token,
        body: JSON.stringify(payload),
      })

  if (!res.ok) {
    return { error: t("errors.generic") }
  }

  const savedId = personId ?? res.data?._id
  revalidatePath(`/families/${familyId}`)
  if (savedId) revalidatePath(`/families/${familyId}/people/${savedId}`)

  redirect(
    savedId
      ? `/families/${familyId}/people/${savedId}`
      : `/families/${familyId}`
  )
}

export async function deletePerson(familyId: string, personId: string): Promise<void> {
  const token = await getToken()
  if (!token) return

  await feathersFetch(`/people/${personId}`, { method: "DELETE", token })
  revalidatePath(`/families/${familyId}`)
  redirect(`/families/${familyId}`)
}
