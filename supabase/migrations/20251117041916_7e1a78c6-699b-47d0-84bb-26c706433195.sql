-- Add DELETE policies to prevent unauthorized deletion of critical data

-- Prevent deletion of complaints (audit-critical)
CREATE POLICY "Prevent complaint deletion" 
  ON complaints 
  FOR DELETE 
  USING (false);

-- Prevent deletion of complaint responses (audit-critical)
CREATE POLICY "Prevent response deletion" 
  ON complaint_responses 
  FOR DELETE 
  USING (false);

-- Prevent deletion of profiles (breaks FK relationships)
CREATE POLICY "Prevent profile deletion" 
  ON profiles 
  FOR DELETE 
  USING (false);

-- Prevent deletion of user roles (privilege escalation risk)
CREATE POLICY "Prevent role deletion" 
  ON user_roles 
  FOR DELETE 
  USING (false);

-- Prevent deletion of feedback (audit trail)
CREATE POLICY "Prevent feedback deletion" 
  ON complaint_feedback 
  FOR DELETE 
  USING (false);

-- Allow super admins to delete categories
CREATE POLICY "Super admins delete categories" 
  ON complaint_categories 
  FOR DELETE 
  USING (has_role(auth.uid(), 'super_admin'));

-- Allow super admins to delete priorities
CREATE POLICY "Super admins delete priorities" 
  ON complaint_priorities 
  FOR DELETE 
  USING (has_role(auth.uid(), 'super_admin'));

-- Users can delete their own files within 24 hours
CREATE POLICY "Users delete recent files" 
  ON complaint_files 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM complaints 
      WHERE id = complaint_files.complaint_id 
      AND user_id = auth.uid()
    )
    AND created_at > NOW() - INTERVAL '24 hours'
  );

-- Admins can delete any complaint file
CREATE POLICY "Admins delete any file" 
  ON complaint_files 
  FOR DELETE 
  USING (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'super_admin')
  );

-- Users can delete their own notifications
CREATE POLICY "Users delete their notifications" 
  ON notifications 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Soft delete for chat messages (don't allow hard delete)
CREATE POLICY "Prevent chat message deletion" 
  ON chat_messages 
  FOR DELETE 
  USING (false);
