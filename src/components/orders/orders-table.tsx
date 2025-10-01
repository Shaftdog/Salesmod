
"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from "@tanstack/react-table";
import { MoreHorizontal, PackageSearch, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Order } from "@/lib/types";
import { OrderStatusBadge } from "./status-badge";
import { format } from "date-fns";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useSearch } from "@/contexts/search-context";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { useToast } from "@/hooks/use-toast";


type OrdersTableProps = {
  orders: Order[];
  isMinimal?: boolean;
};

export const OrdersTableColumns = ({ isMinimal = false, toast }: { isMinimal?: boolean, toast: (options: any) => void }): ColumnDef<Order>[] => {
  const columns: ColumnDef<Order>[] = [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "orderNumber",
        header: "Order #",
        cell: ({ row }) => <Link href={`/orders/${row.original.id}`} className="font-medium text-primary hover:underline">{row.getValue("orderNumber")}</Link>,
      },
      {
        accessorKey: "propertyAddress",
        header: "Property Address",
        cell: ({ row }) => <div>{`${row.original.propertyAddress}, ${row.original.propertyCity}, ${row.original.propertyState}`}</div>
      },
      {
          accessorKey: "client.companyName",
          header: "Client",
          cell: ({ row }) => <div>{row.original.client?.companyName}</div>
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <OrderStatusBadge status={row.getValue("status")} />,
      },
      {
          accessorKey: "orderedDate",
          header: "Ordered",
          cell: ({ row }) => <div>{format(new Date(row.getValue("orderedDate")), "MMM d, yyyy")}</div>,
      },
      {
        accessorKey: "dueDate",
        header: "Due Date",
        cell: ({ row }) => <div>{format(new Date(row.getValue("dueDate")), "MMM d, yyyy")}</div>,
      },
      {
          accessorKey: "assignee.name",
          header: "Assigned To",
          cell: ({ row }) => (
              row.original.assignee ? (
              <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                      <AvatarImage src={row.original.assignee.avatarUrl} />
                      <AvatarFallback>{row.original.assignee.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{row.original.assignee.name}</span>
              </div>
          ) : <span className="text-muted-foreground">Unassigned</span>
          )
      },
      {
          accessorKey: "totalAmount",
          header: () => <div className="text-right">Fee</div>,
          cell: ({ row }) => {
              const amount = parseFloat(row.getValue("totalAmount"))
              return <div className="text-right font-medium">{formatCurrency(amount)}</div>
          },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const handleDelete = () => {
            if (confirm("Are you sure you want to delete this order?")) {
                console.log("Deleting order:", row.original.id);
                toast({
                    title: "Order Deleted",
                    description: "The order has been successfully deleted.",
                    action: <Button variant="secondary" size="sm" onClick={() => toast({title: "Undo not implemented yet."})}>Undo</Button>
                });
            }
          };

          const handleClone = () => {
            toast({ title: "Order duplicated successfully." });
          }

          return (
            <TooltipProvider>
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>More options</p>
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem asChild><Link href={`/orders/${row.original.id}`}>View Details</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href={`/orders/${row.original.id}/edit`}>Edit Order</Link></DropdownMenuItem>
                  <DropdownMenuItem onClick={handleClone}>Clone Order</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={handleDelete}>Delete Order</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TooltipProvider>
          );
        },
      },
  ];

  if (isMinimal) {
    return columns.filter(c => ['orderNumber', 'client.companyName', 'status', 'actions'].includes((c.accessorKey || c.id) as string));
  }
  return columns;
};

export function OrdersTable({ orders, isMinimal = false }: OrdersTableProps) {
  const { toast } = useToast();
  const { searchTerm, setSearchTerm: setGlobalFilter } = useSearch();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  
  const globalFilter = searchTerm;
  const columns = React.useMemo(() => OrdersTableColumns({ isMinimal, toast }), [isMinimal, toast]);

  const table = useReactTable({
    data: orders,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });
  
  if (isMinimal) {
    return (
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
    )
  }

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                    <div className="flex flex-col items-center justify-center gap-2">
                        <PackageSearch className="h-12 w-12 text-muted-foreground" />
                        <h3 className="font-semibold">No Orders Found</h3>
                        {globalFilter ? (
                             <p className="text-sm text-muted-foreground">
                                No orders found matching &quot;{globalFilter}&quot;.
                            </p>
                        ) : (
                             <>
                                <p className="text-sm text-muted-foreground">
                                    Get started by creating a new order.
                                </p>
                                 <Button asChild className="mt-2 gap-1" size="sm">
                                    <Link href="/orders/new">
                                        <PlusCircle className="h-3.5 w-3.5" />
                                        New Order
                                    </Link>
                                </Button>
                            </>
                        )}
                    </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export function OrdersTableSkeleton({ isMinimal }: { isMinimal?: boolean }) {
    const skeletonColumns = React.useMemo(() => {
        const allColumns = ['select', 'orderNumber', 'propertyAddress', 'client.companyName', 'status', 'orderedDate', 'dueDate', 'assignee.name', 'totalAmount', 'actions'];
        if (isMinimal) {
            return ['orderNumber', 'client.companyName', 'status', 'actions'];
        }
        return allColumns;
    }, [isMinimal]);

    return (
         <div className="w-full">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {skeletonColumns.map(colId => (
                                <TableHead key={colId}><Skeleton className="h-5 w-full" /></TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...Array(10)].map((_, rowIndex) => (
                            <TableRow key={rowIndex}>
                                {skeletonColumns.map(colId => (
                                    <TableCell key={colId}><Skeleton className="h-5 w-full" /></TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
         </div>
    )
}
