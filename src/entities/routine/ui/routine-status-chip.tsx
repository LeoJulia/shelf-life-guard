import { cn } from "@/shared/utils";
import {
  routineStatusLabels,
  type TRoutineStatus,
} from "../model/routine-status";

const statusClasses: Record<TRoutineStatus, string> = {
  active: "bg-primary text-primary-foreground",
  planned: "bg-muted text-muted-foreground",
  finished: "bg-secondary text-secondary-foreground",
};

export const RoutineStatusChip = ({
  status,
  className,
}: {
  status: TRoutineStatus;
  className?: string;
}) => (
  <span
    className={cn(
      "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
      statusClasses[status],
      className,
    )}
  >
    {routineStatusLabels[status]}
  </span>
);
