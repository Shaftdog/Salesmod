
"use client";

import * as React from "react";
import type { Order } from "@/lib/types";
import { OrdersTable, OrdersTableSkeleton } from "./orders-table";
import { OrderCard } from "./order-card";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearch } from "@/contexts/search-context";
import { Button } from "../ui/button";
import Link from "next/link";
import { PlusCircle, SearchX } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

type OrdersListProps = {
    orders: Order[];
    isMinimal?: boolean;
    isLoading?: boolean;
};

export function OrdersList({ orders, isMinimal = false, isLoading = false }: OrdersListProps) {
    const isMobile = useIsMobile();
    const { searchTerm } = useSearch();
   
    if (isLoading && isMobile) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-[220px] w-full" />
                ))}
            </div>
        )
    }

    if (isLoading) {
        return <OrdersTableSkeleton isMinimal={isMinimal} />;
    }

    if (isMobile) {
        if (!orders.length) {
             return (
                <div className="text-center py-12 flex flex-col items-center">
                    <SearchX className="h-12 w-12 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mt-4">No Orders Found</h3>
                    {searchTerm ? (
                        <p className="text-muted-foreground text-sm mt-1">
                            No orders found matching &quot;{searchTerm}&quot;.
                        </p>
                    ) : (
                         <>
                            <p className="text-muted-foreground text-sm mt-1">
                                Get started by creating a new order.
                            </p>
                             <Button asChild className="mt-4 gap-1">
                                <Link href="/orders/new">
                                    <PlusCircle className="h-3.5 w-3.5" />
                                    New Order
                                </Link>
                            </Button>
                        </>
                    )}
                </div>
            );
        }
        return (
            <div className="space-y-4">
                {orders.map(order => (
                    <OrderCard key={order.id} order={order} />
                ))}
            </div>
        );
    }
    
    return <OrdersTable orders={orders} isMinimal={isMinimal} />;
}
