CREATE TABLE "private"."account_deletions" (
  "user_id"      uuid                     NOT NULL,
  "requested_at" timestamp with time zone NOT NULL DEFAULT now(),
  "ready_at"     timestamp with time zone NOT NULL DEFAULT now(),
  "completed_at" timestamp with time zone,
  "last_error"   text,
  CONSTRAINT "account_deletions_pkey" PRIMARY KEY (user_id)
);

ALTER TABLE "private"."account_deletions"
  ENABLE ROW LEVEL SECURITY;
