import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckSquare, UserPlus, RefreshCw } from "lucide-react";

interface BulkComplaintActionsProps {
  selectedIds: string[];
  onActionComplete: () => void;
  onClearSelection: () => void;
  admins: Array<{ id: string; full_name: string }>;
}

export const BulkComplaintActions = ({
  selectedIds,
  onActionComplete,
  onClearSelection,
  admins,
}: BulkComplaintActionsProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState("");

  const handleBulkStatusUpdate = async () => {
    if (!selectedStatus || selectedIds.length === 0) {
      toast.error("Please select a status");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("complaints")
        .update({ status: selectedStatus as any })
        .in("id", selectedIds);

      if (error) throw error;

      // Send email notifications
      for (const complaintId of selectedIds) {
        const { data: complaint } = await supabase
          .from("complaints")
          .select("user_id, tracking_id")
          .eq("id", complaintId)
          .single();

        if (complaint) {
          await supabase.functions.invoke("send-notification-email", {
            body: {
              userId: complaint.user_id,
              type: "status_change",
              trackingId: complaint.tracking_id,
              subject: "Complaint Status Updated",
              message: `Your complaint status has been changed to: ${selectedStatus.replace("_", " ").toUpperCase()}`,
            },
          });
        }
      }

      toast.success(`Updated ${selectedIds.length} complaints`);
      onActionComplete();
      onClearSelection();
    } catch (error) {
      console.error("Error updating complaints:", error);
      toast.error("Failed to update complaints");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAssignment = async () => {
    if (!selectedAdmin || selectedIds.length === 0) {
      toast.error("Please select an admin");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("complaints")
        .update({ assigned_to: selectedAdmin })
        .in("id", selectedIds);

      if (error) throw error;

      toast.success(`Assigned ${selectedIds.length} complaints`);
      onActionComplete();
      onClearSelection();
    } catch (error) {
      console.error("Error assigning complaints:", error);
      toast.error("Failed to assign complaints");
    } finally {
      setLoading(false);
    }
  };

  if (selectedIds.length === 0) return null;

  return (
    <div className="border rounded-lg p-4 bg-muted/30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4" />
          <span className="font-semibold">{selectedIds.length} selected</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          Clear Selection
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex gap-2">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Change Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleBulkStatusUpdate}
            disabled={loading || !selectedStatus}
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Update
          </Button>
        </div>

        <div className="flex gap-2">
          <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
            <SelectTrigger>
              <SelectValue placeholder="Assign to Admin" />
            </SelectTrigger>
            <SelectContent>
              {admins.map((admin) => (
                <SelectItem key={admin.id} value={admin.id}>
                  {admin.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleBulkAssignment}
            disabled={loading || !selectedAdmin}
            size="sm"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Assign
          </Button>
        </div>
      </div>
    </div>
  );
};