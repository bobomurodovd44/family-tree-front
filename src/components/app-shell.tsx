"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"

import type { Theme } from "@/lib/theme"
import { AppSidebar, type NavUser } from "@/components/app-sidebar"
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
 * The app shell. Wraps every page: authed pages get the sidebar + a slim top bar; auth
 * screens, the tree canvas, and any not-yet-authenticated view render bare. `user` is null
 * when there's no session, in which case we also render bare (the page itself redirects to
 * /login). Keeping this in one client component lets the sidebar's open/collapsed state
 * persist across navigations (the layout above it never re-renders).
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
      <AppSidebar user={user} theme={theme} />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur">
          <SidebarTrigger />
          <span className="font-heading text-sm font-medium md:hidden">
            {t("appName")}
          </span>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
