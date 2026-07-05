"use client"

import { useActionState, useRef, useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Loader2Icon, UploadIcon, UserRoundIcon, XIcon } from "lucide-react"

import { savePerson, type PersonFormState } from "@/app/families/[familyId]/people/actions"
import { type Person } from "@/lib/people-types"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

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
  const [preview, setPreview] = useState<string | undefined>(person?.mainPhotoUrl)
  const [removed, setRemoved] = useState(false)

  function onPickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) {
      setPreview(URL.createObjectURL(file))
      setRemoved(false)
    }
  }

  function onRemovePhoto() {
    if (fileRef.current) fileRef.current.value = ""
    setPreview(undefined)
    setRemoved(true)
  }

  const err = state?.fieldErrors ?? {}

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      {/* Photo */}
      <div className="flex items-center gap-4">
        <span className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- blob/presigned preview
            <img src={preview} alt="" className="size-full object-cover" />
          ) : (
            <UserRoundIcon className="size-8" />
          )}
        </span>
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <UploadIcon />
              {t("photoChange")}
            </Button>
            {preview && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRemovePhoto}
                className="text-muted-foreground"
              >
                <XIcon />
                {t("photoRemove")}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{t("photoHint")}</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          name="photo"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          onChange={onPickFile}
          className="hidden"
        />
        <input type="hidden" name="removePhoto" value={removed ? "true" : "false"} />
      </div>

      <FieldGroup>
        <div className="grid gap-5 sm:grid-cols-2">
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
            <FieldLabel htmlFor="lastName">{t("lastName")}</FieldLabel>
            <Input id="lastName" name="lastName" defaultValue={person?.lastName} autoComplete="off" />
          </Field>

          <Field>
            <FieldLabel htmlFor="nickname">{t("nickname")}</FieldLabel>
            <Input id="nickname" name="nickname" defaultValue={person?.nickname} autoComplete="off" />
          </Field>

          <Field>
            <FieldLabel htmlFor="gender">{t("gender")} *</FieldLabel>
            <Select id="gender" name="gender" defaultValue={person?.gender ?? "male"}>
              <option value="male">{t("genderMale")}</option>
              <option value="female">{t("genderFemale")}</option>
            </Select>
          </Field>

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

          <Field>
            <FieldLabel htmlFor="privacy">{t("privacy")}</FieldLabel>
            <Select id="privacy" name="privacy" defaultValue={person?.privacy ?? "family"}>
              <option value="public">{t("privacyPublic")}</option>
              <option value="family">{t("privacyFamily")}</option>
              <option value="private">{t("privacyPrivate")}</option>
            </Select>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="bio">{t("bio")}</FieldLabel>
          <Textarea id="bio" name="bio" defaultValue={person?.bio} rows={5} />
        </Field>
      </FieldGroup>

      <div className="flex items-center justify-end gap-2">
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
          {pending && <Loader2Icon className="animate-spin" />}
          {person ? t("saveChanges") : t("createPerson")}
        </Button>
      </div>
    </form>
  )
}
