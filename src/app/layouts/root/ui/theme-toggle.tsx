"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/shared/ui/button";

/**
 * Переключатель светлая/тёмная. Иконки меняются через CSS-вариант `dark:`,
 * поэтому нет рассинхрона гидрации: обе всегда в DOM, видимость решает класс
 * на <html>, который next-themes проставляет до первой отрисовки.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant='ghost'
      size='icon'
      aria-label='Переключить тему'
      title='Переключить тему'
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className='size-5 dark:hidden' />
      <Moon className='hidden size-5 dark:block' />
    </Button>
  );
}
