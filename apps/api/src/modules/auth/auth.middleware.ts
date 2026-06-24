import type { PermissionKey } from "@business/contracts";
import { parse } from "cookie";
import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error.js";
import type { SessionAuthenticator } from "./auth.service.js";

export const SESSION_COOKIE_NAME = "bp_session";

export function readSessionToken(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  try {
    return parse(cookieHeader)[SESSION_COOKIE_NAME] ?? null;
  } catch {
    return null;
  }
}

export function createAuthenticate(service: SessionAuthenticator): RequestHandler {
  return async (request, _response, next) => {
    const token = readSessionToken(request.headers.cookie);
    const principal = token ? await service.authenticate(token) : null;
    if (!principal) {
      next(new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication is required."));
      return;
    }
    request.principal = principal;
    next();
  };
}

export function authorize(permission: PermissionKey): RequestHandler {
  return (request, _response, next) => {
    if (!request.principal) {
      next(new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication is required."));
      return;
    }
    if (!request.principal.permissions.has(permission)) {
      next(new AppError(403, "PERMISSION_DENIED", "You do not have permission to perform this action."));
      return;
    }
    next();
  };
}