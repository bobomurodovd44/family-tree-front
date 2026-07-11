"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  ChevronsUpDownIcon,
  FolderTreeIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  TreePineIcon,
  UsersIcon,
} from "lucide-react"

import { logout } from "@/app/actions"
import type { Theme } from "@/lib/theme"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
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

export function AppSidebar({ user, theme }: { user: NavUser; theme: Theme }) {
  const t = useTranslations()
  const pathname = usePathname()

  const items = [
    {
      href: "/",
      label: t("Nav.overview"),
      icon: LayoutDashboardIcon,
      active: pathname === "/",
    },
    {
      href: "/families",
      label: t("Nav.families"),
      icon: FolderTreeIcon,
      active: pathname === "/families" || pathname.startsWith("/families/"),
    },
    {
      href: "/people",
      label: t("Nav.people"),
      icon: UsersIcon,
      active: pathname === "/people" || pathname.startsWith("/people/"),
    },
  ]

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md px-1 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <TreePineIcon className="size-4.5" />
          </span>
          <span className="font-heading text-sm font-semibold">
            {t("Common.appName")}
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.active}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center justify-between gap-2 px-1">
          <LanguageSwitcher />
          <ThemeToggle current={theme} />
        </div>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary/10 text-xs font-medium text-sidebar-primary">
                    {initialsOf(user.name)}
                  </span>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-sm font-medium">
                      {user.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                  <ChevronsUpDownIcon className="ml-auto size-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                sideOffset={8}
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
              >
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="truncate text-sm font-medium">
                    {user.name}
                  </span>
                  <span className="truncate text-xs font-normal text-muted-foreground">
                    {user.email}
                  </span>
                </DropdownMenuLabel>
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
