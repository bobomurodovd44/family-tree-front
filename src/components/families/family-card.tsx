"use client"

import { useState, useTransition } from "react"
import { useFormatter, useTranslations } from "next-intl"
import { Loader2Icon, Trash2Icon, TreePineIcon } from "lucide-react"

import { deleteFamily } from "@/app/families/actions"
import type { Family } from "@/lib/families"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function FamilyCard({ family }: { family: Family }) {
  const t = useTranslations("Families")
  const format = useFormatter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  return (
    <Card className="group relative gap-3">
      <div className="flex items-start justify-between gap-2">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <TreePineIcon className="size-5" />
        </span>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("delete")}
              onClick={() => setConfirmOpen(true)}
              className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"
            >
              <Trash2Icon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("delete")}</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex flex-col gap-0.5">
        <h3 className="font-medium leading-tight tracking-tight">
          {family.name}
        </h3>
        <p className="text-xs text-muted-foreground">
          {t("createdOn", {
            date: format.dateTime(new Date(family.createdAt), {
              dateStyle: "medium",
            }),
          })}
        </p>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("deleteConfirm", { name: family.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setConfirmOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await deleteFamily(family._id)
                  setConfirmOpen(false)
                })
              }
            >
              {pending && <Loader2Icon className="animate-spin" />}
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
