"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleCheckBig } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { toLocalDateString } from "@/shared/lib/local-date";
import { finishRoutine } from "../api/finish-routine";

export const FinishRoutineButton = ({
  routineId,
  endDate,
}: {
  routineId: string;
  endDate: string | null;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (endDate === toLocalDateString()) {
    return null;
  }

  const handleFinish = () => {
    setError(null);
    startTransition(async () => {
      try {
        await finishRoutine(routineId);
        router.refresh();
      } catch {
        setError("Не удалось завершить рутину");
      }
    });
  };

  return (
    <div className='flex flex-col gap-1'>
      <Button
        type='button'
        variant='outline'
        onClick={handleFinish}
        disabled={isPending}
      >
        <CircleCheckBig />
        {isPending ? "Завершаем..." : "Завершить сегодня"}
      </Button>
      {error && (
        <span role='alert' className='text-destructive text-xs'>
          {error}
        </span>
      )}
    </div>
  );
};
