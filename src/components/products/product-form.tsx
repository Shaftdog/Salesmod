"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCreateProduct, useUpdateProduct } from "@/hooks/use-products";
import { CreateProductSchema, type CreateProductInput } from "@/lib/validations/products";
import { PRODUCT_CATEGORY_OPTIONS } from "@/types/products";
import type { Product } from "@/types/products";

interface ProductFormProps {
  product?: Product;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const isEditMode = !!product;
  const isLoading = createProduct.isPending || updateProduct.isPending;

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

  const requiresSfCalculation = form.watch("requires_sf_calculation");

  async function onSubmit(data: CreateProductInput) {
    try {
      if (isEditMode && product) {
        await updateProduct.mutateAsync({
          id: product.id,
          data,
        });
        toast({
          title: "Success",
          description: "Product updated successfully",
        });
      } else {
        await createProduct.mutateAsync(data);
        toast({
          title: "Success",
          description: "Product created successfully",
        });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/sales/products");
      }
    } catch (error: any) {
      console.error("Failed to save product:", error);
      // Error toast is already shown by the hook
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>
                  Product Name <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Full Residential Appraisal"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* SKU */}
          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU</FormLabel>
                <FormControl>
                  <Input
                    placeholder="APPR-001"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  Optional product code or SKU
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Category */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Category <span className="text-destructive">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PRODUCT_CATEGORY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          {option.description && (
                            <div className="text-xs text-muted-foreground">
                              {option.description}
                            </div>
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

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Detailed description of the product..."
                    className="min-h-[100px]"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  Optional detailed description of the product
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Base Price */}
          <FormField
            control={form.control}
            name="base_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Base Price <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="500.00"
                      className="pl-7"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Base price of the product
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Sort Order */}
          <FormField
            control={form.control}
            name="sort_order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sort Order</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormDescription>
                  Display order (lower numbers appear first)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Active Status */}
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="md:col-span-2 flex flex-row items-center justify-between rounded-lg border p-4">
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

          {/* Square Footage Calculation */}
          <FormField
            control={form.control}
            name="requires_sf_calculation"
            render={({ field }) => (
              <FormItem className="md:col-span-2 flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Square Footage Pricing
                  </FormLabel>
                  <FormDescription>
                    Enable additional pricing based on property square footage
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

          {/* SF Threshold - Only shown if SF calculation is enabled */}
          {requiresSfCalculation && (
            <FormField
              control={form.control}
              name="sf_threshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Square Footage Threshold{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        min="1"
                        placeholder="3000"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 3000)
                        }
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        SF
                      </span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Additional charges apply above this square footage
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Price per SF - Only shown if SF calculation is enabled */}
          {requiresSfCalculation && (
            <FormField
              control={form.control}
              name="price_per_sf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Price per Square Foot{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.10"
                        className="pl-7"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0.1)
                        }
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        /SF
                      </span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Additional charge per square foot over threshold
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
