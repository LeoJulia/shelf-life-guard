"use server";

import {
  createAdminClient,
  createServerClient,
  processAccountDeletion,
  scheduleStorageMaintenance,
} from "@/shared/server";

export const deleteAccount = async (): Promise<boolean> => {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Delete account error: user is not authenticated");
  }

  const admin = createAdminClient();
  const { error } = await supabase.rpc("request_account_deletion");
  if (error) throw new Error("Delete account error", { cause: error });

  scheduleStorageMaintenance();
  return processAccountDeletion(admin, user.id);
};
