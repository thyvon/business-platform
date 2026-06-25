import type { UserListQuery } from "@business/contracts";
import type { AuthenticatedPrincipal } from "../auth/auth.types.js";
import type { UserRepository } from "./user.repository.js";

export class UserService {
  constructor(private readonly repository: UserRepository) {}

  list(principal: AuthenticatedPrincipal, query: UserListQuery) {
    return this.repository.listByOrganization(principal.organization.id, query);
  }
}