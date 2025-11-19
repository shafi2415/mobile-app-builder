-- Add pinned field to chat_messages for admin pinning
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS pinned_by UUID REFERENCES auth.users(id);
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMP WITH TIME ZONE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_parent_id ON chat_messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_pinned ON chat_messages(pinned) WHERE pinned = TRUE;

-- Update RLS policy to allow admins to pin messages
CREATE POLICY "Admins can pin messages"
ON chat_messages
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));