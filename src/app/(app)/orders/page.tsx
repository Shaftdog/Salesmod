
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrdersList } from "@/components/orders/orders-list";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { orderStatuses, Order } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { useSearch } from "@/contexts/search-context";
import { useOrders } from "@/hooks/use-orders";

type SortOption = 
  | "orderedDate_desc" 
  | "orderedDate_asc" 
  | "dueDate_asc" 
  | "dueDate_desc" 
  | "totalAmount_desc" 
  | "totalAmount_asc"
  | "orderNumber_asc"
  | "orderNumber_desc";

export default function OrdersPage() {
    const { searchTerm, setSearchTerm } = useSearch();
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [sortOption, setSortOption] = useState<SortOption>("orderedDate_desc");
    const searchInputRef = useRef<HTMLInputElement>(null);
    const { orders, isLoading } = useOrders();

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const filteredAndSortedOrders = useMemo(() => {
        let filtered: Order[] = orders;

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
                ].filter(Boolean).map(v => String(v).toLowerCase());
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
                    valA = a[sortBy] || 0;
                    valB = b[sortBy] || 0;
                    break;
                case 'orderNumber':
                    valA = a.orderNumber;
                    valB = b.orderNumber;
                    return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
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
                <div className="flex flex-col sm:flex-row items-center gap-2">
                    <Input
                      ref={searchInputRef}
                      placeholder="Search orders (⌘K)..."
                      className="w-full md:w-[200px] lg:w-[336px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="flex w-full sm:w-auto items-center gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-auto">
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
                            <SelectTrigger className="w-full sm:w-auto">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="orderedDate_desc">Created (Newest)</SelectItem>
                                <SelectItem value="orderedDate_asc">Created (Oldest)</SelectItem>
                                <SelectItem value="dueDate_asc">Due Date (Soonest)</SelectItem>
                                <SelectItem value="dueDate_desc">Due Date (Latest)</SelectItem>
                                <SelectItem value="orderNumber_asc">Order # (A-Z)</SelectItem>
                                <SelectItem value="orderNumber_desc">Order # (Z-A)</SelectItem>
                                <SelectItem value="totalAmount_desc">Fee (High-Low)</SelectItem>
                                <SelectItem value="totalAmount_asc">Fee (Low-High)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
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
                <OrdersList orders={filteredAndSortedOrders} isLoading={isLoading} />
            </CardContent>
        </Card>
    );
}
