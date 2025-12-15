"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, Copy, Check } from "lucide-react";
import Image from "next/image";

interface MFASetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function MFASetup({ onComplete, onCancel }: MFASetupProps) {
  const [step, setStep] = useState<"setup" | "verify">("setup");
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [factorId, setFactorId] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");
  const [secretCopied, setSecretCopied] = useState(false);
  const { toast } = useToast();

  const handleSetup = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/mfa/setup", {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to setup MFA");
      }

      const data = await response.json();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setFactorId(data.factorId);
      setStep("verify");

      toast({
        title: "MFA Setup Initialized",
        description: "Scan the QR code with your authenticator app.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Setup Failed",
        description: error.message || "Could not initialize MFA setup.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          factorId,
          code: verificationCode,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Invalid verification code");
      }

      toast({
        title: "MFA Enabled!",
        description: "Two-factor authentication is now active on your account.",
      });

      onComplete?.();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message || "The code you entered is incorrect.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Secret key copied to clipboard.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <CardTitle>Two-Factor Authentication</CardTitle>
        </div>
        <CardDescription>
          {step === "setup"
            ? "Add an extra layer of security to your account"
            : "Verify your authenticator app"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === "setup" ? (
          <>
            <div className="space-y-2">
              <h4 className="font-medium">What is Two-Factor Authentication?</h4>
              <p className="text-sm text-muted-foreground">
                Two-factor authentication (2FA) adds an extra layer of security by requiring
                a code from your phone in addition to your password when signing in.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">What you'll need:</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>A smartphone or tablet</li>
                <li>An authenticator app (Google Authenticator, Authy, 1Password, etc.)</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSetup} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enable Two-Factor Authentication
              </Button>
              {onCancel && (
                <Button variant="outline" onClick={onCancel} disabled={isLoading}>
                  Cancel
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">1. Scan this QR code</h4>
                <p className="text-sm text-muted-foreground">
                  Open your authenticator app and scan this QR code:
                </p>
                {qrCode && (
                  <div className="flex justify-center p-4 bg-white rounded-lg border">
                    <Image
                      src={qrCode}
                      alt="MFA QR Code"
                      width={200}
                      height={200}
                      className="rounded"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Or enter this code manually:</h4>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                    {secret}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copySecret}
                    title="Copy secret"
                  >
                    {secretCopied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">2. Enter the 6-digit code</h4>
                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Verification Code</Label>
                    <Input
                      id="code"
                      type="text"
                      placeholder="000000"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                      maxLength={6}
                      required
                      disabled={isLoading}
                      className="text-center text-lg tracking-widest"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the 6-digit code from your authenticator app
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isLoading || verificationCode.length !== 6}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Verify and Enable
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep("setup")}
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
