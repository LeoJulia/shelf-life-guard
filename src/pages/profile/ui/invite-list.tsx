import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Button } from "@/shared/ui/button";
import { resendInvite } from "../api/send-invite";
import type { TInviteListEntry } from "../api/list-users";

export const InviteList = ({ entries }: { entries: TInviteListEntry[] }) => {
  if (entries.length === 0) {
    return (
      <p className='text-sm text-muted-foreground'>
        Пользователей пока нет — отправьте первое приглашение.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Почта</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead className='text-right'>Действия</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.email}>
            <TableCell>{entry.email}</TableCell>
            <TableCell>
              {entry.status === "accepted" ? "Принял" : "Приглашён, ждёт"}
            </TableCell>
            <TableCell className='text-right'>
              {entry.status === "invited" ? (
                <form action={resendInvite}>
                  <input type='hidden' name='email' value={entry.email} />
                  <Button type='submit' size='sm' variant='outline'>
                    Отправить повторно
                  </Button>
                </form>
              ) : (
                <span className='text-xs text-muted-foreground'>
                  доступ активен
                </span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
