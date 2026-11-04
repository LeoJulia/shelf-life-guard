"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Обёртка next-themes: тема задаётся классом на <html> (attribute="class"),
 * что совпадает с `@custom-variant dark (&:is(.dark *))` в globals.css.
 * defaultTheme="system" — до первого переключения следует настройкам ОС.
 */
export function ThemeProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NextThemesProvider
      attribute='class'
      defaultTheme='system'
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
