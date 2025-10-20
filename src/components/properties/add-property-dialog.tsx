"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUpsertProperty } from '@/hooks/use-properties';
import { Plus, Loader2 } from 'lucide-react';
import { propertyTypes } from '@/lib/types';
import { AddressValidator } from '@/components/shared/address-validator';
import { AddressValidationResult, StandardizedAddress } from '@/lib/address-validation';
import { normalizeAddressKey, isPOBox } from '@/lib/addresses';
import { findExistingProperty } from '@/lib/properties-merge';

const propertySchema = z.object({
  addressLine1: z.string().min(1, 'Street address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2 letters').regex(/^[A-Z]{2}$/, 'State must be uppercase'),
  postalCode: z.string().regex(/^[0-9]{5}(-[0-9]{4})?$/, 'Invalid ZIP code format'),
  country: z.string().default('US'),
  propertyType: z.enum(propertyTypes),
  apn: z.string().optional(),
  yearBuilt: z.number().int().min(1800).max(new Date().getFullYear() + 1).optional(),
  gla: z.number().positive().optional(),
  lotSize: z.number().positive().optional(),
});

type PropertyFormData = z.infer<typeof propertySchema>;

interface AddPropertyDialogProps {
  trigger?: React.ReactNode;
}

export function AddPropertyDialog({ trigger }: AddPropertyDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const upsertMutation = useUpsertProperty();
  const [validationResult, setValidationResult] = useState<AddressValidationResult | null>(null);
  const [validatedAddress, setValidatedAddress] = useState<StandardizedAddress | null>(null);
  const [overrideReason, setOverrideReason] = useState<string | undefined>();

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
      propertyType: 'single_family',
      apn: '',
    },
  });

  const handleValidated = (result: AddressValidationResult) => {
    setValidationResult(result);
  };

  const handleAcceptSuggestion = async (standardized: StandardizedAddress, reason?: string) => {
    // Apply standardized address to form
    form.setValue('addressLine1', standardized.street);
    form.setValue('city', standardized.city);
    form.setValue('state', standardized.state);
    form.setValue('postalCode', standardized.zip);
    
    setValidatedAddress(standardized);
    setOverrideReason(reason);
    
    toast({
      title: 'Address Applied',
      description: reason 
        ? `Using original address (${reason})`
        : 'Standardized address applied',
    });
  };

  const onSubmit = async (data: PropertyFormData) => {
    try {
      // Check if address is PO Box
      const isPoBox = isPOBox(data.addressLine1);
      
      // Use validated/standardized address if available, otherwise user input
      const finalAddress = validatedAddress || {
        street: data.addressLine1,
        city: data.city,
        state: data.state.toUpperCase(),
        zip: data.postalCode,
        zip4: validatedAddress?.zip4,
        county: validatedAddress?.county,
        latitude: validatedAddress?.latitude,
        longitude: validatedAddress?.longitude,
      };

      const propertyData = {
        addressLine1: finalAddress.street,
        city: finalAddress.city,
        state: finalAddress.state.toUpperCase(),
        postalCode: validatedAddress?.zip4 
          ? `${finalAddress.zip}-${validatedAddress.zip4}`
          : finalAddress.zip,
        country: data.country,
        propertyType: data.propertyType,
        apn: data.apn,
        latitude: finalAddress.latitude,
        longitude: finalAddress.longitude,
        gla: data.gla,
        lotSize: data.lotSize,
        yearBuilt: data.yearBuilt,
        props: {
          is_po_box: isPoBox,
          validation_override: overrideReason ? {
            reason: overrideReason,
            at: new Date().toISOString(),
          } : undefined,
          validation: validationResult ? {
            confidence: validationResult.confidence,
            verified_at: new Date().toISOString(),
            verification_source: 'google',
            usps_deliverable: validationResult.metadata?.uspsDeliverable,
            dpv_code: validationResult.metadata?.dpvCode,
            county: validatedAddress?.county,
          } : undefined,
        },
      };

      await upsertMutation.mutateAsync(propertyData);
      
      toast({
        title: 'Property Created',
        description: `${finalAddress.street}, ${finalAddress.city}, ${finalAddress.state} has been added.`,
      });

      form.reset();
      setValidatedAddress(null);
      setValidationResult(null);
      setOverrideReason(undefined);
      setOpen(false);
    } catch (error) {
      toast({
        title: 'Failed to Create Property',
        description: 'There was an error creating the property. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Property
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Property</DialogTitle>
          <DialogDescription>
            Create a new property record. All fields with * are required.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Address Line 1 */}
            <FormField
              control={form.control}
              name="addressLine1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address *</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main Street" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address Line 2 */}
            <FormField
              control={form.control}
              name="addressLine2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 2 (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Suite 100" {...field} />
                  </FormControl>
                  <FormDescription>
                    Apartment, suite, building, floor, etc.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* City, State, ZIP Row */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input placeholder="Los Angeles" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="CA" 
                        maxLength={2}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="90001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Address Validation */}
            <AddressValidator
              street={form.watch('addressLine1')}
              city={form.watch('city')}
              state={form.watch('state')}
              zip={form.watch('postalCode')}
              onValidated={handleValidated}
              onAcceptSuggestion={handleAcceptSuggestion}
              autoValidate={true}
              disabled={upsertMutation.isPending}
            />

            {/* Property Type */}
            <FormField
              control={form.control}
              name="propertyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="single_family">Single Family</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="multi_family">Multi Family</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="land">Land</SelectItem>
                      <SelectItem value="manufactured">Manufactured</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* APN */}
            <FormField
              control={form.control}
              name="apn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>APN (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Assessor Parcel Number" {...field} />
                  </FormControl>
                  <FormDescription>
                    Assessor's Parcel Number if known
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Property Details Row */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="yearBuilt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year Built</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="1985"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gla"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GLA (sq ft)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="1500"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lotSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lot Size (sq ft)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="5000"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setOpen(false);
                }}
                disabled={upsertMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Create Property
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
