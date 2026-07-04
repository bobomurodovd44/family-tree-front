"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

import { isLocale, LOCALE_COOKIE, type Locale } from "./config"

const ONE_YEAR = 60 * 60 * 24 * 365

/** Persist the chosen locale in a cookie and re-render with the new language. */
export async function setLocale(locale: Locale) {
  if (!isLocale(locale)) return

  const store = await cookies()
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  })

  revalidatePath("/", "layout")
}
