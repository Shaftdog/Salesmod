"use client";

/**
 * Password Reset Callback Page
 *
 * Handles the Supabase auth callback for password reset.
 * This must be a client-side component to handle hash fragments.
 *
 * Supabase sends the recovery tokens in the URL hash fragment:
 * /auth/reset-password/callback#access_token=...&type=recovery
 *
 * This page:
 * 1. Reads the hash fragment
 * 2. Sets the session using the tokens
 * 3. Redirects to the update-password page
 */

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

function ResetPasswordCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processing password reset...");

  useEffect(() => {
    const handlePasswordReset = async () => {
      try {
        const supabase = createClient();

        // Check for query parameters first (PKCE flow with code)
        const code = searchParams.get("code");
        const token_hash = searchParams.get("token_hash");
        const type = searchParams.get("type");
        const error = searchParams.get("error");
        const error_description = searchParams.get("error_description");

        // Handle error from Supabase
        if (error) {
          throw new Error(error_description || error);
        }

        // Handle PKCE code exchange
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            throw exchangeError;
          }
          setStatus("success");
          setMessage("Verified! Redirecting to password update...");
          setTimeout(() => router.push("/update-password"), 1000);
          return;
        }

        // Handle token_hash (older OTP flow)
        if (token_hash && type === "recovery") {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash,
            type: "recovery",
          });
          if (verifyError) {
            throw verifyError;
          }
          setStatus("success");
          setMessage("Verified! Redirecting to password update...");
          setTimeout(() => router.push("/update-password"), 1000);
          return;
        }

        // Handle hash fragment (implicit flow)
        // Hash fragments are not available on server, only in browser
        if (typeof window !== "undefined") {
          const hash = window.location.hash;
          if (hash) {
            // Parse hash fragment: #access_token=xxx&type=recovery&...
            const hashParams = new URLSearchParams(hash.substring(1));
            const accessToken = hashParams.get("access_token");
            const refreshToken = hashParams.get("refresh_token");
            const hashType = hashParams.get("type");
            const hashError = hashParams.get("error");
            const hashErrorDescription = hashParams.get("error_description");

            if (hashError) {
              throw new Error(hashErrorDescription || hashError);
            }

            if (accessToken && hashType === "recovery") {
              // Set the session using the tokens from hash
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || "",
              });

              if (sessionError) {
                throw sessionError;
              }

              setStatus("success");
              setMessage("Verified! Redirecting to password update...");
              setTimeout(() => router.push("/update-password"), 1000);
              return;
            }
          }

          // Also check if we already have a session (user may have already been authenticated)
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            // User is authenticated, redirect to update password
            setStatus("success");
            setMessage("Session found! Redirecting to password update...");
            setTimeout(() => router.push("/update-password"), 1000);
            return;
          }
        }

        // If we got here, no valid authentication method was found
        throw new Error("Invalid or expired password reset link. Please request a new one.");

      } catch (error: any) {
        console.error("Password reset callback error:", error);
        setStatus("error");
        setMessage(error.message || "Failed to verify password reset link.");
      }
    };

    handlePasswordReset();
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
              {status === "loading" && "Verifying Reset Link"}
              {status === "success" && "Link Verified"}
              {status === "error" && "Verification Failed"}
            </CardTitle>
          </div>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          {status === "loading" && (
            <div className="text-center text-sm text-muted-foreground">
              Please wait while we verify your password reset link...
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Redirecting you to set your new password...
              </p>
              <Button onClick={() => router.push("/update-password")} className="w-full">
                Update Password Now
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-destructive/10 p-4">
                <p className="text-sm text-destructive">
                  The password reset link may have expired or is invalid. Please try the following:
                </p>
                <ul className="mt-2 text-sm text-destructive list-disc list-inside space-y-1">
                  <li>Request a new password reset email</li>
                  <li>Make sure you're using the most recent email link</li>
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

export default function ResetPasswordCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <CardTitle>Verifying Reset Link</CardTitle>
            </div>
            <CardDescription>Please wait while we verify your password reset link...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <ResetPasswordCallbackContent />
    </Suspense>
  );
}
