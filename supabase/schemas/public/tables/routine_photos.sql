CREATE TABLE "public"."routine_photos" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "routine_id" uuid                     NOT NULL,
  "series"     text                     NOT NULL,
  "slot"       text                     NOT NULL,
  "image_path" text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "routine_photos_pkey" PRIMARY KEY (id),
  CONSTRAINT "routine_photos_series" CHECK ((series = ANY (ARRAY['start'::text, 'end'::text]))),
  CONSTRAINT "routine_photos_slot" CHECK ((slot = ANY (ARRAY['front'::text, 'right'::text, 'left'::text, 'up'::text, 'down'::text, 'zone1'::text, 'zone2'::text]))),
  CONSTRAINT "routine_photos_unique_slot" UNIQUE (routine_id, series, slot),
  CONSTRAINT "routine_photos_routine_id_fkey" FOREIGN KEY (routine_id) REFERENCES public.routines(id) ON DELETE CASCADE,
  "user_id"    uuid                     NOT NULL DEFAULT auth.uid(),
  CONSTRAINT "routine_photos_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE "public"."routine_photos"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX routine_photos_routine_idx ON public.routine_photos USING btree (routine_id);

CREATE TRIGGER guard_account_write
  BEFORE INSERT OR UPDATE ON public.routine_photos
  FOR EACH ROW
  EXECUTE FUNCTION private.guard_account_write();

CREATE TRIGGER track_image_reference
  AFTER INSERT OR DELETE OR UPDATE ON public.routine_photos
  FOR EACH ROW
  EXECUTE FUNCTION private.track_image_reference();

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."routine_photos" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."routine_photos" TO "service_role";

CREATE POLICY "routine_photos_delete_own" ON "public"."routine_photos"
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "routine_photos_select_own" ON "public"."routine_photos"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "routine_photos_insert_own" ON "public"."routine_photos"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM public.routines r
  WHERE ((r.id = routine_photos.routine_id) AND (r.user_id = ( SELECT auth.uid() AS uid)))))));

CREATE POLICY "routine_photos_update_own" ON "public"."routine_photos"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM public.routines r
  WHERE ((r.id = routine_photos.routine_id) AND (r.user_id = ( SELECT auth.uid() AS uid)))))));

REVOKE ALL ON TABLE "public"."routine_photos" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."routine_photos" TO "postgres";
