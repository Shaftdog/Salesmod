
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
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

type OrderCardProps = {
    order: Order;
};

export function OrderCard({ order }: OrderCardProps) {
    const { toast } = useToast();
    const router = useRouter();
    const formattedDueDate = format(new Date(order.dueDate), "MMM d, yyyy");
    const formattedFee = formatCurrency(order.totalAmount);

    const handleAction = (e: React.MouseEvent, callback: () => void) => {
        e.preventDefault();
        e.stopPropagation();
        callback();
    };

    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this order?")) {
            console.log(`Deleting order ${order.id}`);
            toast({
                title: "Order deleted",
                description: `Order ${order.orderNumber} has been deleted.`,
                variant: "destructive",
                action: <Button variant="secondary" size="sm" onClick={() => toast({title: "Undo not implemented yet."})}>Undo</Button>
            });
        }
    };
    
    const handleClone = () => {
        toast({ title: "Order duplicated successfully", description: `A new order based on ${order.orderNumber} has been created.` });
    };

    const handleView = () => {
        router.push(`/orders/${order.id}`);
    }

    const handleEdit = () => {
        toast({ title: "Opening order editor..."});
        router.push(`/orders/${order.id}/edit`);
    }

    return (
        <Link href={`/orders/${order.id}`} className="block hover:shadow-lg rounded-lg transition-shadow">
            <Card className="cursor-pointer h-full flex flex-col">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-lg">
                                {order.orderNumber}
                            </CardTitle>
                            <CardDescription>{order.propertyAddress}</CardDescription>
                        </div>
                         <TooltipProvider>
                            <DropdownMenu>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => handleAction(e, () => {})}>
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
                                <DropdownMenuItem onSelect={(e) => handleAction(e as unknown as React.MouseEvent, handleView)}>View</DropdownMenuItem>
                                <DropdownMenuItem onSelect={(e) => handleAction(e as unknown as React.MouseEvent, handleEdit)}>Edit</DropdownMenuItem>
                                <DropdownMenuItem onSelect={(e) => handleAction(e as unknown as React.MouseEvent, handleClone)}>Clone</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={(e) => handleAction(e as unknown as React.MouseEvent, handleDelete)}>Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TooltipProvider>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-grow">
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
                                {order.assignee.avatarUrl && <AvatarImage src={order.assignee.avatarUrl} />}
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
