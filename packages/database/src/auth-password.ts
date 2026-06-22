import { argon2id, hash, verify } from "argon2";

export const passwordHashOptions = Object.freeze({
  type: argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
});

export function hashPassword(password: string) {
  return hash(password, passwordHashOptions);
}

export function verifyPassword(passwordHash: string, password: string) {
  return verify(passwordHash, password);
}
