import { Metadata } from "next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Audiences & Lead Scoring | Marketing | Salesmod",
  description: "Manage audience segments and lead scoring",
};

export default function AudiencesPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audiences & Lead Scoring</h1>
          <p className="text-muted-foreground">
            Build segments and track engagement with lead scoring
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Audience
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Saved Audiences</CardTitle>
            <CardDescription>Reusable audience segments for campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <p>Audience builder coming soon!</p>
              <p className="text-sm mt-2">Build segments using roles, tags, and engagement</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Scoring</CardTitle>
            <CardDescription>Hot leads ready for follow-up</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <p>Lead scoring coming soon!</p>
              <p className="text-sm mt-2">Automatic scoring based on fit, engagement, recency, and value</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
