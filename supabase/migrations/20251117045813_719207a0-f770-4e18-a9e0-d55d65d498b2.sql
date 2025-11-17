-- Add DELETE and UPDATE policies for complaint-attachments storage bucket

-- Allow users to delete their recent files (within 1 hour)
CREATE POLICY "Users can delete recent files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'complaint-attachments'
    AND EXISTS (
      SELECT 1 FROM complaints 
      WHERE id = (storage.foldername(name))[1]::uuid 
      AND user_id = auth.uid()
    )
    AND created_at > NOW() - INTERVAL '1 hour'
  );

-- Allow admins to delete any file
CREATE POLICY "Admins can delete any file"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'complaint-attachments'
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
  );

-- Allow users to update their recent files
CREATE POLICY "Users can update their recent files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'complaint-attachments'
    AND EXISTS (
      SELECT 1 FROM complaints 
      WHERE id = (storage.foldername(name))[1]::uuid 
      AND user_id = auth.uid()
    )
    AND created_at > NOW() - INTERVAL '1 hour'
  );

-- Improve tracking ID generation with cryptographically secure randomness
CREATE OR REPLACE FUNCTION public.generate_tracking_id()
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_id TEXT;
  random_bytes BYTEA;
  random_int INTEGER;
BEGIN
  LOOP
    -- Use gen_random_bytes for cryptographic randomness
    random_bytes := gen_random_bytes(3);
    random_int := (get_byte(random_bytes, 0) << 16) 
                + (get_byte(random_bytes, 1) << 8) 
                + get_byte(random_bytes, 2);
    random_int := random_int % 1000000;
    
    new_id := 'BRC-' || LPAD(random_int::TEXT, 6, '0');
    
    EXIT WHEN NOT EXISTS(SELECT 1 FROM complaints WHERE tracking_id = new_id);
  END LOOP;
  
  RETURN new_id;
END;
$$;