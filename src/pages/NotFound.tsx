import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Home, Search, MessageSquare, FileText } from "lucide-react";
import { pageVariants } from "@/lib/animations";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        className="text-center space-y-8 px-4 max-w-2xl"
      >
        {/* Large 404 */}
        <div className="space-y-4">
          <h1 className="text-8xl md:text-9xl font-bold">404</h1>
          <div className="h-1 w-24 mx-auto bg-primary" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold">Page Not Found</h2>
          <p className="text-muted-foreground text-lg">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <Button asChild variant="default" size="lg" className="w-full">
            <Link to="/" className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Go Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link to="/student/complaints/track" className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              View Complaints
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link to="/student/community" className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Community Chat
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link to="/student/complaints/new" className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              New Complaint
            </Link>
          </Button>
        </div>

        {/* Help Text */}
        <p className="text-sm text-muted-foreground pt-4">
          Need help? Try searching for what you're looking for or return to the homepage.
        </p>
      </motion.div>
    </div>
  );
};

export default NotFound;
