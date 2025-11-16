"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Calculator, Home } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useActiveProducts, useCalculatePrice } from "@/hooks/use-products";
import { useDebounce } from "@/hooks/use-debounce";
import type { Product } from "@/types/products";

type PriceCalculatorWidgetProps = {
  onPriceCalculated?: (productId: string, price: number) => void;
  defaultProductId?: string;
  defaultSquareFootage?: number;
};

export function PriceCalculatorWidget({
  onPriceCalculated,
  defaultProductId,
  defaultSquareFootage,
}: PriceCalculatorWidgetProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    defaultProductId || ""
  );
  const [squareFootage, setSquareFootage] = useState<string>(
    defaultSquareFootage?.toString() || ""
  );

  const { data: products, isLoading: productsLoading } = useActiveProducts();
  const calculatePrice = useCalculatePrice();

  const selectedProduct = products?.find((p) => p.id === selectedProductId);

  // Debounce square footage input to avoid excessive API calls while typing
  const debouncedSquareFootage = useDebounce(squareFootage, 400);

  // Auto-calculate price when product and SF are selected
  useEffect(() => {
    if (selectedProductId && debouncedSquareFootage && Number(debouncedSquareFootage) > 0) {
      calculatePrice.mutate(
        {
          product_id: selectedProductId,
          square_footage: Number(debouncedSquareFootage),
        },
        {
          onSuccess: (data) => {
            onPriceCalculated?.(selectedProductId, data.total_price);
          },
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProductId, debouncedSquareFootage]);

  const breakdown = calculatePrice.data?.breakdown;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Price Calculator
        </CardTitle>
        <CardDescription>
          Calculate product price based on square footage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Product Selection */}
        <div className="space-y-2">
          <Label htmlFor="product-select">Product</Label>
          <Select
            value={selectedProductId}
            onValueChange={setSelectedProductId}
            disabled={productsLoading}
          >
            <SelectTrigger id="product-select">
              <SelectValue placeholder="Select a product" />
            </SelectTrigger>
            <SelectContent>
              {products?.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  <div className="flex flex-col">
                    <span>{product.name}</span>
                    <span className="text-xs text-muted-foreground">
                      Base: {formatCurrency(product.base_price)}
                      {product.requires_sf_calculation &&
                        ` + $${product.price_per_sf.toFixed(2)}/SF over ${product.sf_threshold.toLocaleString()} SF`}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Square Footage Input */}
        {selectedProduct?.requires_sf_calculation && (
          <div className="space-y-2">
            <Label htmlFor="square-footage">Square Footage</Label>
            <div className="relative">
              <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="square-footage"
                type="number"
                step="1"
                min="1"
                placeholder="3500"
                className="pl-9"
                value={squareFootage}
                onChange={(e) => setSquareFootage(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Price Breakdown */}
        {calculatePrice.isPending && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {breakdown && !calculatePrice.isPending && (
          <div className="space-y-3 pt-4 border-t">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Base Price:</span>
                <span className="font-mono">{formatCurrency(breakdown.base_price)}</span>
              </div>

              {breakdown.calculation_applied && breakdown.additional_sqft > 0 && (
                <>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Square Footage:</span>
                    <span className="font-mono">
                      {breakdown.square_footage.toLocaleString()} SF
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Above Threshold:</span>
                    <span className="font-mono">
                      {breakdown.additional_sqft.toLocaleString()} SF
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      SF Charge ({breakdown.additional_sqft.toLocaleString()} × $
                      {breakdown.price_per_sf.toFixed(2)}):
                    </span>
                    <span className="font-mono">
                      {formatCurrency(breakdown.additional_charge)}
                    </span>
                  </div>
                </>
              )}

              <div className="flex justify-between text-base font-medium pt-2 border-t">
                <span>Total Price:</span>
                <span className="font-mono text-lg">
                  {formatCurrency(breakdown.total_price)}
                </span>
              </div>
            </div>

            {!breakdown.calculation_applied && (
              <p className="text-xs text-muted-foreground text-center">
                No SF charges apply for this product
              </p>
            )}

            {breakdown.calculation_applied &&
              breakdown.square_footage <= breakdown.sf_threshold && (
                <p className="text-xs text-muted-foreground text-center">
                  Property is below {breakdown.sf_threshold.toLocaleString()} SF threshold
                </p>
              )}
          </div>
        )}

        {!selectedProductId && !calculatePrice.isPending && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Select a product to calculate price
          </p>
        )}

        {selectedProduct && !selectedProduct.requires_sf_calculation && (
          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between text-base font-medium">
              <span>Total Price:</span>
              <span className="font-mono text-lg">
                {formatCurrency(selectedProduct.base_price)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Fixed price product (no SF calculation)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
