/**
 * Validation schemas using Zod
 * All data entering the app should be validated
 */

import { z } from 'zod';

// Product stages (matches our Kanban columns)
export const ProductStage = z.enum([
  'discovery',
  'research', 
  'creative',
  'testing',
  'scaling',
  'retired'
]);

// Product validation schema
export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).optional(),
  stage: ProductStage,
  sourceUrl: z.string().url().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  notes: z.string().max(5000).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  tags: z.array(z.string().max(50)).max(10).default([]),
  metrics: z.object({
    cpa: z.number().positive().optional(),
    roas: z.number().positive().optional(),
    revenue: z.number().nonnegative().optional(),
  }).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Create product (without id and timestamps - server generates these)
export const CreateProductSchema = ProductSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Update product (all fields optional)
export const UpdateProductSchema = ProductSchema.partial().omit({
  id: true,
  createdAt: true,
});

// User profile schema
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  settings: z.object({
    theme: z.enum(['light', 'dark', 'system']).default('system'),
    notifications: z.boolean().default(true),
  }).default({}),
});

// Webhook payload schema (from n8n)
export const WebhookProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  sourceUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

// API response wrapper
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Validate data against a schema
 * Returns { success: true, data } or { success: false, errors }
 */
export function validate(schema, data) {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return {
    success: false,
    errors: result.error.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message,
    })),
  };
}

/**
 * Validate and throw on error (for internal use)
 */
export function validateOrThrow(schema, data) {
  return schema.parse(data);
}
