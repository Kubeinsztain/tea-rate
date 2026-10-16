import { createApp } from "./app";
import { createAuth } from "./auth";
import { makeDatabase } from "./db/client";
import { env } from "./env";
import { smtpMailSender } from "./mail/smtp";

const db = makeDatabase(env.DATABASE_URL);
const auth = createAuth({
  db,
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  webOrigin: env.WEB_ORIGIN,
  mailSender: smtpMailSender({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.SMTP_FROM,
  }),
});
const app = createApp(auth);

const server = Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
});

console.log(`auth service listening on http://localhost:${server.port}`);
