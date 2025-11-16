"use client";

import { PasswordResetForm } from "@/components/auth/PasswordResetForm";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <PasswordResetForm onBackToLogin={() => router.push("/login")} />
    </div>
  );
}
