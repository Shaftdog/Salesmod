import { Metadata } from "next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Content Library | Marketing | Salesmod",
  description: "Manage marketing content across all channels",
};

export default function ContentLibraryPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Library</h1>
          <p className="text-muted-foreground">
            Multi-format content for all your marketing channels
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Content
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Content</CardTitle>
          <CardDescription>Blog posts, social content, emails, case studies, and more</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>Content library coming soon!</p>
            <p className="text-sm mt-2">Create once, publish everywhere with multi-format support</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
