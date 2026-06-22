import { double, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const products = mysqlTable("products", {
  id: varchar("id", { length: 36 }).primaryKey(),
  productCode: varchar("product_code", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  uom: varchar("uom", { length: 100 }).notNull(),
  category: varchar("category", { length: 150 }).notNull(),
  subCategory: varchar("sub_category", { length: 150 }).notNull(),
  status: mysqlEnum("status", ["Active", "Inactive", "Discontinued"]).notNull().default("Active"),
  price: double("price"),
  stock: int("stock"),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at", { mode: "date", fsp: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date", fsp: 3 }).notNull().defaultNow().onUpdateNow(),
}, (table) => [
  uniqueIndex("products_product_code_unique").on(table.productCode),
  index("products_category_idx").on(table.category),
  index("products_status_idx").on(table.status),
]);

export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;
