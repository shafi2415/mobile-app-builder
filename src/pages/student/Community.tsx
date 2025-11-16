import { StudentLayout } from "@/components/layouts/StudentLayout";
import { Card } from "@/components/ui/card";

const Community = () => {
  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Community Chat</h1>
          <p className="text-muted-foreground">Connect with fellow students</p>
        </div>

        <Card className="p-6">
          <div className="text-center py-12 text-muted-foreground">
            <p>Community chat coming soon! Stay tuned for real-time discussions.</p>
          </div>
        </Card>
      </div>
    </StudentLayout>
  );
};

export default Community;
