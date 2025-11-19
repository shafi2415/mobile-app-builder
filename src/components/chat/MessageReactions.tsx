import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MessageReactionsProps {
  messageId: string;
}

const REACTIONS = ["👍", "❤️", "😂", "🎉", "🤔", "👏"];

export const MessageReactions = ({ messageId }: MessageReactionsProps) => {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReactions();

    const channel = supabase
      .channel(`reactions:${messageId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reactions",
          filter: `message_id=eq.${messageId}`,
        },
        () => {
          fetchReactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messageId]);

  const fetchReactions = async () => {
    const { data, error } = await supabase
      .from("message_reactions")
      .select("*")
      .eq("message_id", messageId);

    if (!error && data) {
      setReactions(data);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!user || loading) return;

    setLoading(true);
    try {
      const existingReaction = reactions.find(
        (r) => r.user_id === user.id && r.reaction === emoji
      );

      if (existingReaction) {
        const { error } = await supabase
          .from("message_reactions")
          .delete()
          .eq("id", existingReaction.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("message_reactions")
          .insert({
            message_id: messageId,
            user_id: user.id,
            reaction: emoji,
          });

        if (error) throw error;
      }
    } catch (error) {
      toast.error("Failed to add reaction");
    } finally {
      setLoading(false);
    }
  };

  const groupedReactions = reactions.reduce((acc: any, reaction) => {
    if (!acc[reaction.reaction]) {
      acc[reaction.reaction] = {
        count: 0,
        users: [],
        hasUserReacted: false,
      };
    }
    acc[reaction.reaction].count++;
    acc[reaction.reaction].users.push(reaction.user_id);
    if (reaction.user_id === user?.id) {
      acc[reaction.reaction].hasUserReacted = true;
    }
    return acc;
  }, {});

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {Object.entries(groupedReactions).map(([emoji, data]: [string, any]) => (
        <Button
          key={emoji}
          variant={data.hasUserReacted ? "default" : "outline"}
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => handleReaction(emoji)}
          disabled={loading}
        >
          <span className="mr-1">{emoji}</span>
          <span>{data.count}</span>
        </Button>
      ))}

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <Smile className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="flex gap-1">
            {REACTIONS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-lg"
                onClick={() => handleReaction(emoji)}
                disabled={loading}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};