import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { FileText, Users, MessageSquare, TrendingUp } from "lucide-react";

const AdminDashboard = () => {
  const stats = [
    { label: "Total Complaints", value: "0", icon: FileText, trend: "+0%" },
    { label: "Active Users", value: "0", icon: Users, trend: "+0%" },
    { label: "Pending Approvals", value: "0", icon: Users, trend: "+0%" },
    { label: "Community Messages", value: "0", icon: MessageSquare, trend: "+0%" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-2">{stat.value}</p>
                    <div className="flex items-center gap-1 text-sm text-green-500 mt-2">
                      <TrendingUp className="h-4 w-4" />
                      {stat.trend}
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Recent Complaints */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Recent Complaints</h2>
          <div className="text-center py-12 text-muted-foreground">
            <p>No complaints yet. Check back later for updates.</p>
          </div>
        </Card>

        {/* User Approvals */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Pending User Approvals</h2>
          <div className="text-center py-12 text-muted-foreground">
            <p>No pending approvals. All users have been processed.</p>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
