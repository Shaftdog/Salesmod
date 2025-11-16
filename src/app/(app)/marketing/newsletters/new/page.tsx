'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { CreateNewsletterInput } from '@/lib/types/marketing';

const ROLE_CATEGORIES = [
  { value: 'lender', label: 'Lenders' },
  { value: 'investor', label: 'Investors' },
  { value: 'service_provider', label: 'Service Providers' },
  { value: 'other', label: 'Other' },
];

const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
];

export default function NewNewsletterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateNewsletterInput>({
    name: '',
    description: '',
    frequency: 'monthly',
    targetRoleCategories: [],
    targetRoleCodes: [],
  });

  const toggleRoleCategory = (category: string) => {
    setFormData((prev) => {
      const categories = prev.targetRoleCategories || [];
      if (categories.includes(category)) {
        return {
          ...prev,
          targetRoleCategories: categories.filter((c) => c !== category),
        };
      } else {
        return {
          ...prev,
          targetRoleCategories: [...categories, category],
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Newsletter name is required');
      return;
    }

    if (!formData.targetRoleCategories || formData.targetRoleCategories.length === 0) {
      toast.error('Please select at least one target audience');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/marketing/newsletters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create newsletter');
      }

      const { newsletter } = await response.json();
      toast.success('Newsletter created successfully');
      router.push(`/marketing/newsletters/${newsletter.id}`);
    } catch (error) {
      console.error('Error creating newsletter:', error);
      toast.error('Failed to create newsletter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/marketing/newsletters')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Newsletter</h1>
          <p className="text-muted-foreground">
            Set up a new newsletter campaign for your audience
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Define your newsletter name and description
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Newsletter Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Weekly Lender Updates"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this newsletter's purpose..."
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency *</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, frequency: value })
                }
              >
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Target Audience */}
        <Card>
          <CardHeader>
            <CardTitle>Target Audience *</CardTitle>
            <CardDescription>
              Select which audience segments should receive this newsletter
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Role Categories</Label>
              <div className="flex flex-wrap gap-2">
                {ROLE_CATEGORIES.map((category) => (
                  <Badge
                    key={category.value}
                    variant={
                      formData.targetRoleCategories?.includes(category.value)
                        ? 'default'
                        : 'outline'
                    }
                    className="cursor-pointer"
                    onClick={() => toggleRoleCategory(category.value)}
                  >
                    {category.label}
                  </Badge>
                ))}
              </div>
              {formData.targetRoleCategories && formData.targetRoleCategories.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {formData.targetRoleCategories.length} categories
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/marketing/newsletters')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Creating...' : 'Create Newsletter'}
          </Button>
        </div>
      </form>
    </div>
  );
}
