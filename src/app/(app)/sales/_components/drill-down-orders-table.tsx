'use client'

import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { Order } from '@/lib/types'
import Link from 'next/link'

interface DrillDownOrdersTableProps {
  orders: Order[]
}

const statusColors: Record<string, string> = {
  INTAKE: 'bg-blue-500/20 text-blue-400',
  SCHEDULING: 'bg-yellow-500/20 text-yellow-400',
  SCHEDULED: 'bg-orange-500/20 text-orange-400',
  INSPECTED: 'bg-purple-500/20 text-purple-400',
  FINALIZATION: 'bg-indigo-500/20 text-indigo-400',
  READY_FOR_DELIVERY: 'bg-cyan-500/20 text-cyan-400',
  DELIVERED: 'bg-green-500/20 text-green-400',
  WORKFILE: 'bg-gray-500/20 text-gray-400',
  CORRECTION: 'bg-red-500/20 text-red-400',
  REVISION: 'bg-amber-500/20 text-amber-400',
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy')
  } catch {
    return '-'
  }
}

export function DrillDownOrdersTable({ orders }: DrillDownOrdersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: 'orderNumber',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="text-zinc-400 hover:text-zinc-100 -ml-3"
          >
            Order #
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <Link
            href={`/orders/${row.original.id}`}
            className="text-cyan-400 hover:text-cyan-300 hover:underline font-medium"
          >
            {row.getValue('orderNumber') || '-'}
          </Link>
        ),
      },
      {
        id: 'property',
        header: 'Property',
        cell: ({ row }) => (
          <span className="text-zinc-300 truncate max-w-[200px] block">
            {row.original.propertyAddress || row.original.property?.addressLine1 || '-'}
          </span>
        ),
      },
      {
        id: 'client',
        header: 'Client',
        cell: ({ row }) => (
          <span className="text-zinc-300 truncate max-w-[150px] block">
            {row.original.client?.companyName || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.getValue('status') as string
          return (
            <Badge
              variant="outline"
              className={`${statusColors[status] || 'bg-zinc-500/20 text-zinc-400'} border-0`}
            >
              {status?.replace(/_/g, ' ') || '-'}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'orderedDate',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="text-zinc-400 hover:text-zinc-100 -ml-3"
          >
            Ordered
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-zinc-400">
            {formatDate(row.getValue('orderedDate'))}
          </span>
        ),
      },
      {
        accessorKey: 'feeAmount',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="text-zinc-400 hover:text-zinc-100 -ml-3"
          >
            Fee
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-zinc-300 font-medium">
            {formatCurrency(row.getValue('feeAmount'))}
          </span>
        ),
      },
      {
        id: 'assignee',
        header: 'Assigned To',
        cell: ({ row }) => (
          <span className="text-zinc-400 truncate max-w-[120px] block">
            {row.original.assignee?.name || '-'}
          </span>
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data: orders,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  })

  if (orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-zinc-500">
        No orders found for this period
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ScrollArea className="h-[400px] rounded-md border border-zinc-800">
        <Table>
          <TableHeader className="sticky top-0 bg-zinc-900 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-zinc-800 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-zinc-400">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="border-zinc-800 hover:bg-zinc-800/50"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <span className="text-sm text-zinc-500">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            orders.length
          )}{' '}
          of {orders.length} orders
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="bg-transparent border-zinc-700 text-zinc-400 hover:bg-zinc-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-zinc-400">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="bg-transparent border-zinc-700 text-zinc-400 hover:bg-zinc-800"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
