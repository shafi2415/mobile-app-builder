import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export const RealtimeNotifications = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Subscribe to complaint status changes
    const complaintsChannel = supabase
      .channel("complaint-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "complaints",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const oldStatus = (payload.old as any)?.status;
          const newStatus = (payload.new as any)?.status;
          
          if (oldStatus !== newStatus) {
            toast({
              title: "Complaint Status Updated",
              description: `Your complaint status changed to: ${newStatus}`,
            });
          }
        }
      )
      .subscribe();

    // Subscribe to new responses
    const responsesChannel = supabase
      .channel("response-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "complaint_responses",
        },
        async (payload) => {
          const response = payload.new as any;
          
          // Check if this response belongs to user's complaint
          const { data: complaint } = await supabase
            .from("complaints")
            .select("user_id, tracking_id")
            .eq("id", response.complaint_id)
            .single();

          if (complaint?.user_id === user.id && !response.is_internal_note) {
            toast({
              title: "New Response",
              description: `Admin responded to your complaint ${complaint.tracking_id}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(complaintsChannel);
      supabase.removeChannel(responsesChannel);
    };
  }, [user, toast]);

  return null;
};
