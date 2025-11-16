"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter } from "lucide-react";
import { useProducts } from "@/hooks/use-products";
import { ProductList } from "@/components/products/product-list";
import { ProductForm } from "@/components/products/product-form";
import { PriceCalculatorWidget } from "@/components/products/price-calculator-widget";
import type { Product, ProductCategory } from "@/types/products";
import { PRODUCT_CATEGORY_OPTIONS } from "@/types/products";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();

  // Build filters for API query
  const filters = {
    search: search || undefined,
    category: categoryFilter !== "all" ? (categoryFilter as ProductCategory) : undefined,
    is_active: activeFilter === "all" ? undefined : activeFilter === "active",
    page: currentPage,
    limit: 20,
  };

  const { data, isLoading } = useProducts(filters);

  const products = data?.data || [];
  const pagination = data?.pagination;

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, activeFilter]);

  const handleNewProduct = () => {
    setEditingProduct(undefined);
    setFormOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingProduct(undefined);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your appraisal products and pricing
          </p>
        </div>
        <Button onClick={handleNewProduct}>
          <Plus className="mr-2 h-4 w-4" />
          New Product
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">All Products</TabsTrigger>
          <TabsTrigger value="calculator">Price Calculator</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {PRODUCT_CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Product List */}
          <ProductList
            products={products}
            isLoading={isLoading}
            onEdit={handleEditProduct}
          />

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {products.length} of {pagination.total} products
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(pagination.total_pages, p + 1))
                  }
                  disabled={currentPage === pagination.total_pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="calculator" className="space-y-4">
          <div className="max-w-2xl mx-auto">
            <PriceCalculatorWidget />
          </div>
        </TabsContent>
      </Tabs>

      {/* Product Form Dialog */}
      {formOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] border bg-background p-6 shadow-lg sm:rounded-lg">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">
                {editingProduct ? "Edit Product" : "Create New Product"}
              </h2>
            </div>
            <ProductForm
              product={editingProduct}
              onSuccess={handleFormClose}
              onCancel={handleFormClose}
            />
          </div>
        </div>
      )}
    </div>
  );
}
