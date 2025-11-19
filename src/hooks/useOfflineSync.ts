import { useEffect } from "react";
import { offlineStorage } from "@/lib/offlineStorage";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export const useOfflineSync = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const handleOnline = async () => {
      console.log("Connection restored, syncing pending items...");
      
      await offlineStorage.syncPendingItems(
        async (draft) => {
          // Sync complaint draft
          const { error } = await supabase.from("complaints").insert({
            user_id: user.id,
            subject: draft.subject,
            description: draft.description,
            category_id: draft.category_id,
            priority_id: draft.priority_id,
            channel: draft.channel as any,
          });

          if (error) throw error;

          toast({
            title: "Draft Submitted",
            description: "Your offline complaint draft has been submitted",
          });
        },
        async (message) => {
          // Sync queued message
          const { error } = await supabase.from("chat_messages").insert({
            user_id: user.id,
            message: message.message,
            parent_id: message.parent_id,
          });

          if (error) throw error;

          toast({
            title: "Message Sent",
            description: "Your offline message has been sent",
          });
        }
      );
    };

    const handleOffline = () => {
      toast({
        title: "You're Offline",
        description: "Your changes will be saved and synced when you're back online",
        variant: "destructive",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Sync on mount if online
    if (offlineStorage.isOnline()) {
      handleOnline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [user, toast]);
};
