import { currentSessionSchema, type CurrentSession } from "@business/contracts/auth";
import { cookies } from "next/headers";

const apiOrigin = (process.env.API_INTERNAL_URL || "http://127.0.0.1:4000").replace(/\/$/, "");

export async function getCurrentSession(): Promise<CurrentSession | null> {
  const cookieHeader = (await cookies()).toString();
  if (!cookieHeader.includes("bp_session=")) return null;

  const response = await fetch(apiOrigin + "/api/v1/auth/me", {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });

  if (response.status === 401) return null;
  if (!response.ok) {
    throw new Error("The authentication service is unavailable.");
  }

  const payload: unknown = await response.json();
  if (typeof payload !== "object" || payload === null || !("data" in payload)) {
    throw new Error("The authentication service returned an invalid response.");
  }

  return currentSessionSchema.parse(payload.data);
}