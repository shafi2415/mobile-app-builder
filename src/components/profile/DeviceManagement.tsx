import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Monitor, LogOut, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useDeviceTracking } from "@/hooks/useDeviceTracking";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const DeviceManagement = () => {
  const { toast } = useToast();
  const { logoutAllDevices } = useDeviceTracking();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["device-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("device_sessions")
        .select("*")
        .eq("revoked", false)
        .order("last_active", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleLogoutAllDevices = async () => {
    setIsLoggingOut(true);
    const result = await logoutAllDevices();
    
    if (result.success) {
      toast({
        title: "Logged out from all devices",
        description: "You have been logged out from all devices successfully.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to logout from all devices. Please try again.",
        variant: "destructive",
      });
    }
    setIsLoggingOut(false);
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("device_sessions")
        .update({ revoked: true, revoked_at: new Date().toISOString() })
        .eq("id", sessionId);

      if (error) throw error;

      toast({
        title: "Session revoked",
        description: "The device session has been revoked successfully.",
      });
    } catch (error) {
      console.error("Error revoking session:", error);
      toast({
        title: "Error",
        description: "Failed to revoke session. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Loading device sessions...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Active Devices</span>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isLoggingOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout All Devices
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Logout from all devices?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will sign you out from all devices and sessions. You'll need to log in again on each device.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogoutAllDevices} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Logout All Devices
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardTitle>
        <CardDescription>
          Manage your active sessions and devices
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!sessions || sessions.length === 0 ? (
          <p className="text-muted-foreground">No active sessions found</p>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {session.device_type === "mobile" ? (
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Monitor className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">{session.browser} on {session.device_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Last active: {formatDistanceToNow(new Date(session.last_active), { addSuffix: true })}
                    </p>
                  {session.ip_address && (
                      <p className="text-xs text-muted-foreground">IP: {String(session.ip_address)}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400">
                    Active
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevokeSession(session.id)}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
