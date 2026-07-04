// Supported locales for the app. Uzbek is the default; locale is stored in a
// cookie (no URL prefix). Add a locale here + a messages/<locale>.json file to
// support it everywhere.
export const locales = ["uz", "ru"] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "uz"

export const LOCALE_COOKIE = "locale"

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value)
}
