
"use client";

import React, { useState } from "react";
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
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { ClientSelector } from "./client-selector";
import { suggestBestAppraiserForOrder } from "@/ai/flows/suggest-best-appraiser-for-order";
import { useToast } from "@/hooks/use-toast";
import type { User, Client, OrderType, PropertyType, OrderPriority, Order } from "@/lib/types";
import { orderTypes, propertyTypes, orderPriorities } from "@/lib/types";
import { orders as allOrders } from "@/lib/data";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
  

const formSchema = z.object({
  // Step 1
  propertyAddress: z.string().min(1, "Property address is required"),
  propertyCity: z.string().min(1, "City is required"),
  propertyState: z.string().min(1, "State is required"),
  propertyZip: z.string().min(1, "ZIP code is required"),
  propertyType: z.enum(propertyTypes, { required_error: "Please select a property type" }),
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
});

type FormData = z.infer<typeof formSchema>;

const steps = [
  { id: "Step 1", name: "Property Info", fields: ["propertyAddress", "propertyCity", "propertyState", "propertyZip", "propertyType", "accessInstructions", "specialInstructions"] },
  { id: "Step 2", name: "Loan Info", fields: ["loanType", "loanNumber", "loanAmount", "orderType"] },
  { id: "Step 3", name: "Contact Info", fields: ["clientId", "loanOfficer", "processorName", "borrowerName"] },
  { id: "Step 4", name: "Order Details", fields: ["priority", "dueDate", "feeAmount", "assignedTo"] },
  { id: "Step 5", name: "Review" },
];

type OrderFormProps = {
  appraisers: User[];
  clients: Client[];
};

export function OrderForm({ appraisers, clients }: OrderFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{appraiserId: string, reason: string} | null>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [potentialDuplicates, setPotentialDuplicates] = useState<Order[]>([]);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyAddress: "",
      propertyCity: "",
      propertyState: "",
      propertyZip: "",
      propertyType: "single_family",
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
      dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
      feeAmount: "",
      assignedTo: "",
    },
  });

  const handleAiSuggest = async () => {
    setIsAiLoading(true);
    setAiSuggestion(null);
    try {
        const orderDetails = form.getValues();
        const result = await suggestBestAppraiserForOrder({
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
        });
        setAiSuggestion(result);
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

  async function processForm(data: FormData) {
    console.log(data);
    toast({
        title: "Order Created!",
        description: "The new order has been successfully created.",
    });
  }

  type FieldName = keyof FormData;

  const proceedToNextStep = () => {
    if (currentStep < steps.length - 1) {
        if (currentStep === steps.length - 2) { // When on the last form step (Review), submit the form
            form.handleSubmit(processForm)();
        }
        setCurrentStep((step) => step + 1);
    }
  }

  const checkForDuplicates = () => {
    const { propertyAddress, propertyCity, propertyState, propertyZip } = form.getValues();
    const thirtyDaysAgo = subDays(new Date(), 30);

    const duplicates = allOrders.filter(order => {
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


  const next = async () => {
    const fields = steps[currentStep].fields;
    const output = await form.trigger(fields as FieldName[], { shouldFocus: true });

    if (!output) return;

    if (currentStep === 0) { // Property Info step
        checkForDuplicates();
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
          {currentStep === 0 && <Step1 />}
          {currentStep === 1 && <Step2 />}
          {currentStep === 2 && <Step3 clients={clients} />}
          {currentStep === 3 && <Step4 appraisers={appraisers} onSuggest={handleAiSuggest} isLoading={isAiLoading} />}
          {currentStep === 4 && <ReviewStep onSelectSuggestion={handleSelectSuggestion} suggestion={aiSuggestion} appraisers={appraisers} />}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button type="button" onClick={prev} variant="outline" disabled={currentStep === 0}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            {currentStep < steps.length - 2 && (
              <Button type="button" onClick={next}>
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            {currentStep === steps.length - 2 && (
              <Button type="button" onClick={next}>
                Review & Submit
              </Button>
            )}
             {currentStep === steps.length - 1 && (
              <Button type="button" onClick={() => form.reset()}>
                Create Another Order
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

const Step1 = () => {
  const { control } = useFormContext();
  return (
    <div className="space-y-4">
      <FormField name="propertyAddress" control={control} render={({ field }) => (
        <FormItem>
          <FormLabel>Property Address</FormLabel>
          <FormControl><Input placeholder="123 Main St" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <FormField name="propertyCity" control={control} render={({ field }) => (
        <FormItem>
          <FormLabel>City</FormLabel>
          <FormControl><Input placeholder="San Francisco" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField name="propertyState" control={control} render={({ field }) => (
        <FormItem>
          <FormLabel>State</FormLabel>
          <FormControl><Input placeholder="CA" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField name="propertyZip" control={control} render={({ field }) => (
        <FormItem>
          <FormLabel>ZIP Code</FormLabel>
          <FormControl><Input placeholder="94103" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      </div>
       <FormField control={control} name="propertyType" render={({ field }) => (
        <FormItem>
            <FormLabel>Property Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
                <SelectTrigger><SelectValue placeholder="Select a property type" /></SelectTrigger>
            </FormControl>
            <SelectContent>
                {propertyTypes.map(type => <SelectItem key={type} value={type}>{type.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
            </Select>
            <FormMessage />
        </FormItem>
        )} />
      <FormField name="accessInstructions" control={control} render={({ field }) => (
        <FormItem>
          <FormLabel>Access Instructions</FormLabel>
          <FormControl><Textarea placeholder="e.g. key under mat, call for code" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
       <FormField name="specialInstructions" control={control} render={({ field }) => (
        <FormItem>
          <FormLabel>Special Instructions</FormLabel>
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
                    <FormLabel>Order Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select an order type" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {orderTypes.map(type => <SelectItem key={type} value={type}>{type.replace(/_/g, " ")}</SelectItem>)}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
             )} />
            <FormField name="loanType" control={control} render={({ field }) => (
                <FormItem>
                <FormLabel>Loan Type</FormLabel>
                <FormControl><Input placeholder="e.g. Conventional, FHA, VA" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )} />
            <FormField name="loanNumber" control={control} render={({ field }) => (
                <FormItem>
                <FormLabel>Loan Number</FormLabel>
                <FormControl><Input placeholder="e.g. 1234567890" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )} />
            <FormField name="loanAmount" control={control} render={({ field }) => (
                <FormItem>
                <FormLabel>Loan Amount</FormLabel>
                <FormControl><Input type="number" placeholder="e.g. 500000" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )} />
        </div>
    )
}

const Step3 = ({ clients }: { clients: Client[]}) => {
    const { control } = useFormContext();
    return (
        <div className="space-y-4">
             <FormField control={control} name="clientId" render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Client</FormLabel>
                    <ClientSelector clients={clients} value={field.value} onChange={field.onChange} />
                    <FormMessage />
                </FormItem>
            )} />
            <FormField name="borrowerName" control={control} render={({ field }) => (
                <FormItem>
                <FormLabel>Borrower Name</FormLabel>
                <FormControl><Input placeholder="John Borrower" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )} />
            <FormField name="loanOfficer" control={control} render={({ field }) => (
                <FormItem>
                <FormLabel>Loan Officer</FormLabel>
                <FormControl><Input placeholder="Jane Officer" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )} />
            <FormField name="processorName" control={control} render={({ field }) => (
                <FormItem>
                <FormLabel>Processor Name</FormLabel>
                <FormControl><Input placeholder="Peter Processor" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )} />
        </div>
    )
}

const Step4 = ({ appraisers, onSuggest, isLoading }: { appraisers: User[], onSuggest: () => void, isLoading: boolean }) => {
    const { control } = useFormContext();
    return (
        <div className="space-y-4">
            <FormField control={control} name="priority" render={({ field }) => (
                <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select priority level" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {orderPriorities.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
             )} />
             <FormField control={control} name="dueDate" render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
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
                <FormLabel>Fee Amount</FormLabel>
                <FormControl><Input type="number" placeholder="$500.00" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )} />
            <div className="space-y-2">
                <FormField control={control} name="assignedTo" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Assign To Appraiser</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select an appraiser" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="">Unassigned</SelectItem>
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

        </div>
    )
}

const ReviewStep = ({ suggestion, onSelectSuggestion, appraisers }: { suggestion: {appraiserId: string, reason: string} | null, onSelectSuggestion: () => void, appraisers: User[] }) => {
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
                <p className="text-sm text-muted-foreground">Due Date: {format(values.dueDate, "PPP")}</p>
                <p className="text-sm text-muted-foreground">Fee: ${values.feeAmount}</p>
                <p className="text-sm text-muted-foreground">Assigned To: {appraiser?.name || 'Unassigned'}</p>
             </div>
             <div className="text-center pt-4">
                <h3 className="text-2xl font-bold text-green-600">Order Submitted!</h3>
                <p className="text-muted-foreground">Click "Create Another Order" to start a new one.</p>
             </div>
        </div>
    )
}
