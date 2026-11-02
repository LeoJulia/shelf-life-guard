import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

/** Центрированная обёртка auth-экранов (вход, сброс пароля, приглашение). */
export const AuthScreen = ({ children }: { children: ReactNode }) => (
  <div className='flex min-h-screen w-full items-center justify-center p-6 md:p-10'>
    <div className='w-full max-w-sm'>{children}</div>
  </div>
);

/** Карточка для истёкшей или уже использованной ссылки из письма. */
export const InvalidLinkCard = ({ children }: { children: ReactNode }) => (
  <Card>
    <CardHeader>
      <CardTitle className='text-2xl'>Ссылка недействительна</CardTitle>
    </CardHeader>
    <CardContent>
      <p className='text-sm text-muted-foreground'>{children}</p>
    </CardContent>
  </Card>
);
