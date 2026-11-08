CREATE TABLE "public"."routines" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"        text,
  "start_date"  date                     NOT NULL,
  "end_date"    date,
  "notes"       text,
  "copied_from" uuid,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "routines_dates_order" CHECK (((end_date IS NULL) OR (end_date >= start_date))),
  CONSTRAINT "routines_pkey" PRIMARY KEY (id),
  CONSTRAINT "routines_copied_from_fkey" FOREIGN KEY (copied_from) REFERENCES public.routines(id) ON DELETE SET NULL,
  "user_id"     uuid                     NOT NULL DEFAULT auth.uid(),
  CONSTRAINT "routines_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE "public"."routines"
  ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER guard_account_write
  BEFORE INSERT OR UPDATE ON public.routines
  FOR EACH ROW
  EXECUTE FUNCTION private.guard_account_write();

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."routines" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."routines" TO "service_role";

CREATE INDEX routines_user_start_idx ON public.routines USING btree (user_id, start_date DESC);

CREATE POLICY "routines_delete_own" ON "public"."routines"
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "routines_insert_own" ON "public"."routines"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND ((copied_from IS NULL) OR private.atomic_owns_routine(copied_from))));

CREATE POLICY "routines_select_own" ON "public"."routines"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "routines_update_own" ON "public"."routines"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND ((copied_from IS NULL) OR private.atomic_owns_routine(copied_from))));

REVOKE ALL ON TABLE "public"."routines" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."routines" TO "postgres";
