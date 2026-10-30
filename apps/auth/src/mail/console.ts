import { Effect, Logger } from "effect";
import type { MailMessage, MailSender } from "./sender";

/**
 * A `MailSender` that writes the message to an injected Effect `Logger` instead
 * of delivering it over SMTP. Selected when `MAIL_MODE === "console"` so a
 * self-hosted deployment runs end-to-end with no mail provider: the reset and
 * verify links (carried in `body`) appear in the service log.
 *
 * The logger is injected (defaults to Effect's console logger) so tests can
 * capture output without spying on `console`.
 */
export const consoleMailSender = (
  logger: Logger.Logger<unknown, void> = Logger.defaultLogger,
): MailSender => ({
  async send(message: MailMessage): Promise<void> {
    await Effect.runPromise(
      Effect.logInfo("mail delivery").pipe(
        Effect.annotateLogs({
          to: message.to,
          subject: message.subject,
          body: message.body,
        }),
        Effect.provide(Logger.layer([logger])),
      ),
    );
  },
});
