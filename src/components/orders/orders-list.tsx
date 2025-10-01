"use client";

import * as React from "react";
import type { Order } from "@/lib/types";
import { OrdersTable } from "./orders-table";
import { OrderCard } from "./order-card";
import { useIsMobile } from "@/hooks/use-mobile";

type OrdersListProps = {
    orders: Order[];
    isMinimal?: boolean;
};

export function OrdersList({ orders, isMinimal = false }: OrdersListProps) {
    const isMobile = useIsMobile();

    if (isMobile) {
        if (!orders.length) {
            return <p className="text-center text-muted-foreground">No orders found.</p>;
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
