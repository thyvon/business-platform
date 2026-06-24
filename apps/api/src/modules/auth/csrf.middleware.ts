import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function originFromHeader(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function createCsrfProtection(allowedOrigin: string): RequestHandler {
  const expectedOrigin = new URL(allowedOrigin).origin;

  return (request, _response, next) => {
    if (SAFE_METHODS.has(request.method)) {
      next();
      return;
    }

    const requestOrigin = originFromHeader(request.header("origin"))
      ?? originFromHeader(request.header("referer"));

    if (requestOrigin !== expectedOrigin) {
      next(new AppError(403, "CSRF_VALIDATION_FAILED", "The request origin could not be verified."));
      return;
    }

    next();
  };
}