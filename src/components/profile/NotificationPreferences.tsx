import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Bell, Mail, MessageSquare } from "lucide-react";

export const NotificationPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    email: true,
    push: true,
    statusChanges: true,
    adminResponses: true,
    communityMentions: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("notification_preferences")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data?.notification_preferences) {
        setPreferences(data.notification_preferences as typeof preferences);
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ notification_preferences: preferences })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Notification preferences updated");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading preferences...</div>;
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Notification Preferences</h3>
          <p className="text-sm text-muted-foreground">
            Manage how you receive notifications about your complaints and community activity
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="email">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
            </div>
            <Switch
              id="email"
              checked={preferences.email}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, email: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="push">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive push notifications in-app
                </p>
              </div>
            </div>
            <Switch
              id="push"
              checked={preferences.push}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, push: checked })
              }
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Notification Types</h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="statusChanges">Complaint Status Changes</Label>
                <Switch
                  id="statusChanges"
                  checked={preferences.statusChanges}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, statusChanges: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="adminResponses">Admin Responses</Label>
                <Switch
                  id="adminResponses"
                  checked={preferences.adminResponses}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, adminResponses: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="communityMentions">Community Mentions</Label>
                </div>
                <Switch
                  id="communityMentions"
                  checked={preferences.communityMentions}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, communityMentions: checked })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </Card>
  );
};