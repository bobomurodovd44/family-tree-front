"use client"

import { useRef, useState, useTransition } from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import {
  Loader2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  TreePineIcon,
  UsersIcon,
} from "lucide-react"

import {
  deleteFamily,
  updateFamily,
  type FamilyFormState,
} from "@/app/families/actions"
import type { Family } from "@/lib/families"
import { formatShortDate } from "@/lib/format-date"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

/** Families as a data table, with per-row rename / delete / open-tree actions. */
export function FamiliesTable({
  families,
  counts,
}: {
  families: Family[]
  counts?: Record<string, number>
}) {
  const t = useTranslations("Families")
  const tt = useTranslations("Table")
  const tTree = useTranslations("Tree")
  const locale = useLocale()

  const [renameTarget, setRenameTarget] = useState<Family | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Family | null>(null)
  const [renameState, setRenameState] = useState<FamilyFormState>(undefined)
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function submitRename(formData: FormData) {
    if (!renameTarget) return
    startTransition(async () => {
      const result = await updateFamily(renameTarget._id, formData)
      setRenameState(result)
      if (result?.ok) setRenameTarget(null)
    })
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>{tt("name")}</TableHead>
            <TableHead className="hidden sm:table-cell">{tt("people")}</TableHead>
            <TableHead className="hidden md:table-cell">{tt("created")}</TableHead>
            <TableHead className="w-10 text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {families.map((family) => (
            <TableRow key={family._id}>
              <TableCell>
                <Link
                  href={`/families/${family._id}`}
                  className="flex items-center gap-3 font-medium outline-none hover:underline"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <TreePineIcon className="size-4.5" />
                  </span>
                  {family.name}
                </Link>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Badge variant="muted">
                  <UsersIcon />
                  {counts?.[family._id] ?? 0}
                </Badge>
              </TableCell>
              <TableCell
                className="hidden text-sm text-muted-foreground md:table-cell"
                suppressHydrationWarning
              >
                {formatShortDate(family.createdAt, locale)}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={tt("actions")}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <MoreHorizontalIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/families/${family._id}`}>
                        <UsersIcon />
                        {tt("view")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/families/${family._id}/tree`}>
                        <TreePineIcon />
                        {tTree("open")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => {
                        setRenameState(undefined)
                        setRenameTarget(family)
                      }}
                    >
                      <PencilIcon />
                      {t("edit")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setDeleteTarget(family)}
                    >
                      <Trash2Icon />
                      {t("delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Rename */}
      <Dialog
        open={Boolean(renameTarget)}
        onOpenChange={(open) => !open && setRenameTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editTitle")}</DialogTitle>
            <DialogDescription>{t("editSubtitle")}</DialogDescription>
          </DialogHeader>
          <form ref={formRef} action={submitRename} className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="rename-family">{t("nameLabel")}</FieldLabel>
              <Input
                id="rename-family"
                name="name"
                placeholder={t("namePlaceholder")}
                defaultValue={renameTarget?.name}
                autoComplete="off"
                autoFocus
                required
                aria-invalid={Boolean(renameState?.fieldError)}
              />
              {renameState?.fieldError && (
                <FieldError>{renameState.fieldError}</FieldError>
              )}
            </Field>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {t("cancel")}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2Icon className="animate-spin" />}
                {t("editSubmit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteTitle")}</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? t("deleteConfirm", { name: deleteTarget.name })
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setDeleteTarget(null)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => {
                if (!deleteTarget) return
                startTransition(async () => {
                  await deleteFamily(deleteTarget._id)
                  setDeleteTarget(null)
                })
              }}
            >
              {pending && <Loader2Icon className="animate-spin" />}
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
