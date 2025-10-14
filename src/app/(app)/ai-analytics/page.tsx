"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BarChart,
  Brain,
  DollarSign,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function AIAnalyticsPage() {
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      // Fetch draft performance
      const { data: draftStats } = await supabase
        .from('ai_drafts')
        .select('status, draft_type, tokens_used, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      // Fetch suggestion performance
      const { data: suggestionStats } = await supabase
        .from('agent_suggestions')
        .select('status, suggestion_type, priority, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      // Fetch usage logs
      const { data: usageLogs } = await supabase
        .from('ai_usage_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      // Calculate metrics
      const totalDrafts = draftStats?.length || 0
      const approvedDrafts = draftStats?.filter(d => d.status === 'approved').length || 0
      const approvalRate = totalDrafts > 0 ? (approvedDrafts / totalDrafts * 100).toFixed(1) : '0'

      const totalSuggestions = suggestionStats?.length || 0
      const acceptedSuggestions = suggestionStats?.filter(s => s.status === 'accepted').length || 0
      const acceptanceRate = totalSuggestions > 0 ? (acceptedSuggestions / totalSuggestions * 100).toFixed(1) : '0'

      const totalTokens = usageLogs?.reduce((sum, log) => sum + (log.tokens_used || 0), 0) || 0
      const totalCost = usageLogs?.reduce((sum, log) => sum + (log.estimated_cost || 0), 0) || 0

      setStats({
        totalDrafts,
        approvedDrafts,
        approvalRate,
        totalSuggestions,
        acceptedSuggestions,
        acceptanceRate,
        totalTokens,
        totalCost: totalCost.toFixed(4),
        draftsByType: draftStats?.reduce((acc: any, d: any) => {
          acc[d.draft_type] = (acc[d.draft_type] || 0) + 1
          return acc
        }, {}),
        suggestionsByType: suggestionStats?.reduce((acc: any, s: any) => {
          acc[s.suggestion_type] = (acc[s.suggestion_type] || 0) + 1
          return acc
        }, {}),
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Analytics</h2>
          <p className="text-muted-foreground">
            Performance metrics and insights
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Brain className="h-8 w-8 text-purple-500" />
          AI Analytics
        </h2>
        <p className="text-muted-foreground">
          Performance metrics and usage insights (Last 30 days)
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drafts</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDrafts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.approvalRate}% approval rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suggestions</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSuggestions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.acceptanceRate}% accepted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.totalTokens / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-muted-foreground">
              Total API usage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCost}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Draft Performance */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Draft Performance by Type</CardTitle>
            <CardDescription>
              Breakdown of generated drafts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.draftsByType && Object.keys(stats.draftsByType).length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(stats.draftsByType).map(([type, count]: [string, any]) => (
                    <TableRow key={type}>
                      <TableCell className="capitalize">
                        {type.replace('_', ' ')}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {count}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No drafts generated yet
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suggestion Performance by Type</CardTitle>
            <CardDescription>
              Breakdown of AI suggestions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.suggestionsByType && Object.keys(stats.suggestionsByType).length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(stats.suggestionsByType).map(([type, count]: [string, any]) => (
                    <TableRow key={type}>
                      <TableCell className="capitalize">
                        {type.replace('_', ' ')}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {count}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No suggestions generated yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>
            Key performance indicators for AI features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Draft Approval Rate</span>
              <Badge variant={parseFloat(stats.approvalRate) > 70 ? "default" : "secondary"}>
                {stats.approvalRate}%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Suggestion Acceptance Rate</span>
              <Badge variant={parseFloat(stats.acceptanceRate) > 50 ? "default" : "secondary"}>
                {stats.acceptanceRate}%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Average Cost per Draft</span>
              <span className="text-sm font-semibold">
                ${stats.totalDrafts > 0 ? (parseFloat(stats.totalCost) / stats.totalDrafts).toFixed(4) : '0.0000'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Operations</span>
              <span className="text-sm font-semibold">
                {stats.totalDrafts + stats.totalSuggestions}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

