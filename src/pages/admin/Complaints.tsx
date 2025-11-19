import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { BulkComplaintActions } from "@/components/admin/BulkComplaintActions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageSquare, Clock, CheckCircle2, Eye, Send, FileText } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

const RESPONSE_TEMPLATES = [
  {
    name: "Investigating",
    content: "Thank you for reporting this issue. We are currently investigating the matter and will update you shortly.",
  },
  {
    name: "Need More Info",
    content: "To better assist you, we need additional information. Could you please provide more details about the issue?",
  },
  {
    name: "Resolved",
    content: "We're pleased to inform you that your issue has been resolved. Please let us know if you need any further assistance.",
  },
  {
    name: "Escalated",
    content: "Your issue has been escalated to our senior support team for further review. We appreciate your patience.",
  },
];

const AdminComplaints = () => {
  const queryClient = useQueryClient();
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [response, setResponse] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: complaints, isLoading } = useQuery({
    queryKey: ["admin-complaints", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("complaints")
        .select(`
          *,
          profiles(full_name),
          complaint_categories(name, color),
          complaint_priorities(name, level, color)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const { data: complaintResponses } = useQuery({
    queryKey: ["complaint-responses", selectedComplaint?.id],
    queryFn: async () => {
      if (!selectedComplaint?.id) return [];
      
      const { data, error } = await supabase
        .from("complaint_responses")
        .select("*")
        .eq("complaint_id", selectedComplaint.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!selectedComplaint?.id,
  });

  const { data: complaintFiles } = useQuery({
    queryKey: ["complaint-files", selectedComplaint?.id],
    queryFn: async () => {
      if (!selectedComplaint?.id) return [];
      
      const { data, error } = await supabase
        .from("complaint_files")
        .select("*")
        .eq("complaint_id", selectedComplaint.id);

      if (error) throw error;
      return data;
    },
    enabled: !!selectedComplaint?.id,
  });

  const { data: admins } = useQuery({
    queryKey: ["admins"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, profiles(id, full_name)")
        .in("role", ["admin", "super_admin"]);

      if (error) throw error;
      return data.map((r: any) => ({ id: r.user_id, full_name: r.profiles.full_name }));
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: any }) => {
      const { data, error } = await supabase
        .from("complaints")
        .update({ 
          status,
          resolved_at: status === "resolved" ? new Date().toISOString() : null
        })
        .eq("id", id)
        .select("user_id, tracking_id")
        .single();
        
      if (error) throw error;

      // Send email notification
      if (data) {
        await supabase.functions.invoke("send-notification-email", {
          body: {
            userId: data.user_id,
            type: "status_change",
            trackingId: data.tracking_id,
            subject: "Complaint Status Updated",
            message: `Your complaint status has been changed to: ${status.replace("_", " ").toUpperCase()}`,
          },
        });
      }
    },
    onSuccess: () => {
      toast.success("Status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-complaints"] });
    },
    onError: () => toast.error("Failed to update status")
  });

  const addResponseMutation = useMutation({
    mutationFn: async ({ complaintId, message, isInternal }: { complaintId: string; message: string; isInternal: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("complaint_responses")
        .insert({
          complaint_id: complaintId,
          responder_id: user.id,
          message,
          is_internal_note: isInternal
        });
        
      if (error) throw error;

      // Send email notification if not internal note
      if (!isInternal && selectedComplaint) {
        await supabase.functions.invoke("send-notification-email", {
          body: {
            userId: selectedComplaint.user_id,
            type: "admin_response",
            trackingId: selectedComplaint.tracking_id,
            subject: "New Response to Your Complaint",
            message,
          },
        });
      }
    },
    onSuccess: () => {
      toast.success("Response added successfully");
      setResponse("");
      setIsInternalNote(false);
      queryClient.invalidateQueries({ queryKey: ["complaint-responses"] });
    },
    onError: () => toast.error("Failed to add response")
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted": return "bg-blue-500";
      case "in_review": return "bg-yellow-500";
      case "processing": return "bg-orange-500";
      case "resolved": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const handleTemplateSelect = (template: string) => {
    const selectedTemplate = RESPONSE_TEMPLATES.find(t => t.name === template);
    if (selectedTemplate) {
      setResponse(selectedTemplate.content);
    }
  };

  const handleViewComplaint = (complaint: any) => {
    setSelectedComplaint(complaint);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <Card className="p-6">
          <div className="text-center py-12">Loading complaints...</div>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Complaint Management</h2>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <BulkComplaintActions
            selectedIds={selectedIds}
            onActionComplete={() => {
              queryClient.invalidateQueries({ queryKey: ["admin-complaints"] });
            }}
            onClearSelection={() => setSelectedIds([])}
            admins={admins || []}
          />

          <div className="rounded-md border">
            <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === complaints.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedIds(complaints.map((c: any) => c.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                />
              </TableHead>
              <TableHead>Tracking ID</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaints?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      No complaints found
                    </TableCell>
                  </TableRow>
                ) : (
                  complaints?.map((complaint) => (
                    <TableRow key={complaint.id}>
                      <TableCell className="font-mono text-sm">{complaint.tracking_id}</TableCell>
                      <TableCell className="font-medium">{complaint.subject}</TableCell>
                      <TableCell>{(complaint as any).profiles?.full_name || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" style={{ backgroundColor: `${complaint.complaint_categories?.color}20`, borderColor: complaint.complaint_categories?.color }}>
                          {complaint.complaint_categories?.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" style={{ backgroundColor: `${complaint.complaint_priorities?.color}20`, borderColor: complaint.complaint_priorities?.color }}>
                          {complaint.complaint_priorities?.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(complaint.status)}>
                          {complaint.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(complaint.created_at), "PP")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewComplaint(complaint)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Complaint Details Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Complaint Details - {selectedComplaint?.tracking_id}</DialogTitle>
            </DialogHeader>

            {selectedComplaint && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Subject</p>
                    <p className="font-semibold">{selectedComplaint.subject}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Student</p>
                    <p className="font-semibold">{(selectedComplaint as any).profiles?.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Select
                      value={selectedComplaint.status}
                      onValueChange={(value) => 
                        updateStatusMutation.mutate({ id: selectedComplaint.id, status: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="in_review">In Review</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Channel</p>
                    <p className="font-semibold capitalize">{selectedComplaint.channel}</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <Card className="p-4 bg-muted/50">
                    <p className="whitespace-pre-wrap">{selectedComplaint.description}</p>
                  </Card>
                </div>

                {/* Files */}
                {complaintFiles && complaintFiles.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Attachments</p>
                    <div className="space-y-2">
                      {complaintFiles.map((file: any) => (
                        <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="font-medium">{file.file_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(file.file_size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Response History */}
                {complaintResponses && complaintResponses.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Response History</p>
                    <div className="space-y-3">
                      {complaintResponses.map((resp: any) => (
                        <Card key={resp.id} className={`p-4 ${resp.is_internal_note ? "bg-yellow-50 dark:bg-yellow-900/10" : ""}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(resp.created_at), "PPp")}
                            </span>
                            {resp.is_internal_note && (
                              <Badge variant="outline" className="text-xs">Internal Note</Badge>
                            )}
                          </div>
                          <p className="whitespace-pre-wrap">{resp.message}</p>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Response Composer */}
                <div className="border-t pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Add Response</h3>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            id="internal-note"
                            checked={isInternalNote}
                            onCheckedChange={setIsInternalNote}
                          />
                          <Label htmlFor="internal-note" className="text-sm">
                            Internal Note
                          </Label>
                        </div>
                        <Select onValueChange={handleTemplateSelect}>
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Use Template" />
                          </SelectTrigger>
                          <SelectContent>
                            {RESPONSE_TEMPLATES.map((template) => (
                              <SelectItem key={template.name} value={template.name}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Textarea
                      placeholder="Write your response here..."
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />

                    <div className="flex justify-end">
                      <Button
                        onClick={() => {
                          if (response.trim()) {
                            addResponseMutation.mutate({
                              complaintId: selectedComplaint.id,
                              message: response,
                              isInternal: isInternalNote,
                            });
                          }
                        }}
                        disabled={!response.trim() || addResponseMutation.isPending}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Send Response
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminComplaints;
