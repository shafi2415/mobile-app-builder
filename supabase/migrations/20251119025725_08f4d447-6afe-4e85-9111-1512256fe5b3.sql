-- Create device_sessions table for tracking user sessions across devices
CREATE TABLE public.device_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name text,
  device_type text,
  browser text,
  ip_address inet,
  user_agent text,
  last_active timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  revoked boolean DEFAULT false,
  revoked_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own device sessions
CREATE POLICY "Users can view their own sessions" 
ON public.device_sessions FOR SELECT
USING (auth.uid() = user_id);

-- Users can revoke their own sessions
CREATE POLICY "Users can revoke their own sessions" 
ON public.device_sessions FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all sessions
CREATE POLICY "Admins can view all sessions" 
ON public.device_sessions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Create index for performance
CREATE INDEX idx_device_sessions_user_id ON public.device_sessions(user_id);
CREATE INDEX idx_device_sessions_last_active ON public.device_sessions(last_active DESC);

-- Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_emails text[];
BEGIN
  -- Get super admin emails for critical events
  IF NEW.action IN ('role_change', 'multiple_failed_logins', 'suspicious_file_upload') THEN
    SELECT array_agg(au.email)
    INTO admin_emails
    FROM auth.users au
    JOIN user_roles ur ON ur.user_id = au.id
    WHERE ur.role = 'super_admin';
    
    -- Store emails in metadata for edge function to send
    NEW.metadata = jsonb_set(
      COALESCE(NEW.metadata, '{}'::jsonb),
      '{admin_emails}',
      to_jsonb(admin_emails)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for security alerts
CREATE TRIGGER trigger_security_alerts
BEFORE INSERT ON public.audit_logs
FOR EACH ROW
EXECUTE FUNCTION public.log_security_event();