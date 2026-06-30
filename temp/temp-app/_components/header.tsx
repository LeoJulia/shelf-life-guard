import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import Link from "next/link";

export const Header = () => (
  <header className='border-b border-border bg-card/50 backdrop-blur-sm'>
    <div className='mx-auto flex max-w-7xl items-center justify-between px-6 py-4'>
      <Link className='flex items-center gap-3' href='/dashboard'>
        <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-[oklch(0.85_0.1_340)]'>
          <Package className='size-6 text-white' />
        </div>
        <span className='text-lg font-semibold text-foreground'>
          {" "}
          Shelf Life Guard{" "}
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

      <div>
        {/* <ProductForm>
          <Button size="sm" className="gap-2">
            <UIcon name="mage:plus" className="size-6" />
            Добавить
          </Button>
        </ProductForm> */}
        {/* <Button size="sm" className="ml-3 gap-2" @click="onLogout" variant="ghost">
          <UIcon name="mage:logout" className="size-6" />
          Выйти
        </Button> */}
      </div>
    </div>
  </header>
);
