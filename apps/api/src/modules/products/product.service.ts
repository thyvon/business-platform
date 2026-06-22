import { randomUUID } from "node:crypto";
import type { CreateProductInput, UpdateProductInput } from "@business/contracts";
import type { NewProductRow, ProductRow } from "@business/database";
import { AppError } from "../../shared/errors/app-error.js";
import type { ProductRepository } from "./product.repository.js";

function serialize(row: ProductRow) {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

export class ProductService {
  constructor(private readonly repository: ProductRepository) {}

  async list() {
    return (await this.repository.findAll()).map(serialize);
  }

  async get(id: string) {
    const product = await this.repository.findById(id);
    if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Product was not found.");
    return serialize(product);
  }

  async create(input: CreateProductInput) {
    const productCode = input.productCode.toUpperCase();
    if (await this.repository.findByCode(productCode)) {
      throw new AppError(409, "PRODUCT_CODE_EXISTS", "Product code already exists.");
    }
    const created = await this.repository.create({ ...input, id: randomUUID(), productCode });
    return serialize(created);
  }

  async update(id: string, input: UpdateProductInput) {
    await this.get(id);
    const productCode = input.productCode?.toUpperCase();
    if (productCode) {
      const duplicate = await this.repository.findByCode(productCode);
      if (duplicate && duplicate.id !== id) {
        throw new AppError(409, "PRODUCT_CODE_EXISTS", "Product code already exists.");
      }
    }
    const changes = Object.fromEntries(
      Object.entries({ ...input, ...(productCode ? { productCode } : {}) })
        .filter((entry) => entry[1] !== undefined),
    ) as Partial<NewProductRow>;
    const updated = await this.repository.update(id, changes);
    if (!updated) throw new AppError(404, "PRODUCT_NOT_FOUND", "Product was not found.");
    return serialize(updated);
  }

  async delete(id: string) {
    if (!(await this.repository.delete(id))) {
      throw new AppError(404, "PRODUCT_NOT_FOUND", "Product was not found.");
    }
  }
}
