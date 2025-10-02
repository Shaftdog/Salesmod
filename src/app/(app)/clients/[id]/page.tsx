
import { clients } from "@/lib/data";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, DollarSign, Edit, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { OrdersList } from "@/components/orders/orders-list";
import { orders } from "@/lib/data";

export default function ClientDetailsPage({ params }: { params: { id: string } }) {
  const client = clients.find((c) => c.id === params.id);

  if (!client) {
    notFound();
  }

  const clientOrders = orders.filter(o => o.clientId === client.id).slice(0, 5);

  return (
    <div className="grid gap-4 md:grid-cols-4 md:gap-8 lg:grid-cols-5">
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{client.companyName}</CardTitle>
                <CardDescription>
                  {client.primaryContact}
                </CardDescription>
              </div>
               <Button asChild size="sm" variant="outline">
                    <Link href={`/clients/${client.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Client
                    </Link>
                </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${client.email}`} className="text-primary hover:underline">{client.email}</a>
                    </div>
                     <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${client.phone}`} className="text-primary hover:underline">{client.phone}</a>
                    </div>
                     <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span>{client.activeOrders} Active Orders</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>{formatCurrency(client.totalRevenue || 0)} Total Revenue</span>
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold text-sm">Billing Address</h3>
                    <p className="text-sm text-muted-foreground">{client.billingAddress}</p>
                </div>
            </div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              The 5 most recent orders from this client.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrdersList orders={clientOrders} isLoading={false} isMinimal={true} />
          </CardContent>
        </Card>
      </div>
       <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
        <Card>
            <CardHeader>
                <CardTitle>Client Notes</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">No notes for this client yet.</p>
                <Button variant="outline" size="sm" className="mt-4">Add Note</Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
