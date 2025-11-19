import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Shield, QrCode, Key } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const MFASetup = () => {
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);

  const startEnrollment = async () => {
    setIsEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      toast.success("Scan the QR code with your authenticator app");
    } catch (error: any) {
      console.error("MFA enrollment error:", error);
      toast.error(error.message || "Failed to start MFA enrollment");
    } finally {
      setIsEnrolling(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    setIsVerifying(true);
    try {
      const factors = await supabase.auth.mfa.listFactors();
      if (factors.error) throw factors.error;

      const totpFactor = factors.data.totp[0];
      if (!totpFactor) throw new Error("No TOTP factor found");

      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: totpFactor.id,
        code: verificationCode,
      });

      if (error) throw error;

      setMfaEnabled(true);
      toast.success("MFA enabled successfully!");
      
      // Log security event
      await supabase.from('audit_logs').insert({
        action: 'mfa_enabled',
        resource_type: 'authentication',
        metadata: { method: 'totp' },
      });
      
      setQrCode("");
      setSecret("");
      setVerificationCode("");
    } catch (error: any) {
      console.error("MFA verification error:", error);
      toast.error(error.message || "Invalid verification code");
    } finally {
      setIsVerifying(false);
    }
  };

  const disableMFA = async () => {
    try {
      const factors = await supabase.auth.mfa.listFactors();
      if (factors.error) throw factors.error;

      const totpFactor = factors.data.totp[0];
      if (!totpFactor) throw new Error("No TOTP factor found");

      const { error } = await supabase.auth.mfa.unenroll({
        factorId: totpFactor.id,
      });

      if (error) throw error;

      setMfaEnabled(false);
      toast.success("MFA disabled");
      
      // Log security event
      await supabase.from('audit_logs').insert({
        action: 'mfa_disabled',
        resource_type: 'authentication',
        metadata: { method: 'totp' },
      });
    } catch (error: any) {
      console.error("MFA disable error:", error);
      toast.error(error.message || "Failed to disable MFA");
    }
  };

  if (mfaEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-500" />
            Multi-Factor Authentication
          </CardTitle>
          <CardDescription>MFA is currently enabled for your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your account is protected with two-factor authentication. You'll need your
              authenticator app to sign in.
            </AlertDescription>
          </Alert>
          <Button variant="destructive" onClick={disableMFA}>
            Disable MFA
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Multi-Factor Authentication (MFA)
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your admin account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!qrCode ? (
          <>
            <Alert>
              <Key className="h-4 w-4" />
              <AlertDescription>
                Enable MFA to require a time-based code from your authenticator app when
                signing in. Recommended for all admin accounts.
              </AlertDescription>
            </Alert>
            <Button onClick={startEnrollment} disabled={isEnrolling}>
              {isEnrolling ? "Setting up..." : "Enable MFA"}
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                Step 1: Scan QR Code
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Scan this code with Google Authenticator, Authy, or similar app
              </p>
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img src={qrCode} alt="MFA QR Code" className="max-w-xs" />
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Or enter this key manually:</h4>
              <code className="block p-2 bg-muted rounded text-sm break-all">
                {secret}
              </code>
            </div>

            <div>
              <h4 className="font-medium mb-2">Step 2: Verify Code</h4>
              <Label htmlFor="verification-code">Enter 6-digit code from your app</Label>
              <Input
                id="verification-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="text-center text-2xl tracking-widest font-mono"
              />
            </div>

            <Button
              onClick={verifyAndEnable}
              disabled={isVerifying || verificationCode.length !== 6}
              className="w-full"
            >
              {isVerifying ? "Verifying..." : "Verify and Enable MFA"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
