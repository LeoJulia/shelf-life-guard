CREATE POLICY "Authenticated users can upload to own folder 16wiy3a_0" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'product-images'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));

CREATE POLICY "Users can delete own files 16wiy3a_0" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'product-images'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));

CREATE POLICY "Users can delete own files 16wiy3a_1" ON "storage"."objects"
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'product-images'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));

CREATE POLICY "Users can read own files 16wiy3a_0" ON "storage"."objects"
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'product-images'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));

CREATE POLICY "routine_photos_storage_delete_own" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'routine-photos'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

CREATE POLICY "routine_photos_storage_insert_own" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'routine-photos'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

CREATE POLICY "routine_photos_storage_read_own" ON "storage"."objects"
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'routine-photos'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

CREATE POLICY "routine_photos_storage_update_own" ON "storage"."objects"
  FOR UPDATE
  TO "authenticated"
  USING (((bucket_id = 'routine-photos'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)))
  WITH CHECK (((bucket_id = 'routine-photos'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

CREATE POLICY "storage_active_account_insert" ON "storage"."objects"
  AS RESTRICTIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id <> ALL (ARRAY['product-images'::text, 'routine-photos'::text])) OR private.storage_account_active(name)));

CREATE POLICY "storage_active_account_update" ON "storage"."objects"
  AS RESTRICTIVE
  FOR UPDATE
  TO "authenticated"
  USING (((bucket_id <> ALL (ARRAY['product-images'::text, 'routine-photos'::text])) OR private.storage_account_active(name)))
  WITH CHECK (((bucket_id <> ALL (ARRAY['product-images'::text, 'routine-photos'::text])) OR private.storage_account_active(name)));
