import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { MessageItem } from "@/components/chat/MessageItem";
import { OnlineUsers } from "@/components/chat/OnlineUsers";
import { useUserPresence } from "@/hooks/useUserPresence";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Shield, MessageSquare, Users, Pin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AdminCommunity = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [deletedMessages, setDeletedMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { onlineUsers, onlineCount } = useUserPresence("admin-community");

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel("admin-chat-monitor")
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

  const fetchMessages = async () => {
    const { data: activeMessages } = await supabase
      .from("chat_messages")
      .select(`
        *,
        profiles:user_id (full_name)
      `)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(100);

    const { data: deleted } = await supabase
      .from("chat_messages")
      .select(`
        *,
        profiles:user_id (full_name)
      `)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false })
      .limit(50);

    if (activeMessages) setMessages(activeMessages);
    if (deleted) setDeletedMessages(deleted);
    setLoading(false);
  };

  const pinnedMessages = messages.filter((m) => m.pinned);
  const regularMessages = messages.filter((m) => !m.pinned);

  const stats = {
    totalMessages: messages.length,
    pinnedMessages: pinnedMessages.length,
    deletedMessages: deletedMessages.length,
    onlineUsers: onlineCount,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Community Moderation</h2>
          <p className="text-muted-foreground">
            Monitor and moderate community discussions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Messages</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalMessages}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Pin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Pinned</span>
            </div>
            <p className="text-2xl font-bold">{stats.pinnedMessages}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Deleted</span>
            </div>
            <p className="text-2xl font-bold">{stats.deletedMessages}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Online</span>
            </div>
            <p className="text-2xl font-bold">{stats.onlineUsers}</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-3 p-6">
            <Tabs defaultValue="active">
              <TabsList className="mb-4">
                <TabsTrigger value="active">
                  Active Messages
                  <Badge variant="secondary" className="ml-2">
                    {messages.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="pinned">
                  Pinned
                  <Badge variant="secondary" className="ml-2">
                    {pinnedMessages.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="deleted">
                  Deleted
                  <Badge variant="secondary" className="ml-2">
                    {deletedMessages.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active">
                <ScrollArea className="h-[600px]">
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
                      <p>No messages to moderate</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {regularMessages.map((message) => (
                        <MessageItem
                          key={message.id}
                          message={message}
                          onReply={() => {}}
                          showReplies={false}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="pinned">
                <ScrollArea className="h-[600px]">
                  {pinnedMessages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No pinned messages</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pinnedMessages.map((message) => (
                        <MessageItem
                          key={message.id}
                          message={message}
                          onReply={() => {}}
                          showReplies={false}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="deleted">
                <ScrollArea className="h-[600px]">
                  {deletedMessages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No deleted messages</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {deletedMessages.map((message) => (
                        <div
                          key={message.id}
                          className="opacity-50 bg-muted/50 p-3 rounded-lg"
                        >
                          <MessageItem
                            message={message}
                            onReply={() => {}}
                            showReplies={false}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </Card>

          <div className="hidden lg:block">
            <OnlineUsers users={onlineUsers} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCommunity;
