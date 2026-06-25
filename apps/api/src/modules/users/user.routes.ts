import { userListQuerySchema } from "@business/contracts";
import { Router } from "express";
import type { RequestHandler } from "express";
import { authorize } from "../auth/auth.middleware.js";
import type { UserService } from "./user.service.js";

export function createUserRouter(service: UserService, authenticate: RequestHandler) {
  const router = Router();

  router.get("/", authenticate, authorize("users.read"), async (request, response) => {
    const query = userListQuerySchema.parse(request.query);
    response.json({ data: await service.list(request.principal!, query) });
  });

  return router;
}