import { Metadata } from "next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Newsletters | Marketing | Salesmod",
  description: "Manage newsletters and email campaigns",
};

export default function NewslettersPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Newsletters</h1>
          <p className="text-muted-foreground">
            Regular newsletters for lenders, investors, realtors, and homeowners
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Newsletter
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Newsletters</CardTitle>
          <CardDescription>Recurring newsletters with targeted audiences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>Newsletter management coming soon!</p>
            <p className="text-sm mt-2">Create role-specific newsletters with automated scheduling</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
