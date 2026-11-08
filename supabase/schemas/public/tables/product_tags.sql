CREATE TABLE "public"."product_tags" (
  "product_id" uuid NOT NULL,
  "tag_id"     uuid NOT NULL,
  CONSTRAINT "product_tags_pkey" PRIMARY KEY (product_id, tag_id),
  CONSTRAINT "product_tags_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
  CONSTRAINT "product_tags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE
);

ALTER TABLE "public"."product_tags"
  ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER guard_account_write
  BEFORE INSERT OR UPDATE ON public.product_tags
  FOR EACH ROW
  EXECUTE FUNCTION private.guard_account_write();

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."product_tags" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."product_tags" TO "service_role";

CREATE POLICY "Users can access own product tags" ON "public"."product_tags"
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.products p
  WHERE ((p.id = product_tags.product_id) AND (p.user_id = ( SELECT auth.uid() AS uid))))))
  WITH CHECK (((EXISTS ( SELECT 1
   FROM public.products p
  WHERE ((p.id = product_tags.product_id) AND (p.user_id = ( SELECT auth.uid() AS uid))))) AND (EXISTS ( SELECT 1
   FROM public.tags t
  WHERE ((t.id = product_tags.tag_id) AND (t.user_id = ( SELECT auth.uid() AS uid)))))));

REVOKE ALL ON TABLE "public"."product_tags" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."product_tags" TO "postgres";
