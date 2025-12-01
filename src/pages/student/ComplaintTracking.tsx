import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { StudentLayout } from "@/components/layouts/StudentLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Calendar, ArrowRight, FileText } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const ComplaintTracking = () => {
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-500 text-white";
      case "in_review":
        return "bg-yellow-500 text-white";
      case "processing":
        return "bg-orange-500 text-white";
      case "resolved":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const statusLabels = {
    submitted: "Pending",
    in_review: "In Review",
    processing: "Processing",
    resolved: "Resolved",
  };

  useEffect(() => {
    fetchComplaints();

    // Set up real-time subscription for live updates
    const channel = supabase
      .channel('complaints-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'complaints'
        },
        () => {
          fetchComplaints();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterComplaints();
  }, [complaints, searchQuery, statusFilter]);

  const fetchComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from("complaints")
        .select(`
          *,
          complaint_categories(name, color, icon),
          complaint_priorities(name, color, level)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setComplaints(data || []);
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

  const filterComplaints = () => {
    let filtered = [...complaints];

    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.tracking_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.subject.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    setFilteredComplaints(filtered);
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">My Complaints</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Monitor the status of all your support requests
            </p>
          </div>
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link to="/student/complaints/new">
              <Plus className="mr-2 h-4 w-4" />
              New Complaint
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex gap-4 flex-col md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by tracking ID or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
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
        </Card>

        {/* Complaints List */}
        {filteredComplaints.length === 0 ? (
          <Card className="p-12 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
                <FileText className="w-12 h-12 text-muted-foreground" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery || statusFilter !== "all"
                  ? "No complaints found"
                  : "No complaints yet"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Submit your first issue to get started with BroComp support"}
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/student/complaints/new">
                <Plus className="mr-2 h-5 w-5" />
                Submit New Issue
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredComplaints.map((complaint, index) => (
              <motion.div
                key={complaint.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-4 sm:p-6 hover:shadow-lg transition-all hover:border-primary/50">
                  <Link to={`/student/complaints/${complaint.id}`} className="block">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1 space-y-3 min-w-0">
                        <div className="flex items-start gap-2 flex-wrap">
                          <h3 className="text-lg sm:text-xl font-semibold flex-1 min-w-0 break-words">
                            {complaint.subject}
                          </h3>
                          <Badge
                            className={getStatusColor(complaint.status)}
                          >
                            {statusLabels[complaint.status as keyof typeof statusLabels]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate">
                            {format(new Date(complaint.created_at), "PP")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {complaint.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          {complaint.complaint_categories?.name && (
                            <Badge variant="secondary" className="text-xs">
                              {complaint.complaint_categories.name}
                            </Badge>
                          )}
                          {complaint.complaint_priorities?.name && (
                            <Badge variant="outline" className="text-xs">
                              {complaint.complaint_priorities.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="flex-shrink-0 hidden sm:flex">
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </div>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default ComplaintTracking;
