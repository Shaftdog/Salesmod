
"use client";

import React from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrdersList } from "@/components/orders/orders-list";
import { orders } from "@/lib/data";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { orderStatuses } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { useSearch } from "@/contexts/search-context";

type SortOption = "orderedDate_desc" | "orderedDate_asc" | "dueDate_asc" | "dueDate_desc" | "totalAmount_desc" | "totalAmount_asc";

export default function OrdersPage() {
    const { searchTerm, setSearchTerm } = useSearch();
    const [statusFilter, setStatusFilter] = React.useState<string>("all");
    const [sortOption, setSortOption] = React.useState<SortOption>("orderedDate_desc");

    const filteredAndSortedOrders = React.useMemo(() => {
        let filtered = orders;

        if (statusFilter !== 'all') {
            filtered = filtered.filter(order => order.status === statusFilter);
        }

        if (searchTerm) {
             const lowercasedTerm = searchTerm.toLowerCase();
             filtered = filtered.filter(order => {
                const values = [
                    order.orderNumber,
                    order.propertyAddress,
                    order.propertyCity,
                    order.propertyState,
                    order.client?.companyName,
                    order.status,
                    order.assignee?.name,
                ].filter(Boolean).map(v => v.toLowerCase());
                return values.some(v => v.includes(lowercasedTerm));
            });
        }

        const [sortBy, sortDir] = sortOption.split('_');

        return [...filtered].sort((a, b) => {
            let valA, valB;

            switch (sortBy) {
                case 'orderedDate':
                case 'dueDate':
                    valA = new Date(a[sortBy]).getTime();
                    valB = new Date(b[sortBy]).getTime();
                    break;
                case 'totalAmount':
                    valA = a[sortBy];
                    valB = b[sortBy];
                    break;
                default:
                    return 0;
            }

            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

    }, [orders, statusFilter, searchTerm, sortOption]);

    return (
        <Card>
            <CardHeader className="flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <CardTitle>Orders</CardTitle>
                    <CardDescription>
                        Manage your appraisal orders and view their status.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search orders..."
                      className="w-full md:w-[200px] lg:w-[336px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {orderStatuses.map(status => (
                                <SelectItem key={status} value={status} className="capitalize">
                                    {status.replace(/_/g, " ")}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="orderedDate_desc">Ordered (Newest)</SelectItem>
                            <SelectItem value="orderedDate_asc">Ordered (Oldest)</SelectItem>
                            <SelectItem value="dueDate_asc">Due Date (Soonest)</SelectItem>
                            <SelectItem value="dueDate_desc">Due Date (Latest)</SelectItem>
                            <SelectItem value="totalAmount_desc">Fee (High-Low)</SelectItem>
                            <SelectItem value="totalAmount_asc">Fee (Low-High)</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button asChild size="sm" className="gap-1 hidden sm:flex">
                        <Link href="/orders/new">
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                New Order
                            </span>
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <OrdersList orders={filteredAndSortedOrders} />
            </CardContent>
        </Card>
    );
}
