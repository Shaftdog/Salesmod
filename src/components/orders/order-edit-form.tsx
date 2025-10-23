"use client";

import React, { useState, useEffect } from "react";
import { useForm, FormProvider, useFormContext, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronLeft, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn, formatCurrency } from "@/lib/utils";
import { format, formatISO, parseISO } from "date-fns";
import { ClientSelector } from "./client-selector";
import { useToast } from "@/hooks/use-toast";
import type { User, Client, OrderType, PropertyType, OrderPriority, Order } from "@/lib/types";
import { orderTypes, propertyTypes, orderPriorities } from "@/lib/types";
import { useOrders } from "@/hooks/use-orders";
import { useClients } from "@/hooks/use-clients";
import { useRouter } from "next/navigation";
import { AddressValidator } from "@/components/shared/address-validator";
import { AddressValidationResult, StandardizedAddress } from "@/lib/address-validation";
import { UnitSelector } from "@/components/properties/unit-selector";
import { isFeeSimplePropertyType } from "@/lib/units";
import { usePropertyUnits } from "@/hooks/use-property-units";
  

const formSchema = z.object({
  // Property Info
  propertyAddress: z.string().min(1, "Property address is required"),
  propertyCity: z.string().min(1, "City is required"),
  propertyState: z.string().min(1, "State is required"),
  propertyZip: z.string().min(1, "ZIP code is required"),
  propertyType: z.enum(propertyTypes, { required_error: "Please select a property type" }),
  unitId: z.string().optional(),
  accessInstructions: z.string().optional(),
  specialInstructions: z.string().optional(),

  // Loan Info
  loanType: z.string().optional(),
  loanNumber: z.string().optional(),
  loanAmount: z.string().optional(),
  orderType: z.enum(orderTypes, { required_error: "Please select an order type" }),

  // Contact Info
  clientId: z.string().min(1, "Client is required"),
  loanOfficer: z.string().optional(),
  processorName: z.string().optional(),
  borrowerName: z.string().min(1, "Borrower name is required"),

  // Order Details
  priority: z.enum(orderPriorities, { required_error: "Please select a priority" }),
  dueDate: z.date({ required_error: "Due date is required" }),
  feeAmount: z.string().min(1, "Fee is required"),
  assignedTo: z.string().optional(),
  
  // Important Dates
  orderedDate: z.date().optional(),
  assignedDate: z.date().optional(),
  completedDate: z.date().optional(),
  deliveredDate: z.date().optional(),
});

type FormData = z.infer<typeof formSchema>;

type OrderEditFormProps = {
  order: Order;
  appraisers: User[];
  clients: Client[];
};

export function OrderEditForm({ order, appraisers, clients: initialClients }: OrderEditFormProps) {
  const [addressValidationResult, setAddressValidationResult] = useState<AddressValidationResult | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { updateOrder, isUpdating } = useOrders();
  const { clients, createClient } = useClients();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyAddress: order.propertyAddress || "",
      propertyCity: order.propertyCity || "",
      propertyState: order.propertyState || "",
      propertyZip: order.propertyZip || "",
      propertyType: order.propertyType || "single_family",
      unitId: order.propertyUnitId || "",
      accessInstructions: order.accessInstructions || "",
      specialInstructions: order.specialInstructions || "",
      loanType: order.loanType || "",
      loanNumber: order.loanNumber || "",
      loanAmount: order.loanAmount?.toString() || "",
      orderType: order.orderType || "purchase",
      clientId: order.clientId || "",
      loanOfficer: order.loanOfficer || "",
      processorName: order.processorName || "",
      borrowerName: order.borrowerName || "",
      priority: order.priority || "normal",
      feeAmount: order.feeAmount?.toString() || "",
      assignedTo: order.assignedTo || "unassigned",
      dueDate: order.dueDate ? parseISO(order.dueDate) : new Date(),
      orderedDate: order.orderedDate ? parseISO(order.orderedDate) : undefined,
      assignedDate: order.assignedDate ? parseISO(order.assignedDate) : undefined,
      completedDate: order.completedDate ? parseISO(order.completedDate) : undefined,
      deliveredDate: order.deliveredDate ? parseISO(order.deliveredDate) : undefined,
    },
  });

  const handleQuickAddClient = async (clientData: any) => {
    try {
      const newClient = await createClient({
        company_name: clientData.companyName,
        primary_contact: clientData.primaryContact,
        email: clientData.email,
        phone: clientData.phone,
        address: clientData.address,
        billing_address: clientData.address,
        payment_terms: 30,
        is_active: true,
        active_orders: 0,
        total_revenue: 0,
      } as any);
      
      form.setValue("clientId", newClient.id);
    } catch (error) {
      console.error('Failed to add client:', error);
    }
  };

  const handleAddressValidation = (result: AddressValidationResult) => {
    setAddressValidationResult(result);
  };

  const handleAcceptAddressSuggestion = (standardized: StandardizedAddress, overrideReason?: string) => {
    // Update form fields with standardized address
    form.setValue("propertyAddress", standardized.street);
    form.setValue("propertyCity", standardized.city);
    form.setValue("propertyState", standardized.state);
    form.setValue("propertyZip", standardized.zip);
    
    toast({
      title: "Address Standardized",
      description: overrideReason ? `Address updated: ${overrideReason}` : "Address has been standardized",
    });
  };

  async function processForm(data: FormData) {
    try {
      await updateOrder({
        id: order.id,
        priority: data.priority,
        order_type: data.orderType,
        property_address: data.propertyAddress,
        property_city: data.propertyCity,
        property_state: data.propertyState,
        property_zip: data.propertyZip,
        property_type: data.propertyType,
        property_unit_id: data.unitId || undefined,
        borrower_name: data.borrowerName,
        client_id: data.clientId,
        fee_amount: parseFloat(data.feeAmount),
        total_amount: parseFloat(data.feeAmount),
        due_date: formatISO(data.dueDate),
        assigned_to: data.assignedTo === 'unassigned' ? null : data.assignedTo,
        loan_type: data.loanType,
        loan_number: data.loanNumber,
        loan_amount: data.loanAmount ? parseFloat(data.loanAmount) : undefined,
        loan_officer: data.loanOfficer,
        processor_name: data.processorName,
        access_instructions: data.accessInstructions,
        special_instructions: data.specialInstructions,
        ordered_date: data.orderedDate ? formatISO(data.orderedDate) : undefined,
        assigned_date: data.assignedDate ? formatISO(data.assignedDate) : undefined,
        completed_date: data.completedDate ? formatISO(data.completedDate) : undefined,
        delivered_date: data.deliveredDate ? formatISO(data.deliveredDate) : undefined,
      } as any);
      
      // Redirect back to order detail page
      router.push(`/orders/${order.id}`);
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(processForm)} className="space-y-8">
        <fieldset disabled={isUpdating} className="space-y-8">
          {/* Property Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Property Information</h3>
            <PropertyInfoFields 
              onAddressValidation={handleAddressValidation}
              onAcceptAddressSuggestion={handleAcceptAddressSuggestion}
              propertyId={order.propertyId}
            />
          </div>

          {/* Loan Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Loan Information</h3>
            <LoanInfoFields />
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contact Information</h3>
            <ContactInfoFields clients={clients} onQuickAdd={handleQuickAddClient} />
          </div>

          {/* Order Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Order Details</h3>
            <OrderDetailsFields appraisers={appraisers} />
          </div>
        </fieldset>

        {/* Actions */}
        <div className="flex justify-between gap-4 pt-4 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push(`/orders/${order.id}`)}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isUpdating}>
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

const PropertyInfoFields = ({ 
  onAddressValidation, 
  onAcceptAddressSuggestion,
  propertyId
}: { 
  onAddressValidation: (result: AddressValidationResult) => void;
  onAcceptAddressSuggestion: (standardized: StandardizedAddress, overrideReason?: string) => void;
  propertyId?: string;
}) => {
  const { control, watch, setValue } = useFormContext();
  const propertyAddress = watch("propertyAddress");
  const propertyCity = watch("propertyCity");
  const propertyState = watch("propertyState");
  const propertyZip = watch("propertyZip");
  const propertyType = watch("propertyType");
  const unitId = watch("unitId");
  
  // Fetch units if we have a propertyId
  const { data: units = [] } = usePropertyUnits(propertyId);
  
  // Show unit selector if property is fee-simple type OR if property has units
  const shouldShowUnitSelector = propertyId && (
    isFeeSimplePropertyType(propertyType) || units.length > 0
  );

  return (
    <div className="space-y-4">
      <FormField name="propertyAddress" control={control} render={({ field }) => (
        <FormItem>
          <FormLabel>Property Address <span className="text-destructive">*</span></FormLabel>
          <FormControl><Input placeholder="123 Main St" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <FormField name="propertyCity" control={control} render={({ field }) => (
        <FormItem>
          <FormLabel>City <span className="text-destructive">*</span></FormLabel>
          <FormControl><Input placeholder="San Francisco" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField name="propertyState" control={control} render={({ field }) => (
        <FormItem>
          <FormLabel>State <span className="text-destructive">*</span></FormLabel>
          <FormControl><Input placeholder="CA" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField name="propertyZip" control={control} render={({ field }) => (
        <FormItem>
          <FormLabel>ZIP Code <span className="text-destructive">*</span></FormLabel>
          <FormControl><Input placeholder="94103" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      </div>
      
      {/* Address Validation Component */}
      <AddressValidator
        street={propertyAddress || ""}
        city={propertyCity || ""}
        state={propertyState || ""}
        zip={propertyZip || ""}
        onValidated={onAddressValidation}
        onAcceptSuggestion={onAcceptAddressSuggestion}
        autoValidate={false}
        className="mt-4"
      />
       <FormField control={control} name="propertyType" render={({ field }) => (
        <FormItem>
            <FormLabel>Property Type <span className="text-destructive">*</span></FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
                <SelectTrigger><SelectValue placeholder="Select a property type" /></SelectTrigger>
            </FormControl>
            <SelectContent>
                {propertyTypes.map(type => <SelectItem key={type} value={type} className="capitalize">{type.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
            </Select>
            <FormMessage />
        </FormItem>
        )} />
      
      {/* Unit Selector - only for fee-simple properties or properties with existing units */}
      {shouldShowUnitSelector && (
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Unit <span className="text-muted-foreground">(optional)</span>
          </label>
          <UnitSelector
            propertyId={propertyId!}
            propertyType={propertyType}
            selectedUnitId={unitId}
            onSelectUnit={(selectedUnitId) => {
              setValue("unitId", selectedUnitId || "");
            }}
            allowCreate={true}
          />
        </div>
      )}
      
      <FormField name="accessInstructions" control={control} render={({ field }) => (
        <FormItem>
          <FormLabel>Access Instructions <span className="text-muted-foreground">(optional)</span></FormLabel>
          <FormControl><Textarea placeholder="e.g. key under mat, call for code" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
       <FormField name="specialInstructions" control={control} render={({ field }) => (
        <FormItem>
          <FormLabel>Special Instructions <span className="text-muted-foreground">(optional)</span></FormLabel>
          <FormControl><Textarea placeholder="e.g. Beware of dog, gate code is #1234" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
    </div>
  )
}

const LoanInfoFields = () => {
    const { control } = useFormContext();
    return (
        <div className="space-y-4">
             <FormField control={control} name="orderType" render={({ field }) => (
                <FormItem>
                    <FormLabel>Order Type <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select an order type" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {orderTypes.map(type => <SelectItem key={type} value={type} className="capitalize">{type.replace(/_/g, " ")}</SelectItem>)}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
             )} />
            <FormField name="loanType" control={control} render={({ field }) => (
                <FormItem>
                <FormLabel>Loan Type <span className="text-muted-foreground">(optional)</span></FormLabel>
                <FormControl><Input placeholder="e.g. Conventional, FHA, VA" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )} />
            <FormField name="loanNumber" control={control} render={({ field }) => (
                <FormItem>
                <FormLabel>Loan Number <span className="text-muted-foreground">(optional)</span></FormLabel>
                <FormControl><Input placeholder="e.g. 1234567890" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )} />
            <FormField name="loanAmount" control={control} render={({ field }) => (
                <FormItem>
                <FormLabel>Loan Amount <span className="text-muted-foreground">(optional)</span></FormLabel>
                <FormControl><Input type="number" placeholder="e.g. 500000" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )} />
        </div>
    )
}

const ContactInfoFields = ({ clients, onQuickAdd }: { clients: Client[], onQuickAdd: (data: any) => void }) => {
    const { control } = useFormContext();
    return (
        <div className="space-y-4">
             <FormField control={control} name="clientId" render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Client <span className="text-destructive">*</span></FormLabel>
                    <ClientSelector clients={clients} value={field.value} onChange={field.onChange} onQuickAdd={onQuickAdd} />
                    <FormMessage />
                </FormItem>
            )} />
            <FormField name="borrowerName" control={control} render={({ field }) => (
                <FormItem>
                <FormLabel>Borrower Name <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input placeholder="John Borrower" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )} />
            <FormField name="loanOfficer" control={control} render={({ field }) => (
                <FormItem>
                <FormLabel>Loan Officer <span className="text-muted-foreground">(optional)</span></FormLabel>
                <FormControl><Input placeholder="Jane Officer" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )} />
            <FormField name="processorName" control={control} render={({ field }) => (
                <FormItem>
                <FormLabel>Processor Name <span className="text-muted-foreground">(optional)</span></FormLabel>
                <FormControl><Input placeholder="Peter Processor" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )} />
        </div>
    )
}

const OrderDetailsFields = ({ appraisers }: { appraisers: User[] }) => {
    const { control } = useFormContext();
    return (
        <div className="space-y-4">
            <FormField control={control} name="priority" render={({ field }) => (
                <FormItem>
                    <FormLabel>Priority <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select priority level" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {orderPriorities.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
             )} />
             <FormField control={control} name="dueDate" render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Due Date <span className="text-destructive">*</span></FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-[240px] pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? (
                                format(field.value, "PPP")
                            ) : (
                                <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
            )} />
             <FormField name="feeAmount" control={control} render={({ field }) => (
                <FormItem>
                <FormLabel>Fee Amount <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input type="number" placeholder="e.g. 500.00" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )} />
            <FormField control={control} name="assignedTo" render={({ field }) => (
                <FormItem>
                    <FormLabel>Assign To Appraiser <span className="text-muted-foreground">(optional)</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select an appraiser" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {appraisers.map(user => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )} />

            <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-4">Important Dates</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={control} name="orderedDate" render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Ordered Date <span className="text-muted-foreground">(optional)</span></FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value ? (
                                        format(field.value, "PPP")
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <FormField control={control} name="assignedDate" render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Assigned Date <span className="text-muted-foreground">(optional)</span></FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value ? (
                                        format(field.value, "PPP")
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <FormField control={control} name="completedDate" render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Completed Date <span className="text-muted-foreground">(optional)</span></FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value ? (
                                        format(field.value, "PPP")
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <FormField control={control} name="deliveredDate" render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Delivered Date <span className="text-muted-foreground">(optional)</span></FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value ? (
                                        format(field.value, "PPP")
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
            </div>
        </div>
    )
}

