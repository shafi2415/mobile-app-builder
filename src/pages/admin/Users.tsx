import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";

const AdminUsers = () => {
  return (
    <AdminLayout>
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">User Management</h2>
        <div className="text-center py-12 text-muted-foreground">
          <p>No users to manage yet.</p>
        </div>
      </Card>
    </AdminLayout>
  );
};

export default AdminUsers;
