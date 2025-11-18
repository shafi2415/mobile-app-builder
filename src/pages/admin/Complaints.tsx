import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageSquare, Clock, CheckCircle2, Eye } from "lucide-react";
import { useState } from "react";

const AdminComplaints = () => {
  const queryClient = useQueryClient();
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [response, setResponse] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: complaints, isLoading } = useQuery({
    queryKey: ["admin-complaints", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("complaints")
        .select(`
          *,
          profiles!complaints_user_id_fkey(full_name),
          complaint_categories(name, color),
          complaint_priorities(name, level, color),
          complaint_responses(count)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as "submitted" | "in_review" | "processing" | "resolved");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "submitted" | "in_review" | "processing" | "resolved" }) => {
      const { error } = await supabase
        .from("complaints")
        .update({ 
          status,
          resolved_at: status === "resolved" ? new Date().toISOString() : null
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-complaints"] });
    },
    onError: () => toast.error("Failed to update status")
  });

  const addResponseMutation = useMutation({
    mutationFn: async ({ complaintId, message }: { complaintId: string; message: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("complaint_responses")
        .insert({
          complaint_id: complaintId,
          responder_id: user.id,
          message,
          is_internal_note: false
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Response added successfully");
      setResponse("");
      queryClient.invalidateQueries({ queryKey: ["admin-complaints"] });
    },
    onError: () => toast.error("Failed to add response")
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted": return "secondary";
      case "in_review": return "default";
      case "processing": return "default";
      case "resolved": return "default";
      default: return "secondary";
    }
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
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Complaint Management</h2>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Complaints</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!complaints || complaints.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No complaints found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tracking ID</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complaints.map((complaint: any) => (
                <TableRow key={complaint.id}>
                  <TableCell className="font-mono text-xs">{complaint.tracking_id}</TableCell>
                  <TableCell>{complaint.profiles?.full_name}</TableCell>
                  <TableCell className="max-w-xs truncate">{complaint.subject}</TableCell>
                  <TableCell>
                    <Badge style={{ backgroundColor: complaint.complaint_categories?.color }}>
                      {complaint.complaint_categories?.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge style={{ backgroundColor: complaint.complaint_priorities?.color }}>
                      {complaint.complaint_priorities?.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={complaint.status}
                      onValueChange={(value: "submitted" | "in_review" | "processing" | "resolved") => updateStatusMutation.mutate({ id: complaint.id, status: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="in_review">In Review</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{new Date(complaint.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => setSelectedComplaint(complaint)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Complaint Details - {complaint.tracking_id}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-1">Subject</h4>
                            <p>{complaint.subject}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-1">Description</h4>
                            <p className="text-sm text-muted-foreground">{complaint.description}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Add Response</h4>
                            <Textarea
                              value={response}
                              onChange={(e) => setResponse(e.target.value)}
                              placeholder="Type your response here..."
                              className="mb-2"
                            />
                            <Button
                              onClick={() => {
                                if (response.trim()) {
                                  addResponseMutation.mutate({
                                    complaintId: complaint.id,
                                    message: response
                                  });
                                }
                              }}
                              disabled={!response.trim() || addResponseMutation.isPending}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Send Response
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </AdminLayout>
  );
};

export default AdminComplaints;
