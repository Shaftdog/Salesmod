"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AudienceBuilder } from "@/components/marketing/AudienceBuilder";
import { AudienceFilter, CampaignGoal, MarketingChannel } from "@/lib/types/marketing";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function NewCampaignPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    goal: "" as CampaignGoal,
    description: "",
    startDate: "",
    endDate: "",
    channels: [] as MarketingChannel[],
  });

  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>({});

  const handleChannelToggle = (channel: MarketingChannel) => {
    setFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ...audienceFilter,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create campaign');
      }

      const { campaign } = await response.json();

      toast({
        title: "Campaign created",
        description: "Your campaign has been created successfully.",
      });

      router.push(`/marketing/campaigns/${campaign.id}`);
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error",
        description: "Failed to create campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/marketing/campaigns">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Campaign</h1>
          <p className="text-muted-foreground">
            Set up a new multi-channel marketing campaign
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>Basic information about your campaign</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Lender Reactivation Q1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="goal">Campaign Goal *</Label>
                <Select
                  required
                  value={formData.goal}
                  onValueChange={(value: CampaignGoal) => setFormData({ ...formData, goal: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reactivation">Reactivation</SelectItem>
                    <SelectItem value="nurture">Nurture</SelectItem>
                    <SelectItem value="acquisition">Acquisition</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="retention">Retention</SelectItem>
                    <SelectItem value="brand_awareness">Brand Awareness</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the campaign goals and strategy"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Channels</CardTitle>
            <CardDescription>Select where you'll publish content for this campaign</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'email', label: 'Email' },
                { value: 'newsletter', label: 'Newsletter' },
                { value: 'linkedin', label: 'LinkedIn' },
                { value: 'blog', label: 'Blog' },
                { value: 'webinar', label: 'Webinar' },
                { value: 'instagram', label: 'Instagram' },
                { value: 'facebook', label: 'Facebook' },
                { value: 'youtube', label: 'YouTube' },
              ].map((channel) => (
                <Button
                  key={channel.value}
                  type="button"
                  variant={formData.channels.includes(channel.value as MarketingChannel) ? 'default' : 'outline'}
                  onClick={() => handleChannelToggle(channel.value as MarketingChannel)}
                >
                  {channel.label}
                </Button>
              ))}
            </div>
            {formData.channels.length === 0 && (
              <p className="text-sm text-destructive mt-2">
                * Please select at least one channel
              </p>
            )}
          </CardContent>
        </Card>

        <AudienceBuilder value={audienceFilter} onChange={setAudienceFilter} />

        <div className="flex justify-end gap-3">
          <Button variant="outline" asChild type="button">
            <Link href="/marketing/campaigns">Cancel</Link>
          </Button>
          <Button type="submit" disabled={submitting || formData.channels.length === 0}>
            <Save className="mr-2 h-4 w-4" />
            {submitting ? 'Creating...' : 'Create Campaign'}
          </Button>
        </div>
      </form>
    </div>
  );
}
