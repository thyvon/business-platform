import { randomBytes, randomUUID, createHash } from "node:crypto";
import { hashPassword } from "@business/database";
import { AppError } from "../../shared/errors/app-error.js";
import { env } from "../../config/env.js";
import type { EmailService } from "../../shared/email/email.service.js";
import type { InvitationRepository } from "./invitation.repository.js";

const INVITATION_TOKEN_BYTES = 32;
const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1_000;

function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export class InvitationService {
  constructor(
    private readonly repository: InvitationRepository,
    private readonly emailService: EmailService,
  ) {}

  async invite(
    organizationId: string,
    organizationName: string,
    invitedByUserId: string,
    invitedByName: string,
    requestId: string,
    input: { email: string; roleIds: string[] },
  ) {
    const existingUser = await this.repository.findUserByEmail(input.email);
    if (existingUser) {
      throw new AppError(409, "USER_ALREADY_EXISTS", "A user with this email address already exists.");
    }

    const id = randomUUID();
    const token = randomBytes(INVITATION_TOKEN_BYTES).toString("base64url");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

    await this.repository.create({
      id,
      organizationId,
      email: input.email,
      tokenHash,
      invitedByUserId,
      expiresAt,
      roleIds: input.roleIds,
    });

    const invitationLink = `${env.webOrigin}/accept-invitation?token=${token}`;

    await this.emailService.sendInvitation({
      email: input.email,
      invitationLink,
      organizationName,
      invitedByName,
    });

    await this.repository.createAuditEvent({
      organizationId,
      actorUserId: invitedByUserId,
      action: "user.invited",
      targetType: "user_invitation",
      targetId: id,
      requestId,
      metadata: { email: input.email, roleIds: input.roleIds },
    });
  }

  async accept(token: string, input: { displayName: string; password: string }) {
    const tokenHash = hashToken(token);
    const invitation = await this.repository.findByTokenHash(tokenHash);

    if (!invitation) {
      throw new AppError(400, "INVALID_INVITATION", "The invitation is invalid or has expired.");
    }

    const passwordHash = await hashPassword(input.password);
    const userId = await this.repository.createUser(invitation.email, input.displayName, passwordHash);
    const membershipId = await this.repository.createMembership(userId, invitation.organizationId);

    const roleIds = await this.repository.getInvitationRoles(invitation.id);
    if (roleIds.length > 0) {
      await this.repository.assignMembershipRoles(membershipId, roleIds);
    }

    await this.repository.markAccepted(invitation.id, new Date());

    await this.repository.createAuditEvent({
      organizationId: invitation.organizationId,
      actorUserId: userId,
      action: "invitation.accepted",
      targetType: "user_invitation",
      targetId: invitation.id,
      requestId: "accept-invitation",
      metadata: { email: invitation.email },
    });
  }
}
