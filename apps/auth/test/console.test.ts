import { Logger } from "effect";
import { describe, expect, it } from "vitest";
import { consoleMailSender } from "../src/mail/console";

describe("consoleMailSender", () => {
  it("writes to, subject, and body to the injected logger", async () => {
    const records: Array<{ annotations: Record<string, unknown> }> = [];
    const spy = Logger.make((options) => {
      records.push(Logger.formatStructured.log(options));
    });

    const sender = consoleMailSender(spy);

    await sender.send({
      to: "ada@example.com",
      subject: "Verify your email",
      body: "http://localhost:4000/verify-email?token=abc",
    });

    expect(records).toHaveLength(1);
    expect(records[0]?.annotations).toEqual({
      to: "ada@example.com",
      subject: "Verify your email",
      body: "http://localhost:4000/verify-email?token=abc",
    });
  });
});
