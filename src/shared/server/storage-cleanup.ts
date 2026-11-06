import "server-only";

import { after } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/model";
import { createAdminClient } from "./admin";

type Client = SupabaseClient<Database>;

export const releaseUploadedImage = async (
  supabase: Client,
  bucket: string,
  path: string,
): Promise<void> => {
  try {
    const { error } = await supabase.rpc("release_image_upload", {
      p_bucket: bucket,
      p_path: path,
    });
    if (error) throw error;
  } catch (error) {
    console.error("Image cleanup reservation retained for retry", error);
  }
};

export const processImageCleanup = async (admin: Client): Promise<number> => {
  const { data: jobs, error } = await admin.rpc("claim_image_cleanup", {
    p_limit: 100,
  });
  if (error) throw error;

  for (const bucket of new Set(jobs.map((job) => job.bucket))) {
    const batch = jobs.filter((job) => job.bucket === bucket);
    let failure: string | undefined;
    try {
      const { error: removeError } = await admin.storage
        .from(bucket)
        .remove(batch.map((job) => job.path));
      if (removeError) throw removeError;
    } catch (error) {
      failure =
        error instanceof Error ? error.message : "Storage removal failed";
    }

    for (const job of batch) {
      const { error: finishError } = await admin.rpc("finish_image_cleanup", {
        p_bucket: bucket,
        p_path: job.path,
        p_claim_token: job.claim_token,
        ...(failure ? { p_error: failure } : {}),
      });
      if (finishError) throw finishError;
    }
  }

  return jobs.length;
};

export const processAccountDeletion = async (
  admin: Client,
  userId: string,
): Promise<boolean> => {
  try {
    for (let batch = 0; batch < 4; batch++) {
      const { data: empty, error } = await admin.rpc(
        "prepare_account_cleanup",
        {
          p_user_id: userId,
        },
      );
      if (error) throw error;
      if (empty) {
        const { error: deleteError } =
          await admin.auth.admin.deleteUser(userId);
        if (deleteError && deleteError.status !== 404) throw deleteError;
        const { error: finishError } = await admin.rpc(
          "finish_account_cleanup",
          {
            p_user_id: userId,
          },
        );
        if (finishError) throw finishError;
        return true;
      }
      if ((await processImageCleanup(admin)) === 0) break;
    }
    const { error: deferError } = await admin.rpc("finish_account_cleanup", {
      p_user_id: userId,
      p_error: "Cleanup is still pending",
    });
    if (deferError) throw deferError;
    return false;
  } catch (error) {
    const { error: finishError } = await admin.rpc("finish_account_cleanup", {
      p_user_id: userId,
      p_error:
        error instanceof Error ? error.message : "Account cleanup failed",
    });
    if (finishError)
      console.error("Account cleanup retry record unavailable", finishError);
    console.error("Account deletion remains queued", error);
    return false;
  }
};

export const runStorageMaintenance = async (): Promise<void> => {
  const admin = createAdminClient();
  await processImageCleanup(admin);
  const { data: accounts, error } = await admin.rpc(
    "pending_account_deletions",
    {},
  );
  if (error) throw error;
  for (const account of accounts) {
    await processAccountDeletion(admin, account.user_id);
  }
};

export const scheduleStorageMaintenance = (): void => {
  after(async () => {
    try {
      await runStorageMaintenance();
    } catch (error) {
      console.error(
        "Storage maintenance will retry on a subsequent request",
        error,
      );
    }
  });
};
