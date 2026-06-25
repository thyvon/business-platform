import { assignUserRolesSchema, updateUserSchema, userListQuerySchema } from "@business/contracts";
import { Router } from "express";
import type { RequestHandler } from "express";
import { authorize } from "../auth/auth.middleware.js";
import type { UserService } from "./user.service.js";

export function createUserRouter(
  service: UserService,
  authenticate: RequestHandler,
  csrfProtection: RequestHandler,
) {
  const router = Router();

  router.get("/", authenticate, authorize("users.read"), async (request, response) => {
    const query = userListQuerySchema.parse(request.query);
    response.json({ data: await service.list(request.principal!, query) });
  });

  router.get("/:id", authenticate, authorize("users.read"), async (request, response) => {
    response.json({ data: await service.get(request.principal!, String(request.params.id)) });
  });

  router.patch("/:id", csrfProtection, authenticate, authorize("users.update"), async (request, response) => {
    await service.update(request.principal!, String(request.params.id), updateUserSchema.parse(request.body), String(response.locals.requestId));
    response.status(204).send();
  });

  router.post("/:id/suspend", csrfProtection, authenticate, authorize("users.suspend"), async (request, response) => {
    await service.suspend(request.principal!, String(request.params.id), String(response.locals.requestId));
    response.status(204).send();
  });

  router.post("/:id/reactivate", csrfProtection, authenticate, authorize("users.suspend"), async (request, response) => {
    await service.reactivate(request.principal!, String(request.params.id), String(response.locals.requestId));
    response.status(204).send();
  });

  router.put("/:id/roles", csrfProtection, authenticate, authorize("users.roles.assign"), async (request, response) => {
    await service.assignRoles(request.principal!, String(request.params.id), assignUserRolesSchema.parse(request.body), String(response.locals.requestId));
    response.status(204).send();
  });

  router.post("/:id/revoke-sessions", csrfProtection, authenticate, authorize("users.update"), async (request, response) => {
    await service.revokeSessions(request.principal!, String(request.params.id), String(response.locals.requestId));
    response.status(204).send();
  });

  return router;
}



