import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { pageVariants } from "@/lib/animations";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Shield } from "lucide-react";

const adminLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").max(128, "Password must be less than 128 characters"),
});

type AdminLoginFormData = z.infer<typeof adminLoginSchema>;

const AdminLogin = () => {
  const { signIn, user, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (user && (isAdmin || isSuperAdmin)) {
      navigate("/admin/dashboard");
    } else if (user) {
      navigate("/dashboard");
    }
  }, [user, isAdmin, isSuperAdmin, navigate]);

  const onSubmit = async (data: AdminLoginFormData) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(data.email, data.password);
      if (!error) {
        // Navigation will be handled by useEffect
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <motion.main
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="flex-1 pt-16 flex items-center justify-center"
      >
        <Card className="w-full max-w-md p-8 mx-4">
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold">Admin Portal</h1>
              <p className="text-muted-foreground">Sign in to access admin dashboard</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="admin@brototype.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input placeholder="••••••••" type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In as Admin"}
                </Button>
              </form>
            </Form>

            <div className="text-center">
              <Link to="/login" className="text-sm text-muted-foreground hover:text-primary">
                ← Back to student login
              </Link>
            </div>
          </div>
        </Card>
      </motion.main>
      <Footer />
    </div>
  );
};

export default AdminLogin;
