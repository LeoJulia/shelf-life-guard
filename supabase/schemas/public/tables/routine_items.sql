CREATE TABLE "public"."routine_items" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "routine_id"  uuid                     NOT NULL,
  "product_id"  uuid                     NOT NULL,
  "time_of_day" text                     NOT NULL DEFAULT 'both'::text,
  "is_constant" boolean                  NOT NULL DEFAULT true,
  "mon"         boolean                  NOT NULL DEFAULT true,
  "tue"         boolean                  NOT NULL DEFAULT true,
  "wed"         boolean                  NOT NULL DEFAULT true,
  "thu"         boolean                  NOT NULL DEFAULT true,
  "fri"         boolean                  NOT NULL DEFAULT true,
  "sat"         boolean                  NOT NULL DEFAULT true,
  "sun"         boolean                  NOT NULL DEFAULT true,
  "position"    integer                  NOT NULL DEFAULT 0,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "routine_items_constant_consistency" CHECK ((is_constant = (mon AND tue AND wed AND thu AND fri AND sat AND sun))),
  CONSTRAINT "routine_items_pkey" PRIMARY KEY (id),
  CONSTRAINT "routine_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
  CONSTRAINT "routine_items_time_of_day" CHECK ((time_of_day = ANY (ARRAY['morning'::text, 'evening'::text, 'both'::text]))),
  CONSTRAINT "routine_items_unique_product" UNIQUE (routine_id, product_id),
  CONSTRAINT "routine_items_routine_id_fkey" FOREIGN KEY (routine_id) REFERENCES public.routines(id) ON DELETE CASCADE,
  "user_id"     uuid                     NOT NULL DEFAULT auth.uid(),
  CONSTRAINT "routine_items_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE "public"."routine_items"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX routine_items_product_idx ON public.routine_items USING btree (product_id);

CREATE INDEX routine_items_routine_idx ON public.routine_items USING btree (routine_id, "position");

CREATE TRIGGER atomic_lock_routine_items_parent
  BEFORE INSERT OR DELETE OR UPDATE ON public.routine_items
  FOR EACH ROW
  EXECUTE FUNCTION private.lock_routine_items_parent();

CREATE TRIGGER guard_account_write
  BEFORE INSERT OR UPDATE ON public.routine_items
  FOR EACH ROW
  EXECUTE FUNCTION private.guard_account_write();

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."routine_items" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."routine_items" TO "service_role";

CREATE POLICY "routine_items_delete_own" ON "public"."routine_items"
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "routine_items_select_own" ON "public"."routine_items"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "routine_items_insert_own" ON "public"."routine_items"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM public.routines r
  WHERE ((r.id = routine_items.routine_id) AND (r.user_id = ( SELECT auth.uid() AS uid))))) AND (EXISTS ( SELECT 1
   FROM public.products p
  WHERE ((p.id = routine_items.product_id) AND (p.user_id = ( SELECT auth.uid() AS uid)))))));

CREATE POLICY "routine_items_update_own" ON "public"."routine_items"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM public.routines r
  WHERE ((r.id = routine_items.routine_id) AND (r.user_id = ( SELECT auth.uid() AS uid))))) AND (EXISTS ( SELECT 1
   FROM public.products p
  WHERE ((p.id = routine_items.product_id) AND (p.user_id = ( SELECT auth.uid() AS uid)))))));

REVOKE ALL ON TABLE "public"."routine_items" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."routine_items" TO "postgres";
