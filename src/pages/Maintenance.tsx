import { motion } from "framer-motion";
import { Clock, Mail, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Maintenance = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full"
      >
        <Card className="p-8 md:p-12 text-center space-y-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mx-auto w-20 h-20 rounded-full border-4 border-primary border-t-transparent"
          />

          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Under Maintenance</h1>
            <p className="text-xl text-muted-foreground">
              We're making improvements to serve you better
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <Clock className="h-5 w-5" />
              <span className="font-medium">Expected Resolution Time</span>
            </div>
            <p className="text-2xl font-bold">2-3 hours</p>
            <p className="text-sm text-muted-foreground">
              Scheduled maintenance from 2:00 AM to 5:00 AM IST
            </p>
          </div>

          <div className="pt-4 space-y-4">
            <p className="text-muted-foreground">
              We apologize for any inconvenience. If you need immediate assistance, please
              contact us:
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" className="gap-2">
                <Mail className="h-4 w-4" />
                support@brocomp.com
              </Button>
              <Button variant="outline" className="gap-2">
                <Phone className="h-4 w-4" />
                +91 1234567890
              </Button>
            </div>
          </div>

          <div className="pt-4">
            <p className="text-xs text-muted-foreground">
              Thank you for your patience and understanding
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Maintenance;
