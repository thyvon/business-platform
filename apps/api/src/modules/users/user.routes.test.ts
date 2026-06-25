import type { NextFunction, RequestHandler, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuthenticatedPrincipal } from "../auth/auth.types.js";
import { createUserRouter } from "./user.routes.js";
import type { UserService } from "./user.service.js";

const principal: AuthenticatedPrincipal = {
  sessionId: "session-id",
  user: { id: "user-id", email: "owner@example.com", displayName: "Owner" },
  organization: { id: "organization-id", name: "Example Organization" },
  membershipId: "membership-id",
  roles: [{ id: "role-id", name: "Owner", description: "Owner", isSystem: true }],
  permissions: new Set(["users.read"]),
  expiresAt: new Date("2030-01-01T12:00:00.000Z"),
};

function invoke(handler: RequestHandler, request: Record<string, unknown>) {
  const response = {
    json: vi.fn(),
  } as unknown as Response;

  return new Promise<{ response: Response }>((resolve, reject) => {
    const next: NextFunction = (error?: unknown) => {
      if (error instanceof Error) reject(error);
      else if (error) reject(new Error("Route handler failed.", { cause: error }));
      else resolve({ response });
    };

    Promise.resolve(handler(request as never, response, next))
      .then(() => resolve({ response }))
      .catch(reject);
  });
}

function firstRouteHandler(router: ReturnType<typeof createUserRouter>) {
  const stack = router.stack as Array<{ route?: { stack: Array<{ handle: RequestHandler }> } }>;
  const route = stack.find((layer) => layer.route)?.route;
  if (!route) throw new Error("Route was not registered.");
  return route.stack.map((layer) => layer.handle);
}

describe("user routes", () => {
  it("returns a paginated user list for principals with users.read", async () => {
    const list = vi.fn<UserService["list"]>().mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0,
    });
    const authenticate: RequestHandler = (request, _response, next) => {
      request.principal = principal;
      next();
    };
    const handlers = firstRouteHandler(createUserRouter({ list } as unknown as UserService, authenticate));
    const request = { query: { search: "owner" } };

    for (const handler of handlers) await invoke(handler, request);

    expect(list).toHaveBeenCalledWith(principal, expect.objectContaining({ search: "owner", page: 1, pageSize: 20 }));
  });

  it("rejects authenticated principals without users.read", async () => {
    const list = vi.fn<UserService["list"]>();
    const authenticate: RequestHandler = (request, _response, next) => {
      request.principal = { ...principal, permissions: new Set() };
      next();
    };
    const handlers = firstRouteHandler(createUserRouter({ list } as unknown as UserService, authenticate));
    const request = { query: {} };

    await invoke(handlers[0]!, request);
    await expect(invoke(handlers[1]!, request))
      .rejects.toMatchObject({ statusCode: 403, code: "PERMISSION_DENIED" });
    expect(list).not.toHaveBeenCalled();
  });

  it("requires authentication before authorization", async () => {
    const list = vi.fn<UserService["list"]>();
    const authenticate: RequestHandler = (_request, _response, next) => {
      next(new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication is required."));
    };
    const handlers = firstRouteHandler(createUserRouter({ list } as unknown as UserService, authenticate));

    await expect(invoke(handlers[0]!, { query: {} }))
      .rejects.toMatchObject({ statusCode: 401, code: "AUTHENTICATION_REQUIRED" });
    expect(list).not.toHaveBeenCalled();
  });
});