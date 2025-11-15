import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { pageVariants } from "@/lib/animations";

const AdminLogin = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <motion.main
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="flex-1 pt-16"
      >
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-center">Admin Login</h1>
          <p className="text-center text-muted-foreground mt-4">
            Coming soon...
          </p>
        </div>
      </motion.main>
      <Footer />
    </div>
  );
};

export default AdminLogin;
