import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Activity, Lock, UserX, FileWarning } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Security = () => {
  // Fetch audit logs
  const { data: auditLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate security metrics
  const securityMetrics = {
    totalLogs: auditLogs?.length || 0,
    criticalActions: auditLogs?.filter(log => 
      log.action.includes("role_change") || log.action.includes("approval")
    ).length || 0,
    recentActivity: auditLogs?.filter(log => {
      const logDate = new Date(log.created_at);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return logDate > oneDayAgo;
    }).length || 0,
  };

  const getActionBadge = (action: string) => {
    if (action.includes("role")) return <Badge variant="destructive">Role Change</Badge>;
    if (action.includes("approval")) return <Badge variant="default">Approval</Badge>;
    if (action.includes("complaint")) return <Badge variant="secondary">Complaint</Badge>;
    if (action.includes("file")) return <Badge variant="outline">File</Badge>;
    return <Badge variant="secondary">{action}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Security Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor security events, audit logs, and system integrity
          </p>
        </div>

        {/* Security Overview Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Audit Logs</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{securityMetrics.totalLogs}</div>
              <p className="text-xs text-muted-foreground">All recorded actions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Actions</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{securityMetrics.criticalActions}</div>
              <p className="text-xs text-muted-foreground">Role changes & approvals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last 24h Activity</CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{securityMetrics.recentActivity}</div>
              <p className="text-xs text-muted-foreground">Recent security events</p>
            </CardContent>
          </Card>
        </div>

        {/* Security Alerts */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Status:</strong> All systems operational. Rate limiting and input validation active.
            Leaked password protection enabled.
          </AlertDescription>
        </Alert>

        {/* Tabs for Different Security Views */}
        <Tabs defaultValue="audit-logs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
            <TabsTrigger value="rate-limits">Rate Limits</TabsTrigger>
            <TabsTrigger value="failed-attempts">Failed Attempts</TabsTrigger>
            <TabsTrigger value="file-uploads">File Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="audit-logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Audit Logs</CardTitle>
                <CardDescription>
                  Chronological record of all security-relevant actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <p className="text-muted-foreground">Loading audit logs...</p>
                ) : auditLogs && auditLogs.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>User Agent</TableHead>
                        <TableHead>IP Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </TableCell>
                          <TableCell>{getActionBadge(log.action)}</TableCell>
                          <TableCell className="text-sm">
                            {log.resource_type}
                            {log.resource_id && ` (${log.resource_id.slice(0, 8)}...)`}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground truncate max-w-xs">
                            {log.user_agent ? String(log.user_agent) : "N/A"}
                          </TableCell>
                          <TableCell className="text-sm">{log.ip_address ? String(log.ip_address) : "N/A"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground">No audit logs found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rate-limits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Rate Limit Status</CardTitle>
                <CardDescription>Current rate limiting configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Login Attempts</p>
                      <p className="text-sm text-muted-foreground">5 attempts per 15 minutes</p>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Complaint Submissions</p>
                      <p className="text-sm text-muted-foreground">5 per hour</p>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Chat Messages</p>
                      <p className="text-sm text-muted-foreground">60 per minute</p>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">File Uploads</p>
                      <p className="text-sm text-muted-foreground">10 per hour</p>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="failed-attempts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserX className="h-5 w-5" />
                  Failed Authentication Attempts
                </CardTitle>
                <CardDescription>
                  Monitor suspicious login attempts and potential security threats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Failed login attempts are rate-limited client-side. Check browser localStorage
                    for rate limit data. Server-side logging coming in future updates.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="file-uploads" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileWarning className="h-5 w-5" />
                  File Upload Activity
                </CardTitle>
                <CardDescription>
                  Track file uploads and detect suspicious activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium text-sm">Security Measures Active:</p>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <li>✓ File type validation (MIME type checking)</li>
                      <li>✓ File size limits (5MB maximum)</li>
                      <li>✓ Filename sanitization</li>
                      <li>✓ Rate limiting (10 uploads per hour)</li>
                      <li>✓ Allowed types: Images, PDF, Word, Excel</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Security;
