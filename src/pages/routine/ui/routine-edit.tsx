import { getRoutine } from "../api/get-routine";
import { RoutineForm } from "./routine-form";

export const RoutineEdit = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  const routine = await getRoutine(id);

  return <RoutineForm routine={routine} />;
};
