import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { pageVariants } from "@/lib/animations";

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        className="text-center space-y-6 px-4"
      >
        <ShieldAlert className="w-24 h-24 mx-auto text-destructive" />
        <h1 className="text-4xl font-bold">403 - Unauthorized</h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          You don't have permission to access this page. Please contact an administrator if you
          believe this is an error.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Unauthorized;
