
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

type ClientCardProps = {
    client: Client;
};

export function ClientCard({ client }: ClientCardProps) {
    const { toast } = useToast();
    const router = useRouter();
    const formattedRevenue = client.totalRevenue ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(client.totalRevenue) : '$0';

    const handleView = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        toast({ title: "Loading client details..." });
        router.push(`/clients/${client.id}`);
    };

    const handleEdit = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        toast({ title: "Opening edit form..." });
        // This would navigate to an edit page, which we can build later.
        // router.push(`/clients/${client.id}/edit`);
    };

    const handleDelete = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        // A simple confirmation dialog. For a better UX, a custom AlertDialog component would be ideal.
        if (window.confirm("Are you sure you want to delete this client?")) {
            console.log(`Deleting client ${client.id}`);
            toast({ 
                title: "Client deleted",
                description: `${client.companyName} has been deleted.`,
                variant: "destructive",
                // The current toast implementation doesn't support an undo action out of the box.
                // This would require a more advanced toast setup.
            });
        }
    };


    return (
        <Link href={`/clients/${client.id}`} className="block hover:shadow-lg rounded-lg">
            <Card className="cursor-pointer h-full flex flex-col">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-lg">
                                {client.companyName}
                            </CardTitle>
                            <CardDescription>{client.primaryContact}</CardDescription>
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
                                <DropdownMenuItem onSelect={handleView}>View</DropdownMenuItem>
                                <DropdownMenuItem onSelect={handleEdit}>Edit</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onSelect={handleDelete}>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
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
