"use client"

import { useActionState, useRef, useState, useEffect } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Loader2Icon, UploadIcon, UserRoundIcon, XIcon, ImagePlusIcon } from "lucide-react"

import { savePerson, type PersonFormState } from "@/app/families/[familyId]/people/actions"
import { type Person } from "@/lib/people-types"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ImageCropper } from "./image-cropper"

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
  
  // Cropper state
  const [cropperSrc, setCropperSrc] = useState<string | null>(null)
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null)

  function onPickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) {
      setCropperSrc(URL.createObjectURL(file))
      event.target.value = ""
    }
  }

  function onCropComplete(blob: Blob) {
    setCroppedBlob(blob)
    setPreview(URL.createObjectURL(blob))
    setRemoved(false)
    setCropperSrc(null)
  }

  function onRemovePhoto() {
    if (fileRef.current) fileRef.current.value = ""
    setCroppedBlob(null)
    setPreview(undefined)
    setRemoved(true)
  }
  
  useEffect(() => {
    return () => {
      if (cropperSrc) URL.revokeObjectURL(cropperSrc)
    }
  }, [cropperSrc])

  function handleSubmit(formData: FormData) {
    if (croppedBlob) {
      formData.set("photo", new File([croppedBlob], "photo.jpg", { type: "image/jpeg" }))
    }
    formAction(formData)
  }

  const err = state?.fieldErrors ?? {}

  return (
    <>
      <form action={handleSubmit} className="flex flex-col gap-8">
        {state?.error && (
          <p
            role="alert"
            className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {state.error}
          </p>
        )}

        {/* Photo Upload Area */}
        <div className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed rounded-xl bg-muted/30">
          <span className="relative flex h-36 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary/10 text-primary shadow-sm border border-primary/20">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <UserRoundIcon className="size-14 opacity-40" />
            )}
          </span>
          <div className="flex flex-col items-center gap-2 text-center">
            <h4 className="font-medium text-sm">{t("profilePhoto", { fallback: "Profile Photo" })}</h4>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={preview ? "outline" : "default"}
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlusIcon className="mr-2 size-4" />
                {preview ? t("photoChange") : t("uploadPhoto", { fallback: "Upload Photo" })}
              </Button>
              {preview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onRemovePhoto}
                  className="text-muted-foreground"
                >
                  <XIcon className="mr-2 size-4" />
                  {t("photoRemove")}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{t("photoHint")}</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            onChange={onPickFile}
            className="hidden"
          />
          <input type="hidden" name="removePhoto" value={removed ? "true" : "false"} />
        </div>

        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t("basicInfo", { fallback: "Basic Information" })}</h3>
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
                <FieldLabel htmlFor="middleName">{t("middleName", { fallback: "Middle Name" })}</FieldLabel>
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
                <FieldLabel htmlFor="maritalStatus">{t("maritalStatus", { fallback: "Marital Status" })}</FieldLabel>
                <input type="hidden" name="maritalStatus" id="maritalStatus" defaultValue={person?.maritalStatus ?? "single"} />
                <Select defaultValue={person?.maritalStatus ?? "single"} onValueChange={(val) => {
                  const el = document.getElementById("maritalStatus") as HTMLInputElement;
                  if (el) el.value = val;
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("maritalStatus", { fallback: "Select Status" })} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">{t("statusSingle", { fallback: "Single" })}</SelectItem>
                    <SelectItem value="married">{t("statusMarried", { fallback: "Married" })}</SelectItem>
                    <SelectItem value="divorced">{t("statusDivorced", { fallback: "Divorced" })}</SelectItem>
                    <SelectItem value="widowed">{t("statusWidowed", { fallback: "Widowed" })}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </FieldGroup>
        </div>

        {/* Life Events */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t("lifeEvents", { fallback: "Life Events" })}</h3>
          <FieldGroup>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-5 p-4 bg-muted/20 rounded-lg border">
                <h4 className="font-medium text-sm text-muted-foreground">{t("birth", { fallback: "Birth" })}</h4>
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
                <h4 className="font-medium text-sm text-muted-foreground">{t("death", { fallback: "Death" })}</h4>
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
          <h3 className="text-lg font-medium">{t("background", { fallback: "Background & Bio" })}</h3>
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

      {/* Cropper Dialog */}
      <Dialog open={!!cropperSrc} onOpenChange={(open) => !open && setCropperSrc(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t("cropPhoto", { fallback: "Crop Photo" })}</DialogTitle>
            <DialogDescription>
              {t("cropHint", { fallback: "Adjust the image to fit the 3:4 portrait ratio." })}
            </DialogDescription>
          </DialogHeader>
          {cropperSrc && (
            <ImageCropper 
              imageSrc={cropperSrc} 
              onCropComplete={onCropComplete} 
              onCancel={() => setCropperSrc(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
