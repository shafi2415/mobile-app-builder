-- Create notification trigger function for complaint status changes
CREATE OR REPLACE FUNCTION notify_complaint_status_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only create notification if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      NEW.user_id,
      'complaint_status',
      'Complaint Status Updated',
      'Your complaint ' || NEW.tracking_id || ' status changed to: ' || NEW.status,
      '/student/complaints/' || NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for complaint status changes
DROP TRIGGER IF EXISTS complaint_status_notification ON complaints;
CREATE TRIGGER complaint_status_notification
  AFTER UPDATE ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION notify_complaint_status_change();

-- Create notification trigger function for complaint responses
CREATE OR REPLACE FUNCTION notify_complaint_response()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  complaint_user_id uuid;
  complaint_tracking_id text;
BEGIN
  -- Get complaint user_id and tracking_id
  SELECT user_id, tracking_id INTO complaint_user_id, complaint_tracking_id
  FROM complaints
  WHERE id = NEW.complaint_id;
  
  -- Only notify if response is not an internal note
  IF NOT NEW.is_internal_note THEN
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      complaint_user_id,
      'complaint_response',
      'New Response to Your Complaint',
      'An admin has responded to your complaint ' || complaint_tracking_id,
      '/student/complaints/' || NEW.complaint_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for complaint responses
DROP TRIGGER IF EXISTS complaint_response_notification ON complaint_responses;
CREATE TRIGGER complaint_response_notification
  AFTER INSERT ON complaint_responses
  FOR EACH ROW
  EXECUTE FUNCTION notify_complaint_response();