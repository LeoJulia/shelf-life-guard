import { Suspense } from "react";
import { Package, Plus } from "lucide-react";
import Link from "next/link";
import { AuthButton } from "./auth-button";
import { Button } from "@/shared/ui/button";

export const Header = () => (
  <header className='border-b border-border bg-card/50 backdrop-blur-sm'>
    <div className='mx-auto flex max-w-7xl items-center justify-between px-6 py-4'>
      <Link className='flex items-center gap-3' href='/dashboard'>
        <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-[oklch(0.85_0.1_340)]'>
          <Package className='size-6 text-white' />
        </div>
        <span className='text-lg font-semibold text-foreground'>
          Shelf Life Guard
        </span>
      </Link>

      <nav className='hidden items-center gap-6 md:flex'>
        <a
          href='#'
          className='text-sm font-medium text-foreground transition-colors hover:text-primary'
        >
          Главная
        </a>
        <a
          href='#'
          className='text-sm text-muted-foreground transition-colors hover:text-foreground'
        >
          Продукты
        </a>
        <a
          href='#'
          className='text-sm text-muted-foreground transition-colors hover:text-foreground'
        >
          Рутина
        </a>
        <a
          href='#'
          className='text-sm text-muted-foreground transition-colors hover:text-foreground'
        >
          Аналитика
        </a>
      </nav>

      <Suspense>
        <div className='flex items-center gap-4'>
          <Link href='/product/new'>
            <Button variant='secondary'>
              <Plus />
              Добавить
            </Button>
          </Link>
          <AuthButton />
        </div>
      </Suspense>
    </div>
  </header>
);
