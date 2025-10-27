'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, AlertCircle, ChevronLeft, ChevronRight, Eye, Calendar, Download } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

interface AuditLog {
  id: string
  user_id: string
  action: string
  resource_type: string | null
  resource_id: string | null
  status: string
  changes: any
  metadata: any
  ip_address: string | null
  user_agent: string | null
  created_at: string
  profiles?: {
    id: string
    name: string
    email: string
  }
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface Filters {
  actions: string[]
  resourceTypes: string[]
}

const statusColors = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  pending: 'bg-yellow-500',
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })
  const [filters, setFilters] = useState<Filters>({
    actions: [],
    resourceTypes: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Detail dialog
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch logs
  useEffect(() => {
    async function fetchLogs() {
      try {
        setIsLoading(true)
        setError(null)

        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
        })

        if (debouncedSearch) params.append('search', debouncedSearch)
        if (actionFilter && actionFilter !== 'all') params.append('action', actionFilter)
        if (resourceTypeFilter && resourceTypeFilter !== 'all') params.append('resource_type', resourceTypeFilter)
        if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)

        const response = await fetch(`/api/admin/audit-logs?${params.toString()}`)

        if (!response.ok) {
          throw new Error('Failed to fetch audit logs')
        }

        const data = await response.json()
        setLogs(data.logs)
        setPagination(data.pagination)
        setFilters(data.filters)
      } catch (err) {
        console.error('Error fetching logs:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLogs()
  }, [pagination.page, pagination.limit, debouncedSearch, actionFilter, resourceTypeFilter, statusFilter])

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }))
  }

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log)
    setIsDetailOpen(true)
  }

  const handleExport = () => {
    // Convert logs to CSV and download
    const headers = ['Date', 'User', 'Action', 'Resource', 'Status']
    const rows = logs.map(log => [
      format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      log.profiles?.email || 'Unknown',
      log.action,
      log.resource_type || '-',
      log.status,
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">View all system activity and admin actions</p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            View all system activity and admin actions
          </p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter audit logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {filters.actions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={resourceTypeFilter} onValueChange={setResourceTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Resources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                {filters.resourceTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log ({pagination.total})</CardTitle>
          <CardDescription>
            {pagination.total > 0
              ? `Showing ${(pagination.page - 1) * pagination.limit + 1}-${Math.min(
                  pagination.page * pagination.limit,
                  pagination.total
                )} of ${pagination.total} logs`
              : 'No logs found'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No audit logs found matching your criteria
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">
                          {format(new Date(log.created_at), 'MMM d, HH:mm:ss')}
                          <br />
                          <span className="text-muted-foreground">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {log.profiles?.name || 'Unknown'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {log.profiles?.email || log.user_id?.substring(0, 8)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.action}
                        </TableCell>
                        <TableCell>
                          {log.resource_type ? (
                            <div>
                              <div className="font-medium">{log.resource_type}</div>
                              {log.resource_id && (
                                <div className="text-xs text-muted-foreground font-mono">
                                  {log.resource_id.substring(0, 8)}...
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[log.status as keyof typeof statusColors] || 'bg-gray-500'}>
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Complete information about this audit log entry
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
                  <p className="text-sm">
                    {format(new Date(selectedLog.created_at), 'PPpp')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={statusColors[selectedLog.status as keyof typeof statusColors] || 'bg-gray-500'}>
                    {selectedLog.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User</p>
                  <p className="text-sm">{selectedLog.profiles?.name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedLog.profiles?.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Action</p>
                  <p className="text-sm font-mono">{selectedLog.action}</p>
                </div>
                {selectedLog.resource_type && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Resource Type</p>
                      <p className="text-sm">{selectedLog.resource_type}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Resource ID</p>
                      <p className="text-sm font-mono">{selectedLog.resource_id || '-'}</p>
                    </div>
                  </>
                )}
                {selectedLog.ip_address && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">IP Address</p>
                    <p className="text-sm font-mono">{selectedLog.ip_address}</p>
                  </div>
                )}
              </div>

              {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Changes</p>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                    {JSON.stringify(selectedLog.changes, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Metadata</p>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.user_agent && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User Agent</p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {selectedLog.user_agent}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
