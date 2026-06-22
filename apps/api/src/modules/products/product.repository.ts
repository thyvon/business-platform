import { asc, eq } from "drizzle-orm";
import type { Database } from "@business/database";
import { products, type NewProductRow, type ProductRow } from "@business/database";

export class ProductRepository {
  constructor(private readonly database: Database["db"]) {}

  findAll(): Promise<ProductRow[]> {
    return this.database.select().from(products).orderBy(asc(products.name));
  }

  async findById(id: string): Promise<ProductRow | null> {
    const rows = await this.database.select().from(products).where(eq(products.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async findByCode(productCode: string): Promise<ProductRow | null> {
    const rows = await this.database.select().from(products).where(eq(products.productCode, productCode)).limit(1);
    return rows[0] ?? null;
  }

  async create(product: NewProductRow): Promise<ProductRow> {
    await this.database.insert(products).values(product);
    const created = await this.findById(product.id);
    if (!created) throw new Error("Created product could not be read back.");
    return created;
  }

  async update(id: string, changes: Partial<NewProductRow>): Promise<ProductRow | null> {
    await this.database.update(products).set(changes).where(eq(products.id, id));
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.database.delete(products).where(eq(products.id, id));
    return result[0].affectedRows > 0;
  }
}
