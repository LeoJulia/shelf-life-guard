CREATE TABLE "public"."tags" (
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "name"       text                     NOT NULL,
  "color"      text,
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT "tags_pkey" PRIMARY KEY (id),
  "user_id"    uuid                     DEFAULT auth.uid(),
  CONSTRAINT "tags_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE "public"."tags"
  ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER guard_account_write
  BEFORE INSERT OR UPDATE ON public.tags
  FOR EACH ROW
  EXECUTE FUNCTION private.guard_account_write();

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."tags" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."tags" TO "service_role";

CREATE UNIQUE INDEX tags_name_per_user_key ON public.tags USING btree (user_id, lower(name));

CREATE POLICY "Enable delete for users based on user_id" ON "public"."tags"
  FOR DELETE
  TO PUBLIC
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Enable insert for users based on user_id" ON "public"."tags"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Policy with table joins" ON "public"."tags"
  FOR UPDATE
  TO PUBLIC
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users can get own tags" ON "public"."tags"
  FOR SELECT
  TO PUBLIC
  USING ((( SELECT auth.uid() AS uid) = user_id));

REVOKE ALL ON TABLE "public"."tags" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."tags" TO "postgres";
