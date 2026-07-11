"use client"

import { useActionState, useRef, useState, useEffect } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Loader2Icon, UserRoundIcon, XIcon, ImagePlusIcon, StarIcon } from "lucide-react"

import { savePerson, type PersonFormState } from "@/app/families/[familyId]/people/actions"
import { type Person } from "@/lib/people-types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

// One entry in the photo gallery: either an already-stored S3 key (loaded from the person) or a
// freshly picked local File that still needs uploading. `url` is a directly-renderable image src
// (presigned URL for existing, object URL for new).
type GalleryItem =
  | { id: string; kind: "existing"; key: string; url: string }
  | { id: string; kind: "new"; file: File; url: string }

// The stored keys + presigned urls for a person, falling back to the legacy single main photo
// for records saved before the gallery existed.
function initialPhotos(person?: Person): { keys: string[]; urls: string[] } {
  if (person?.photos?.length) return { keys: person.photos, urls: person.photoUrls ?? [] }
  if (person?.mainPhotoKey) return { keys: [person.mainPhotoKey], urls: person.mainPhotoUrl ? [person.mainPhotoUrl] : [] }
  return { keys: [], urls: [] }
}

/** Shared create/edit form. Omit `person` to create; pass it to edit. */
export function PersonForm({
  familyId,
  person,
}: {
  familyId: string
  person?: Person
}) {
  const t = useTranslations("People")
  const action = savePerson.bind(null, familyId, person?._id ?? null)
  const [state, formAction, pending] = useActionState<PersonFormState, FormData>(
    action,
    undefined
  )

  const fileRef = useRef<HTMLInputElement>(null)

  // Gallery state, seeded once from the person's stored photos.
  const [items, setItems] = useState<GalleryItem[]>(() => {
    const { keys, urls } = initialPhotos(person)
    return keys.map((key, i) => ({ id: `e${i}`, kind: "existing" as const, key, url: urls[i] ?? "" }))
  })
  const [mainId, setMainId] = useState<string | undefined>(() => {
    const { keys } = initialPhotos(person)
    if (!keys.length) return undefined
    const idx = person?.mainPhotoKey ? keys.indexOf(person.mainPhotoKey) : 0
    return `e${idx >= 0 ? idx : 0}`
  })
  const nextId = useRef(0)

  // Keep a ref of items so the unmount cleanup can revoke object URLs of picked-but-unsaved
  // files without re-running on every change. (Ref synced in an effect, not during render.)
  const itemsRef = useRef(items)
  useEffect(() => {
    itemsRef.current = items
  }, [items])
  useEffect(() => {
    return () => {
      for (const it of itemsRef.current) if (it.kind === "new") URL.revokeObjectURL(it.url)
    }
  }, [])

  function onPickFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (!files?.length) return
    const added: GalleryItem[] = Array.from(files).map((file) => ({
      id: `n${nextId.current++}`,
      kind: "new" as const,
      file,
      url: URL.createObjectURL(file),
    }))
    setItems((prev) => [...prev, ...added])
    setMainId((prev) => prev ?? added[0]?.id) // first-ever photo becomes the avatar
    event.target.value = ""
  }

  function onRemove(id: string) {
    const target = items.find((it) => it.id === id)
    if (target?.kind === "new") URL.revokeObjectURL(target.url)
    const next = items.filter((it) => it.id !== id)
    setItems(next)
    if (mainId === id) setMainId(next[0]?.id) // main removed → promote whatever is first
  }

  // Serialize the gallery for the server action: the ordered list of entries (existing key or a
  // pointer into the appended new-file list) plus which position is the main/avatar.
  function handleSubmit(formData: FormData) {
    const order: Array<{ key: string } | { newIndex: number }> = []
    let newIndex = 0
    for (const it of items) {
      if (it.kind === "existing") {
        order.push({ key: it.key })
      } else {
        formData.append("newPhotos", it.file)
        order.push({ newIndex: newIndex++ })
      }
    }
    formData.set("gallery", JSON.stringify(order))
    formData.set("mainIndex", String(items.findIndex((it) => it.id === mainId)))
    formAction(formData)
  }

  const err = state?.fieldErrors ?? {}

  return (
    <form action={handleSubmit} className="flex flex-col gap-8">
      {state?.error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      {/* Photos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">{t("photos")}</h3>
          {items.length > 0 && (
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <ImagePlusIcon className="mr-2 size-4" />
              {t("addPhotos")}
            </Button>
          )}
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {items.map((it) => {
              const isMain = it.id === mainId
              return (
                <div
                  key={it.id}
                  className={cn(
                    "group relative aspect-[3/4] overflow-hidden rounded-lg border bg-muted",
                    isMain && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                >
                  {it.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <UserRoundIcon className="size-8 opacity-30" />
                    </div>
                  )}

                  {isMain && (
                    <span className="absolute top-1.5 left-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground shadow">
                      {t("mainPhoto")}
                    </span>
                  )}

                  <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-linear-to-t from-black/60 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    {!isMain && (
                      <button
                        type="button"
                        onClick={() => setMainId(it.id)}
                        title={t("setAsMain")}
                        aria-label={t("setAsMain")}
                        className="rounded-md bg-white/90 p-1 text-foreground hover:bg-white"
                      >
                        <StarIcon className="size-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemove(it.id)}
                      title={t("photoRemove")}
                      aria-label={t("photoRemove")}
                      className="ml-auto rounded-md bg-white/90 p-1 text-destructive hover:bg-white"
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-muted/30 p-8 text-muted-foreground hover:bg-muted/50"
          >
            <ImagePlusIcon className="size-8 opacity-40" />
            <span className="text-sm">{t("addPhotos")}</span>
          </button>
        )}

        <p className="text-xs text-muted-foreground">{t("photosHint")}</p>

        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          onChange={onPickFiles}
          className="hidden"
        />
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t("basicInfo")}</h3>
        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field data-invalid={Boolean(err.firstName)}>
              <FieldLabel htmlFor="firstName">{t("firstName")} *</FieldLabel>
              <Input
                id="firstName"
                name="firstName"
                defaultValue={person?.firstName}
                autoComplete="off"
                required
                aria-invalid={Boolean(err.firstName)}
              />
              {err.firstName && <FieldError>{err.firstName}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="middleName">{t("middleName")}</FieldLabel>
              <Input id="middleName" name="middleName" defaultValue={person?.middleName} autoComplete="off" />
            </Field>

            <Field>
              <FieldLabel htmlFor="lastName">{t("lastName")}</FieldLabel>
              <Input id="lastName" name="lastName" defaultValue={person?.lastName} autoComplete="off" />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="nickname">{t("nickname")}</FieldLabel>
              <Input id="nickname" name="nickname" defaultValue={person?.nickname} autoComplete="off" />
            </Field>

            <Field>
              <FieldLabel htmlFor="gender">{t("gender")} *</FieldLabel>
              <input type="hidden" name="gender" id="gender" defaultValue={person?.gender ?? "male"} />
              <Select defaultValue={person?.gender ?? "male"} onValueChange={(val) => {
                const el = document.getElementById("gender") as HTMLInputElement;
                if (el) el.value = val;
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={t("gender")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t("genderMale")}</SelectItem>
                  <SelectItem value="female">{t("genderFemale")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="maritalStatus">{t("maritalStatus")}</FieldLabel>
              <input type="hidden" name="maritalStatus" id="maritalStatus" defaultValue={person?.maritalStatus ?? "single"} />
              <Select defaultValue={person?.maritalStatus ?? "single"} onValueChange={(val) => {
                const el = document.getElementById("maritalStatus") as HTMLInputElement;
                if (el) el.value = val;
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={t("maritalStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">{t("statusSingle")}</SelectItem>
                  <SelectItem value="married">{t("statusMarried")}</SelectItem>
                  <SelectItem value="divorced">{t("statusDivorced")}</SelectItem>
                  <SelectItem value="widowed">{t("statusWidowed")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </FieldGroup>
      </div>

      {/* Life Events */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t("lifeEvents")}</h3>
        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-5 p-4 bg-muted/20 rounded-lg border">
              <h4 className="font-medium text-sm text-muted-foreground">{t("birth")}</h4>
              <Field data-invalid={Boolean(err.birthDate)}>
                <FieldLabel htmlFor="birthDate">{t("birthDate")}</FieldLabel>
                <Input
                  id="birthDate"
                  name="birthDate"
                  defaultValue={person?.birthDate}
                  placeholder={t("datePlaceholder")}
                  autoComplete="off"
                  aria-invalid={Boolean(err.birthDate)}
                />
                {err.birthDate && <FieldError>{err.birthDate}</FieldError>}
              </Field>

              <Field>
                <FieldLabel htmlFor="birthPlace">{t("birthPlace")}</FieldLabel>
                <Input id="birthPlace" name="birthPlace" defaultValue={person?.birthPlace} autoComplete="off" />
              </Field>
            </div>

            <div className="space-y-5 p-4 bg-muted/20 rounded-lg border">
              <h4 className="font-medium text-sm text-muted-foreground">{t("death")}</h4>
              <Field data-invalid={Boolean(err.deathDate)}>
                <FieldLabel htmlFor="deathDate">{t("deathDate")}</FieldLabel>
                <Input
                  id="deathDate"
                  name="deathDate"
                  defaultValue={person?.deathDate}
                  placeholder={t("datePlaceholder")}
                  autoComplete="off"
                  aria-invalid={Boolean(err.deathDate)}
                />
                {err.deathDate && <FieldError>{err.deathDate}</FieldError>}
              </Field>

              <Field>
                <FieldLabel htmlFor="deathPlace">{t("deathPlace")}</FieldLabel>
                <Input id="deathPlace" name="deathPlace" defaultValue={person?.deathPlace} autoComplete="off" />
              </Field>
            </div>
          </div>
        </FieldGroup>
      </div>

      {/* Background & Additional Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t("background")}</h3>
        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Field>
              <FieldLabel htmlFor="profession">{t("profession")}</FieldLabel>
              <Input id="profession" name="profession" defaultValue={person?.profession} autoComplete="off" />
            </Field>

            <Field>
              <FieldLabel htmlFor="nationality">{t("nationality")}</FieldLabel>
              <Input id="nationality" name="nationality" defaultValue={person?.nationality} autoComplete="off" />
            </Field>

            <Field>
              <FieldLabel htmlFor="clan">{t("clan")}</FieldLabel>
              <Input id="clan" name="clan" defaultValue={person?.clan} autoComplete="off" />
            </Field>

            <Field>
              <FieldLabel htmlFor="tribe">{t("tribe")}</FieldLabel>
              <Input id="tribe" name="tribe" defaultValue={person?.tribe} autoComplete="off" />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 mt-2">
            <Field>
              <FieldLabel htmlFor="privacy">{t("privacy")}</FieldLabel>
              <input type="hidden" name="privacy" id="privacy" defaultValue={person?.privacy ?? "family"} />
              <Select defaultValue={person?.privacy ?? "family"} onValueChange={(val) => {
                const el = document.getElementById("privacy") as HTMLInputElement;
                if (el) el.value = val;
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={t("privacy")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">{t("privacyPublic")}</SelectItem>
                  <SelectItem value="family">{t("privacyFamily")}</SelectItem>
                  <SelectItem value="private">{t("privacyPrivate")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="bio">{t("bio")}</FieldLabel>
            <Textarea id="bio" name="bio" defaultValue={person?.bio} rows={5} />
          </Field>
        </FieldGroup>
      </div>

      <div className="flex items-center justify-end gap-2 pt-4 border-t">
        <Button asChild type="button" variant="outline">
          <Link
            href={
              person
                ? `/families/${familyId}/people/${person._id}`
                : `/families/${familyId}`
            }
          >
            {t("cancel")}
          </Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
          {person ? t("saveChanges") : t("createPerson")}
        </Button>
      </div>
    </form>
  )
}
