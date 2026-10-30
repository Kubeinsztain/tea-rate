import { Effect } from "effect";
import { createApp } from "./app";
import { createAuth } from "./auth";
import { makeDatabase } from "./db/client";
import { env } from "./env";
import { consoleMailSender } from "./mail/console";
import type { MailSender } from "./mail/sender";
import { smtpMailSender } from "./mail/smtp";

/**
 * Build the `MailSender` for the configured `MAIL_MODE`. Console mode needs no
 * SMTP; smtp mode requires the full `SMTP_*` set, so a missing value fails fast
 * here rather than surfacing as a delivery error on first use.
 */
const buildMailSender = (): MailSender => {
  if (env.MAIL_MODE === "console") {
    return consoleMailSender();
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = env;
  if (
    !SMTP_HOST ||
    !SMTP_USER ||
    !SMTP_PASS ||
    !SMTP_FROM ||
    SMTP_PORT === undefined
  ) {
    throw new Error(
      "MAIL_MODE=smtp requires SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM",
    );
  }

  return smtpMailSender({
    host: SMTP_HOST,
    port: SMTP_PORT,
    user: SMTP_USER,
    pass: SMTP_PASS,
    from: SMTP_FROM,
  });
};

const db = makeDatabase(env.DATABASE_URL);
const auth = createAuth({
  db,
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  webOrigin: env.WEB_ORIGIN,
  mailSender: buildMailSender(),
});
const app = createApp(auth);

const server = Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
});

Effect.runFork(
  Effect.logInfo(`auth service listening on http://localhost:${server.port}`),
);
