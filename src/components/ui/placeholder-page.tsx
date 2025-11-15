import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction } from "lucide-react";
import Link from "next/link";

interface PlaceholderPageProps {
  title: string;
  description: string;
  backLink: string;
  backLinkLabel: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function PlaceholderPage({
  title,
  description,
  backLink,
  backLinkLabel,
  icon: Icon = Construction,
}: PlaceholderPageProps) {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={backLink}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLinkLabel}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>This feature is under development</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Icon className="h-24 w-24 mb-6 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Feature In Development</h3>
          <p className="text-muted-foreground text-center max-w-md">
            {title} functionality is currently being built. Check back soon for updates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
