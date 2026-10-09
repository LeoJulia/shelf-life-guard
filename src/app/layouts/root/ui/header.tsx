import { Suspense } from "react";
import { Package, Plus } from "lucide-react";
import Link from "next/link";
import { AuthButton } from "./auth-button";
import { HeaderNav } from "./header-nav";
import { MobileMenu } from "./mobile-menu";
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

      <HeaderNav />

      <div className='flex items-center gap-2 sm:gap-4'>
        <Link href='/product/new'>
          <Button variant='secondary'>
            <Plus />
            <span className='hidden sm:inline'>Добавить</span>
          </Button>
        </Link>

        <Suspense>
          <div className='hidden md:block'>
            <AuthButton />
          </div>
        </Suspense>

        <MobileMenu
          auth={
            <Suspense>
              <AuthButton />
            </Suspense>
          }
        />
      </div>
    </div>
  </header>
);
