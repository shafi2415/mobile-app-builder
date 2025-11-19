import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users } from "lucide-react";

interface OnlineUsersProps {
  users: Array<{
    user_id: string;
    full_name: string;
    online_at: string;
  }>;
}

export const OnlineUsers = ({ users }: OnlineUsersProps) => {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-4 w-4" />
        <h3 className="font-semibold">Online ({users.length})</h3>
      </div>
      
      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {users.map((user) => {
            const initials = user.full_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <div key={user.user_id} className="flex items-center gap-2">
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                </div>
                <span className="text-sm">{user.full_name}</span>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
};