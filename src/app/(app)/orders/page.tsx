
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrdersList } from "@/components/orders/orders-list";
import { orders } from "@/lib/data";
import Link from "next/link";

export default function OrdersPage() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Orders</CardTitle>
                    <CardDescription>
                        Manage your appraisal orders and view their status.
                    </CardDescription>
                </div>
                 <Button asChild size="sm" className="gap-1">
                    <Link href="/orders/new">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            New Order
                        </span>
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <OrdersList orders={orders} />
            </CardContent>
        </Card>
    );
}
