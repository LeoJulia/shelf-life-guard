"use server";

import { createServerClient } from "@/shared/server";
import { ROUTINE_PHOTOS_BUCKET } from "@/shared/lib/buckets";
import { redirect } from "next/navigation";
import { revalidateRoutineLists } from "../lib/revalidate";

export const deleteRoutine = async (id: string) => {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    throw new Error("Delete routine error: user is not authenticated");
  }

  const { error } = await supabase
    .from("routines")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error("Delete routine error", { cause: error });
  }

  // Каскад в БД удаляет строки routine_photos, но не файлы в Storage,
  // поэтому объекты чистятся отдельно по префиксу {user.id}/{routine.id}.
  const prefix = `${data.user.id}/${id}`;
  const { data: objects } = await supabase.storage
    .from(ROUTINE_PHOTOS_BUCKET)
    .list(prefix);

  const paths = (objects ?? []).map((object) => `${prefix}/${object.name}`);

  if (paths.length) {
    const { error: removeError } = await supabase.storage
      .from(ROUTINE_PHOTOS_BUCKET)
      .remove(paths);

    if (removeError) {
      throw new Error("Delete routine photos error", { cause: removeError });
    }
  }

  revalidateRoutineLists();

  redirect("/routine");
};
