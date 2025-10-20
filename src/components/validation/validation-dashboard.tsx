"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  TrendingUp, 
  DollarSign, 
  Activity,
  MapPin,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface ValidationStats {
  usage: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    successRate: number;
  };
  properties: {
    verified: number;
    partial: number;
    unverified: number;
    total: number;
  };
  apiUsage: {
    google: number;
    geocoding: number;
    mock: number;
    total: number;
  };
  cost: {
    estimated: number;
    googleValidations: number;
  };
  recentActivity: Array<{
    id: string;
    address: string;
    success: boolean;
    source: string;
    confidence: number;
    createdAt: string;
  }>;
}

export function ValidationDashboard() {
  const [stats, setStats] = useState<ValidationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/validate-address/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch validation statistics');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-8">
        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Statistics</h3>
        <p className="text-gray-600">{error || 'Unable to load validation statistics'}</p>
      </div>
    );
  }

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return <Badge className="bg-green-50 text-green-700 border-green-200">HIGH</Badge>;
    }
    if (confidence >= 0.5) {
      return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">MEDIUM</Badge>;
    }
    return <Badge className="bg-red-50 text-red-700 border-red-200">LOW</Badge>;
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'google':
        return <MapPin className="h-4 w-4 text-blue-600" />;
      case 'geocoding':
        return <Activity className="h-4 w-4 text-green-600" />;
      case 'mock':
        return <Clock className="h-4 w-4 text-gray-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Address Validation Dashboard</h2>
        <p className="text-gray-600 mt-1">Monitor address validation usage and performance</p>
      </div>

      {/* Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Validations</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usage.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.usage.thisMonth} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getSuccessRateColor(stats.usage.successRate)}`}>
              {stats.usage.successRate.toFixed(1)}%
            </div>
            <Progress value={stats.usage.successRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Google API Usage</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.apiUsage.google.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.apiUsage.google / stats.apiUsage.total) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.cost.estimated.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Based on Google API usage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Property Validation Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Property Validation Status</CardTitle>
            <CardDescription>Distribution of property validation statuses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Verified</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{stats.properties.verified}</span>
                <span className="text-sm text-gray-500">
                  ({((stats.properties.verified / stats.properties.total) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">Partial</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{stats.properties.partial}</span>
                <span className="text-sm text-gray-500">
                  ({((stats.properties.partial / stats.properties.total) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm">Unverified</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{stats.properties.unverified}</span>
                <span className="text-sm text-gray-500">
                  ({((stats.properties.unverified / stats.properties.total) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Usage Breakdown</CardTitle>
            <CardDescription>Validation requests by source</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Google Address Validation</span>
              </div>
              <span className="font-semibold">{stats.apiUsage.google}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-green-600" />
                <span className="text-sm">Google Geocoding</span>
              </div>
              <span className="font-semibold">{stats.apiUsage.geocoding}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-sm">Mock Validation</span>
              </div>
              <span className="font-semibold">{stats.apiUsage.mock}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Validation Activity</CardTitle>
          <CardDescription>Last 10 address validations</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No recent validation activity
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentActivity.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">
                      <div className="max-w-xs truncate">
                        {activity.address}
                      </div>
                    </TableCell>
                    <TableCell>
                      {activity.success ? (
                        <Badge className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Success
                        </Badge>
                      ) : (
                        <Badge className="bg-red-50 text-red-700 border-red-200">
                          <XCircle className="h-3 w-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getSourceIcon(activity.source)}
                        <span className="text-sm capitalize">{activity.source}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getConfidenceBadge(activity.confidence)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {format(new Date(activity.createdAt), 'MMM d, HH:mm')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
