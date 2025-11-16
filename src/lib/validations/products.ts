/**
 * Zod Validation Schemas for Products
 * Used for API request validation and form validation
 */

import { z } from 'zod';
import { sanitizeText } from '@/lib/utils/sanitize';
import type { ProductCategory } from '@/types/products';

// =====================================================
// CONSTANTS
// =====================================================

const MAX_PRODUCT_NAME_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_SKU_LENGTH = 50;
const MAX_BASE_PRICE = 999999.99;
const MAX_PRICE_PER_SF = 10.00;
const MAX_SF_THRESHOLD = 50000;
const MAX_SORT_ORDER = 9999;

// =====================================================
// BASE SCHEMAS
// =====================================================

/**
 * Product Category Schema
 */
export const ProductCategorySchema = z.enum(['core', 'addition', 'specialized', 'other'], {
  errorMap: () => ({
    message: 'Category must be one of: core, addition, specialized, or other',
  }),
});

/**
 * Product Name Schema
 */
const ProductNameSchema = z
  .string()
  .min(1, 'Product name is required')
  .max(MAX_PRODUCT_NAME_LENGTH, `Product name must be ${MAX_PRODUCT_NAME_LENGTH} characters or less`)
  .transform(sanitizeText);

/**
 * Product Description Schema
 */
const ProductDescriptionSchema = z
  .string()
  .max(MAX_DESCRIPTION_LENGTH, `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`)
  .transform(sanitizeText)
  .optional()
  .nullable();

/**
 * Product SKU Schema
 */
const ProductSkuSchema = z
  .string()
  .max(MAX_SKU_LENGTH, `SKU must be ${MAX_SKU_LENGTH} characters or less`)
  .transform(sanitizeText)
  .optional()
  .nullable();

/**
 * Base Price Schema
 */
const BasePriceSchema = z
  .number({
    required_error: 'Base price is required',
    invalid_type_error: 'Base price must be a number',
  })
  .nonnegative('Base price must be non-negative')
  .max(MAX_BASE_PRICE, `Base price cannot exceed $${MAX_BASE_PRICE.toLocaleString()}`)
  .refine((val) => {
    // Ensure no more than 2 decimal places
    return Number.isInteger(val * 100);
  }, 'Base price can have at most 2 decimal places');

/**
 * Square Footage Threshold Schema
 */
const SfThresholdSchema = z
  .number({
    invalid_type_error: 'Square footage threshold must be a number',
  })
  .int('Square footage threshold must be a whole number')
  .positive('Square footage threshold must be positive')
  .max(MAX_SF_THRESHOLD, `Square footage threshold cannot exceed ${MAX_SF_THRESHOLD.toLocaleString()} SF`)
  .default(3000);

/**
 * Price Per Square Foot Schema
 */
const PricePerSfSchema = z
  .number({
    invalid_type_error: 'Price per square foot must be a number',
  })
  .nonnegative('Price per square foot must be non-negative')
  .max(MAX_PRICE_PER_SF, `Price per square foot cannot exceed $${MAX_PRICE_PER_SF}`)
  .refine((val) => {
    // Ensure no more than 4 decimal places
    return Number.isInteger(val * 10000);
  }, 'Price per square foot can have at most 4 decimal places')
  .default(0.10);

/**
 * Sort Order Schema
 */
const SortOrderSchema = z
  .number({
    invalid_type_error: 'Sort order must be a number',
  })
  .int('Sort order must be a whole number')
  .nonnegative('Sort order must be non-negative')
  .max(MAX_SORT_ORDER, `Sort order cannot exceed ${MAX_SORT_ORDER}`)
  .default(0);

// =====================================================
// CREATE PRODUCT SCHEMA
// =====================================================

/**
 * Schema for creating a new product
 */
export const CreateProductSchema = z.object({
  name: ProductNameSchema,
  description: ProductDescriptionSchema,
  sku: ProductSkuSchema,
  category: ProductCategorySchema,
  base_price: BasePriceSchema,
  requires_sf_calculation: z.boolean().default(false),
  sf_threshold: SfThresholdSchema,
  price_per_sf: PricePerSfSchema,
  is_active: z.boolean().default(true),
  sort_order: SortOrderSchema,
}).refine(
  (data) => {
    // If requires_sf_calculation is true, ensure sf_threshold and price_per_sf are reasonable
    if (data.requires_sf_calculation) {
      return data.sf_threshold > 0 && data.price_per_sf >= 0;
    }
    return true;
  },
  {
    message: 'When square footage calculation is enabled, threshold must be positive and price per SF must be non-negative',
    path: ['requires_sf_calculation'],
  }
);

export type CreateProductInput = z.infer<typeof CreateProductSchema>;

// =====================================================
// UPDATE PRODUCT SCHEMA
// =====================================================

/**
 * Schema for updating an existing product
 * All fields are optional since it's a partial update
 */
export const UpdateProductSchema = z.object({
  name: ProductNameSchema.optional(),
  description: ProductDescriptionSchema,
  sku: ProductSkuSchema,
  category: ProductCategorySchema.optional(),
  base_price: BasePriceSchema.optional(),
  requires_sf_calculation: z.boolean().optional(),
  sf_threshold: SfThresholdSchema.optional(),
  price_per_sf: PricePerSfSchema.optional(),
  is_active: z.boolean().optional(),
  sort_order: SortOrderSchema.optional(),
}).refine(
  (data) => {
    // If requires_sf_calculation is being set to true, ensure other fields are reasonable
    if (data.requires_sf_calculation === true) {
      if (data.sf_threshold !== undefined && data.sf_threshold <= 0) {
        return false;
      }
      if (data.price_per_sf !== undefined && data.price_per_sf < 0) {
        return false;
      }
    }
    return true;
  },
  {
    message: 'When enabling square footage calculation, threshold must be positive and price per SF must be non-negative',
    path: ['requires_sf_calculation'],
  }
);

export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

// =====================================================
// CALCULATE PRICE SCHEMA
// =====================================================

/**
 * Schema for price calculation request
 */
export const CalculatePriceSchema = z.object({
  product_id: z
    .string({
      required_error: 'Product ID is required',
    })
    .uuid('Product ID must be a valid UUID'),
  square_footage: z
    .number({
      required_error: 'Square footage is required',
      invalid_type_error: 'Square footage must be a number',
    })
    .int('Square footage must be a whole number')
    .positive('Square footage must be positive')
    .max(MAX_SF_THRESHOLD, `Square footage cannot exceed ${MAX_SF_THRESHOLD.toLocaleString()} SF`),
});

export type CalculatePriceInput = z.infer<typeof CalculatePriceSchema>;

// =====================================================
// QUERY PARAMS SCHEMAS
// =====================================================

/**
 * Schema for product list query parameters
 */
export const ProductListParamsSchema = z.object({
  // Pagination
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().positive().default(1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().positive().max(100).default(20)),

  // Filtering
  category: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      // Support comma-separated categories
      if (val.includes(',')) {
        return val.split(',').map((c) => c.trim());
      }
      return val;
    }),
  is_active: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
  search: z.string().optional(),

  // Sorting
  sort_by: z
    .enum(['name', 'category', 'base_price', 'created_at', 'sort_order'])
    .optional()
    .default('sort_order'),
  sort_order: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type ProductListParamsInput = z.infer<typeof ProductListParamsSchema>;

// =====================================================
// PRODUCT ID SCHEMA
// =====================================================

/**
 * Schema for validating product ID in URL params
 */
export const ProductIdSchema = z.object({
  id: z.string().uuid('Invalid product ID'),
});

export type ProductIdInput = z.infer<typeof ProductIdSchema>;

// =====================================================
// BULK OPERATIONS SCHEMAS
// =====================================================

/**
 * Schema for bulk update (e.g., activating/deactivating multiple products)
 */
export const BulkUpdateProductsSchema = z.object({
  product_ids: z
    .array(z.string().uuid('Each product ID must be a valid UUID'))
    .min(1, 'At least one product ID is required')
    .max(50, 'Cannot update more than 50 products at once'),
  updates: z.object({
    is_active: z.boolean().optional(),
    sort_order: SortOrderSchema.optional(),
  }),
});

export type BulkUpdateProductsInput = z.infer<typeof BulkUpdateProductsSchema>;

// =====================================================
// HELPER VALIDATION FUNCTIONS
// =====================================================

/**
 * Validates if a product category is valid
 */
export function isValidProductCategory(category: string): category is ProductCategory {
  return ['core', 'addition', 'specialized', 'other'].includes(category);
}

/**
 * Validates product name uniqueness (to be used with database check)
 */
export function validateProductName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Product name cannot be empty' };
  }

  if (name.length > MAX_PRODUCT_NAME_LENGTH) {
    return { valid: false, error: `Product name must be ${MAX_PRODUCT_NAME_LENGTH} characters or less` };
  }

  return { valid: true };
}

/**
 * Validates price calculation parameters
 */
export function validatePriceCalculation(
  squareFootage: number,
  threshold: number,
  pricePerSf: number
): { valid: boolean; error?: string } {
  if (squareFootage <= 0) {
    return { valid: false, error: 'Square footage must be positive' };
  }

  if (threshold <= 0) {
    return { valid: false, error: 'Threshold must be positive' };
  }

  if (pricePerSf < 0) {
    return { valid: false, error: 'Price per square foot cannot be negative' };
  }

  return { valid: true };
}
