import { StudentLayout } from "@/components/layouts/StudentLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

const Complaints = () => {
  return (
    <StudentLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Complaints</h1>
            <p className="text-muted-foreground">Track and manage your support requests</p>
          </div>
          <Button asChild>
            <Link to="/complaints/new">
              <Plus className="mr-2 h-4 w-4" />
              New Complaint
            </Link>
          </Button>
        </div>

        <Card className="p-6">
          <div className="text-center py-12 text-muted-foreground">
            <p>No complaints yet. Submit your first complaint to get started!</p>
          </div>
        </Card>
      </div>
    </StudentLayout>
  );
};

export default Complaints;
