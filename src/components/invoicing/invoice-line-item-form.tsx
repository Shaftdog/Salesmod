"use client";

import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2, Calculator, Home } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { useActiveProducts, useCalculatePrice } from "@/hooks/use-products";
import type { CreateInvoiceInput } from "@/lib/validations/invoicing";

type InvoiceLineItemFormProps = {
  form: UseFormReturn<CreateInvoiceInput>;
  index: number;
  onRemove: () => void;
  showRemove: boolean;
};

export function InvoiceLineItemForm({ form, index, onRemove, showRemove }: InvoiceLineItemFormProps) {
  const { data: products } = useActiveProducts();
  const calculatePrice = useCalculatePrice();

  const [isCalculating, setIsCalculating] = useState(false);

  const productId = form.watch(`line_items.${index}.product_id`);
  const squareFootage = form.watch(`line_items.${index}.square_footage`);
  const quantity = form.watch(`line_items.${index}.quantity`);
  const unitPrice = form.watch(`line_items.${index}.unit_price`);
  const taxRate = form.watch(`line_items.${index}.tax_rate`);

  const selectedProduct = products?.find((p) => p.id === productId);

  // Categorize products
  const coreProducts = products?.filter((p) => p.category === "core") || [];
  const additionProducts = products?.filter((p) => p.category === "addition") || [];
  const specializedProducts = products?.filter((p) => p.category === "specialized") || [];
  const otherProducts = products?.filter((p) => p.category === "other") || [];

  // Auto-calculate price when product with SF is selected
  useEffect(() => {
    if (selectedProduct && selectedProduct.requires_sf_calculation && squareFootage && squareFootage > 0) {
      setIsCalculating(true);

      calculatePrice.mutate(
        {
          product_id: selectedProduct.id,
          square_footage: squareFootage,
        },
        {
          onSuccess: (data) => {
            form.setValue(`line_items.${index}.unit_price`, data.total_price);
            setIsCalculating(false);
          },
          onError: () => {
            setIsCalculating(false);
          },
        }
      );
    } else if (selectedProduct && !selectedProduct.requires_sf_calculation) {
      // No SF calculation needed, use base price
      form.setValue(`line_items.${index}.unit_price`, selectedProduct.base_price);
    }
  }, [selectedProduct, squareFootage, index]);

  // Update description when product changes
  useEffect(() => {
    if (selectedProduct) {
      let description = selectedProduct.name;
      if (squareFootage && selectedProduct.requires_sf_calculation) {
        description += ` (${squareFootage.toLocaleString()} SF)`;
      }
      form.setValue(`line_items.${index}.description`, description);
    }
  }, [selectedProduct, squareFootage, index]);

  const subtotal = (quantity || 0) * (unitPrice || 0);
  const tax = subtotal * ((taxRate || 0) / 100);
  const total = subtotal + tax;

  return (
    <div className="flex gap-4 items-start p-4 border rounded-lg">
      <div className="flex-1 space-y-4">
        {/* Product Selection */}
        <FormField
          control={form.control}
          name={`line_items.${index}.product_id`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  // Reset SF when product changes
                  form.setValue(`line_items.${index}.square_footage`, undefined);
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product or leave blank for custom item" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {coreProducts.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Core Appraisals
                      </div>
                      {coreProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className="flex flex-col">
                            <span>{product.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatCurrency(product.base_price)}
                              {product.requires_sf_calculation &&
                                ` + $${product.price_per_sf.toFixed(2)}/SF over ${product.sf_threshold.toLocaleString()} SF`}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {additionProducts.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Additions
                      </div>
                      {additionProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className="flex flex-col">
                            <span>{product.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatCurrency(product.base_price)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {specializedProducts.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Specialized
                      </div>
                      {specializedProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className="flex flex-col">
                            <span>{product.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatCurrency(product.base_price)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {otherProducts.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Other / Discounts
                      </div>
                      {otherProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className="flex flex-col">
                            <span>{product.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatCurrency(product.base_price)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Square Footage (conditional) */}
        {selectedProduct?.requires_sf_calculation && (
          <FormField
            control={form.control}
            name={`line_items.${index}.square_footage`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Square Footage</FormLabel>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="3500"
                      className="pl-9"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Description */}
        <FormField
          control={form.control}
          name={`line_items.${index}.description`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input
                  placeholder="Custom description or leave blank to use product name"
                  {...field}
                  disabled={!!productId}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Quantity, Unit Price, Tax Rate */}
        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name={`line_items.${index}.quantity`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    {...field}
                    value={field.value || 1}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`line_items.${index}.unit_price`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Unit Price
                  {isCalculating && <Calculator className="inline h-3 w-3 ml-1 animate-spin" />}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    {...field}
                    value={field.value || 0}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    disabled={isCalculating}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`line_items.${index}.tax_rate`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax Rate (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    {...field}
                    value={field.value || 0}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Totals */}
        <div className="text-sm text-muted-foreground">
          Subtotal: {formatCurrency(subtotal)}
          {' | '}
          Tax: {formatCurrency(tax)}
          {' | '}
          Total: {formatCurrency(total)}
        </div>
      </div>

      {/* Remove Button */}
      {showRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="mt-8"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </div>
  );
}
