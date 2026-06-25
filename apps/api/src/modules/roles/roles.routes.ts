import { Router } from "express";
import type { RequestHandler } from "express";
import { createRoleSchema, updateRoleSchema, setRolePermissionsSchema } from "@business/contracts";
import { authorize } from "../auth/auth.middleware.js";
import type { RolesService } from "./roles.service.js";

export function createRolesRouter(
  service: RolesService,
  authenticate: RequestHandler,
  csrfProtection: RequestHandler,
) {
  const router = Router();

  router.get("/", authenticate, authorize("roles.read"), async (request, response) => {
    response.json({ data: await service.list(request.principal!.organization.id) });
  });

  router.get("/permissions", authenticate, authorize("roles.read"), async (request, response) => {
    response.json({ data: await service.listPermissions() });
  });

  router.get("/:id", authenticate, authorize("roles.read"), async (request, response) => {
    const role = await service.get(request.principal!.organization.id, String(request.params.id));
    if (!role) {
      response.status(404).json({ error: { code: "ROLE_NOT_FOUND", message: "The role could not be found." } });
      return;
    }
    response.json({ data: role });
  });

  router.post("/", csrfProtection, authenticate, authorize("roles.create"), async (request, response) => {
    const parsed = createRoleSchema.parse(request.body);
    const principal = request.principal!;
    const roleId = await service.create(
      principal.organization.id,
      principal.user.id,
      String(response.locals.requestId),
      parsed,
    );
    const role = await service.get(principal.organization.id, roleId);
    response.status(201).json({ data: role });
  });

  router.patch("/:id", csrfProtection, authenticate, authorize("roles.update"), async (request, response) => {
    const parsed = updateRoleSchema.parse(request.body);
    await service.update(
      request.principal!.organization.id,
      String(request.params.id),
      request.principal!.user.id,
      String(response.locals.requestId),
      parsed,
    );
    const role = await service.get(request.principal!.organization.id, String(request.params.id));
    if (!role) {
      response.status(404).json({ error: { code: "ROLE_NOT_FOUND", message: "The role could not be found." } });
      return;
    }
    response.json({ data: role });
  });

  router.delete("/:id", csrfProtection, authenticate, authorize("roles.delete"), async (request, response) => {
    await service.delete(
      request.principal!.organization.id,
      String(request.params.id),
      request.principal!.user.id,
      String(response.locals.requestId),
    );
    response.status(204).send();
  });

  router.put("/:id/permissions", csrfProtection, authenticate, authorize("roles.update"), async (request, response) => {
    const parsed = setRolePermissionsSchema.parse(request.body);
    await service.setPermissions(
      request.principal!.organization.id,
      String(request.params.id),
      request.principal!.user.id,
      String(response.locals.requestId),
      parsed.permissionKeys,
    );
    const role = await service.get(request.principal!.organization.id, String(request.params.id));
    if (!role) {
      response.status(404).json({ error: { code: "ROLE_NOT_FOUND", message: "The role could not be found." } });
      return;
    }
    response.json({ data: role });
  });

  return router;
}



