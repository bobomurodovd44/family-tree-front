"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { deleteSession } from "@/lib/session"
import { isTheme, THEME_COOKIE, type Theme } from "@/lib/theme"

const ONE_YEAR = 60 * 60 * 24 * 365

export async function logout() {
  await deleteSession()
  redirect("/login")
}

/** Persist the chosen theme in a cookie and re-render with it applied to <html>. */
export async function setTheme(theme: Theme) {
  if (!isTheme(theme)) return

  const store = await cookies()
  store.set(THEME_COOKIE, theme, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  })

  revalidatePath("/", "layout")
}
