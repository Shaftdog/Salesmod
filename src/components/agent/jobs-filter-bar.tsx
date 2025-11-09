'use client';

import { useJobs } from '@/hooks/use-jobs';
import { Job } from '@/types/jobs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Briefcase, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JobsFilterBarProps {
  selectedJobId: string | null;
  onJobSelect: (jobId: string | null) => void;
}

export function JobsFilterBar({
  selectedJobId,
  onJobSelect,
}: JobsFilterBarProps) {
  const { data } = useJobs();
  const jobs = data?.jobs || [];

  // Only show active jobs (running or pending)
  const activeJobs = jobs.filter((j: Job) => ['running', 'pending', 'paused'].includes(j.status));

  const selectedJob = jobs.find((j: Job) => j.id === selectedJobId);

  if (activeJobs.length === 0) {
    return null; // Don't show filter if no active jobs
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border">
      <div className="flex items-center gap-2">
        <Briefcase className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filter by Job:</span>
      </div>

      <Select
        value={selectedJobId || 'all'}
        onValueChange={(value) => onJobSelect(value === 'all' ? null : value)}
      >
        <SelectTrigger className="w-[300px]">
          <SelectValue placeholder="All cards" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Cards (No Filter)</SelectItem>
          {activeJobs.map((job) => (
            <SelectItem key={job.id} value={job.id}>
              <div className="flex items-center gap-2">
                <span>{job.name}</span>
                <Badge
                  variant="secondary"
                  className="text-xs"
                >
                  {job.status}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedJob && (
        <div className="flex items-center gap-2 ml-auto">
          <div className="text-sm text-muted-foreground">
            Showing cards for: <span className="font-medium text-foreground">{selectedJob.name}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Badge variant="secondary">{selectedJob.cards_created} cards</Badge>
            <Badge variant="secondary">{selectedJob.emails_sent} emails sent</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onJobSelect(null)}
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
