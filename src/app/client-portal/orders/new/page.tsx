"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Home, FileText } from "lucide-react";
import Link from "next/link";

const orderSchema = z.object({
  propertyAddress: z.string().min(5, "Address is required"),
  propertyCity: z.string().min(2, "City is required"),
  propertyState: z.string().length(2, "State must be 2 characters"),
  propertyZip: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
  propertyType: z.string().min(1, "Property type is required"),
  orderType: z.string().min(1, "Order type is required"),
  dueDate: z.string().min(1, "Due date is required"),
  borrowerName: z.string().optional(),
  loanNumber: z.string().optional(),
  notes: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

const propertyTypes = [
  { value: "single_family", label: "Single Family" },
  { value: "condo", label: "Condominium" },
  { value: "townhouse", label: "Townhouse" },
  { value: "multi_family", label: "Multi-Family" },
  { value: "land", label: "Land/Vacant Lot" },
  { value: "commercial", label: "Commercial" },
];

const orderTypes = [
  { value: "full_appraisal", label: "Full Appraisal" },
  { value: "drive_by", label: "Drive-By Appraisal" },
  { value: "desktop", label: "Desktop Appraisal" },
  { value: "bpo", label: "Broker Price Opinion (BPO)" },
];

export default function NewOrderPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
  });

  const propertyType = watch("propertyType");
  const orderType = watch("orderType");

  const onSubmit = async (data: OrderFormData) => {
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      // Get user's tenant_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", session.user.id)
        .single();

      if (!profile?.tenant_id) {
        throw new Error("User profile not found");
      }

      // Create property first
      const { data: property, error: propertyError } = await supabase
        .from("properties")
        .insert({
          address: data.propertyAddress,
          city: data.propertyCity,
          state: data.propertyState,
          zip: data.propertyZip,
          property_type: data.propertyType,
          tenant_id: profile.tenant_id,
        })
        .select()
        .single();

      if (propertyError) {
        throw propertyError;
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          property_id: property.id,
          tenant_id: profile.tenant_id,
          status: "INTAKE",
          order_type: data.orderType,
          ordered_date: new Date().toISOString(),
          due_date: data.dueDate,
          borrower_name: data.borrowerName || null,
          loan_number: data.loanNumber || null,
          notes: data.notes || null,
        })
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      toast({
        title: "Order Submitted!",
        description: "Your appraisal request has been submitted successfully.",
      });

      router.push(`/client-portal/orders/${order.id}`);
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit order. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="container mx-auto p-6 max-w-3xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/client-portal/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Request Appraisal</h1>
              <p className="text-muted-foreground">Submit a new appraisal request</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Property Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-primary" />
                  <CardTitle>Property Information</CardTitle>
                </div>
                <CardDescription>
                  Enter the details of the property to be appraised
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="propertyAddress">Street Address *</Label>
                  <Input
                    id="propertyAddress"
                    placeholder="123 Main St"
                    disabled={isLoading}
                    {...register("propertyAddress")}
                  />
                  {errors.propertyAddress && (
                    <p className="text-sm text-destructive">{errors.propertyAddress.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-3 md:col-span-1 space-y-2">
                    <Label htmlFor="propertyCity">City *</Label>
                    <Input
                      id="propertyCity"
                      placeholder="Miami"
                      disabled={isLoading}
                      {...register("propertyCity")}
                    />
                    {errors.propertyCity && (
                      <p className="text-sm text-destructive">{errors.propertyCity.message}</p>
                    )}
                  </div>

                  <div className="col-span-3 md:col-span-1 space-y-2">
                    <Label htmlFor="propertyState">State *</Label>
                    <Input
                      id="propertyState"
                      placeholder="FL"
                      maxLength={2}
                      disabled={isLoading}
                      {...register("propertyState")}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase();
                        setValue("propertyState", value);
                      }}
                    />
                    {errors.propertyState && (
                      <p className="text-sm text-destructive">{errors.propertyState.message}</p>
                    )}
                  </div>

                  <div className="col-span-3 md:col-span-1 space-y-2">
                    <Label htmlFor="propertyZip">ZIP Code *</Label>
                    <Input
                      id="propertyZip"
                      placeholder="33101"
                      disabled={isLoading}
                      {...register("propertyZip")}
                    />
                    {errors.propertyZip && (
                      <p className="text-sm text-destructive">{errors.propertyZip.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propertyType">Property Type *</Label>
                  <Select
                    onValueChange={(value) => setValue("propertyType", value)}
                    value={propertyType}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.propertyType && (
                    <p className="text-sm text-destructive">{errors.propertyType.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle>Order Details</CardTitle>
                </div>
                <CardDescription>
                  Specify the type of appraisal and timeline
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orderType">Order Type *</Label>
                  <Select
                    onValueChange={(value) => setValue("orderType", value)}
                    value={orderType}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select order type" />
                    </SelectTrigger>
                    <SelectContent>
                      {orderTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.orderType && (
                    <p className="text-sm text-destructive">{errors.orderType.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    disabled={isLoading}
                    {...register("dueDate")}
                    min={new Date().toISOString().split("T")[0]}
                  />
                  {errors.dueDate && (
                    <p className="text-sm text-destructive">{errors.dueDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="borrowerName">Borrower Name (Optional)</Label>
                  <Input
                    id="borrowerName"
                    placeholder="John Doe"
                    disabled={isLoading}
                    {...register("borrowerName")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loanNumber">Loan Number (Optional)</Label>
                  <Input
                    id="loanNumber"
                    placeholder="1234567890"
                    disabled={isLoading}
                    {...register("loanNumber")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special instructions or information..."
                    disabled={isLoading}
                    rows={4}
                    {...register("notes")}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Request
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
