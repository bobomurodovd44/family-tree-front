// Client-safe date formatting. The `uz` locale's ICU data renders abbreviated months as
// "M07" (e.g. `Intl.DateTimeFormat('uz', { month: 'short' })`), so for Uzbek we format the
// month name ourselves and lay it out as `11-iyl, 2026`. Other locales use Intl directly.

const UZ_MONTHS_SHORT = [
  "yan",
  "fev",
  "mar",
  "apr",
  "may",
  "iyn",
  "iyl",
  "avg",
  "sen",
  "okt",
  "noy",
  "dek",
]

/** e.g. uz → "11-iyl, 2026" · ru → "11 июл. 2026 г." */
export function formatShortDate(value: number | Date, locale: string): string {
  const date = value instanceof Date ? value : new Date(value)
  if (locale === "uz") {
    return `${date.getDate()}-${UZ_MONTHS_SHORT[date.getMonth()]}, ${date.getFullYear()}`
  }
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)
}
