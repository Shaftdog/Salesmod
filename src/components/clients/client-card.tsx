
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Client } from "@/lib/types";
import Link from "next/link";
import { Button } from "../ui/button";
import { MoreHorizontal, Briefcase, DollarSign } from "lucide-react";
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

type ClientCardProps = {
    client: Client;
};

export function ClientCard({ client }: ClientCardProps) {
    const { toast } = useToast();
    const router = useRouter();
    const formattedRevenue = formatCurrency(client.totalRevenue || 0);

    const handleAction = (e: React.MouseEvent, callback: () => void) => {
        e.preventDefault();
        e.stopPropagation();
        callback();
    };

    const handleView = () => {
        toast({ title: `Loading details for ${client.companyName}...` });
        router.push(`/clients/${client.id}`);
    };

    const handleEdit = () => {
        toast({ title: "Opening edit form..." });
        router.push(`/clients/${client.id}/edit`);
    };

    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this client?")) {
            console.log(`Deleting client ${client.id}`);
            toast({ 
                title: "Client deleted",
                description: `${client.companyName} has been deleted.`,
                variant: "destructive",
                action: <Button variant="secondary" size="sm" onClick={() => toast({title: "Undo not implemented yet."})}>Undo</Button>
            });
        }
    };


    return (
        <Link href={`/clients/${client.id}`} className="block hover:shadow-lg rounded-lg transition-shadow" onClick={() => toast({ title: `Viewing ${client.companyName}...` })}>
            <Card className="cursor-pointer h-full flex flex-col">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-lg">
                                {client.companyName}
                            </CardTitle>
                            <CardDescription>{client.primaryContact}</CardDescription>
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
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={(e) => handleAction(e as unknown as React.MouseEvent, handleDelete)}>Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TooltipProvider>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-grow">
                    <div className="text-sm text-muted-foreground space-y-1">
                       <p>{client.email}</p>
                       <p>{client.phone}</p>
                    </div>
                </CardContent>
                <div className="flex items-center justify-between p-6 pt-0 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Briefcase className="h-4 w-4" /> 
                        <span>{client.activeOrders ?? 0} Active Orders</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4" /> 
                        <span className="font-semibold">{formattedRevenue}</span>
                    </div>
                </div>
            </Card>
        </Link>
    );
}
