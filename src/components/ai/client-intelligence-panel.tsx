"use client"

import * as React from "react"
import { useState } from "react"
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Activity,
  DollarSign,
  Clock,
  Target,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

interface ClientIntelligencePanelProps {
  clientId: string
  clientContext?: any
}

export function ClientIntelligencePanel({
  clientId,
  clientContext,
}: ClientIntelligencePanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [insights, setInsights] = useState<any>(null)

  const analyzeClient = async () => {
    setIsAnalyzing(true)
    
    // Simulate analysis (in real implementation, this would call an AI endpoint)
    setTimeout(() => {
      setInsights({
        engagementScore: 72,
        engagementTrend: "up",
        riskLevel: "low",
        opportunities: [
          "Ready for upsell - high engagement",
          "Consistent order pattern detected"
        ],
        concerns: [],
        dealVelocity: "12 days avg",
        responseRate: "95%",
        lastInteractionQuality: "positive",
      })
      setIsAnalyzing(false)
    }, 2000)
  }

  React.useEffect(() => {
    if (clientContext && !insights) {
      analyzeClient()
    }
  }, [clientContext])

  if (!insights && !isAnalyzing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Client Intelligence</CardTitle>
          <CardDescription>
            AI-powered insights about this client
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={analyzeClient} className="w-full">
            <Activity className="mr-2 h-4 w-4" />
            Generate Insights
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isAnalyzing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Client Intelligence</CardTitle>
          <CardDescription>Analyzing client data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">
              AI is analyzing engagement patterns, deal velocity, and opportunities...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Client Intelligence</CardTitle>
            <CardDescription>
              AI-powered insights and recommendations
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={analyzeClient}
            disabled={isAnalyzing}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Engagement Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Engagement Score</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{insights.engagementScore}</span>
              {insights.engagementTrend === "up" ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
            </div>
          </div>
          <Progress value={insights.engagementScore} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            Based on communication frequency, response times, and deal activity
          </p>
        </div>

        <Separator />

        {/* Risk Assessment */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Risk Level</span>
            {insights.riskLevel === "low" ? (
              <Badge className="bg-green-500/10 text-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Low Risk
              </Badge>
            ) : insights.riskLevel === "medium" ? (
              <Badge className="bg-yellow-500/10 text-yellow-500">
                <AlertCircle className="h-3 w-3 mr-1" />
                Medium Risk
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                High Risk
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            No concerning patterns detected. Client relationship is healthy.
          </p>
        </div>

        <Separator />

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Deal Velocity</span>
            </div>
            <p className="text-lg font-semibold">{insights.dealVelocity}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Target className="h-4 w-4" />
              <span className="text-xs">Response Rate</span>
            </div>
            <p className="text-lg font-semibold">{insights.responseRate}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Activity className="h-4 w-4" />
              <span className="text-xs">Last Contact</span>
            </div>
            <p className="text-lg font-semibold capitalize">
              {insights.lastInteractionQuality}
            </p>
          </div>
        </div>

        <Separator />

        {/* Opportunities */}
        {insights.opportunities.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              Opportunities
            </h4>
            <ul className="space-y-2">
              {insights.opportunities.map((opp: string, idx: number) => (
                <li
                  key={idx}
                  className="text-sm pl-6 relative before:content-['•'] before:absolute before:left-2 before:text-green-500"
                >
                  {opp}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Concerns */}
        {insights.concerns.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              Attention Needed
            </h4>
            <ul className="space-y-2">
              {insights.concerns.map((concern: string, idx: number) => (
                <li
                  key={idx}
                  className="text-sm pl-6 relative before:content-['•'] before:absolute before:left-2 before:text-yellow-500"
                >
                  {concern}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

