"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, DollarSign, Calculator } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { CreateProductSchema, type CreateProductInput } from "@/lib/validations/products";
import { useCreateProduct, useUpdateProduct } from "@/hooks/use-products";
import type { Product, ProductCategory } from "@/types/products";
import { PRODUCT_CATEGORY_OPTIONS } from "@/types/products";
import { Card, CardContent } from "@/components/ui/card";

type ProductFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product; // If provided, we're editing. Otherwise, creating new.
};

export function ProductForm({ open, onOpenChange, product }: ProductFormProps) {
  const isEditing = !!product;
  const [showPricePreview, setShowPricePreview] = useState(false);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const form = useForm<CreateProductInput>({
    resolver: zodResolver(CreateProductSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      sku: product?.sku || "",
      category: product?.category || "core",
      base_price: product?.base_price || 0,
      requires_sf_calculation: product?.requires_sf_calculation || false,
      sf_threshold: product?.sf_threshold || 3000,
      price_per_sf: product?.price_per_sf || 0.10,
      is_active: product?.is_active ?? true,
      sort_order: product?.sort_order || 0,
    },
  });

  // Reset form when product changes or dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        name: product?.name || "",
        description: product?.description || "",
        sku: product?.sku || "",
        category: product?.category || "core",
        base_price: product?.base_price || 0,
        requires_sf_calculation: product?.requires_sf_calculation || false,
        sf_threshold: product?.sf_threshold || 3000,
        price_per_sf: product?.price_per_sf || 0.10,
        is_active: product?.is_active ?? true,
        sort_order: product?.sort_order || 0,
      });
    }
  }, [open, product, form]);

  const onSubmit = async (data: CreateProductInput) => {
    try {
      // Convert null values to undefined
      const cleanedData = {
        ...data,
        description: data.description ?? undefined,
        sku: data.sku ?? undefined,
      };

      if (isEditing) {
        await updateProduct.mutateAsync({ id: product.id, data: cleanedData });
      } else {
        await createProduct.mutateAsync(cleanedData);
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      // Error handling is done in the mutation hooks
      console.error('Error submitting product form:', error);
    }
  };

  const requiresSfCalculation = form.watch("requires_sf_calculation");
  const basePrice = form.watch("base_price");
  const sfThreshold = form.watch("sf_threshold");
  const pricePerSf = form.watch("price_per_sf");

  // Calculate preview price for a sample property (e.g., 3500 SF)
  const previewSf = 3500;
  const previewPrice = requiresSfCalculation && previewSf > sfThreshold
    ? basePrice + (previewSf - sfThreshold) * pricePerSf
    : basePrice;

  const isSubmitting = createProduct.isPending || updateProduct.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Product" : "Create New Product"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the product details below."
              : "Add a new product to your catalog."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Basic Information</h3>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Full Appraisal (1004)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRODUCT_CATEGORY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex flex-col">
                              <span>{option.label}</span>
                              {option.description && (
                                <span className="text-xs text-muted-foreground">
                                  {option.description}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="APPR-1004" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sort_order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort Order</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Lower numbers appear first
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detailed description of the product..."
                        className="min-h-[80px]"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Pricing Configuration */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Pricing Configuration</h3>

              <FormField
                control={form.control}
                name="base_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Price *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="450.00"
                          className="pl-9"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">
                      Base price for the product
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requires_sf_calculation"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Square Footage Pricing
                      </FormLabel>
                      <FormDescription>
                        Enable to add charges for properties above a square footage threshold
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {requiresSfCalculation && (
                <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-primary/20">
                  <FormField
                    control={form.control}
                    name="sf_threshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SF Threshold</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            min="1"
                            placeholder="3000"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Charge extra above this SF
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price_per_sf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price per SF</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.10"
                              className="pl-9"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs">
                          Price per SF over threshold
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Price Preview */}
              {requiresSfCalculation && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2">
                      <Calculator className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">Price Preview</p>
                        <p className="text-xs text-muted-foreground">
                          Example: {previewSf.toLocaleString()} SF property
                        </p>
                        <div className="text-xs space-y-0.5 mt-2">
                          <div className="flex justify-between">
                            <span>Base Price:</span>
                            <span className="font-mono">{formatCurrency(basePrice)}</span>
                          </div>
                          {previewSf > sfThreshold && (
                            <>
                              <div className="flex justify-between text-muted-foreground">
                                <span>
                                  + {(previewSf - sfThreshold).toLocaleString()} SF × $
                                  {pricePerSf.toFixed(2)}:
                                </span>
                                <span className="font-mono">
                                  {formatCurrency((previewSf - sfThreshold) * pricePerSf)}
                                </span>
                              </div>
                              <div className="flex justify-between font-medium border-t pt-1">
                                <span>Total:</span>
                                <span className="font-mono">{formatCurrency(previewPrice)}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Status */}
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <FormDescription>
                      Active products are available for selection in orders
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Update Product" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
