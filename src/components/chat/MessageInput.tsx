import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";
import { useRateLimit } from "@/hooks/useRateLimit";
import { chatMessageSchema } from "@/lib/validation";
import { sanitizeText } from "@/lib/sanitize";

interface MessageInputProps {
  replyTo?: { id: string; userName: string } | null;
  onCancelReply?: () => void;
  onTyping?: (isTyping: boolean) => void;
}

export const MessageInput = ({ replyTo, onCancelReply, onTyping }: MessageInputProps) => {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const { checkRateLimit, incrementAttempts } = useRateLimit("chat");

  // Handle typing indicator
  useEffect(() => {
    if (message.trim()) {
      if (!isTyping) {
        setIsTyping(true);
        onTyping?.(true);
      }
    } else {
      if (isTyping) {
        setIsTyping(false);
        onTyping?.(false);
      }
    }

    // Debounce: stop typing after 2 seconds of no input
    const timeout = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        onTyping?.(false);
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [message, isTyping, onTyping]);

  const handleSend = async () => {
    if (!message.trim() || !user || sending) return;

    // Check rate limit
    const rateCheck = checkRateLimit();
    if (!rateCheck.allowed) {
      toast.error("You're sending messages too quickly. Please slow down.");
      return;
    }

    // Validate message
    const result = chatMessageSchema.safeParse({
      message: message.trim(),
      parent_id: replyTo?.id || null,
    });

    if (!result.success) {
      toast.error(result.error.errors[0]?.message || "Invalid message");
      return;
    }

    setSending(true);
    try {
      const sanitizedMessage = sanitizeText(message.trim());
      
      const { error } = await supabase.from("chat_messages").insert({
        user_id: user.id,
        message: sanitizedMessage,
        parent_id: replyTo?.id || null,
      });

      if (error) throw error;

      incrementAttempts();
      setMessage("");
      onCancelReply?.();
      onTyping?.(false);
      setIsTyping(false);
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t bg-background p-4">
      {replyTo && (
        <div className="mb-2 flex items-center justify-between bg-muted p-2 rounded-md">
          <span className="text-sm text-muted-foreground">
            Replying to <span className="font-semibold">{replyTo.userName}</span>
          </span>
          <Button variant="ghost" size="sm" onClick={onCancelReply}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="flex gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={replyTo ? "Write a reply..." : "Type a message..."}
          className="resize-none touch-manipulation"
          rows={2}
          disabled={sending}
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() || sending}
          size="icon"
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
};