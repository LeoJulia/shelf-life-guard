"use server";

import { createAdminClient, createServerClient } from "@/shared/server";
import {
  PRODUCT_IMAGES_BUCKET,
  ROUTINE_PHOTOS_BUCKET,
} from "@/shared/lib/buckets";

export const deleteAccount = async (): Promise<void> => {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Delete account error: user is not authenticated");
  }

  const admin = createAdminClient();

  // Storage чистим ДО deleteUser: после удаления пользователя список объектов
  // уже некому привязать, а каскады в БД файлы бакетов не удаляют.
  const { data: productImages } = await admin.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .list(user.id, { limit: 1000 });

  const productPaths = (productImages ?? []).map(
    (object) => `${user.id}/${object.name}`,
  );
  if (productPaths.length) {
    const { error } = await admin.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove(productPaths);
    if (error) {
      throw new Error("Delete account: product images cleanup error", {
        cause: error,
      });
    }
  }

  // routine-photos двухуровневый: {uid}/{routineId}/{file}, list не рекурсивен.
  const { data: routineFolders } = await admin.storage
    .from(ROUTINE_PHOTOS_BUCKET)
    .list(user.id, { limit: 1000 });

  const routinePaths: string[] = [];
  for (const folder of routineFolders ?? []) {
    const prefix = `${user.id}/${folder.name}`;
    const { data: photos } = await admin.storage
      .from(ROUTINE_PHOTOS_BUCKET)
      .list(prefix, { limit: 1000 });
    routinePaths.push(
      ...(photos ?? []).map((photo) => `${prefix}/${photo.name}`),
    );
  }
  if (routinePaths.length) {
    const { error } = await admin.storage
      .from(ROUTINE_PHOTOS_BUCKET)
      .remove(routinePaths);
    if (error) {
      throw new Error("Delete account: routine photos cleanup error", {
        cause: error,
      });
    }
  }

  // Строки public.* (products, tags, product_tags, routines, routine_items,
  // routine_photos) удалятся каскадами FK на auth.users.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    throw new Error("Delete account error", { cause: error });
  }
};
