/**
 * Product Types for Sales Module
 * Supports residential appraisal products with square footage pricing
 */

// =====================================================
// ENUMS & CONSTANTS
// =====================================================

/**
 * Product Categories
 * - core: Core residential appraisals (Field Inspection, Desktop, Full Appraisal, etc.)
 * - addition: Add-ons to core appraisals (Addition - 3000+ SF, Addition - Acreage, etc.)
 * - specialized: Standalone residential products (Appraisal Update, Operating Income, etc.)
 * - other: Discounts, Sales, or miscellaneous items
 */
export type ProductCategory = 'core' | 'addition' | 'specialized' | 'other';

export const PRODUCT_CATEGORIES: Record<ProductCategory, string> = {
  core: 'Core Appraisal',
  addition: 'Addition',
  specialized: 'Specialized',
  other: 'Other',
} as const;

export const DEFAULT_SF_THRESHOLD = 3000;
export const DEFAULT_PRICE_PER_SF = 0.10;

// =====================================================
// DATABASE MODELS
// =====================================================

/**
 * Product - Main product entity
 */
export interface Product {
  id: string;
  org_id: string;

  // Product Information
  name: string;
  description: string | null;
  sku: string | null;
  category: ProductCategory;

  // Pricing Configuration
  base_price: number;
  requires_sf_calculation: boolean;
  sf_threshold: number;
  price_per_sf: number;

  // Status and Display
  is_active: boolean;
  sort_order: number;

  // Additional Properties
  props: Record<string, any>;

  // Audit Fields
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Product with calculated pricing info
 */
export interface ProductWithPrice extends Product {
  calculated_price?: number;
  price_breakdown?: ProductPriceBreakdown;
}

// =====================================================
// PRICE CALCULATION
// =====================================================

/**
 * Product Price Breakdown
 * Detailed breakdown of how the price was calculated
 */
export interface ProductPriceBreakdown {
  product_id: string;
  product_name: string;
  base_price: number;
  square_footage: number;
  sf_threshold: number;
  additional_sqft: number;
  price_per_sf: number;
  additional_charge: number;
  total_price: number;
  calculation_applied: boolean;
}

/**
 * Price Calculation Request
 */
export interface CalculatePriceRequest {
  product_id: string;
  square_footage: number;
}

/**
 * Price Calculation Response
 */
export interface CalculatePriceResponse {
  product_id: string;
  product_name: string;
  total_price: number;
  breakdown: ProductPriceBreakdown;
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

/**
 * Create Product Request
 */
export interface CreateProductRequest {
  name: string;
  description?: string;
  sku?: string;
  category: ProductCategory;
  base_price: number;
  requires_sf_calculation?: boolean;
  sf_threshold?: number;
  price_per_sf?: number;
  is_active?: boolean;
  sort_order?: number;
}

/**
 * Update Product Request
 */
export interface UpdateProductRequest {
  name?: string;
  description?: string;
  sku?: string;
  category?: ProductCategory;
  base_price?: number;
  requires_sf_calculation?: boolean;
  sf_threshold?: number;
  price_per_sf?: number;
  is_active?: boolean;
  sort_order?: number;
}

/**
 * Product List Filters
 */
export interface ProductFilters {
  category?: ProductCategory | ProductCategory[];
  is_active?: boolean;
  search?: string;
}

/**
 * Product List Query Parameters
 */
export interface ProductListParams extends ProductFilters {
  page?: number;
  limit?: number;
  sort_by?: 'name' | 'category' | 'base_price' | 'created_at' | 'sort_order';
  sort_order?: 'asc' | 'desc';
}

/**
 * Paginated Product List Response
 */
export interface ProductListResponse {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// =====================================================
// FORM DATA TYPES
// =====================================================

/**
 * Product Form Data (for React Hook Form)
 */
export interface ProductFormData {
  name: string;
  description: string;
  sku: string;
  category: ProductCategory;
  base_price: number | string; // String to handle empty input
  requires_sf_calculation: boolean;
  sf_threshold: number | string;
  price_per_sf: number | string;
  is_active: boolean;
  sort_order: number | string;
}

// =====================================================
// UI HELPER TYPES
// =====================================================

/**
 * Product Category Option (for selects/dropdowns)
 */
export interface ProductCategoryOption {
  value: ProductCategory;
  label: string;
  description?: string;
}

export const PRODUCT_CATEGORY_OPTIONS: ProductCategoryOption[] = [
  {
    value: 'core',
    label: 'Core Appraisal',
    description: 'Main residential appraisal products',
  },
  {
    value: 'addition',
    label: 'Addition',
    description: 'Add-ons to core appraisals',
  },
  {
    value: 'specialized',
    label: 'Specialized',
    description: 'Standalone residential products',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Discounts, sales, misc items',
  },
];

/**
 * Product Display Info (for UI cards/lists)
 */
export interface ProductDisplayInfo {
  id: string;
  name: string;
  category: ProductCategory;
  categoryLabel: string;
  basePrice: string; // Formatted currency
  hasSfPricing: boolean;
  sfPricingInfo?: string; // e.g., "$0.10/SF over 3000 SF"
  isActive: boolean;
}

// =====================================================
// ORDER INTEGRATION TYPES
// =====================================================

/**
 * Product Selection for Orders
 * Used when selecting products for an order
 */
export interface OrderProductSelection {
  product_id: string;
  product_name: string;
  category: ProductCategory;
  calculated_price: number;
  is_manual_override: boolean;
  manual_price?: number;
  square_footage_used?: number;
}

/**
 * Order Product Summary
 * Summary of products selected for an order
 */
export interface OrderProductSummary {
  core_product?: OrderProductSelection;
  additions: OrderProductSelection[];
  total_price: number;
  has_manual_overrides: boolean;
}

// =====================================================
// UTILITY FUNCTIONS (TYPE GUARDS)
// =====================================================

/**
 * Type guard to check if a product requires SF calculation
 */
export function requiresSfCalculation(product: Product): boolean {
  return product.requires_sf_calculation === true;
}

/**
 * Type guard to check if a product is a core appraisal
 */
export function isCoreProduct(product: Product): boolean {
  return product.category === 'core';
}

/**
 * Type guard to check if a product is an addition
 */
export function isAdditionProduct(product: Product): boolean {
  return product.category === 'addition';
}

/**
 * Type guard to check if a product is active
 */
export function isActiveProduct(product: Product): boolean {
  return product.is_active === true;
}
