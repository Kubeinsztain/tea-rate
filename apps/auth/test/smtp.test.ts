import { describe, expect, it } from "vitest";
import type { SmtpTransport } from "../src/mail/smtp";
import { smtpMailSender } from "../src/mail/smtp";

describe("smtpMailSender", () => {
  it("relays recipient, subject, and body through the SMTP transport", async () => {
    const sent: Array<{
      from: string;
      to: string;
      subject: string;
      text: string;
    }> = [];
    const transport: SmtpTransport = {
      async sendMail(options) {
        sent.push(options);
        return { messageId: "test" };
      },
    };

    const sender = smtpMailSender(
      {
        host: "smtp.example.com",
        port: 587,
        user: "auth",
        pass: "password",
        from: "no-reply@example.com",
      },
      transport,
    );

    await sender.send({
      to: "ada@example.com",
      subject: "Verify your email",
      body: "http://localhost:4000/verify-email?token=abc",
    });

    expect(sent).toHaveLength(1);
    expect(sent[0]).toEqual({
      from: "no-reply@example.com",
      to: "ada@example.com",
      subject: "Verify your email",
      text: "http://localhost:4000/verify-email?token=abc",
    });
  });
});
