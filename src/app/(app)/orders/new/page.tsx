"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderForm } from "@/components/orders/order-form";
import { useAppraisers } from "@/hooks/use-appraisers";
import { useClients } from "@/hooks/use-clients";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewOrderPage() {
    const { appraisers, isLoading: appraisersLoading } = useAppraisers();
    const { clients, isLoading: clientsLoading } = useClients();

    const isLoading = appraisersLoading || clientsLoading;

    return (
        <div className="max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>New Order</CardTitle>
                    <CardDescription>
                        Fill out the form below to create a new appraisal order. Fields marked with <span className="text-destructive">*</span> are required.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : (
                        <OrderForm appraisers={appraisers} clients={clients} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
