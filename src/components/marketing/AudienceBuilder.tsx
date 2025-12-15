"use client";

import { useState, useEffect } from "react";
import { AudienceFilter } from "@/lib/types/marketing";
import { PartyRoleCode } from "@/lib/roles/mapPartyRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, TrendingUp, Tag, Filter } from "lucide-react";

interface AudienceBuilderProps {
  value: AudienceFilter;
  onChange: (filter: AudienceFilter) => void;
}

export function AudienceBuilder({ value, onChange }: AudienceBuilderProps) {
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
  const [calculating, setCalculating] = useState(false);

  // Calculate audience size when filter changes
  useEffect(() => {
    const calculateSize = async () => {
      if (!value.targetRoleCodes?.length && !value.targetRoleCategories?.length) {
        setEstimatedSize(null);
        return;
      }

      setCalculating(true);
      try {
        const response = await fetch('/api/marketing/audiences/calculate-size', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(value),
        });

        if (response.ok) {
          const data = await response.json();
          setEstimatedSize(data.size);
        }
      } catch (error) {
        console.error('Error calculating audience size:', error);
      } finally {
        setCalculating(false);
      }
    };

    const debounce = setTimeout(calculateSize, 500);
    return () => clearTimeout(debounce);
  }, [value]);

  const handleRoleCategoryToggle = (category: 'lender' | 'investor' | 'service_provider' | 'other') => {
    const categories = value.targetRoleCategories || [];
    const newCategories = categories.includes(category)
      ? categories.filter(c => c !== category)
      : [...categories, category];

    onChange({ ...value, targetRoleCategories: newCategories });
  };

  const handleTagAdd = (tag: string, type: 'include' | 'exclude') => {
    if (!tag.trim()) return;

    const field = type === 'include' ? 'includeTags' : 'excludeTags';
    const tags = value[field] || [];

    onChange({
      ...value,
      [field]: [...tags, tag.trim()],
    });
  };

  const handleTagRemove = (tag: string, type: 'include' | 'exclude') => {
    const field = type === 'include' ? 'includeTags' : 'excludeTags';
    const tags = value[field] || [];

    onChange({
      ...value,
      [field]: tags.filter(t => t !== tag),
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Target Audience
            </CardTitle>
            <CardDescription>
              Define who should receive this campaign
            </CardDescription>
          </div>
          {estimatedSize !== null && (
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {calculating ? '...' : `~${estimatedSize.toLocaleString()} contacts`}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Role Categories */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Role Categories
          </Label>
          <div className="flex flex-wrap gap-2">
            {(['lender', 'investor', 'service_provider'] as const).map((category) => (
              <Button
                key={category}
                variant={value.targetRoleCategories?.includes(category) ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleRoleCategoryToggle(category)}
                type="button"
              >
                {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Select broad role categories to target
          </p>
        </div>

        <Separator />

        {/* Tags - Include */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Include Tags
          </Label>
          <div className="flex flex-wrap gap-2">
            {(value.includeTags || []).map((tag) => (
              <Badge key={tag} variant="default" className="cursor-pointer" onClick={() => handleTagRemove(tag, 'include')}>
                {tag} ×
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Enter tag name..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleTagAdd(e.currentTarget.value, 'include');
                  e.currentTarget.value = '';
                }
              }}
            />
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={(e) => {
                const input = e.currentTarget.parentElement?.querySelector('input');
                if (input) {
                  handleTagAdd(input.value, 'include');
                  input.value = '';
                }
              }}
            >
              Add
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Contacts must have at least one of these tags
          </p>
        </div>

        {/* Tags - Exclude */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Exclude Tags
          </Label>
          <div className="flex flex-wrap gap-2">
            {(value.excludeTags || []).map((tag) => (
              <Badge key={tag} variant="destructive" className="cursor-pointer" onClick={() => handleTagRemove(tag, 'exclude')}>
                {tag} ×
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Enter tag name..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleTagAdd(e.currentTarget.value, 'exclude');
                  e.currentTarget.value = '';
                }
              }}
            />
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={(e) => {
                const input = e.currentTarget.parentElement?.querySelector('input');
                if (input) {
                  handleTagAdd(input.value, 'exclude');
                  input.value = '';
                }
              }}
            >
              Add
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Contacts with any of these tags will be excluded
          </p>
        </div>

        <Separator />

        {/* Lead Score */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Lead Score
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minScore" className="text-sm text-muted-foreground">
                Minimum Score
              </Label>
              <Input
                id="minScore"
                type="number"
                min={0}
                max={100}
                value={value.minLeadScore || ''}
                onChange={(e) => onChange({
                  ...value,
                  minLeadScore: e.target.value ? parseInt(e.target.value) : undefined
                })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="maxScore" className="text-sm text-muted-foreground">
                Maximum Score
              </Label>
              <Input
                id="maxScore"
                type="number"
                min={0}
                max={100}
                value={value.maxLeadScore || ''}
                onChange={(e) => onChange({
                  ...value,
                  maxLeadScore: e.target.value ? parseInt(e.target.value) : undefined
                })}
                placeholder="100"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {[
              { label: 'Hot (75+)', min: 75, max: 100 },
              { label: 'Warm (50-74)', min: 50, max: 74 },
              { label: 'All', min: undefined, max: undefined },
            ].map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                type="button"
                onClick={() => onChange({
                  ...value,
                  minLeadScore: preset.min,
                  maxLeadScore: preset.max,
                })}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Filter by engagement score (0-100)
          </p>
        </div>

        {/* Activity Filters */}
        <div className="space-y-3">
          <Label>Activity Filters</Label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                type="checkbox"
                className="h-4 w-4"
                checked={value.hasOrders === true}
                onChange={(e) => onChange({
                  ...value,
                  hasOrders: e.target.checked ? true : undefined
                })}
              />
              <Label className="text-sm font-normal">Has active orders</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minOrders" className="text-sm text-muted-foreground">
                  Min Orders
                </Label>
                <Input
                  id="minOrders"
                  type="number"
                  min={0}
                  value={value.orderCountMin || ''}
                  onChange={(e) => onChange({
                    ...value,
                    orderCountMin: e.target.value ? parseInt(e.target.value) : undefined
                  })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="minRevenue" className="text-sm text-muted-foreground">
                  Min Revenue ($)
                </Label>
                <Input
                  id="minRevenue"
                  type="number"
                  min={0}
                  value={value.totalRevenueMin || ''}
                  onChange={(e) => onChange({
                    ...value,
                    totalRevenueMin: e.target.value ? parseFloat(e.target.value) : undefined
                  })}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
