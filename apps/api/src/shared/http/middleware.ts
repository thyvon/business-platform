import { randomUUID } from "node:crypto";
import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/app-error.js";

export const requestContext: RequestHandler = (request, response, next) => {
  const requestId = request.header("x-request-id") || randomUUID();
  request.id = requestId;
  response.locals.requestId = requestId;
  response.setHeader("x-request-id", requestId);
  next();
};

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(new AppError(404, "ROUTE_NOT_FOUND", `${request.method} ${request.path} was not found.`));
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  void next;
  const normalized = error instanceof AppError
    ? error
    : error instanceof ZodError
      ? new AppError(422, "VALIDATION_FAILED", "The request data is invalid.", error.issues)
      : new AppError(500, "INTERNAL_ERROR", "An unexpected server error occurred.");

  response.status(normalized.statusCode).json({
    error: {
      code: normalized.code,
      message: normalized.message,
      requestId: String(response.locals.requestId),
      ...(normalized.details === undefined ? {} : { details: normalized.details }),
    },
  });
};
