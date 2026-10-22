import { revalidatePath } from "next/cache";

export const revalidateRoutineLists = () => {
  revalidatePath("/routine", "page");
};

/** Всё, что показывает рутину: просмотр, редактор и список. */
export const revalidateRoutine = (routineId: string) => {
  revalidatePath(`/routine/${routineId}`, "page");
  revalidatePath(`/routine/${routineId}/edit`, "page");
  revalidateRoutineLists();
};
