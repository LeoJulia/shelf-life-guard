"use client";

import { useActionState, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  changeEmailAdmin,
  type TChangeEmailAdminState,
} from "../api/change-email-admin";
import { ChangeEmailForm } from "./change-email-form";

const ADMIN_INITIAL_STATE: TChangeEmailAdminState = { message: null };

type TAccountCardProps = {
  email: string;
  newEmail: string | null;
  isInviteAdmin: boolean;
};

export function AccountCard({
  email,
  newEmail,
  isInviteAdmin,
}: TAccountCardProps) {
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminState, adminFormAction] = useActionState(
    changeEmailAdmin,
    ADMIN_INITIAL_STATE,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-xl'>Аккаунт</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='flex flex-col gap-4'>
          <div className='grid gap-2'>
            <Label htmlFor='current-email'>Почта</Label>
            <Input id='current-email' type='email' value={email} readOnly />
          </div>

          {newEmail && (
            <div className='rounded-lg border border-chart-4/50 bg-chart-4/10 p-3 text-sm'>
              Ожидает подтверждения: ссылка отправлена на {email} и на{" "}
              {newEmail}. Почта изменится после подтверждения обоих ящиков.
            </div>
          )}

          <ChangeEmailForm />

          {isInviteAdmin && (
            <Collapsible open={adminOpen} onOpenChange={setAdminOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='px-0 text-muted-foreground'
                >
                  <ChevronDown className='size-4' />
                  Нет доступа к старой почте?
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <form action={adminFormAction} className='pt-2'>
                  <div className='flex flex-col gap-4'>
                    <div className='grid gap-2'>
                      <Label htmlFor='admin-email'>
                        Новая почта (без писем, мгновенно)
                      </Label>
                      <div className='flex gap-2'>
                        <Input
                          id='admin-email'
                          name='email'
                          type='email'
                          placeholder='m@example.com'
                          required
                        />
                        <Button type='submit'>Сменить</Button>
                      </div>
                    </div>
                    {adminState.message && (
                      <p className='text-sm text-muted-foreground'>
                        {adminState.message}
                      </p>
                    )}
                    <p className='text-xs text-muted-foreground'>
                      Админ-эскалация: почта меняется сразу, без подтверждения.
                      Доступна только администратору приглашений.
                    </p>
                  </div>
                </form>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
