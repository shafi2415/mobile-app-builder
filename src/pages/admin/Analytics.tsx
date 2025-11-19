import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, Clock, Star, Users, MessageSquare } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, differenceInHours } from "date-fns";
import { toast } from "sonner";

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalComplaints: 0,
    avgResolutionTime: 0,
    avgRating: 0,
    totalUsers: 0,
    totalMessages: 0,
  });
  const [complaintsOverTime, setComplaintsOverTime] = useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [feedbackData, setFeedbackData] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch total complaints
      const { count: totalComplaints } = await supabase
        .from("complaints")
        .select("*", { count: "exact", head: true });

      // Fetch resolved complaints for avg resolution time
      const { data: resolvedComplaints } = await supabase
        .from("complaints")
        .select("created_at, resolved_at")
        .eq("status", "resolved")
        .not("resolved_at", "is", null);

      const avgResolutionTime =
        resolvedComplaints?.reduce((acc, c) => {
          const hours = differenceInHours(
            new Date(c.resolved_at),
            new Date(c.created_at)
          );
          return acc + hours;
        }, 0) / (resolvedComplaints?.length || 1);

      // Fetch feedback ratings
      const { data: feedback } = await supabase
        .from("complaint_feedback")
        .select("rating, comment, is_anonymous, created_at, complaint_id");

      const avgRating =
        feedback?.reduce((acc, f) => acc + f.rating, 0) /
          (feedback?.length || 1) || 0;

      setFeedbackData(feedback || []);

      // Fetch total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("admin_approved", true);

      // Fetch total messages
      const { count: totalMessages } = await supabase
        .from("chat_messages")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null);

      setMetrics({
        totalComplaints: totalComplaints || 0,
        avgResolutionTime: Math.round(avgResolutionTime),
        avgRating: Math.round(avgRating * 10) / 10,
        totalUsers: totalUsers || 0,
        totalMessages: totalMessages || 0,
      });

      // Fetch complaints over time (last 7 days)
      const { data: complaints } = await supabase
        .from("complaints")
        .select("created_at")
        .gte("created_at", subDays(new Date(), 7).toISOString());

      const timeData = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        const count = complaints?.filter(
          (c) =>
            format(new Date(c.created_at), "yyyy-MM-dd") ===
            format(date, "yyyy-MM-dd")
        ).length;
        return {
          date: format(date, "MMM dd"),
          complaints: count || 0,
        };
      });
      setComplaintsOverTime(timeData);

      // Fetch status distribution
      const { data: allComplaints } = await supabase
        .from("complaints")
        .select("status");

      const statusCounts = allComplaints?.reduce((acc: any, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {});

      const statusData = Object.entries(statusCounts || {}).map(([status, count]) => ({
        name: status.replace("_", " ").toUpperCase(),
        value: count as number,
      }));
      setStatusDistribution(statusData);

      // Fetch category breakdown
      const { data: categoryCounts } = await supabase
        .from("complaints")
        .select("category_id, complaint_categories(name)");

      const catCounts = categoryCounts?.reduce((acc: any, c) => {
        const name = (c.complaint_categories as any)?.name || "Unknown";
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {});

      const catData = Object.entries(catCounts || {}).map(([name, count]) => ({
        category: name,
        count: count as number,
      }));
      setCategoryBreakdown(catData);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const csvData = [
      ["Metric", "Value"],
      ["Total Complaints", metrics.totalComplaints],
      ["Average Resolution Time (hours)", metrics.avgResolutionTime],
      ["Average Rating", metrics.avgRating],
      ["Total Users", metrics.totalUsers],
      ["Total Messages", metrics.totalMessages],
      [""],
      ["Date", "Complaints"],
      ...complaintsOverTime.map((d) => [d.date, d.complaints]),
    ];

    const csv = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast.success("Analytics exported successfully");
  };

  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Analytics Dashboard</h2>
            <p className="text-muted-foreground">
              Insights and metrics for your support system
            </p>
          </div>
          <Button onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Complaints</span>
            </div>
            <p className="text-3xl font-bold">{metrics.totalComplaints}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Avg Resolution</span>
            </div>
            <p className="text-3xl font-bold">{metrics.avgResolutionTime}h</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Avg Rating</span>
            </div>
            <p className="text-3xl font-bold">{metrics.avgRating}/5</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Users</span>
            </div>
            <p className="text-3xl font-bold">{metrics.totalUsers}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Chat Messages</span>
            </div>
            <p className="text-3xl font-bold">{metrics.totalMessages}</p>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="trends" className="space-y-4">
          <TabsList>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Complaints Over Time (Last 7 Days)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={complaintsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="complaints"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Status Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={80}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Feedback</h3>
              <div className="space-y-4">
                {feedbackData.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No feedback yet</p>
                ) : (
                  feedbackData.slice(0, 10).map((feedback) => (
                    <div
                      key={feedback.complaint_id}
                      className="border-b pb-4 last:border-0"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < feedback.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted"
                                }`}
                              />
                            ))}
                          </div>
                          {feedback.is_anonymous && (
                            <span className="text-xs bg-muted px-2 py-1 rounded">
                              Anonymous
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(feedback.created_at), "MMM dd, yyyy")}
                        </span>
                      </div>
                      {feedback.comment && (
                        <p className="text-sm text-muted-foreground">{feedback.comment}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Analytics;
