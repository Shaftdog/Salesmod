"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Calculator, Home, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useActiveProducts, useCalculatePrice } from "@/hooks/use-products";
import type { Product } from "@/types/products";

type LineItem = {
  id: string;
  product: Product;
  squareFootage?: number;
  calculatedPrice: number;
  isCalculating: boolean;
};

export function PriceCalculatorWidget() {
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [squareFootage, setSquareFootage] = useState<string>("");

  const { data: products, isLoading: productsLoading } = useActiveProducts();
  const calculatePrice = useCalculatePrice();

  const selectedProduct = products?.find((p) => p.id === selectedProductId);

  // Get products by category for better UX
  const coreProducts = products?.filter((p) => p.category === "core") || [];
  const additionProducts = products?.filter((p) => p.category === "addition") || [];
  const specializedProducts = products?.filter((p) => p.category === "specialized") || [];
  const otherProducts = products?.filter((p) => p.category === "other") || [];

  const handleAddProduct = async () => {
    if (!selectedProductId || !selectedProduct) return;

    const sf = squareFootage ? Number(squareFootage) : undefined;

    // Validate SF if required
    if (selectedProduct.requires_sf_calculation && (!sf || sf <= 0)) {
      alert("Please enter a valid square footage for this product");
      return;
    }

    // Create temporary line item
    const tempId = `temp-${Date.now()}`;
    const newLineItem: LineItem = {
      id: tempId,
      product: selectedProduct,
      squareFootage: sf,
      calculatedPrice: selectedProduct.base_price,
      isCalculating: selectedProduct.requires_sf_calculation && !!sf,
    };

    setLineItems((prev) => [...prev, newLineItem]);

    // Calculate price if needed
    if (selectedProduct.requires_sf_calculation && sf) {
      calculatePrice.mutate(
        {
          product_id: selectedProductId,
          square_footage: sf,
        },
        {
          onSuccess: (data) => {
            setLineItems((prev) =>
              prev.map((item) =>
                item.id === tempId
                  ? { ...item, calculatedPrice: data.total_price, isCalculating: false }
                  : item
              )
            );
          },
          onError: () => {
            // Remove item on error
            setLineItems((prev) => prev.filter((item) => item.id !== tempId));
            alert("Failed to calculate price. Please try again.");
          },
        }
      );
    }

    // Reset form
    setSelectedProductId("");
    setSquareFootage("");
  };

  const handleRemoveItem = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClear = () => {
    setLineItems([]);
    setSelectedProductId("");
    setSquareFootage("");
  };

  const total = lineItems.reduce((sum, item) => sum + item.calculatedPrice, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Price Calculator
        </CardTitle>
        <CardDescription>
          Build a quote by selecting products and calculating final price
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Product Section */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <h3 className="font-medium">Add Product</h3>

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
                      Other
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
          </div>

          {/* Square Footage Input (conditional) */}
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

          {/* Add Button */}
          <Button
            onClick={handleAddProduct}
            disabled={!selectedProductId || calculatePrice.isPending}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add to Quote
          </Button>
        </div>

        {/* Line Items */}
        {lineItems.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Quote Items</h3>
              <Button variant="ghost" size="sm" onClick={handleClear}>
                Clear All
              </Button>
            </div>

            <div className="space-y-2">
              {lineItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-background"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.squareFootage && (
                        <span>{item.squareFootage.toLocaleString()} SF • </span>
                      )}
                      {item.isCalculating ? (
                        <span className="inline-flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Calculating...
                        </span>
                      ) : (
                        <span className="font-mono">{formatCurrency(item.calculatedPrice)}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(item.id)}
                    className="ml-2"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="pt-3 border-t">
              <div className="flex justify-between items-baseline">
                <span className="text-lg font-semibold">Total Quote:</span>
                <span className="text-2xl font-bold font-mono">
                  {formatCurrency(total)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground text-right mt-1">
                {lineItems.length} item{lineItems.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}

        {lineItems.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calculator className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No items added yet</p>
            <p className="text-xs">Select a product above to start building your quote</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
