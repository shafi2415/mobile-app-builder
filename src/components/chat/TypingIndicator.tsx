import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface TypingUser {
  userId: string;
  fullName: string;
}

export const TypingIndicator = () => {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel("typing-indicator");

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users: TypingUser[] = [];
        
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.userId !== user.id && presence.typing) {
              users.push({
                userId: presence.userId,
                fullName: presence.fullName,
              });
            }
          });
        });
        
        setTypingUsers(users);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (typingUsers.length === 0) return null;

  const displayText =
    typingUsers.length === 1
      ? `${typingUsers[0].fullName} is typing...`
      : typingUsers.length === 2
      ? `${typingUsers[0].fullName} and ${typingUsers[1].fullName} are typing...`
      : `${typingUsers.length} people are typing...`;

  return (
    <div className="px-4 py-2 text-sm text-muted-foreground flex items-center gap-2">
      <div className="flex gap-1">
        <span className="animate-bounce" style={{ animationDelay: "0ms" }}>
          •
        </span>
        <span className="animate-bounce" style={{ animationDelay: "150ms" }}>
          •
        </span>
        <span className="animate-bounce" style={{ animationDelay: "300ms" }}>
          •
        </span>
      </div>
      <span>{displayText}</span>
    </div>
  );
};

export const useTypingIndicator = () => {
  const { user } = useAuth();
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const typingChannel = supabase.channel("typing-indicator", {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    typingChannel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        setChannel(typingChannel);
        
        // Track initial presence as not typing
        await typingChannel.track({
          userId: user.id,
          fullName: profile?.full_name || "Anonymous",
          typing: false,
        });
      }
    });

    return () => {
      typingChannel.untrack();
      supabase.removeChannel(typingChannel);
    };
  }, [user]);

  const setTyping = async (isTyping: boolean) => {
    if (!channel || !user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    await channel.track({
      userId: user.id,
      fullName: profile?.full_name || "Anonymous",
      typing: isTyping,
    });
  };

  return { setTyping };
};