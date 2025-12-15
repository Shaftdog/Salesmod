"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  MessageSquare,
  RefreshCw,
  Filter,
  ThumbsUp,
  ThumbsDown,
  Minus,
} from "lucide-react";
import Link from "next/link";
import type { ReputationStats, PlatformStats, Review, SentimentTrend } from "@/types/reputation";

export default function ReputationDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReputationStats | null>(null);
  const [platforms, setPlatforms] = useState<PlatformStats[]>([]);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [trends, setTrends] = useState<SentimentTrend[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [statsRes, reviewsRes] = await Promise.all([
        fetch("/api/reputation/stats"),
        fetch("/api/reputation/reviews?limit=10"),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
        setPlatforms(statsData.platforms);
        setTrends(statsData.trends);
      }

      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setRecentReviews(reviewsData.data);
      }
    } catch (error) {
      console.error("Error fetching reputation data:", error);
    } finally {
      setLoading(false);
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <ThumbsUp className="h-4 w-4 text-green-600" />;
      case "negative":
        return <ThumbsDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <Badge className="bg-green-100 text-green-800">Positive</Badge>;
      case "negative":
        return <Badge className="bg-red-100 text-red-800">Negative</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Neutral</Badge>;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Reputation Management</h2>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Reputation Management</h2>
          <p className="text-muted-foreground">
            Monitor and respond to reviews across all platforms
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button asChild>
            <Link href="/marketing/reputation/reviews">View All Reviews</Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.average_rating.toFixed(1) || "0.0"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.total_reviews || 0} total reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sentiment</CardTitle>
            {stats?.trend_direction === "up" ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : stats?.trend_direction === "down" ? (
              <TrendingDown className="h-4 w-4 text-red-600" />
            ) : (
              <Minus className="h-4 w-4 text-gray-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.positive_percentage.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">positive reviews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Flagged</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.flagged_count || 0}</div>
            <p className="text-xs text-muted-foreground">need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.response_rate.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">reviews responded</p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Breakdown</CardTitle>
          <CardDescription>Reviews by platform</CardDescription>
        </CardHeader>
        <CardContent>
          {platforms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No platforms configured yet</p>
              <Button className="mt-4" variant="outline" asChild>
                <Link href="/marketing/reputation/platforms">Add Platform</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {platforms.map((platform) => (
                <div key={platform.platform_id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium capitalize">{platform.platform_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {platform.total_reviews} reviews • {platform.review_count_this_month} this month
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{platform.average_rating.toFixed(1)}</div>
                      {renderStars(Math.round(platform.average_rating))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reviews</CardTitle>
          <CardDescription>Latest customer feedback</CardDescription>
        </CardHeader>
        <CardContent>
          {recentReviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No reviews yet</p>
              <p className="text-sm mt-2">Reviews will appear here once synced from platforms</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentReviews.map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{review.author_name || "Anonymous"}</span>
                        {review.platform && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {review.platform.platform_name}
                          </Badge>
                        )}
                        {review.is_flagged && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Flagged
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        {renderStars(review.rating)}
                        {review.sentiment && getSentimentBadge(review.sentiment)}
                      </div>
                      {review.review_text && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {review.review_text}
                        </p>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(review.review_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/marketing/reputation/reviews/${review.id}`}>
                        View Details
                      </Link>
                    </Button>
                    {!review.responses?.length && (
                      <Button size="sm" variant="outline">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Respond
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
