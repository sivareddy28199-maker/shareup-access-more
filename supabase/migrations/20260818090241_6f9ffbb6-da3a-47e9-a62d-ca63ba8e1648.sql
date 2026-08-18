-- listing images: readable by everyone (signed URLs), writable only in the user's own folder
CREATE POLICY "listing images readable" ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-images');
CREATE POLICY "listing images insert own folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "listing images update own folder" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "listing images delete own folder" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- student IDs: strictly private
CREATE POLICY "student ids read own or admin" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'student-ids' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "student ids insert own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'student-ids' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "student ids delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'student-ids' AND (storage.foldername(name))[1] = auth.uid()::text);