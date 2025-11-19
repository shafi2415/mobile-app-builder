import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { StudentLayout } from "@/components/layouts/StudentLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Clock,
  CheckCircle,
  TrendingUp,
  Star,
  Download,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const SupportHistory = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalComplaints: 0,
    resolvedComplaints: 0,
    averageResolutionTime: 0,
    averageRating: 0,
  });
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistoryData();
  }, []);

  const fetchHistoryData = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Fetch all complaints
      const { data: complaints, error: complaintsError } = await supabase
        .from("complaints")
        .select(`
          *,
          complaint_categories(name, color),
          complaint_priorities(name, color),
          complaint_feedback(rating, comment)
        `)
        .order("created_at", { ascending: false });

      if (complaintsError) throw complaintsError;

      const total = complaints?.length || 0;
      const resolved = complaints?.filter((c) => c.status === "resolved").length || 0;

      // Calculate average resolution time
      const resolvedComplaints = complaints?.filter(
        (c) => c.status === "resolved" && c.resolved_at
      );
      const avgResolutionTime =
        resolvedComplaints && resolvedComplaints.length > 0
          ? resolvedComplaints.reduce((acc, c) => {
              const created = new Date(c.created_at).getTime();
              const resolved = new Date(c.resolved_at).getTime();
              return acc + (resolved - created);
            }, 0) /
            resolvedComplaints.length /
            (1000 * 60 * 60 * 24) // Convert to days
          : 0;

      // Calculate average rating
      const feedbacks = complaints?.flatMap((c) => c.complaint_feedback || []) || [];
      const avgRating =
        feedbacks.length > 0
          ? feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length
          : 0;

      setStats({
        totalComplaints: total,
        resolvedComplaints: resolved,
        averageResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        averageRating: Math.round(avgRating * 10) / 10,
      });

      setRecentComplaints(complaints?.slice(0, 10) || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    const csvContent = [
      ["Tracking ID", "Subject", "Status", "Created", "Resolved", "Category", "Priority"],
      ...recentComplaints.map((c) => [
        c.tracking_id,
        c.subject,
        c.status,
        format(new Date(c.created_at), "PPP"),
        c.resolved_at ? format(new Date(c.resolved_at), "PPP") : "N/A",
        c.complaint_categories?.name || "N/A",
        c.complaint_priorities?.name || "N/A",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `support-history-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Support History</h1>
            <p className="text-muted-foreground">
              Review your past support interactions and feedback
            </p>
          </div>
          <Button onClick={downloadReport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Complaints</p>
                  <p className="text-3xl font-bold">{stats.totalComplaints}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                  <p className="text-3xl font-bold">{stats.resolvedComplaints}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Resolution</p>
                  <p className="text-3xl font-bold">
                    {stats.averageResolutionTime}
                    <span className="text-sm text-muted-foreground ml-1">days</span>
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <Star className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Rating</p>
                  <p className="text-3xl font-bold">
                    {stats.averageRating}
                    <span className="text-sm text-muted-foreground ml-1">/ 5</span>
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Recent Complaints */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Recent Complaints</h2>
          {recentComplaints.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No complaints yet. Submit your first complaint to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentComplaints.map((complaint, index) => (
                <motion.div
                  key={complaint.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={`/student/complaints/${complaint.id}`}>
                    <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{complaint.subject}</h3>
                            <Badge
                              variant={
                                complaint.status === "resolved" ? "default" : "secondary"
                              }
                            >
                              {complaint.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(complaint.created_at), "PPP")}
                            </div>
                            <Badge variant="outline">
                              {complaint.complaint_categories?.name}
                            </Badge>
                            {complaint.complaint_feedback?.[0] && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                {complaint.complaint_feedback[0].rating}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </StudentLayout>
  );
};

export default SupportHistory;
