"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function ConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const confirmEmail = async () => {
      const token_hash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      if (!token_hash || !type) {
        setStatus("error");
        setMessage("Invalid confirmation link. Please try again.");
        return;
      }

      try {
        const supabase = createClient();

        // Verify the email confirmation token
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as any,
        });

        if (error) {
          throw error;
        }

        setStatus("success");
        setMessage("Your email has been verified successfully!");

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } catch (error: any) {
        console.error("Confirmation error:", error);
        setStatus("error");
        setMessage(error.message || "Failed to verify email. The link may have expired.");
      }
    };

    confirmEmail();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            {status === "loading" && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
            {status === "success" && <CheckCircle className="h-5 w-5 text-green-600" />}
            {status === "error" && <XCircle className="h-5 w-5 text-destructive" />}
            <CardTitle>
              {status === "loading" && "Verifying Email"}
              {status === "success" && "Email Verified"}
              {status === "error" && "Verification Failed"}
            </CardTitle>
          </div>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          {status === "loading" && (
            <div className="text-center text-sm text-muted-foreground">
              Please wait while we verify your email address...
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Redirecting you to the dashboard...
              </p>
              <Button onClick={() => router.push("/dashboard")} className="w-full">
                Go to Dashboard
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-destructive/10 p-4">
                <p className="text-sm text-destructive">
                  The verification link may have expired or is invalid. Please try the following:
                </p>
                <ul className="mt-2 text-sm text-destructive list-disc list-inside space-y-1">
                  <li>Request a new verification email</li>
                  <li>Check if you're already logged in</li>
                  <li>Contact support if the problem persists</li>
                </ul>
              </div>
              <Button onClick={() => router.push("/login")} variant="outline" className="w-full">
                Back to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
