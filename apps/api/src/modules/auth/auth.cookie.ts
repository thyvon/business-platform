import { serialize } from "cookie";
import { SESSION_COOKIE_NAME } from "./auth.middleware.js";

export function createSessionCookie(token: string, expiresAt: Date, secure: boolean): string {
  return serialize(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(secure: boolean): string {
  return serialize(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });
}