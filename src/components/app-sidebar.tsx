"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  FolderTreeIcon,
  LayoutDashboardIcon,
  TreePineIcon,
  UsersIcon,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebar() {
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

      <SidebarRail />
    </Sidebar>
  )
}
