"use client";

import * as React from "react";
import type { Order } from "@/lib/types";
import { OrdersTable } from "./orders-table";
import { OrderCard } from "./order-card";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearch } from "@/contexts/search-context";

type OrdersListProps = {
    orders: Order[];
    isMinimal?: boolean;
};

export function OrdersList({ orders, isMinimal = false }: OrdersListProps) {
    const isMobile = useIsMobile();
    const { searchTerm } = useSearch();

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


    if (isMobile) {
        if (!filteredOrders.length) {
            return <p className="text-center text-muted-foreground">No orders found.</p>;
        }
        return (
            <div className="space-y-4">
                {filteredOrders.map(order => (
                    <OrderCard key={order.id} order={order} />
                ))}
            </div>
        );
    }

    return <OrdersTable orders={orders} isMinimal={isMinimal} />;
}
