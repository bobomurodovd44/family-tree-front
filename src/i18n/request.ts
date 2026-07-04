import { getRequestConfig } from "next-intl/server"
import { cookies } from "next/headers"

import { defaultLocale, isLocale, type Locale } from "./config"

// No i18n routing: the active locale comes from the `locale` cookie (falling back
// to the default). Messages are loaded from the top-level `messages/` folder.
export default getRequestConfig(async () => {
  const store = await cookies()
  const cookieLocale = store.get("locale")?.value
  const locale: Locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
