'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  useJob,
  useJobTasks,
  usePauseJob,
  useResumeJob,
  useCancelJob,
  useJobProgress,
  useApprovalRate,
} from '@/hooks/use-jobs';
import { KanbanBoard } from '@/components/agent/kanban-board';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  PlayCircle,
  PauseCircle,
  XCircle,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Target,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = use(params);
  const { data, isLoading, error } = useJob(id);
  const { data: tasksData } = useJobTasks(id);
  const pauseJob = usePauseJob(id);
  const resumeJob = useResumeJob(id);
  const cancelJob = useCancelJob(id);

  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const job = data?.job;
  const metrics = data?.metrics;
  const recentTasks = data?.recent_tasks || [];
  const tasks = tasksData?.tasks || [];

  const progress = useJobProgress(job);
  const approvalRate = useApprovalRate(job);

  if (isLoading) {
    return <JobDetailSkeleton />;
  }

  if (error || !job) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Job not found</h2>
        <p className="text-muted-foreground mb-4">
          The job you're looking for doesn't exist or you don't have access.
        </p>
        <Button asChild>
          <Link href="/agent/jobs">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Link>
        </Button>
      </div>
    );
  }

  const canStart = job.status === 'pending';
  const canPause = job.status === 'running';
  const canResume = job.status === 'paused';
  const canCancel = ['pending', 'running', 'paused'].includes(job.status);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/agent/jobs">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{job.name}</h1>
          {job.description && (
            <p className="text-muted-foreground mt-1">{job.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <JobStatusBadge status={job.status} />

          {canStart && (
            <Button
              variant="default"
              size="sm"
              onClick={() => resumeJob.mutate()}
              disabled={resumeJob.isPending}
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              Start Job
            </Button>
          )}

          {canPause && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => pauseJob.mutate()}
              disabled={pauseJob.isPending}
            >
              <PauseCircle className="h-4 w-4 mr-2" />
              Pause
            </Button>
          )}

          {canResume && (
            <Button
              variant="default"
              size="sm"
              onClick={() => resumeJob.mutate()}
              disabled={resumeJob.isPending}
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              Resume
            </Button>
          )}

          {canCancel && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsCancelDialogOpen(true)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress}%</div>
            <Progress value={progress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {job.cards_executed} / {job.cards_created} cards executed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{job.emails_sent}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Delivered successfully
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvalRate}%</div>
            <p className="text-xs text-muted-foreground mt-2">
              {job.cards_approved} / {job.cards_created} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{job.errors_count}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {job.errors_count > 0 ? 'Needs attention' : 'No errors'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Job Details & Tasks */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Job Info */}
        <Card>
          <CardHeader>
            <CardTitle>Job Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Created</div>
              <div className="text-sm">
                {format(new Date(job.created_at), 'MMM d, yyyy')}
                <span className="text-muted-foreground ml-2">
                  ({formatDistanceToNow(new Date(job.created_at), { addSuffix: true })})
                </span>
              </div>
            </div>

            {job.started_at && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Started</div>
                <div className="text-sm">
                  {format(new Date(job.started_at), 'MMM d, yyyy')}
                </div>
              </div>
            )}

            {job.last_run_at && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Last Run</div>
                <div className="text-sm">
                  {formatDistanceToNow(new Date(job.last_run_at), { addSuffix: true })}
                </div>
              </div>
            )}

            {job.finished_at && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Finished</div>
                <div className="text-sm">
                  {format(new Date(job.finished_at), 'MMM d, yyyy')}
                </div>
              </div>
            )}

            <Separator />

            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Configuration
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Target Group:</span>
                  <span className="font-medium">{job.params.target_group}</span>
                </div>
                <div className="flex justify-between">
                  <span>Batch Size:</span>
                  <span className="font-medium">{job.params.batch_size || 10}</span>
                </div>
                <div className="flex justify-between">
                  <span>Review Mode:</span>
                  <span className="font-medium">
                    {job.params.review_mode ? 'On' : 'Off'}
                  </span>
                </div>
              </div>
            </div>

            {job.params.cadence && (
              <>
                <Separator />
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Email Cadence
                  </div>
                  <div className="space-y-1 text-sm">
                    {job.params.cadence.day0 && <div>✓ Day 0 - Initial</div>}
                    {job.params.cadence.day4 && <div>✓ Day 4 - Follow-up 1</div>}
                    {job.params.cadence.day10 && <div>✓ Day 10 - Follow-up 2</div>}
                    {job.params.cadence.day21 && <div>✓ Day 21 - Final</div>}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tasks yet
              </p>
            ) : (
              <div className="space-y-2">
                {recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <div className="font-medium text-sm">
                        {task.kind.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Batch {task.batch} · Step {task.step}
                      </div>
                    </div>
                    <TaskStatusBadge status={task.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board (Filtered to this job) */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Job Cards</h2>
        <KanbanBoard jobId={id} />
      </div>

      {/* Cancel Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Job?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel all pending tasks and mark the job as cancelled.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Running</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                cancelJob.mutate();
                setIsCancelDialogOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Helper Components
function JobStatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; icon: any }> = {
    pending: { color: 'bg-gray-500', icon: Clock },
    running: { color: 'bg-blue-500', icon: PlayCircle },
    paused: { color: 'bg-yellow-500', icon: PauseCircle },
    succeeded: { color: 'bg-green-500', icon: CheckCircle2 },
    failed: { color: 'bg-red-500', icon: XCircle },
    cancelled: { color: 'bg-gray-400', icon: XCircle },
  };

  const { color, icon: Icon } = config[status] || config.pending;

  return (
    <Badge className={color}>
      <Icon className="h-3 w-3 mr-1" />
      {status}
    </Badge>
  );
}

function TaskStatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: any; icon: any }> = {
    pending: { variant: 'secondary', icon: Clock },
    running: { variant: 'default', icon: PlayCircle },
    done: { variant: 'default', icon: CheckCircle2 },
    error: { variant: 'destructive', icon: AlertTriangle },
    skipped: { variant: 'secondary', icon: XCircle },
  };

  const { variant, icon: Icon } = config[status] || config.pending;

  return (
    <Badge variant={variant}>
      <Icon className="h-3 w-3 mr-1" />
      {status}
    </Badge>
  );
}

function JobDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-2 w-full mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Skeleton className="h-96 w-full" />
    </div>
  );
}
