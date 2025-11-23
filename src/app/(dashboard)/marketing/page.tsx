'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Share2,
  Calendar,
  BarChart3,
  FileText,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

export default function MarketingPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Marketing Hub</h1>
        <p className="text-muted-foreground">
          Manage your content strategy, social media, and marketing campaigns
        </p>
      </div>

      {/* Marketing Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Social Media Agent */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-blue-500" />
              Social Media Agent
            </CardTitle>
            <CardDescription>
              AI-powered content strategy, creation, and analytics for LinkedIn and Twitter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  Strategy Agent
                </div>
                <div className="flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  Production Agent
                </div>
                <div className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  Analysis Agent
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Auto Scheduling
                </div>
              </div>
              <Link href="/marketing/social-media">
                <Button className="w-full">
                  Open Social Media Agent
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Content Calendar - Coming Soon */}
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              Content Calendar
            </CardTitle>
            <CardDescription>
              Visual calendar view of all scheduled content across channels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-3">
              View and manage your content schedule with drag-and-drop functionality
            </div>
            <Button variant="outline" disabled className="w-full">
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        {/* Content Library - Coming Soon */}
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-500" />
              Content Library
            </CardTitle>
            <CardDescription>
              Browse and manage all marketing content in one place
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-3">
              Filter by type, channel, status, and performance metrics
            </div>
            <Button variant="outline" disabled className="w-full">
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Marketing Overview</CardTitle>
          <CardDescription>
            Summary of your marketing content and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Marketing analytics dashboard coming soon</p>
            <p className="text-sm mt-1">
              Visit the Social Media Agent to see detailed analytics for social posts
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
