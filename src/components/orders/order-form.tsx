
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
import { CalendarIcon, ChevronLeft, ChevronRight, Loader2, Wand2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn, formatCurrency } from "@/lib/utils";
import { format, formatISO, subDays, addDays } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { ClientSelector } from "./client-selector";
import { useToast } from "@/hooks/use-toast";
import type { User, Client, OrderType, PropertyType, OrderPriority, Order } from "@/lib/types";
import { orderTypes, propertyTypes, orderPriorities } from "@/lib/types";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { QuickClientForm } from "./quick-client-form";
import { useOrders } from "@/hooks/use-orders";
import { useClients } from "@/hooks/use-clients";
import { useCurrentUser } from "@/hooks/use-appraisers";
import { useRouter } from "next/navigation";
import { AddressValidator } from "@/components/shared/address-validator";
import { AddressValidationResult, StandardizedAddress } from "@/lib/address-validation";
import { UnitSelector } from "@/components/properties/unit-selector";
import { isFeeSimplePropertyType } from "@/lib/units";
import { usePropertyUnits } from "@/hooks/use-property-units";
import { useProductionTemplates, useCreateProductionCard } from "@/hooks/use-production";
import type { ProductionTemplateWithTasks } from "@/types/production";
  

const formSchema = z.object({
  // Step 1
  propertyAddress: z.string().min(1, "Property address is required"),
  propertyCity: z.string().min(1, "City is required"),
  propertyState: z.string().min(1, "State is required"),
  propertyZip: z.string().min(1, "ZIP code is required"),
  propertyType: z.enum(propertyTypes, { required_error: "Please select a property type" }),
  unitId: z.string().optional(),
  accessInstructions: z.string().optional(),
  specialInstructions: z.string().optional(),

  // Step 2
  loanType: z.string().optional(),
  loanNumber: z.string().optional(),
  loanAmount: z.string().optional(),
  orderType: z.enum(orderTypes, { required_error: "Please select an order type" }),

  // Step 3
  clientId: z.string().min(1, "Client is required"),
  loanOfficer: z.string().optional(),
  processorName: z.string().optional(),
  borrowerName: z.string().min(1, "Borrower name is required"),

  // Step 4
  priority: z.enum(orderPriorities, { required_error: "Please select a priority" }),
  dueDate: z.date({ required_error: "Due date is required" }),
  feeAmount: z.string().min(1, "Fee is required"),
  assignedTo: z.string().optional(),
  productionTemplateId: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const steps = [
  { id: "Step 1", name: "Property Info", fields: ["propertyAddress", "propertyCity", "propertyState", "propertyZip", "propertyType", "unitId", "accessInstructions", "specialInstructions"] },
  { id: "Step 2", name: "Loan Info", fields: ["loanType", "loanNumber", "loanAmount", "orderType"] },
  { id: "Step 3", name: "Contact Info", fields: ["clientId", "loanOfficer", "processorName", "borrowerName"] },
  { id: "Step 4", name: "Order Details", fields: ["priority", "dueDate", "feeAmount", "assignedTo", "productionTemplateId"] },
  { id: "Step 5", name: "Review & Submit" },
];

type OrderFormProps = {
  appraisers: User[];
  clients: Client[];
  initialValues?: Partial<FormData & { propertyId?: string }>;
};

export function OrderForm({ appraisers, clients: initialClients, initialValues }: OrderFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{appraiserId: string, reason: string} | null>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [potentialDuplicates, setPotentialDuplicates] = useState<Order[]>([]);
  const [propertyIdFromUrl, setPropertyIdFromUrl] = useState<string | undefined>(initialValues?.propertyId);
  const [addressValidationResult, setAddressValidationResult] = useState<AddressValidationResult | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { orders: storeOrders, createOrder, isCreating } = useOrders();
  const { clients, createClient } = useClients();
  const { data: currentUser } = useCurrentUser();
  const { data: productionTemplates } = useProductionTemplates({ active_only: true });
  const createProductionCard = useCreateProductionCard();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyAddress: initialValues?.propertyAddress || "",
      propertyCity: initialValues?.propertyCity || "",
      propertyState: initialValues?.propertyState || "",
      propertyZip: initialValues?.propertyZip || "",
      propertyType: initialValues?.propertyType || "single_family",
      unitId: "",
      accessInstructions: "",
      specialInstructions: "",
      loanType: "",
      loanNumber: "",
      loanAmount: "",
      orderType: "purchase",
      clientId: "",
      loanOfficer: "",
      processorName: "",
      borrowerName: "",
      priority: "normal",
      feeAmount: "",
      assignedTo: "unassigned",
      productionTemplateId: "none",
    },
  });

  useEffect(() => {
    // Set default due date on client side to avoid hydration mismatch
    form.reset({
      ...form.getValues(),
      dueDate: addDays(new Date(), 7),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
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


  const handleAiSuggest = async () => {
    setIsAiLoading(true);
    setAiSuggestion(null);
    const validation = await form.trigger(["propertyAddress", "propertyCity", "propertyState", "propertyZip", "priority", "orderType"]);
    if (!validation) {
        toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Please fill out property and order details before using AI suggestion.",
        });
        setIsAiLoading(false);
        return;
    }
    try {
        const orderDetails = form.getValues();
        const response = await fetch('/api/suggest-appraiser', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                propertyAddress: orderDetails.propertyAddress,
                propertyCity: orderDetails.propertyCity,
                propertyState: orderDetails.propertyState,
                propertyZip: orderDetails.propertyZip,
                orderPriority: orderDetails.priority,
                orderType: orderDetails.orderType,
                appraisers: appraisers.map(a => ({
                    id: a.id,
                    name: a.name,
                    availability: a.availability ?? false,
                    geographicCoverage: a.geographicCoverage ?? '',
                    workload: a.workload ?? 0,
                    rating: a.rating ?? 0,
                })),
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to get AI suggestion');
        }

        const result = await response.json();
        setAiSuggestion(result);
        toast({
            title: "AI Suggestion Ready",
            description: "Review the suggested appraiser below.",
        });
    } catch (error) {
        console.error("AI suggestion failed:", error);
        toast({
            variant: "destructive",
            title: "AI Suggestion Failed",
            description: "Could not get an appraiser suggestion. Please try again.",
        });
    } finally {
        setIsAiLoading(false);
    }
  }

  const handleSelectSuggestion = () => {
    if (aiSuggestion) {
      form.setValue("assignedTo", aiSuggestion.appraiserId);
      toast({
        title: "Appraiser Assigned",
        description: `${appraisers.find(a => a.id === aiSuggestion.appraiserId)?.name} has been assigned to the order.`,
      })
    }
  }

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
    if (!currentUser || !currentUser.id) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "Your session has expired. Please refresh and try again.",
      });
      console.error('currentUser is missing or has no id:', currentUser);
      return;
    }

    try {
      console.log('Creating order with currentUser:', currentUser.id)
      const newOrder = await createOrder({
        org_id: currentUser.id,
        status: 'new',
        priority: data.priority,
        order_type: data.orderType,
        property_address: data.propertyAddress,
        property_city: data.propertyCity,
        property_state: data.propertyState,
        property_zip: data.propertyZip,
        property_type: data.propertyType,
        property_id: propertyIdFromUrl || undefined,
        property_unit_id: data.unitId || undefined,
        borrower_name: data.borrowerName,
        client_id: data.clientId,
        fee_amount: parseFloat(data.feeAmount),
        total_amount: parseFloat(data.feeAmount),
        due_date: formatISO(data.dueDate),
        ordered_date: formatISO(new Date()),
        assigned_to: data.assignedTo === 'unassigned' ? undefined : data.assignedTo,
        created_by: currentUser.id,
        loan_type: data.loanType,
        loan_number: data.loanNumber,
        loan_amount: data.loanAmount ? parseFloat(data.loanAmount) : undefined,
        loan_officer: data.loanOfficer,
        processor_name: data.processorName,
        access_instructions: data.accessInstructions,
        special_instructions: data.specialInstructions,
      } as any);

      // Create production card if a template is selected
      if (data.productionTemplateId && data.productionTemplateId !== 'none' && newOrder?.id) {
        try {
          // Map order priority to production card priority
          const priorityMap: Record<string, 'low' | 'normal' | 'high' | 'urgent'> = {
            'rush': 'urgent',
            'high': 'high',
            'normal': 'normal',
            'low': 'low',
          };
          const cardPriority = priorityMap[data.priority] || 'normal';

          await createProductionCard.mutateAsync({
            order_id: newOrder.id,
            template_id: data.productionTemplateId,
            due_date: formatISO(data.dueDate),
            priority: cardPriority,
            assigned_appraiser_id: data.assignedTo !== 'unassigned' ? data.assignedTo : undefined,
          });
        } catch (prodError) {
          console.error('Failed to create production card:', prodError);
          // Don't fail the whole order creation if production card fails
        }
      }

      // Reset form for next entry
      form.reset();
      setCurrentStep(0);

      // Redirect to orders page
      router.push('/orders');
    } catch (error) {
      console.error('Failed to create order:', error);
    }
  }

  type FieldName = keyof FormData;

  const next = async () => {
    const fields = steps[currentStep].fields;
    const output = await form.trigger(fields as FieldName[], { shouldFocus: true });

    if (!output) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out all required fields before continuing.",
      });
      return;
    }

    if (currentStep === 0) { // Property Info step
        checkForDuplicates();
    } else if (currentStep < steps.length - 1) {
        setCurrentStep((step) => step + 1);
    }
  };

  const proceedToNextStep = () => {
    if (currentStep < steps.length - 1) {
        setCurrentStep((step) => step + 1);
    }
  }

  const checkForDuplicates = () => {
    const { propertyAddress, propertyCity, propertyState, propertyZip } = form.getValues();
    const thirtyDaysAgo = subDays(new Date(), 30);

    const duplicates = storeOrders.filter(order => {
        const orderDate = new Date(order.orderedDate);
        return (
            order.propertyAddress.toLowerCase() === propertyAddress.toLowerCase() &&
            order.propertyCity.toLowerCase() === propertyCity.toLowerCase() &&
            order.propertyState.toLowerCase() === propertyState.toLowerCase() &&
            order.propertyZip === propertyZip &&
            orderDate >= thirtyDaysAgo
        );
    });

    if (duplicates.length > 0) {
        setPotentialDuplicates(duplicates);
        setShowDuplicateWarning(true);
    } else {
        proceedToNextStep();
    }
  };


  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep((step) => step - 1);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(processForm)} className="space-y-8">
          <Progress value={progress} className="w-full" />
          
          <div className="min-h-[450px]">
            <fieldset disabled={isCreating}>
              {currentStep === 0 && <Step1 
                onAddressValidation={handleAddressValidation}
                onAcceptAddressSuggestion={handleAcceptAddressSuggestion}
                propertyId={propertyIdFromUrl}
              />}
              {currentStep === 1 && <Step2 />}
              {currentStep === 2 && <Step3 clients={clients} onQuickAdd={handleQuickAddClient} />}
              {currentStep === 3 && <Step4 appraisers={appraisers} productionTemplates={productionTemplates || []} onSuggest={handleAiSuggest} isLoading={isAiLoading} />}
              {currentStep === 4 && <ReviewStep onSelectSuggestion={handleSelectSuggestion} suggestion={aiSuggestion} appraisers={appraisers} clients={clients} />}
            </fieldset>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button type="button" onClick={prev} variant="outline" disabled={currentStep === 0 || isCreating}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            {currentStep < steps.length - 2 && (
              <Button type="button" onClick={next} disabled={isCreating}>
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
             {currentStep === steps.length - 2 && (
               <Button type="button" onClick={next} disabled={isCreating}>
                 Review Order
              </Button>
            )}
            {currentStep === steps.length - 1 && (
              <Button type="submit" disabled={isCreating}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isCreating ? "Submitting..." : "Submit Order"}
              </Button>
            )}
          </div>
        </form>
      </FormProvider>

      <AlertDialog open={showDuplicateWarning} onOpenChange={setShowDuplicateWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Potential Duplicate Order</AlertDialogTitle>
            <AlertDialogDescription>
              An order for this property address was created recently. Are you sure you want to create a new one?
              <ul className="mt-2 list-disc list-inside bg-muted p-2 rounded-md">
                {potentialDuplicates.map(d => (
                    <li key={d.id} className="text-sm">Order #{d.orderNumber} created on {format(new Date(d.orderedDate), "PPP")}</li>
                ))}
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
                setShowDuplicateWarning(false);
                proceedToNextStep();
            }}>
              Create Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const Step1 = ({ 
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
        autoValidate={true}
        className="mt-4"
      />
       <FormField control={control} name="propertyType" render={({ field }) => (
        <FormItem>
            <FormLabel>Property Type <span className="text-destructive">*</span></FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
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

const Step2 = () => {
    const { control } = useFormContext();
    return (
        <div className="space-y-4">
             <FormField control={control} name="orderType" render={({ field }) => (
                <FormItem>
                    <FormLabel>Order Type <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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

const Step3 = ({ clients, onQuickAdd }: { clients: Client[], onQuickAdd: (data: any) => void }) => {
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

const Step4 = ({ appraisers, productionTemplates, onSuggest, isLoading }: { appraisers: User[], productionTemplates: ProductionTemplateWithTasks[], onSuggest: () => void, isLoading: boolean }) => {
    const { control } = useFormContext();
    return (
        <div className="space-y-4">
            <FormField control={control} name="priority" render={({ field }) => (
                <FormItem>
                    <FormLabel>Priority <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <div className="space-y-2">
                <FormField control={control} name="assignedTo" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Assign To Appraiser <span className="text-muted-foreground">(optional)</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
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
                <Button type="button" variant="outline" size="sm" onClick={onSuggest} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    AI Suggest Appraiser
                </Button>
            </div>

            {/* Production Template Selector */}
            <FormField control={control} name="productionTemplateId" render={({ field }) => (
                <FormItem>
                    <FormLabel>Production Template <span className="text-muted-foreground">(optional)</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a production template" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="none">No template (skip production tracking)</SelectItem>
                        {productionTemplates.map(template => (
                            <SelectItem key={template.id} value={template.id}>
                                {template.name}
                                {template.tasks && template.tasks.length > 0 && (
                                    <span className="text-muted-foreground ml-2">({template.tasks.length} tasks)</span>
                                )}
                            </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <FormDescription>
                        Select a template to create a production card for tracking this order through the workflow
                    </FormDescription>
                    <FormMessage />
                </FormItem>
            )} />

        </div>
    )
}

const ReviewStep = ({ suggestion, onSelectSuggestion, appraisers, clients }: { suggestion: {appraiserId: string, reason: string} | null, onSelectSuggestion: () => void, appraisers: User[], clients: Client[] }) => {
    const { getValues } = useFormContext();
    const values = getValues();
    const client = clients.find(c => c.id === values.clientId);
    const appraiser = appraisers.find(a => a.id === values.assignedTo);
    
    return (
        <div className="space-y-6">
             <h3 className="text-lg font-medium">Review Order</h3>
             {suggestion && (
                <div className="p-4 bg-accent/20 border border-accent rounded-lg">
                    <h4 className="font-semibold text-accent-foreground flex items-center gap-2"><Wand2 className="h-5 w-5" /> AI Suggestion</h4>
                    <p className="text-sm mt-2">{suggestion.reason}</p>
                    <p className="text-sm mt-1 font-semibold">Suggested Appraiser: {appraisers.find(a => a.id === suggestion.appraiserId)?.name}</p>
                    <Button size="sm" className="mt-2" onClick={onSelectSuggestion}>Accept Suggestion</Button>
                </div>
            )}
             <div className="space-y-2">
                <h4 className="font-medium">Property</h4>
                <p className="text-sm text-muted-foreground">{values.propertyAddress}, {values.propertyCity}, {values.propertyState} {values.propertyZip}</p>
             </div>
             <div className="space-y-2">
                <h4 className="font-medium">Client</h4>
                <p className="text-sm text-muted-foreground">{client?.companyName}</p>
             </div>
             <div className="space-y-2">
                <h4 className="font-medium">Details</h4>
                <p className="text-sm text-muted-foreground">Due Date: {values.dueDate ? format(values.dueDate, "PPP") : 'Not set'}</p>
                <p className="text-sm text-muted-foreground">Fee: {formatCurrency(parseFloat(values.feeAmount || '0'))}</p>
                <p className="text-sm text-muted-foreground">Assigned To: {appraiser?.name || 'Unassigned'}</p>
             </div>
        </div>
    )
}
