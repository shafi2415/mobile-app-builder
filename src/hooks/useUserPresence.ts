import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UserPresence {
  user_id: string;
  full_name: string;
  online_at: string;
}

export const useUserPresence = (channelName: string = "community-chat") => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users: UserPresence[] = [];
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            users.push({
              user_id: presence.user_id,
              full_name: presence.full_name,
              online_at: presence.online_at,
            });
          });
        });
        setOnlineUsers(users);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        console.log("User joined:", key, newPresences);
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        console.log("User left:", key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Fetch user's full name
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .single();

          await channel.track({
            user_id: user.id,
            full_name: profile?.full_name || "Anonymous",
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [user, channelName]);

  const isUserOnline = (userId: string) => {
    return onlineUsers.some((u) => u.user_id === userId);
  };

  return {
    onlineUsers,
    isUserOnline,
    onlineCount: onlineUsers.length,
  };
};