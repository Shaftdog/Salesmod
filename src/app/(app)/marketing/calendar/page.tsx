import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Content Calendar | Marketing | Salesmod",
  description: "Schedule and manage content publishing",
};

export default function ContentCalendarPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Calendar</h1>
          <p className="text-muted-foreground">
            Schedule content across all marketing channels
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Publishing Schedule</CardTitle>
          <CardDescription>Visual calendar of scheduled and published content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>Content calendar coming soon!</p>
            <p className="text-sm mt-2">Schedule posts, emails, and campaigns with a visual calendar</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
