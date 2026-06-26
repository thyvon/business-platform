import { Router } from "express";
import { inviteUserSchema, acceptInvitationSchema } from "@business/contracts";
import type { RequestHandler } from "express";
import { authorize } from "../auth/auth.middleware.js";
import type { InvitationService } from "./invitation.service.js";

export function createInvitationRouter(service: InvitationService, authenticate: RequestHandler, csrfProtection: RequestHandler) {
  const router = Router();

  router.post("/", csrfProtection, authenticate, authorize("users.invite"), async (request, response) => {
    const parsed = inviteUserSchema.parse(request.body);
    const principal = request.principal!;
    await service.invite(
      principal.organization.id,
      principal.organization.name,
      principal.user.id,
      principal.user.displayName,
      String(response.locals.requestId),
      parsed,
    );
    response.status(204).send();
  });

  router.post("/accept", csrfProtection, async (request, response) => {
    const parsed = acceptInvitationSchema.parse(request.body);
    await service.accept(parsed.token, {
      displayName: parsed.displayName,
      password: parsed.password,
    });
    response.status(204).send();
  });

  return router;
}

