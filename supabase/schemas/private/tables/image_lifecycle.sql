CREATE TABLE "private"."image_lifecycle" (
  "bucket"         text                     NOT NULL,
  "path"           text                     NOT NULL,
  "user_id"        uuid                     NOT NULL,
  "state"          text                     NOT NULL,
  "upload_settled" boolean                  NOT NULL DEFAULT true,
  "ready_at"       timestamp with time zone NOT NULL DEFAULT now(),
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  "claim_token"    uuid,
  "attempts"       integer                  NOT NULL DEFAULT 0,
  "last_error"     text,
  CONSTRAINT "image_lifecycle_bucket_check" CHECK ((bucket = ANY (ARRAY['product-images'::text, 'routine-photos'::text]))),
  CONSTRAINT "image_lifecycle_pkey" PRIMARY KEY (bucket, path),
  CONSTRAINT "image_lifecycle_state_check" CHECK ((state = ANY (ARRAY['uploading'::text, 'attached'::text, 'pending'::text, 'deleting'::text, 'deleted'::text])))
);

ALTER TABLE "private"."image_lifecycle"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX image_lifecycle_due_idx ON private.image_lifecycle USING btree (ready_at)
  WHERE (state = ANY (ARRAY['uploading'::text, 'pending'::text, 'deleting'::text]));

CREATE INDEX image_lifecycle_user_idx ON private.image_lifecycle USING btree (user_id);
