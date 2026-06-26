import nodemailer from "nodemailer";
import { env } from "../../config/env.js";

export class EmailService {
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    if (env.smtp.configured) {
      this.transporter = nodemailer.createTransport({
        host: env.smtp.host,
        port: env.smtp.port,
        secure: env.smtp.port === 465,
        auth: { user: env.smtp.user, pass: env.smtp.pass },
      });
    } else {
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
    }
  }

  async sendInvitation(params: {
    email: string;
    invitationLink: string;
    organizationName: string;
    invitedByName: string;
  }): Promise<void> {
    const subject = `You've been invited to join ${params.organizationName}`;
    const text = [
      `Hello,`,
      ``,
      `${params.invitedByName} has invited you to join ${params.organizationName} on Business Platform.`,
      ``,
      `Click the following link to accept the invitation and set up your account:`,
      params.invitationLink,
      ``,
      `This invitation will expire in 7 days.`,
      ``,
      `If you did not expect this invitation, you can safely ignore this email.`,
    ].join("\n");

    await this.send({ email: params.email, subject, text });
  }

  async sendPasswordReset(params: {
    email: string;
    displayName: string;
    organizationName: string;
    resetLink: string;
    expiresInMinutes: number;
  }): Promise<void> {
    const subject = `Reset your ${params.organizationName} password`;
    const text = [
      `Hello ${params.displayName},`,
      ``,
      `We received a request to reset your Business Platform password for ${params.organizationName}.`,
      ``,
      `Click the following link to choose a new password:`,
      params.resetLink,
      ``,
      `This link will expire in ${params.expiresInMinutes} minutes and can only be used once.`,
      ``,
      `If you did not request this reset, you can safely ignore this email.`,
    ].join("\n");

    await this.send({ email: params.email, subject, text });
  }

  private async send(params: { email: string; subject: string; text: string }): Promise<void> {
    const info: unknown = await this.transporter.sendMail({
      from: env.smtp.from,
      to: params.email,
      subject: params.subject,
      text: params.text,
    });

    if (!env.smtp.configured) {
      const message = typeof info === "object" && info !== null && "message" in info
        && typeof (info as { message?: unknown }).message === "string"
        ? (info as { message: string }).message
        : "";
      console.log("--- Email (dev mode) ---");
      console.log("To:", params.email);
      console.log("Subject:", params.subject);
      console.log("Body:");
      console.log(params.text);
      console.log("---");
      if (message) console.log("Raw:", message);
    }
  }
}
