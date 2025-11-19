import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, MoreVertical, Pin, Trash2, Edit2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { MessageReactions } from "./MessageReactions";

interface MessageItemProps {
  message: any;
  onReply: (messageId: string, userName: string) => void;
  onEdit?: (messageId: string, content: string) => void;
  showReplies?: boolean;
  isReply?: boolean;
}

export const MessageItem = ({ message, onReply, onEdit, showReplies = true, isReply = false }: MessageItemProps) => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.message);

  const isOwnMessage = user?.id === message.user_id;
  const canModerate = isAdmin || isSuperAdmin;

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("chat_messages")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", message.id);

      if (error) throw error;
      toast.success("Message deleted");
    } catch (error) {
      toast.error("Failed to delete message");
    }
  };

  const handlePin = async () => {
    try {
      const { error } = await supabase
        .from("chat_messages")
        .update({
          pinned: !message.pinned,
          pinned_by: !message.pinned ? user?.id : null,
          pinned_at: !message.pinned ? new Date().toISOString() : null,
        })
        .eq("id", message.id);

      if (error) throw error;
      toast.success(message.pinned ? "Message unpinned" : "Message pinned");
    } catch (error) {
      toast.error("Failed to pin message");
    }
  };

  const handleEditSave = async () => {
    if (!editContent.trim()) return;

    try {
      const { error } = await supabase
        .from("chat_messages")
        .update({
          message: editContent,
          edited_at: new Date().toISOString(),
        })
        .eq("id", message.id);

      if (error) throw error;
      setIsEditing(false);
      toast.success("Message updated");
    } catch (error) {
      toast.error("Failed to update message");
    }
  };

  const userName = message.profiles?.full_name || "Anonymous";
  const initials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`group ${isReply ? "ml-8 mt-2" : ""} ${message.pinned ? "border-l-4 border-primary pl-3" : ""}`}>
      <div className="flex gap-3 hover:bg-muted/50 p-3 rounded-lg transition-colors">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{userName}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </span>
            {message.edited_at && (
              <span className="text-xs text-muted-foreground italic">(edited)</span>
            )}
            {message.pinned && (
              <Pin className="h-3 w-3 text-primary" />
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 border rounded-md resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEditSave}>Save</Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
          )}

          <div className="flex items-center gap-2 mt-2">
            <MessageReactions messageId={message.id} />
            
            {showReplies && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onReply(message.id, userName)}
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}

            {(isOwnMessage || canModerate) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isOwnMessage && (
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit2 className="h-3 w-3 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {canModerate && (
                    <DropdownMenuItem onClick={handlePin}>
                      <Pin className="h-3 w-3 mr-2" />
                      {message.pinned ? "Unpin" : "Pin"}
                    </DropdownMenuItem>
                  )}
                  {(isOwnMessage || canModerate) && (
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};