import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";

const AdminComplaints = () => {
  return (
    <AdminLayout>
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Complaint Management</h2>
        <div className="text-center py-12 text-muted-foreground">
          <p>No complaints to manage yet.</p>
        </div>
      </Card>
    </AdminLayout>
  );
};

export default AdminComplaints;
