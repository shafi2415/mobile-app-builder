-- Create audit logs table for security monitoring
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  ip_address inet,
  user_agent text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins and super admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Prevent deletion of audit logs
CREATE POLICY "Prevent audit log deletion" ON public.audit_logs
  FOR DELETE
  USING (false);

-- Create index for faster audit log queries
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);