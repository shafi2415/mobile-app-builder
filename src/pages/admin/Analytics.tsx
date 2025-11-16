import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";

const AdminAnalytics = () => {
  return (
    <AdminLayout>
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Analytics & Reports</h2>
        <div className="text-center py-12 text-muted-foreground">
          <p>Analytics dashboard coming soon.</p>
        </div>
      </Card>
    </AdminLayout>
  );
};

export default AdminAnalytics;
