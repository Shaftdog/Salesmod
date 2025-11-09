'use client';
// Jobs Management Page - Trigger deployment
import { useState } from 'react';
import Link from 'next/link';
import { useJobs, useJobStatusColor } from '@/hooks/use-jobs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { JobFormDialog } from '@/components/agent/job-form-dialog';
import {
  Briefcase,
  Plus,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  XCircle,
  Mail,
  AlertTriangle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Job } from '@/types/jobs';

export default function JobsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data, isLoading, error } = useJobs(
    statusFilter === 'all' ? undefined : statusFilter
  );

  const jobs = data?.jobs || [];
  const total = data?.total || 0;

  // Calculate summary stats
  const runningCount = jobs.filter((j) => j.status === 'running').length;
  const succeededCount = jobs.filter((j) => j.status === 'succeeded').length;
  const failedCount = jobs.filter((j) => j.status === 'failed').length;
  const totalEmailsSent = jobs.reduce((sum, j) => sum + j.emails_sent, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="h-8 w-8" />
            Jobs & Campaigns
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage multi-step campaigns and automated workflows
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Job
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground">All campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <PlayCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{runningCount}</div>
            <p className="text-xs text-muted-foreground">Active jobs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{succeededCount}</div>
            <p className="text-xs text-muted-foreground">
              {failedCount > 0 && `${failedCount} failed`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmailsSent}</div>
            <p className="text-xs text-muted-foreground">Across all jobs</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="succeeded">Succeeded</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p>Failed to load jobs</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No jobs found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create your first job
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Cards</TableHead>
                  <TableHead className="text-right">Emails</TableHead>
                  <TableHead className="text-right">Errors</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <JobRow key={job.id} job={job} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Job Dialog */}
      <JobFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}

// Job Table Row Component
function JobRow({ job }: { job: Job }) {
  const progress =
    job.cards_created > 0
      ? Math.round((job.cards_executed / job.cards_created) * 100)
      : 0;

  return (
    <TableRow className="cursor-pointer hover:bg-muted/50">
      <TableCell>
        <Link
          href={`/agent/jobs/${job.id}`}
          className="font-medium hover:underline"
        >
          {job.name}
        </Link>
        {job.description && (
          <p className="text-xs text-muted-foreground truncate max-w-md">
            {job.description}
          </p>
        )}
      </TableCell>
      <TableCell>
        <JobStatusBadge status={job.status} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Progress value={progress} className="w-[100px]" />
          <span className="text-xs text-muted-foreground">{progress}%</span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="text-sm font-medium">{job.cards_executed}</div>
        <div className="text-xs text-muted-foreground">
          / {job.cards_created}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="text-sm font-medium">{job.emails_sent}</div>
      </TableCell>
      <TableCell className="text-right">
        {job.errors_count > 0 ? (
          <Badge variant="destructive" className="text-xs">
            {job.errors_count}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">0</span>
        )}
      </TableCell>
      <TableCell>
        {job.last_run_at ? (
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(job.last_run_at), {
              addSuffix: true,
            })}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Never</span>
        )}
      </TableCell>
      <TableCell>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
        </span>
      </TableCell>
    </TableRow>
  );
}

// Status Badge Component
function JobStatusBadge({ status }: { status: string }) {
  const variants: Record<string, any> = {
    pending: { variant: 'secondary', icon: PauseCircle },
    running: { variant: 'default', icon: PlayCircle, className: 'bg-blue-500' },
    paused: { variant: 'secondary', icon: PauseCircle, className: 'bg-yellow-500' },
    succeeded: { variant: 'default', icon: CheckCircle2, className: 'bg-green-500' },
    failed: { variant: 'destructive', icon: XCircle },
    cancelled: { variant: 'secondary', icon: XCircle },
  };

  const config = variants[status] || variants.pending;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon className="h-3 w-3 mr-1" />
      {status}
    </Badge>
  );
}
