

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Order } from "@/lib/types";
import { OrderStatusBadge } from "./status-badge";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import Link from "next/link";
import { Button } from "../ui/button";
import { MoreHorizontal } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

type OrderCardProps = {
    order: Order;
};

export function OrderCard({ order }: OrderCardProps) {
    const { toast } = useToast();
    const formattedDueDate = format(new Date(order.dueDate), "MMM d, yyyy");
    const formattedFee = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(order.totalAmount)

    const handleAction = (e: Event, message: string, variant?: "default" | "destructive") => {
        e.preventDefault();
        e.stopPropagation();
        toast({ title: message, variant });
    }

    return (
        <Link href={`/orders/${order.id}`} className="block hover:shadow-lg rounded-lg">
            <Card className="cursor-pointer">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-lg">
                                {order.orderNumber}
                            </CardTitle>
                            <CardDescription>{order.propertyAddress}</CardDescription>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={(e) => handleAction(e, "Viewing order...")} asChild><Link href={`/orders/${order.id}`}>View</Link></DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => handleAction(e, "Editing order...")}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => handleAction(e, "Cloning order...")}>Clone</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onSelect={(e) => handleAction(e, "Order deleted", "destructive")}>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                        <OrderStatusBadge status={order.status} />
                        <div className="text-sm text-muted-foreground">Due: {formattedDueDate}</div>
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="text-sm">
                            <span className="text-muted-foreground">Client: </span>
                            <span>{order.client?.companyName}</span>
                        </div>
                        <div className="text-right font-medium">{formattedFee}</div>
                    </div>

                    {order.assignee ? (
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Assigned to:</span>
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={order.assignee.avatarUrl} />
                                <AvatarFallback>{order.assignee.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{order.assignee.name}</span>
                        </div>
                    ): (
                        <div className="text-sm text-muted-foreground">Unassigned</div>
                    )}

                </CardContent>
            </Card>
        </Link>
    );
}

