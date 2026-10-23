# Project architecture

Edoméx Control de licencias is a Spanish internal license registry, independent from any official government registry. Do not imply government integration or authenticity verification.

## Main directories

- `src/routes/index.tsx` mounts the application. `__root.tsx` holds Spanish document metadata and shared UI providers.
- `src/components/license-app.tsx` contains the dashboard, secure account dialogs, editor, QR download and public verification view.
- `src/lib/licenses.ts` defines the client record contract and date/status helpers.
- `src/styles.css` contains Tailwind component theme variables and responsive burgundy/gold dashboard styles.
- `netlify/functions/licenses.mts` provides publicly accessible list/create/update and public single-record lookup by random UUID token.
- `netlify/functions/photos.mts` handles public JPEG upload and serves photos only through a registered license token.
- `db/schema.ts` defines Drizzle tables; `db/index.ts` creates the native Netlify adapter.
- `netlify/database/migrations` contains deployment-managed migrations generated using `pnpm exec drizzle-kit generate --name <imperative_snake_case>`.

## Conventions and decisions

Use TypeScript and React function components. Keep product copy in Spanish. Use Radix Dialog for keyboard accessible modals and Lucide for icons. Dates are ISO date-only values, and validity uses America/Mexico_City inclusive of the expiration date. Suspension takes priority over dates. Future issuance is Por iniciar. Do not seed invented licenses or drivers.

Anyone with the application link can list, create and update all licenses and upload photos without authentication, as explicitly requested. Accounts are optional and do not control record access. Same-origin checks and input validation remain required for mutations. The profile label is Dcamargo; authentication uses verified email. Never hardcode passwords, create an unauthenticated admin-claim flow, or authorize by user-controlled metadata. Identity callbacks support invitations, recovery and confirmation. Public UUID lookup deliberately excludes notes and internal row ID. QR links use the browser origin and remain stable after edits.

Photos persist in Netlify Blobs, and records persist in Netlify Database. Store no persistent records in browser storage or JSON. Client uploads are normalized to JPEG and resized; server checks size and JPEG signature. Strong blob consistency prevents immediate-read failures. The shared application listing includes notes; the QR lookup continues to exclude notes and internal row ID. Database schema changes require generated migrations; do not apply migrations manually. Keep account and upload errors free of sensitive values.

Follow the run's restrictions on validation. Do not run builds, dev servers, type checks, or test commands when the platform forbids them; deployment performs validation. Review edited source files instead. Do not inspect `.git` or create commits directly.
