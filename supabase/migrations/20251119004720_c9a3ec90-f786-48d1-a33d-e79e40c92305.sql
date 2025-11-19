-- Insert default complaint categories if they don't exist
INSERT INTO complaint_categories (name, description, color, icon) VALUES
  ('Technical Issue', 'Problems with technical systems or equipment', '#3B82F6', '💻'),
  ('Account Access', 'Issues related to account access or login', '#10B981', '🔐'),
  ('General Inquiry', 'General questions or concerns', '#6366F1', '💬'),
  ('Facilities', 'Issues related to facilities or infrastructure', '#F59E0B', '🏢'),
  ('Other', 'Other issues not covered by above categories', '#6B7280', '📋')
ON CONFLICT DO NOTHING;

-- Insert default complaint priorities if they don't exist
INSERT INTO complaint_priorities (name, level, color) VALUES
  ('Low', 1, '#10B981'),
  ('Medium', 2, '#F59E0B'),
  ('High', 3, '#EF4444'),
  ('Critical', 4, '#DC2626')
ON CONFLICT DO NOTHING;