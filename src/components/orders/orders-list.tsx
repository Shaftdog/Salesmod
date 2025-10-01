

"use client";

import * as React from "react";
import type { Order } from "@/lib/types";
import { OrdersTable } from "./orders-table";
import { OrderCard } from "./order-card";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearch } from "@/contexts/search-context";
import { Button } from "../ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

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
             return (
                <div className="text-center py-12">
                    <h3 className="text-lg font-semibold">No Orders Found</h3>
                    {searchTerm ? (
                        <p className="text-muted-foreground text-sm mt-1">
                            No orders found matching &quot;{searchTerm}&quot;.
                        </p>
                    ) : (
                         <p className="text-muted-foreground text-sm mt-1">
                            Get started by creating a new order.
                        </p>
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

    return <OrdersTable orders={orders} isMinimal={isMinimal} />;
}
