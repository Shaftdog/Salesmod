"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderForm } from "@/components/orders/order-form";
import { useAppraisers } from "@/hooks/use-appraisers";
import { useClients } from "@/hooks/use-clients";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

export default function NewOrderPage() {
    const { appraisers, isLoading: appraisersLoading } = useAppraisers();
    const { clients, isLoading: clientsLoading } = useClients();
    const searchParams = useSearchParams();

    const isLoading = appraisersLoading || clientsLoading;
    
    // Get property data from query params
    const propertyId = searchParams.get('propertyId');
    const propertyAddress = searchParams.get('propertyAddress');
    const propertyCity = searchParams.get('propertyCity');
    const propertyState = searchParams.get('propertyState');
    const propertyZip = searchParams.get('propertyZip');
    const propertyType = searchParams.get('propertyType');
    
    const initialValues = propertyId ? {
      propertyId,
      propertyAddress: propertyAddress || "",
      propertyCity: propertyCity || "",
      propertyState: propertyState || "",
      propertyZip: propertyZip || "",
      propertyType: (propertyType as any) || "single_family",
    } : undefined;

    return (
        <div className="max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>New Order</CardTitle>
                    <CardDescription>
                        Fill out the form below to create a new appraisal order. Fields marked with <span className="text-destructive">*</span> are required.
                    </CardDescription>
                    {propertyId && propertyAddress && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-900">
                                    Pre-filled from property:
                                </span>
                                <Badge variant="outline" className="text-blue-700">
                                    {propertyAddress}, {propertyCity}, {propertyState} {propertyZip}
                                </Badge>
                            </div>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : (
                        <OrderForm 
                            appraisers={appraisers} 
                            clients={clients}
                            initialValues={initialValues}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
