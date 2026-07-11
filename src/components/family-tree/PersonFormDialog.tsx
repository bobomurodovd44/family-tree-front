"use client"

// Add / edit a person. The canvas creates a placeholder first (so the new card + its lines
// appear immediately), then opens this dialog to fill in the details.

import { useCallback, useState, useRef, useEffect } from "react"
import { useTranslations } from "next-intl"
import { motion, AnimatePresence } from "motion/react"
import { MinusIcon, PlusIcon, UserIcon, ImagePlusIcon, XIcon, Loader2Icon } from "lucide-react"

import { type Gender, type SpouseStatus, type TreePerson } from "@/lib/tree-types"
import type { PersonPatch } from "@/hooks/use-family-tree"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ImageCropper } from "@/components/people/image-cropper"

/* ── Gender toggle (pill with icons) ─────────────────────────────────────── */

function GenderToggle({
  value,
  onChange,
}: {
  value: Gender
  onChange: (g: Gender) => void
}) {
  const t = useTranslations("Tree")
  return (
    <div className="relative flex h-10 w-full items-center rounded-xl border border-input bg-muted/50 p-1">
      <div
        className={cn(
          "pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-lg shadow-sm transition-transform duration-200 ease-out",
          value === "female" && "translate-x-[calc(100%+4px)]"
        )}
      >
        <div
          className={cn(
            "h-full w-full rounded-lg transition-colors duration-200",
            value === "male"
              ? "bg-sky-500/15 dark:bg-sky-400/20"
              : "bg-rose-500/15 dark:bg-rose-400/20"
          )}
        />
      </div>
      <button
        type="button"
        onClick={() => onChange("male")}
        className={cn(
          "relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1 text-sm font-medium transition-colors",
          value === "male"
            ? "text-sky-600 dark:text-sky-400"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <MaleIcon className="size-4" />
        {t("male")}
      </button>
      <button
        type="button"
        onClick={() => onChange("female")}
        className={cn(
          "relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1 text-sm font-medium transition-colors",
          value === "female"
            ? "text-rose-600 dark:text-rose-400"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <FemaleIcon className="size-4" />
        {t("female")}
      </button>
    </div>
  )
}

function MaleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="10" cy="14" r="5" />
      <path d="M19 5l-5.4 5.4M15 5h4v4" />
    </svg>
  )
}

function FemaleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="9" r="5" />
      <path d="M12 14v7M9 18h6" />
    </svg>
  )
}

/* ── Year spinner (input with ± buttons) ─────────────────────────────────── */

function YearSpinner({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
}) {
  const bump = useCallback(
    (delta: number) => {
      const n = Number.parseInt(value, 10)
      if (Number.isFinite(n)) {
        onChange(String(n + delta))
      } else {
        onChange(String(new Date().getFullYear() + delta))
      }
    },
    [value, onChange]
  )

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div
        className={cn(
          "flex items-center rounded-lg border border-input transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
          disabled && "pointer-events-none opacity-40"
        )}
      >
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => bump(-1)}
          className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        >
          <MinusIcon className="size-3.5" />
        </button>
        <input
          id={id}
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "—"}
          disabled={disabled}
          className="h-8 w-full min-w-0 bg-transparent text-center text-sm tabular-nums outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => bump(1)}
          className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        >
          <PlusIcon className="size-3.5" />
        </button>
      </div>
    </Field>
  )
}

/* ── Living / Deceased toggle ───────────────────────────────────────────── */

function LivingToggle({
  isLiving,
  onChange,
}: {
  isLiving: boolean
  onChange: (living: boolean) => void
}) {
  const t = useTranslations("Tree")
  return (
    <div className="relative flex h-10 w-full items-center rounded-xl border border-input bg-muted/50 p-1">
      <div
        className={cn(
          "pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-lg shadow-sm transition-transform duration-200 ease-out",
          !isLiving && "translate-x-[calc(100%+4px)]"
        )}
      >
        <div
          className={cn(
            "h-full w-full rounded-lg transition-colors duration-200",
            isLiving
              ? "bg-emerald-500/15 dark:bg-emerald-400/20"
              : "bg-zinc-500/15 dark:bg-zinc-400/20"
          )}
        />
      </div>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          "relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1 text-sm font-medium transition-colors",
          isLiving
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <span className="size-2 rounded-full bg-emerald-500" />
        {t("living")}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1 text-sm font-medium transition-colors",
          !isLiving
            ? "text-zinc-600 dark:text-zinc-400"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <span className="size-2 rounded-full bg-zinc-400 dark:bg-zinc-500" />
        {t("deceased")}
      </button>
    </div>
  )
}

/* ── The form ────────────────────────────────────────────────────────────── */

export interface PersonFormDialogProps {
  open: boolean
  person: TreePerson | null
  onOpenChange: (open: boolean) => void
  onSubmit: (patch: PersonPatch) => void
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result as string
      resolve(dataUrl.split(",")[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function PersonForm({
  person,
  onSubmit,
}: {
  person: TreePerson
  onSubmit: (patch: PersonPatch) => void
}) {
  const tTree = useTranslations("Tree")
  const tPeople = useTranslations("People")
  
  const [firstName, setFirstName] = useState(person.firstName ?? "")
  const [middleName, setMiddleName] = useState(person.middleName ?? "")
  const [lastName, setLastName] = useState(person.lastName ?? "")
  const [gender, setGender] = useState<Gender>(person.gender)
  const [maritalStatus, setMaritalStatus] = useState<SpouseStatus | "single">(person.maritalStatus ?? "single")
  const [birthYear, setBirthYear] = useState(person.birthYear ? String(person.birthYear) : "")
  const [deathYear, setDeathYear] = useState(person.deathYear ? String(person.deathYear) : "")
  const [isLiving, setIsLiving] = useState(person.isLiving !== false && !person.deathYear)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Photo Cropper State
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | undefined>(person.avatar)
  const [removedPhoto, setRemovedPhoto] = useState(false)
  const [cropperSrc, setCropperSrc] = useState<string | null>(null)
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null)

  const isNew = !person.firstName

  function handleLivingToggle(living: boolean) {
    setIsLiving(living)
    if (living) setDeathYear("")
  }

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
    setRemovedPhoto(false)
    setCropperSrc(null)
  }

  function onRemovePhoto() {
    if (fileRef.current) fileRef.current.value = ""
    setCroppedBlob(null)
    setPreview(undefined)
    setRemovedPhoto(true)
  }
  
  useEffect(() => {
    return () => {
      if (cropperSrc) URL.revokeObjectURL(cropperSrc)
    }
  }, [cropperSrc])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    
    const by = Number.parseInt(birthYear, 10)
    const dy = Number.parseInt(deathYear, 10)
    
    let photoData: PersonPatch["photoData"]
    let avatar: string | undefined = undefined

    if (croppedBlob) {
      const b64 = await blobToBase64(croppedBlob)
      photoData = { base64: b64, contentType: "image/jpeg", filename: "photo.jpg" }
      avatar = URL.createObjectURL(croppedBlob)
    } else if (removedPhoto) {
      photoData = { remove: true }
      avatar = "" // Clear the avatar
    }

    onSubmit({
      firstName: firstName.trim(),
      middleName: middleName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      gender,
      maritalStatus,
      birthYear: Number.isFinite(by) ? by : undefined,
      deathYear: !isLiving && Number.isFinite(dy) ? dy : undefined,
      isLiving,
      photoData,
      ...(avatar !== undefined && { avatar })
    })
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 pb-8 px-4 sm:px-6 relative">
        <div className="sticky top-0 z-10 flex flex-row items-center justify-between bg-popover/95 backdrop-blur pt-4 pb-3 border-b -mx-4 px-4 sm:-mx-6 sm:px-6 mb-2">
          <div className="flex flex-row items-center gap-3">
            <SheetClose asChild>
              <Button type="button" variant="ghost" size="icon" disabled={isSubmitting} className="shrink-0 -ml-2">
                <XIcon className="size-5" />
              </Button>
            </SheetClose>
            <SheetTitle className="text-lg font-semibold">{isNew ? tTree("addTitle") : tTree("editTitle")}</SheetTitle>
          </div>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting && <Loader2Icon className="mr-2 size-4 animate-spin" />}
            {tTree("save")}
          </Button>
        </div>
        {/* Photo Upload Area */}
        <div className="flex flex-col items-center justify-center gap-3 p-4 border-2 border-dashed rounded-xl bg-muted/30">
          <span className="relative flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary/10 text-primary shadow-sm border border-primary/20">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <UserIcon className="size-8 opacity-40" />
            )}
          </span>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <h4 className="font-medium text-xs">{tPeople("profilePhoto", { fallback: "Profile Photo" })}</h4>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={preview ? "outline" : "default"}
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlusIcon className="mr-1.5 size-3.5" />
                {preview ? tPeople("photoChange") : tPeople("uploadPhoto", { fallback: "Upload Photo" })}
              </Button>
              {preview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2 text-muted-foreground"
                  onClick={onRemovePhoto}
                >
                  <XIcon className="mr-1.5 size-3.5" />
                  {tPeople("photoRemove")}
                </Button>
              )}
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            onChange={onPickFile}
            className="hidden"
          />
        </div>

        {/* name fields */}
        <div className="flex flex-col gap-3">
          <Field>
            <FieldLabel htmlFor="tf-first">{tTree("firstName")}</FieldLabel>
            <Input
              id="tf-first"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoFocus
              autoComplete="off"
              placeholder="Aziz"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="tf-middle">{tPeople("middleName", { fallback: "Middle Name" })}</FieldLabel>
            <Input
              id="tf-middle"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              autoComplete="off"
              placeholder="Rustamovich"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="tf-last">{tTree("lastName")}</FieldLabel>
            <Input
              id="tf-last"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="off"
              placeholder="Karimov"
            />
          </Field>
        </div>

        {/* gender and marital status */}
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel>{tTree("gender")}</FieldLabel>
            <GenderToggle value={gender} onChange={setGender} />
          </Field>
          <Field>
            <FieldLabel>{tTree("relationshipStatus", { fallback: "Marital Status" })}</FieldLabel>
            <Select value={maritalStatus} onValueChange={(v: SpouseStatus | "single") => setMaritalStatus(v)}>
              <SelectTrigger className="h-10 rounded-xl bg-muted/50 border-input">
                <SelectValue placeholder={tTree("relationshipStatus", { fallback: "Marital Status" })} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">{tTree("statusSingle", { fallback: "Single" })}</SelectItem>
                <SelectItem value="married">{tTree("statusMarried", { fallback: "Married" })}</SelectItem>
                <SelectItem value="divorced">{tTree("statusDivorced", { fallback: "Divorced" })}</SelectItem>
                <SelectItem value="widowed">{tTree("statusWidowed", { fallback: "Widowed" })}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        {/* living/deceased toggle */}
        <LivingToggle isLiving={isLiving} onChange={handleLivingToggle} />

        {/* year fields */}
        <div className="grid grid-cols-2 gap-3">
          <YearSpinner
            id="tf-birth"
            label={tTree("birthYear")}
            value={birthYear}
            onChange={setBirthYear}
            placeholder="1958"
          />
          <AnimatePresence mode="wait">
            {!isLiving ? (
              <motion.div
                key="death"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.15 }}
              >
                <YearSpinner
                  id="tf-death"
                  label={tTree("deathYear")}
                  value={deathYear}
                  onChange={setDeathYear}
                  placeholder="2020"
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-end pb-0.5"
              >
                {/* spacer — keeps the grid balanced */}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </form>

      {/* Cropper Dialog */}
      <Dialog open={!!cropperSrc} onOpenChange={(open) => !open && setCropperSrc(null)}>
        <DialogContent className="sm:max-w-[600px] z-[100]">
          <DialogHeader>
            <DialogTitle>{tPeople("cropPhoto", { fallback: "Crop Photo" })}</DialogTitle>
            <DialogDescription>
              {tPeople("cropHint", { fallback: "Adjust the image to fit the 3:4 portrait ratio." })}
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

export function PersonFormDialog({ open, person, onOpenChange, onSubmit }: PersonFormDialogProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        className="w-full sm:w-[600px] sm:max-w-none overflow-y-auto p-0 [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {person && (
          <PersonForm
            key={person.id}
            person={person}
            onSubmit={(patch) => {
              onSubmit(patch)
              onOpenChange(false)
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
