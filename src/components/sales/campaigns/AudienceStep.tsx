"use client";

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, RefreshCw } from 'lucide-react';

interface AudienceStepProps {
  formData: any;
  updateFormData: (updates: any) => void;
}

const CLIENT_TYPES = [
  { value: 'AMC', label: 'AMC' },
  { value: 'Direct Lender', label: 'Direct Lender' },
  { value: 'Broker', label: 'Broker' },
  { value: 'Attorney', label: 'Attorney' },
  { value: 'Private', label: 'Private' },
];

export function AudienceStep({ formData, updateFormData }: AudienceStepProps) {
  const [audiencePreview, setAudiencePreview] = useState<{
    count: number;
    sample: any[];
  } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const filters = formData.target_segment?.filters || {};

  function updateFilter(key: string, value: any) {
    updateFormData({
      target_segment: {
        ...formData.target_segment,
        filters: {
          ...filters,
          [key]: value,
        },
      },
    });
  }

  function toggleClientType(type: string) {
    const current = filters.client_types || [];
    const updated = current.includes(type)
      ? current.filter((t: string) => t !== type)
      : [...current, type];
    updateFilter('client_types', updated);
  }

  async function loadPreview() {
    setLoadingPreview(true);
    try {
      const response = await fetch('/api/campaigns/preview-audience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_segment: formData.target_segment,
        }),
      });

      if (!response.ok) {
        // Don't crash - gracefully handle API failures
        console.warn('Preview API failed:', response.status);
        setAudiencePreview({ count: 0, sample: [] });
        return;
      }

      const data = await response.json();
      setAudiencePreview(data);
    } catch (error) {
      // Don't crash - gracefully handle errors
      console.error('Error loading preview:', error);
      setAudiencePreview({ count: 0, sample: [] });
    } finally {
      setLoadingPreview(false);
    }
  }

  useEffect(() => {
    // Auto-load preview when filters change (debounced)
    // Only load if there are actual filter values set
    const hasFilters =
      (filters.client_types && filters.client_types.length > 0) ||
      filters.last_order_days_ago_min !== undefined ||
      filters.last_order_days_ago_max !== undefined;

    const timer = setTimeout(() => {
      if (hasFilters) {
        loadPreview();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Campaign Name *</Label>
          <Input
            id="name"
            placeholder="e.g., Q1 AMC Reactivation"
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Brief description of the campaign goals..."
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            rows={3}
          />
        </div>
      </div>

      {/* Target Audience Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Target Audience Filters</CardTitle>
          <CardDescription>
            Define who should receive this campaign
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Client Types */}
          <div className="space-y-3">
            <Label>Client Types</Label>
            <div className="grid grid-cols-2 gap-3">
              {CLIENT_TYPES.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type.value}`}
                    checked={filters.client_types?.includes(type.value) || false}
                    onCheckedChange={() => toggleClientType(type.value)}
                  />
                  <label
                    htmlFor={`type-${type.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {type.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Last Order Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="days_ago_min">
                Last order at least (days ago)
              </Label>
              <Input
                id="days_ago_min"
                type="number"
                placeholder="e.g., 180"
                value={filters.last_order_days_ago_min || ''}
                onChange={(e) =>
                  updateFilter(
                    'last_order_days_ago_min',
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
              />
              <p className="text-xs text-muted-foreground">
                Minimum days since last order
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="days_ago_max">
                Last order at most (days ago)
              </Label>
              <Input
                id="days_ago_max"
                type="number"
                placeholder="e.g., 365"
                value={filters.last_order_days_ago_max || ''}
                onChange={(e) =>
                  updateFilter(
                    'last_order_days_ago_max',
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
              />
              <p className="text-xs text-muted-foreground">
                Maximum days since last order
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audience Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle className="text-lg">Audience Preview</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadPreview}
              disabled={loadingPreview}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingPreview ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingPreview ? (
            <p className="text-muted-foreground text-center py-8">
              Loading audience preview...
            </p>
          ) : audiencePreview ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Total Recipients</p>
                  <p className="text-3xl font-bold">{audiencePreview.count}</p>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {audiencePreview.count} contacts
                </Badge>
              </div>

              {audiencePreview.sample && audiencePreview.sample.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Sample Recipients:</p>
                  <div className="space-y-2">
                    {audiencePreview.sample.map((recipient: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-muted rounded-md text-sm"
                      >
                        <div>
                          <p className="font-medium">
                            {recipient.first_name} {recipient.last_name}
                          </p>
                          <p className="text-muted-foreground">{recipient.email}</p>
                        </div>
                        <p className="text-muted-foreground">{recipient.company_name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Configure filters to preview your audience
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
