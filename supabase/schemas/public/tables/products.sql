CREATE TABLE "public"."products" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"         text                     NOT NULL,
  "brand"        text                     NOT NULL,
  "category"     text,
  "market_price" double precision,
  "actual_price" double precision         DEFAULT '0'::double precision,
  "opened_at"    date,
  "finished_at"  date,
  "rating"       integer,
  "notes"        text,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "year"         numeric,
  "expiry_date"  date,
  "ingredients"  text,
  "volume"       text,
  "shop"         text,
  "image_path"   text,
  "user_id"      uuid                     NOT NULL,
  CONSTRAINT "products_pkey" PRIMARY KEY (id),
  CONSTRAINT "products_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE "public"."products"
  ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER guard_account_write
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION private.guard_account_write();

CREATE TRIGGER track_image_reference
  AFTER INSERT OR DELETE OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION private.track_image_reference();

CREATE POLICY "Enable insert for users based on user_id" ON "public"."products"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users can delete own products" ON "public"."products"
  FOR DELETE
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "Users can update own products" ON "public"."products"
  FOR UPDATE
  TO PUBLIC
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users can view own products" ON "public"."products"
  FOR SELECT
  TO PUBLIC
  USING ((auth.uid() = user_id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."products" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."products" TO "service_role";

REVOKE ALL ON TABLE "public"."products" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."products" TO "postgres";
