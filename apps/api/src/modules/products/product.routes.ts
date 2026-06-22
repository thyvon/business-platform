import { Router } from "express";
import { createProductSchema, updateProductSchema } from "@business/contracts";
import type { ProductService } from "./product.service.js";

export function createProductRouter(service: ProductService) {
  const router = Router();

  router.get("/", async (_request, response) => {
    response.json({ data: await service.list() });
  });

  router.get("/:id", async (request, response) => {
    response.json({ data: await service.get(request.params.id) });
  });

  router.post("/", async (request, response) => {
    const product = await service.create(createProductSchema.parse(request.body));
    response.status(201).json({ data: product });
  });

  router.patch("/:id", async (request, response) => {
    response.json({ data: await service.update(request.params.id, updateProductSchema.parse(request.body)) });
  });

  router.delete("/:id", async (request, response) => {
    await service.delete(request.params.id);
    response.status(204).send();
  });

  return router;
}
