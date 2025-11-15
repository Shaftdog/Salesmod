import { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Campaigns | Marketing | Salesmod",
  description: "Manage marketing campaigns",
};

export default function CampaignsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage multi-channel marketing campaigns
          </p>
        </div>
        <Button asChild>
          <Link href="/marketing/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Campaigns</CardTitle>
          <CardDescription>Your currently running marketing campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>Campaign management coming soon!</p>
            <p className="text-sm mt-2">Create targeted campaigns with role-based audience filtering</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
