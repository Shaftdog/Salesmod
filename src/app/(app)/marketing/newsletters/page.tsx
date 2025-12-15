"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Mail, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Newsletter } from "@/lib/types/marketing";

export default function NewslettersPage() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNewsletters() {
      try {
        const response = await fetch('/api/marketing/newsletters');
        if (response.ok) {
          const data = await response.json();
          setNewsletters(data.newsletters);
        }
      } catch (error) {
        console.error('Error fetching newsletters:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchNewsletters();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Newsletters</h1>
          <p className="text-muted-foreground">
            Regular newsletters for lenders, investors, realtors, and homeowners
          </p>
        </div>
        <Button asChild>
          <Link href="/marketing/newsletters/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Newsletter
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : newsletters.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No newsletters yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create newsletters to engage your audience regularly
            </p>
            <Button asChild>
              <Link href="/marketing/newsletters/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Newsletter
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {newsletters.map((newsletter) => (
            <Link key={newsletter.id} href={`/marketing/newsletters/${newsletter.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-1 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {newsletter.name}
                      </CardTitle>
                      <CardDescription className="capitalize mt-1">
                        {newsletter.frequency.replace('_', ' ')}
                      </CardDescription>
                    </div>
                    <Badge variant={newsletter.isActive ? 'default' : 'secondary'}>
                      {newsletter.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {newsletter.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {newsletter.description}
                    </p>
                  )}
                  <div className="space-y-2 text-sm">
                    {newsletter.targetRoleCategories?.length ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{newsletter.targetRoleCategories.length} audience segments</span>
                      </div>
                    ) : null}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="capitalize">{newsletter.frequency.replace('_', ' ')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
