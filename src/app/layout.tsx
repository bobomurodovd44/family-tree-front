import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Roboto, Roboto_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";

import { getTheme } from "@/lib/theme";
import { getCurrentUser } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Common");
  return {
    title: t("appName"),
    description: t("tagline"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const theme = await getTheme();
  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const sidebarOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <html
      lang={locale}
      className={`${roboto.variable} ${robotoMono.variable} h-full antialiased ${
        theme === "dark" ? "dark" : ""
      }`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <TooltipProvider>
            <AppShell
              user={user ? { name: user.name, email: user.email } : null}
              theme={theme}
              defaultOpen={sidebarOpen}
            >
              {children}
            </AppShell>
          </TooltipProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
