import { useState, useEffect, useRef } from "react";
import { StudentLayout } from "@/components/layouts/StudentLayout";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { MessageItem } from "@/components/chat/MessageItem";
import { MessageInput } from "@/components/chat/MessageInput";
import { OnlineUsers } from "@/components/chat/OnlineUsers";
import { MessageSearch } from "@/components/chat/MessageSearch";
import { useUserPresence } from "@/hooks/useUserPresence";
import { Skeleton } from "@/components/ui/skeleton";
import { Pin, Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const Community = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<{ id: string; userName: string } | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { onlineUsers, onlineCount } = useUserPresence();

  const handleReply = (id: string, userName: string) => {
    setReplyTo({ id, userName });
  };

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel("chat-messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select(`
        *,
        profiles:user_id (full_name)
      `)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
    setLoading(false);
  };

  const pinnedMessages = isSearchActive ? filteredMessages.filter((m) => m.pinned) : messages.filter((m) => m.pinned);
  const regularMessages = isSearchActive 
    ? filteredMessages.filter((m) => !m.pinned && !m.parent_id)
    : messages.filter((m) => !m.pinned && !m.parent_id);

  const getReplies = (parentId: string) => {
    const sourceMessages = isSearchActive ? filteredMessages : messages;
    return sourceMessages.filter((m) => m.parent_id === parentId);
  };

  const handleSearch = (results: any[]) => {
    setFilteredMessages(results);
    setIsSearchActive(true);
  };

  const handleClearSearch = () => {
    setFilteredMessages([]);
    setIsSearchActive(false);
  };

  return (
    <StudentLayout>
      <div className="space-y-6 h-[calc(100vh-8rem)]">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Community Chat</h1>
              <p className="text-muted-foreground">
                Connect with fellow students • {onlineCount} online
                {isSearchActive && ` • ${filteredMessages.length} results`}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSearch(!showSearch)}
            >
              <SearchIcon className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100%-5rem)]">
          <Card className="lg:col-span-3 flex flex-col h-full">
            {showSearch && (
              <MessageSearch onSearch={handleSearch} onClear={handleClearSearch} />
            )}
            
            {pinnedMessages.length > 0 && (
              <div className="border-b bg-muted/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Pin className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Pinned Messages</span>
                </div>
                {pinnedMessages.map((message) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    onReply={handleReply}
                    showReplies={false}
                  />
                ))}
              </div>
            )}

            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : regularMessages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No messages yet. Be the first to start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {regularMessages.map((message) => (
                    <div key={message.id}>
                      <MessageItem
                        message={message}
                        onReply={handleReply}
                      />
                      {getReplies(message.id).map((reply) => (
                        <MessageItem
                          key={reply.id}
                          message={reply}
                          onReply={handleReply}
                          isReply
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <MessageInput
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
            />
          </Card>

          <div className="hidden lg:block">
            <OnlineUsers users={onlineUsers} />
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default Community;
