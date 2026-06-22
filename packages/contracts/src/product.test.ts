import { describe, expect, it } from "vitest";
import { createProductSchema } from "./index.js";

describe("createProductSchema", () => {
  it("normalizes whitespace and supplies safe defaults", () => {
    const product = createProductSchema.parse({
      productCode: "  SKU-001 ",
      name: "  Office Chair ",
      uom: " Pcs ",
      category: " Furniture ",
    });

    expect(product).toMatchObject({
      productCode: "SKU-001",
      name: "Office Chair",
      description: "",
      status: "Active",
      price: null,
      stock: null,
    });
  });

  it("rejects negative stock", () => {
    const result = createProductSchema.safeParse({
      productCode: "SKU-002",
      name: "Desk",
      uom: "Pcs",
      category: "Furniture",
      stock: -1,
    });

    expect(result.success).toBe(false);
  });
});