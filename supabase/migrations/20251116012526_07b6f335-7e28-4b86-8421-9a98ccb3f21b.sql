-- Fix search_path for update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix search_path for generate_tracking_id function
CREATE OR REPLACE FUNCTION public.generate_tracking_id()
RETURNS TEXT
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    new_id := 'BRC-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    SELECT EXISTS(SELECT 1 FROM public.complaints WHERE tracking_id = new_id) INTO exists_check;
    
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN new_id;
END;
$$;