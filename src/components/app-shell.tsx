"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"

import type { Theme } from "@/lib/theme"
import { AppSidebar } from "@/components/app-sidebar"
import { UserMenu, type NavUser } from "@/components/user-menu"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

// Routes that render WITHOUT the dashboard chrome: the auth screens and the full-bleed
// interactive tree canvas (a spatial pan/zoom surface that wants the whole viewport).
const BARE_ROUTES = [
  /^\/login$/,
  /^\/signup$/,
  /^\/families\/[^/]+\/tree\/?$/,
]

/**
 * The app shell. Wraps every page: authed pages get the sidebar + a top bar (with the
 * language / theme / account controls on the right); auth screens, the tree canvas, and any
 * not-yet-authenticated view render bare. `user` is null when there's no session, in which
 * case we also render bare (the page itself redirects to /login). Keeping this in one client
 * component lets the sidebar's open/collapsed state persist across navigations.
 */
export function AppShell({
  user,
  theme,
  defaultOpen,
  children,
}: {
  user: NavUser | null
  theme: Theme
  defaultOpen: boolean
  children: ReactNode
}) {
  const pathname = usePathname()
  const t = useTranslations("Common")

  const bare = !user || BARE_ROUTES.some((re) => re.test(pathname))
  if (bare) return <>{children}</>

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur">
          <SidebarTrigger />
          <span className="font-heading text-sm font-medium md:hidden">
            {t("appName")}
          </span>
          <div className="ml-auto flex items-center">
            <UserMenu user={user} theme={theme} />
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
