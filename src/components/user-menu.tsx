"use client"

import { useTranslations } from "next-intl"
import { LogOutIcon } from "lucide-react"

import { logout } from "@/app/actions"
import type { Theme } from "@/lib/theme"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type NavUser = { name: string; email: string }

function initialsOf(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  )
}

/**
 * The header's account button (avatar only). Its dropdown holds the account details, the
 * language switcher, the theme toggle, and logout.
 */
export function UserMenu({ user, theme }: { user: NavUser; theme: Theme }) {
  const t = useTranslations()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={user.name}
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary outline-none transition-colors hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-ring/50 data-[state=open]:ring-2 data-[state=open]:ring-ring/50"
        >
          {initialsOf(user.name)}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate text-sm font-medium">{user.name}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Interactive rows — not DropdownMenuItems, so they don't close the menu on use. */}
        <div className="flex items-center justify-between gap-3 px-2 py-1.5">
          <span className="text-sm">{t("Common.language")}</span>
          <LanguageSwitcher />
        </div>
        <div className="flex items-center justify-between gap-3 px-2 py-1.5">
          <span className="text-sm">{t("Common.theme")}</span>
          <ThemeToggle current={theme} />
        </div>

        <DropdownMenuSeparator />
        <form action={logout}>
          <DropdownMenuItem asChild variant="destructive">
            <button type="submit" className="w-full cursor-pointer">
              <LogOutIcon />
              {t("Home.logout")}
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
