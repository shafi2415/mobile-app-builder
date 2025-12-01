import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquare, Phone, Mail, FileText, Users, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import {
  pageVariants,
  staggerContainerVariants,
  staggerItemVariants,
  cardVariants,
  liquidButtonVariants,
} from "@/lib/animations";

const Index = () => {
  const features = [
    {
      icon: MessageSquare,
      title: "Multi-Channel Support",
      description: "Submit complaints via chat, phone, email, or detailed tickets",
    },
    {
      icon: FileText,
      title: "Real-Time Tracking",
      description: "Track your complaints with unique IDs and live status updates",
    },
    {
      icon: Users,
      title: "Community Chat",
      description: "Connect with verified students in a moderated community space",
    },
    {
      icon: Phone,
      title: "Instant Support",
      description: "Get help through multiple channels with fast response times",
    },
    {
      icon: Mail,
      title: "Email Notifications",
      description: "Stay updated with instant email alerts for all status changes",
    },
    {
      icon: Zap,
      title: "Quick Resolution",
      description: "Efficient complaint management with transparent workflows",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <motion.section
        variants={pageVariants}
        initial="initial"
        animate="animate"
        className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      >
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 -left-20 w-72 h-72 bg-primary/5 rounded-full animate-liquid-blob"
            animate={{
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-20 -right-20 w-96 h-96 bg-accent/5 rounded-full animate-liquid-blob"
            animate={{
              x: [0, -50, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
        </div>

        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              className="mb-8"
            >
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  BroComp
                </span>
              </h1>
              <p className="text-2xl sm:text-3xl font-semibold text-foreground mb-4">
                Seamless Issue Reporting for Brototype
              </p>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Professional tech support management with multi-channel complaint tracking, 
                real-time status updates, and collaborative community features.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <motion.div
                variants={liquidButtonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Link to="/register">
                  <Button size="lg" className="text-lg px-8 py-6 rounded-xl">
                    Get Started
                  </Button>
                </Link>
              </motion.div>
              <motion.div
                variants={liquidButtonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Link to="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 py-6 rounded-xl"
                  >
                    Sign In
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
            >
              {[
                { label: "Active Students", value: "1000+" },
                { label: "Avg Response Time", value: "<2hrs" },
                { label: "Satisfaction Rate", value: "98%" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl font-bold text-foreground mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A comprehensive platform designed to streamline support and foster
              community engagement
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div key={feature.title} variants={staggerItemVariants}>
                <motion.div
                  variants={cardVariants}
                  whileHover="hover"
                  initial="rest"
                  className="h-full"
                >
                  <Card className="p-6 h-full border-2 hover:border-primary/20 transition-colors">
                    <motion.div
                      className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <feature.icon className="w-6 h-6 text-primary" />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-primary/5 animate-liquid-blob"
          animate={{
            borderRadius: [
              "60% 40% 30% 70% / 60% 30% 70% 40%",
              "30% 60% 70% 40% / 50% 60% 30% 60%",
              "60% 40% 30% 70% / 60% 30% 70% 40%",
            ],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <div className="container mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-4xl font-bold text-foreground mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join Brototype students and experience seamless support management
            </p>
            <motion.div
              variants={liquidButtonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Link to="/register">
                <Button size="lg" className="text-lg px-8 py-6 rounded-xl">
                  Create Your Account
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
