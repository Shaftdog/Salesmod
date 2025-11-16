"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Power,
  PowerOff,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useDeleteProduct, useToggleProductStatus } from "@/hooks/use-products";
import type { Product, ProductCategory } from "@/types/products";
import { PRODUCT_CATEGORIES } from "@/types/products";

type ProductListProps = {
  products: Product[];
  isLoading?: boolean;
  onEdit: (product: Product) => void;
};

export function ProductList({ products, isLoading, onEdit }: ProductListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const deleteProduct = useDeleteProduct();
  const toggleStatus = useToggleProductStatus();

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (productToDelete) {
      await deleteProduct.mutateAsync(productToDelete.id);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    await toggleStatus.mutateAsync({
      id: product.id,
      is_active: !product.is_active,
    });
  };

  const getCategoryBadgeVariant = (category: ProductCategory) => {
    switch (category) {
      case "core":
        return "default";
      case "addition":
        return "secondary";
      case "specialized":
        return "outline";
      default:
        return "outline";
    }
  };

  const getSfPricingInfo = (product: Product): string | null => {
    if (!product.requires_sf_calculation) return null;
    return `$${product.price_per_sf.toFixed(2)}/SF over ${product.sf_threshold.toLocaleString()} SF`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No products found</p>
        <p className="text-sm text-muted-foreground mt-2">
          Create your first product to get started
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Base Price</TableHead>
              <TableHead>SF Pricing</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const sfPricingInfo = getSfPricingInfo(product);

              return (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{product.name}</span>
                      {product.sku && (
                        <span className="text-xs text-muted-foreground">
                          {product.sku}
                        </span>
                      )}
                      {product.description && (
                        <span className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {product.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getCategoryBadgeVariant(product.category)}>
                      {PRODUCT_CATEGORIES[product.category]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatCurrency(product.base_price)}
                  </TableCell>
                  <TableCell>
                    {sfPricingInfo ? (
                      <span className="text-sm text-muted-foreground">
                        {sfPricingInfo}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? "default" : "secondary"}>
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEdit(product)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(product)}
                        >
                          {product.is_active ? (
                            <>
                              <PowerOff className="mr-2 h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Power className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(product)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the product &quot;{productToDelete?.name}&quot;.
              This action cannot be undone.
              {/* TODO: Add warning if product is used in any orders */}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProduct.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
