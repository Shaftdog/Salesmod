"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MFASetup } from "@/components/auth/MFASetup";
import Link from "next/link";

export default function SecuritySettingsPage() {
  const [showMFASetup, setShowMFASetup] = useState(false);

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/client-portal/settings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account security and authentication methods
          </p>
        </div>
      </div>

      {/* MFA Setup */}
      <MFASetup
        onComplete={() => {
          setShowMFASetup(false);
        }}
        onCancel={() => {
          setShowMFASetup(false);
        }}
      />
    </div>
  );
}
