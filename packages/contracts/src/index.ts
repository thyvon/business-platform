import { z } from "zod";

export const productStatusSchema = z.enum(["Active", "Inactive", "Discontinued"]);

export const productSchema = z.object({
  id: z.string().uuid(),
  productCode: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(255),
  description: z.string().max(10_000),
  uom: z.string().trim().min(1).max(100),
  category: z.string().trim().min(1).max(150),
  subCategory: z.string().trim().max(150),
  status: productStatusSchema,
  price: z.number().nonnegative().nullable(),
  stock: z.number().int().nonnegative().nullable(),
  imageUrl: z.string().max(2_000),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createProductSchema = productSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    description: z.string().max(10_000).default(""),
    subCategory: z.string().trim().max(150).default(""),
    status: productStatusSchema.default("Active"),
    price: z.number().nonnegative().nullable().default(null),
    stock: z.number().int().nonnegative().nullable().default(null),
    imageUrl: z.string().max(2_000).default(""),
  });

export const updateProductSchema = createProductSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field must be supplied.",
);

export type Product = z.infer<typeof productSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export interface ApiSuccess<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiFailure {
  error: { code: string; message: string; requestId: string; details?: unknown };
}
