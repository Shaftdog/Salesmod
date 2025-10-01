
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
};

export function OrdersList({ orders, isMinimal = false }: OrdersListProps) {
    const isMobile = useIsMobile();
    const { searchTerm } = useSearch();
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1500); // Simulate loading
        return () => clearTimeout(timer);
    }, []);

    // This is a simplified filtering for demonstration. 
    // In a real app, this would likely be part of the API call.
    const filteredOrders = React.useMemo(() => {
        if (!searchTerm) return orders;
        
        return orders.filter(order => {
            const values = [
                order.orderNumber,
                order.propertyAddress,
                order.propertyCity,
                order.propertyState,
                order.client?.companyName,
                order.status,
                order.assignee?.name,
            ].filter(Boolean).map(v => v.toLowerCase());

            return values.some(v => v.includes(searchTerm.toLowerCase()));
        });

    }, [orders, searchTerm]);


    if (isLoading && isMobile) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-[220px] w-full" />
                ))}
            </div>
        )
    }

    if (isMobile) {
        if (!filteredOrders.length) {
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
                {filteredOrders.map(order => (
                    <OrderCard key={order.id} order={order} />
                ))}
            </div>
        );
    }
    
    if (isLoading) {
        return <OrdersTableSkeleton isMinimal={isMinimal} />;
    }

    return <OrdersTable orders={filteredOrders} isMinimal={isMinimal} />;
}
