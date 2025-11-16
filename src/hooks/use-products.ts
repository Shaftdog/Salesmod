/**
 * React Query hooks for Products
 * Handles fetching, creating, updating, and deleting products
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import type {
  Product,
  ProductListResponse,
  CreateProductRequest,
  UpdateProductRequest,
  ProductFilters,
  CalculatePriceRequest,
  CalculatePriceResponse,
} from '@/types/products';

// =====================================================
// QUERY HOOKS
// =====================================================

/**
 * Fetch paginated list of products with optional filters
 */
export function useProducts(filters?: ProductFilters & { page?: number; limit?: number }) {
  return useQuery<ProductListResponse>({
    queryKey: ['products', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.category) {
        if (Array.isArray(filters.category)) {
          params.append('category', filters.category.join(','));
        } else {
          params.append('category', filters.category);
        }
      }

      if (filters?.is_active !== undefined) {
        params.append('is_active', String(filters.is_active));
      }

      if (filters?.search) {
        params.append('search', filters.search);
      }

      if (filters?.page) {
        params.append('page', String(filters.page));
      }

      if (filters?.limit) {
        params.append('limit', String(filters.limit));
      }

      const response = await fetch(`/api/products?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch products');
      }

      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch a single product by ID
 */
export function useProduct(id: string | undefined) {
  return useQuery<Product>({
    queryKey: ['products', id],
    queryFn: async () => {
      if (!id) throw new Error('Product ID is required');

      const response = await fetch(`/api/products/${id}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch product');
      }

      const data = await response.json();
      return data.data;
    },
    enabled: !!id,
  });
}

/**
 * Fetch all active products (no pagination, for dropdowns/selects)
 */
export function useActiveProducts() {
  return useQuery<Product[]>({
    queryKey: ['products', 'active'],
    queryFn: async () => {
      const response = await fetch('/api/products?is_active=true&limit=100');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch active products');
      }

      const data = await response.json();
      return data.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Fetch products by category
 */
export function useProductsByCategory(category: string) {
  return useQuery<Product[]>({
    queryKey: ['products', 'category', category],
    queryFn: async () => {
      const response = await fetch(`/api/products?category=${category}&is_active=true&limit=100`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch products');
      }

      const data = await response.json();
      return data.data;
    },
    enabled: !!category,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// =====================================================
// MUTATION HOOKS
// =====================================================

/**
 * Create a new product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateProductRequest) => {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create product');
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: () => {
      // Invalidate all product queries to refetch
      queryClient.invalidateQueries({ queryKey: ['products'] });

      toast({
        title: 'Success',
        description: 'Product created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update an existing product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProductRequest }) => {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update product');
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate product queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', data.id] });

      toast({
        title: 'Success',
        description: 'Product updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete a product
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete product');
      }

      return { id };
    },
    onSuccess: () => {
      // Invalidate product queries
      queryClient.invalidateQueries({ queryKey: ['products'] });

      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Calculate product price based on square footage
 */
export function useCalculatePrice() {
  const { toast } = useToast();

  return useMutation<CalculatePriceResponse, Error, CalculatePriceRequest>({
    mutationFn: async (data: CalculatePriceRequest) => {
      const response = await fetch('/api/products/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to calculate price');
      }

      const result = await response.json();
      return result.data;
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Toggle product active status
 */
export function useToggleProductStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update product status');
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate product queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', data.id] });

      toast({
        title: 'Success',
        description: `Product ${data.is_active ? 'activated' : 'deactivated'} successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
