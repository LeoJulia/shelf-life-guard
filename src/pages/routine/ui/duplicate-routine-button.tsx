import { Copy } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { duplicateRoutine } from "../api/duplicate-routine";

export const DuplicateRoutineButton = ({
  routineId,
}: {
  routineId: string;
}) => (
  <form action={duplicateRoutine.bind(null, routineId)}>
    <Button type='submit' variant='outline'>
      <Copy />
      Скопировать
    </Button>
  </form>
);
