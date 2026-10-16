/**
 * Email delivery seam.
 *
 * Production delivers over SMTP (see `./smtp.ts`); tests inject a spy to assert
 * that Better Auth's verification/reset callbacks fire with the right
 * recipient, subject, and link — without sending real mail.
 */

export interface MailMessage {
  to: string;
  subject: string;
  body: string;
}

export interface MailSender {
  send(message: MailMessage): Promise<void>;
}
