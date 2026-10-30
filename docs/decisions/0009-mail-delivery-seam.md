# ADR-0009: Mail delivery behind a seam, log-only by default

- Status: accepted
- Date: 2026-10-30

## Context

The auth service sends verification and password-reset email. Today
`apps/auth/src/index.ts` always wires `smtpMailSender` (nodemailer), so a
self-hosted deployment without a mail provider would fail to deliver. Self-hosting
a full mail transfer agent (Mailcow, Maddy) requires a domain, MX/SPF/DKIM/DMARC
records, reverse DNS, and IP reputation — a separate operations project, and
deliverability to Gmail/Outlook is hard. Right now the app is self-hosted and
personal; real transactional email is not yet needed.

## Decision

Keep the existing `MailSender` interface (`apps/auth/src/mail/sender.ts`) as the
**single email seam**, and make SMTP optional behind it.

- Add a `consoleMailSender` — a second `MailSender` implementation that logs
  `to`, `subject`, and `body` (the body already contains the reset/verify link)
  instead of sending. Selected by env (e.g. `MAIL_MODE=console|smtp`).
- **Default to `console`** for self-hosted development, so the app works
  end-to-end with no SMTP configuration.
- Better Auth's callbacks are untouched — they depend only on the `MailSender`
  interface, not a concrete transport.
- Future delivery (a transactional provider over HTTP, or a self-hosted MTA) is
  added as further `MailSender` implementations, never as changes to auth logic.

Considered and rejected:

- **Self-hosting email now** (Mailcow/Maddy) — technically possible but a large
  separate ops burden with hard deliverability; rejected and treated as its own
  future project if it ever matters.

## Consequences

- A self-hosted deployment runs end-to-end with no SMTP config; verification and
  reset links appear in the service log.
- The seam keeps the email decision reversible and cheap to change later.
- A transactional provider (Resend/Postmark/SES) remains the recommended path
  when real email is required.

## See also

- [ADR-0005](./0005-separate-auth-service.md) — the auth service and its SMTP
  delivery.
- [ADR-0008](./0008-deployment-operations.md) — the self-hosted deployment this
  seam supports.
