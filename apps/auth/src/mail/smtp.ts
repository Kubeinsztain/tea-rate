import nodemailer from "nodemailer";
import type { MailMessage, MailSender } from "./sender";

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

/**
 * The slice of a Nodemailer SMTP transport this sender relies on. Kept small so
 * tests can substitute a spy instead of standing up a live SMTP server.
 */
export interface SmtpTransport {
  sendMail(options: {
    from: string;
    to: string;
    subject: string;
    text: string;
  }): Promise<unknown>;
}

/**
 * Build the production Nodemailer SMTP transport for `config`. Implicit TLS is
 * enabled only on port 465; on every other port Nodemailer upgrades to TLS via
 * STARTTLS when the server offers it.
 */
const createSmtpTransport = (config: SmtpConfig): SmtpTransport =>
  nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

/**
 * A `MailSender` that delivers messages over SMTP via Nodemailer (whose ES
 * module build officially supports Bun).
 */
export const smtpMailSender = (
  config: SmtpConfig,
  transport: SmtpTransport = createSmtpTransport(config),
): MailSender => ({
  async send(message: MailMessage): Promise<void> {
    await transport.sendMail({
      from: config.from,
      to: message.to,
      subject: message.subject,
      text: message.body,
    });
  },
});
