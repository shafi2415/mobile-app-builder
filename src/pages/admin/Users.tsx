import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle, Shield, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminUsers = () => {
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const rolesMap = roles.reduce((acc, r) => {
        if (!acc[r.user_id]) acc[r.user_id] = [];
        acc[r.user_id].push(r.role);
        return acc;
      }, {} as Record<string, string[]>);

      return profiles.map(p => ({
        ...p,
        roles: rolesMap[p.id] || []
      }));
    }
  });

  const approveUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ admin_approved: true })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("User approved successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast.error("Failed to approve user")
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: "student" | "admin" | "super_admin" }) => {
      // Remove existing role
      await supabase.from("user_roles").delete().eq("user_id", userId);
      
      // Add new role
      const { error } = await supabase
        .from("user_roles")
        .insert([{ user_id: userId, role: newRole }]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast.error("Failed to update role")
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <Card className="p-6">
          <div className="text-center py-12">Loading users...</div>
        </Card>
      </AdminLayout>
    );
  }

  const pendingUsers = users?.filter(u => !u.admin_approved) || [];
  const approvedUsers = users?.filter(u => u.admin_approved) || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Pending Approvals</h2>
          {pendingUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No pending user approvals</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email Verified</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>
                      <Badge variant={user.email_verified ? "default" : "secondary"}>
                        {user.email_verified ? "Verified" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => approveUserMutation.mutate(user.id)}
                        disabled={approveUserMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">All Users</h2>
          {approvedUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No approved users yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.phone || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={user.roles.includes("admin") || user.roles.includes("super_admin") ? "destructive" : "default"}>
                        {user.roles.includes("super_admin") ? (
                          <><Shield className="h-3 w-3 mr-1" />Super Admin</>
                        ) : user.roles.includes("admin") ? (
                          <><Shield className="h-3 w-3 mr-1" />Admin</>
                        ) : (
                          <><User className="h-3 w-3 mr-1" />Student</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.admin_approved ? "default" : "secondary"}>
                        {user.admin_approved ? "Approved" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        defaultValue={user.roles[0] || "student"}
                        onValueChange={(value: "student" | "admin" | "super_admin") => updateRoleMutation.mutate({ userId: user.id, newRole: value })}
                        disabled={updateRoleMutation.isPending}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
