"use client";

import { useActionState } from "react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { sendInvite, type TInviteFormState } from "../api/send-invite";

const INITIAL_STATE: TInviteFormState = { message: null };

export const InviteForm = () => {
  const [state, formAction] = useActionState(sendInvite, INITIAL_STATE);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-xl'>Пригласить пользователя</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction}>
          <div className='flex flex-col gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor='email'>Почта</Label>
              <div className='flex gap-2'>
                <Input
                  id='email'
                  name='email'
                  type='email'
                  placeholder='m@example.com'
                  required
                />
                <Button type='submit'>Отправить</Button>
              </div>
            </div>
            {state.message && (
              <p className='text-sm text-muted-foreground'>{state.message}</p>
            )}
            <p className='text-xs text-muted-foreground'>
              Письмо приходит со встроенной почты Supabase и может попасть в
              Спам. Лимит ≈ 2 письма в час.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
