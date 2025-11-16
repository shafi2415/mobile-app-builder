import { StudentLayout } from "@/components/layouts/StudentLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, MessageSquare, HelpCircle, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Dashboard = () => {
  const quickActions = [
    {
      title: "New Complaint",
      description: "Submit a new support request",
      icon: FileText,
      href: "/complaints/new",
      color: "bg-primary",
    },
    {
      title: "Community Chat",
      description: "Join the discussion",
      icon: MessageSquare,
      href: "/community",
      color: "bg-accent",
    },
    {
      title: "Support History",
      description: "View your past requests",
      icon: HelpCircle,
      href: "/support/history",
      color: "bg-muted",
    },
  ];

  const stats = [
    { label: "Total Complaints", value: "0", trend: "+0%" },
    { label: "Resolved", value: "0", trend: "+0%" },
    { label: "Pending", value: "0", trend: "+0%" },
  ];

  return (
    <StudentLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-4xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground text-lg">
            Track your complaints and connect with the community
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-green-500">
                    <TrendingUp className="h-4 w-4" />
                    {stat.trend}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                >
                  <Card className="p-6 hover:shadow-lg transition-all hover-scale">
                    <Link to={action.href}>
                      <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-4`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{action.title}</h3>
                      <p className="text-muted-foreground mb-4">{action.description}</p>
                      <Button variant="ghost" className="px-0">
                        Get Started →
                      </Button>
                    </Link>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
          <div className="text-center py-12 text-muted-foreground">
            <p>No recent activity. Submit your first complaint to get started!</p>
          </div>
        </Card>
      </div>
    </StudentLayout>
  );
};

export default Dashboard;
