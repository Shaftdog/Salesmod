
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useClients } from "@/hooks/use-clients";

const formSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  primaryContact: z.string().min(1, "Primary contact name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  billingAddress: z.string().optional(),
  paymentTerms: z.coerce.number().positive().optional(),
});

type ClientFormData = z.infer<typeof formSchema>;

export function ClientForm() {
  const { toast } = useToast();
  const router = useRouter();
  const { createClient, isCreating } = useClients();
  
  const form = useForm<ClientFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      primaryContact: "",
      email: "",
      phone: "",
      address: "",
      billingAddress: "",
      paymentTerms: 30,
    },
  });

  async function onSubmit(data: ClientFormData) {
    try {
      await createClient({
        company_name: data.companyName,
        primary_contact: data.primaryContact,
        email: data.email,
        phone: data.phone,
        address: data.address,
        billing_address: data.billingAddress || data.address,
        payment_terms: data.paymentTerms || 30,
        is_active: true,
        active_orders: 0,
        total_revenue: 0,
      } as any);
      
      router.push("/clients");
    } catch (error: any) {
      console.error('Failed to create client:', error);
      console.error('Error details:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
      });
      // Error toast is already shown by the hook
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="Global Bank Corp" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="primaryContact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primary Contact <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="Alice Wonderland" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="alice@gbc.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="(123) 456-7890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Textarea placeholder="123 Main St, San Francisco, CA 94105" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="billingAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Billing Address <span className="text-muted-foreground">(optional)</span></FormLabel>
              <FormControl>
                <Textarea placeholder="Leave blank if same as address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="paymentTerms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Terms (in days) <span className="text-muted-foreground">(optional)</span></FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isCreating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isCreating ? "Saving..." : "Save Client"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
