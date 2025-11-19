import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useDeviceTracking = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const trackDevice = async () => {
      try {
        const deviceInfo = {
          device_name: navigator.platform,
          device_type: /mobile/i.test(navigator.userAgent) ? "mobile" : "desktop",
          browser: getBrowserName(),
          user_agent: navigator.userAgent,
        };

        // Check if device already exists
        const { data: existingSessions } = await supabase
          .from("device_sessions")
          .select("id")
          .eq("user_id", user.id)
          .eq("user_agent", navigator.userAgent)
          .eq("revoked", false)
          .single();

        if (!existingSessions) {
          // Create new device session
          await supabase.from("device_sessions").insert({
            user_id: user.id,
            ...deviceInfo,
          });
        } else {
          // Update last_active timestamp
          await supabase
            .from("device_sessions")
            .update({ last_active: new Date().toISOString() })
            .eq("id", existingSessions.id);
        }
      } catch (error) {
        console.error("Error tracking device:", error);
      }
    };

    trackDevice();

    // Update last_active every 5 minutes
    const interval = setInterval(() => {
      trackDevice();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  const logoutAllDevices = async () => {
    if (!user) return;

    try {
      // Revoke all device sessions
      await supabase
        .from("device_sessions")
        .update({ revoked: true, revoked_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("revoked", false);

      // Sign out current session
      await supabase.auth.signOut();

      return { success: true };
    } catch (error) {
      console.error("Error logging out all devices:", error);
      return { success: false, error };
    }
  };

  return { logoutAllDevices };
};

const getBrowserName = () => {
  const userAgent = navigator.userAgent;
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Edge")) return "Edge";
  return "Unknown";
};
