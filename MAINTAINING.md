# Maintaining pfm-app-template

For engineers maintaining this template repo itself — raw `copier` usage,
the answers/toggle reference, template-authoring rules, and troubleshooting.
If you're a team member trying to *use* the template to build an app, you
don't need this — see the root `README.md`.

This file covers generate and update (sections 1-2) as raw `copier`
commands, for testing the template directly. There's also a third
workflow — migrating an existing app onto the template — that has no raw
`copier` equivalent, since it's supervised judgment work rather than a
scriptable command; see Workflow 3 in
`skills/pfm-app-template/SKILL.md`.

---

## 0. Prerequisites

- `copier` CLI, installed via pipx: `pipx install copier` (Python tool;
  generated apps stay pure JS/TS — this is the only place Python is involved).
- Git >= 2.24.
- `gh` authenticated (`gh auth login`) — copier clones
  `https://github.com/Prop-Firm-Match/pfm-app-template.git` itself (no
  manual `git clone` step needed) using your existing git credential
  helper, which `gh auth login` sets up for HTTPS. HTTPS + `gh` over raw
  SSH remotes since SSH key setup isn't a safe assumption on every
  machine (works the same on macOS and Windows either way).

Verify: `copier --version` should print `9.x`.

**Published at:** `https://github.com/Prop-Firm-Match/pfm-app-template.git`. No
release tags yet — `--vcs-ref=HEAD` means "latest commit on the default
branch (`main`)", which is what you want until tags exist.

---

## 1. Generate a new app (raw copier, no skill)

Every generated app is a **separate repo** — not inside this template repo,
not inside the `propfirm` monorepo. The skill/plugin does this via natural
language; this section is for testing the template directly.

### Interactive

```sh
copier copy https://github.com/Prop-Firm-Match/pfm-app-template.git ./my-new-app \
  --vcs-ref=HEAD
```

Copier will prompt for each answer below. Then:

```sh
cd my-new-app
git init -b main
git add -A && git commit -m "Initial generation from pfm-app-template"
```

### Non-interactive (scripted)

Always pass every answer explicitly with `--data`, plus `--defaults` (so
copier never blocks waiting on stdin) and `--vcs-ref=HEAD` (so it uses the
latest commit on `main`, not a stale checkout):

```sh
copier copy https://github.com/Prop-Firm-Match/pfm-app-template.git ./my-new-app \
  --vcs-ref=HEAD \
  --data project_name=my-new-app \
  --data owner=you@propfirmmatch.com \
  --data data_source=external-api-only \
  --data auth=cloudflare-access \
  --data enable_i18n=false \
  --data enable_testing=true \
  --data enable_file_storage=false \
  --data enable_storybook=false \
  --defaults
```

Working from a local clone instead of the git URL works the same way — just
swap the source argument for an absolute local path. **Never use a relative
local path**: it gets baked into the generated repo's `.copier-answers.yml`
as `_src_path` and breaks `copier update` later if it's ever run from a
different working directory.

### Answers reference

| Key | Choices | Default | Notes |
|---|---|---|---|
| `project_name` | kebab-case string | — | Becomes the CF Worker name and the `{project_name}.propfirmmatch.solutions` route. Must match `^[a-z][a-z0-9-]*$`. |
| `owner` | email string | — | Human, not a bot/service account. Required — no default. Lands in `CLAUDE.md`, `README.md`, and `.github/CODEOWNERS`. |
| `data_source` | `postgres`, `bigquery`, `google-sheets`, `external-api-only` | `external-api-only` | Not every app owns a database — pick the one matching where the data actually lives. |
| `auth` | `clerk`, `google-oauth`, `cloudflare-access` | `cloudflare-access` | `cloudflare-access` = zero app code, gate the route in the CF Zero Trust dashboard. Simplest default for internal tools. |
| `enable_i18n` | bool | `false` | |
| `enable_testing` | bool | `true` | Adds Vitest scaffolding. |
| `enable_file_storage` | bool | `false` | Adds an R2 client stub. |
| `enable_storybook` | bool | `false` | Adds Storybook (stories for `Button`/`Card`) for previewing/developing design-system components. |

Always-on regardless of answers: Vite + React on Cloudflare Workers (via
`@cloudflare/vite-plugin` — frontend and the tRPC API run together in one
process, one Worker), a [Vite+](https://viteplus.dev) toolchain (single `vp`
CLI wrapping Vite/Vitest/Oxlint/Oxfmt — `vp dev`/`vp build`/`vp test run`/
`vp lint`, config centralized in `vite.config.ts`'s `lint`/`fmt` blocks, no
more standalone `.oxlintrc.json`; `pnpm-workspace.yaml` pins the `vite`/
`vitest` catalog entries vite-plus needs — this is still a plain single-package
repo, not a pnpm workspace of multiple packages), a pre-commit hook (wired up
by the `prepare: vp config --no-agent` script on first `pnpm install` — runs
`vp check --fix` on staged files via `vite.config.ts`'s `staged` block, so
lint/fmt issues get caught before a commit lands, not just in CI; hook
internals live in `.vite-hooks/` which is partially gitignored), the vendored
design system (`src/components/ui/` —
Button, Card, Input, Label, Select, Table, DataTable, Form + react-hook-form,
Chart + recharts — plus `src/lib/utils.ts`, `src/styles/globals.css`), a
branded top nav (`src/components/nav.tsx`, PFM logo in `public/`), a tRPC
router (`server/router.ts`, `server/worker.ts`) default-denying by default —
`protectedProcedure` (`server/trpc.ts`) requires a server-verified identity
and is what any real data-touching procedure should use; `publicProcedure`
is the explicit opt-in for routes that genuinely don't need auth — baked-in
`.github/workflows/ci.yml` (lint + `format:check` + type-check + test +
build, plus a `secret-scan` job running gitleaks — see `.gitleaks.toml` for
the one allowlisted entry, a known fake test fixture, not a real secret),
a `.env.example` + `docker-compose.yml` (postgres) local-dev story, a
`.github/CODEOWNERS` naming the `owner` answer, and a generated `CLAUDE.md`
(agent working-rules for that specific app, scoped to the answers picked —
e.g. don't hand-edit the vendored design-system files, push brand/component
changes upstream to this template instead).

**The CI pipeline is not optional.** Every app built from this template gets
`ci.yml` (lint/format/type-check/test/build/secret-scan) and deploys via
Cloudflare Workers Builds — a manual `wrangler deploy` from someone's laptop
is not an accepted deploy path for a template-based app. This applies to
apps brought onto the template via Workflow 3 (migrate) too: bringing an
app "onto the template" means bringing it onto this CI/deploy story, not
just the code shape.

After generating, read the generated app's own `README.md` and `CLAUDE.md`
— they document that specific app's secrets/deploy steps and working rules
based on the answers you picked.

---

## 2. Update an already-generated app (raw copier, no skill)

This is the whole point of using copier instead of a one-shot scaffolder.
When this template repo changes (a design token, a new shared component, a
CI tweak), every already-generated app can pull that change in as a normal
git diff.

**Preconditions** (copier will refuse otherwise):
- The target repo must be a git repo with a **clean working tree** — commit
  or stash first.
- `.copier-answers.yml` must exist at the repo root and must not be hand-edited.

```sh
cd my-existing-app
copier update --vcs-ref=HEAD --defaults
git diff        # review what changed before committing
git add -A && git commit -m "Apply pfm-app-template update"
```

If the app's `.copier-answers.yml` still has an absolute local `_src_path`
from before this template was pushed to GitHub, update it to the git URL
first (`https://github.com/Prop-Firm-Match/pfm-app-template.git`) — see
[Troubleshooting](#troubleshooting).

Copier does a 3-way merge (original template render vs. new template render
vs. your current file). Conflicts show up as normal git conflict markers —
resolve them like any merge conflict.

---

## 3. Toggle → what actually changes

| Answer | Files it gates |
|---|---|
| `data_source=postgres` | `drizzle.config.ts`, `lib/db/schema.ts`, `lib/db/client.ts`, `docker-compose.yml`, `hyperdrive` binding in `wrangler.jsonc` |
| `data_source=bigquery` | `lib/data/bigquery-client.ts` |
| `data_source=google-sheets` | `lib/data/sheets-client.ts` |
| `data_source=external-api-only` | none of the above — no owned datastore code |
| `auth=clerk` | `lib/auth/AuthGate.tsx` (ClerkProvider + SignedIn/SignedOut, feeds the session token into `lib/auth/token-store.ts`) + `lib/auth/verify-identity.ts` (server-side, via `@clerk/backend`) |
| `auth=google-oauth` | `lib/auth/AuthGate.tsx` (Google Identity Services + Workspace-domain check, feeds the ID token into `lib/auth/token-store.ts`) + `lib/auth/verify-identity.ts` (server-side, JWT-verified against Google's JWKS via `jose`) |
| `auth=cloudflare-access` | `lib/auth/AuthGate.tsx` (passthrough) + `lib/auth/verify-identity.ts` (server-side, `Cf-Access-Jwt-Assertion` verified against Cloudflare's JWKS via `jose` — not just decoded) + a `whoami` tRPC procedure surfacing the verified identity in the nav |
| `enable_testing=true` | `vitest.config.ts`, test-related deps/scripts, a starter `App.test.tsx` |
| `enable_file_storage=true` | `lib/r2-client.ts` |
| `enable_storybook=true` | `.storybook/main.ts`, `.storybook/preview.tsx`, `src/components/ui/button.stories.tsx`, `src/components/ui/card.stories.tsx` |
| `enable_i18n=true` | adds `react-i18next`/`i18next` deps (no routing scaffolding wired yet — see [Known gaps](#known-gaps)) |

---

## 4. Maintaining this template (for whoever edits `template/`)

- Everything a generated app receives lives under `template/`. Do not add
  files at the repo root outside `template/` and `copier.yml` — they won't
  be part of any generated app.
- **Conditional files/dirs**: name them with a Jinja `{% if %}` wrapping the
  whole segment, e.g. `{% if auth == "clerk" %}clerk.ts{% endif %}`. When the
  condition is false, the rendered name is empty and copier skips it.
  **The `{% if %}...{% endif %}` must stay within a single path segment** —
  it cannot span a `/`. `lib/{% if x %}dir/file.ts{% endif %}` breaks Jinja
  parsing because copier renders path segments independently. Keep
  conditional subtrees flat if the condition covers a whole directory.
- **File content templating**: only files with a literal `.jinja` suffix on
  disk get their *content* rendered as Jinja (and the suffix is stripped in
  the output). Path segments are always Jinja-rendered regardless of
  suffix. If a file's content needs `{{ project_name }}` etc., it needs the
  `.jinja` suffix; if only the *filename* is conditional and the content is
  static, it doesn't.
- **The answers file is not automatic.** Copier does NOT write
  `.copier-answers.yml` on its own — the template must contain a literal
  file named `{{ _copier_conf.answers_file }}.jinja` (see `template/`) or
  `copier update` will have nothing to read and will fail outright.
- After any change, run the matrix check before committing (adjust the
  answer axes in the script if you add/remove a toggle):

  ```sh
  bash scripts/test-matrix.sh
  ```

  This generates every `data_source × auth × enable_i18n ×
  enable_testing × enable_file_storage × enable_storybook` combination (192 total as of this
  writing) into a temp dir and exits non-zero on any render error or
  leftover unrendered `{% %}`/`{{ }}` filename. Last run: **192/192 passed**.

  This also runs automatically in CI (`.github/workflows/test-matrix.yml`)
  on every PR and push to `main` — a red check means a template change
  broke rendering for at least one toggle combination.

  **This check only verifies rendering**, not that the output builds — it
  does not `pnpm install`/lint/type-check/build/test the generated app. A
  generation can pass the matrix and still fail its own CI. See
  [Known gaps](#known-gaps).

---

## 5. Note for agents working in this repo

Sections 1-4 above already state the load-bearing rules (never hand-edit
`.copier-answers.yml`, use `--vcs-ref=HEAD` until tags exist, show the diff
before committing on update, keep `scripts/test-matrix.sh` in sync with
`copier.yml`). The `pfm-app-template` skill
(`skills/pfm-app-template/SKILL.md`) encodes the same discipline as
directives for agents generating/updating apps through the plugin — read
that instead of re-deriving these rules from a task.

If a generation or update fails, check [Troubleshooting](#troubleshooting)
below before assuming something is broken in copier itself.

---

## Troubleshooting

**`ValueError: Local template must be a directory` on `copier update`.**
The generated repo's `.copier-answers.yml` has a relative or stale
`_src_path` that doesn't resolve from the current working directory. Fix:
either `cd` back to the directory it was generated from, or hand-edit just
the `_src_path` line in `.copier-answers.yml` to an absolute path or git
URL — that field isn't part of the rendered-answers contract, it's copier's
own bookkeeping (along with `_commit`, below), so it's one of the two lines
in that file that are safe to fix by hand.

**A generated app has a file/folder literally named with `{%` or `{{` in it.**
A conditional path is spanning a `/` boundary somewhere in `template/`. Find
it and flatten it per the rule in [section 4](#4-maintaining-this-template-for-whoever-edits-template).

**`copier update` fails immediately complaining the destination is dirty.**
Commit or stash first — copier refuses to update a repo with uncommitted
changes, by design.

**No `.copier-answers.yml` appears after `copier copy`.**
The template is missing `template/{{ _copier_conf.answers_file }}.jinja`.
Without it, copier has nothing to base a future `copier update` on.

**`copier update` fails because the recorded `_commit` no longer exists**
(template history was squashed/rewritten and force-pushed — this repo has
no release tags, so that's a real risk every time `main` gets rewritten).
Copier needs to check out the *old* `_commit` to render the "before" side
of its 3-way diff; if that commit was garbage-collected off `main`, the
checkout fails outright. Fix: hand-edit just the `_commit` line in the
downstream repo's `.copier-answers.yml` to the new HEAD's short SHA (`git
log --oneline -1` in this repo) — this is the one other line in that file
(besides `_src_path`) that's safe to touch by hand, since it's copier's
bookkeeping, not a rendered answer. Then run `copier update --vcs-ref=HEAD
--defaults` normally and review the diff before committing.

---

## Known gaps

- `scripts/test-matrix.sh` only verifies rendering, not that a generated
  app actually builds — no `pnpm install`/lint/type-check/build/test pass
  per combination. Several real bugs (missing React/CF Workers types, oxlint
  scanning `node_modules`, no starter test, no `.gitignore`, a missing
  `postcss.config.js` so Tailwind directives never got processed at all, a
  bad `@types/react-dom` version range) were only found by actually running
  `pnpm install`/`build`/`type-check` on generated output, not by the
  matrix. A real build/lint/test smoke test per combination would close
  this for good — until then, treat the matrix as a floor, not a guarantee.
- No error-tracking integration (PostHog was deliberately dropped from this
  template's stack; no Sentry equivalent was added). Accepted for now —
  revisit if it becomes a real problem for a generated app.
- `data_source=bigquery` and `auth=google-oauth` have no precedent anywhere
  in the `propfirm` monorepo or its sibling repos — net-new patterns written
  for this template, not lifted from working code (`data_source=google-sheets`
  now IS lifted from a real sibling repo, `financial-dashboard` — see the
  Known gaps entry above). Treat their
  generated stubs as a starting point, not a battle-tested integration.
- `enable_i18n=true` only adds `react-i18next`/`i18next` as dependencies —
  no actual routing/locale-switching scaffolding is wired up yet. Lowest-
  effort toggle in the template; treat it as a placeholder.
- Every `data_source` × every `auth` combination, plus `enable_storybook=true`
  and `enable_file_storage=true`, have each been exercised fully end-to-end
  (generate → `pnpm install` → lint/`format:check`/type-check/build/test →
  `dev` → real HTTP + tRPC request) at least once. Not exhaustive (not every
  combination has been cross-multiplied against every other toggle) but every
  individual code path has executed. Two real bugs were only found this way
  (never caught by the render-only matrix): `auth=google-oauth`'s JWT decode
  didn't handle a possibly-`undefined` payload segment under
  `noUncheckedIndexedAccess`, and `process.env` (used by the bigquery/
  google-sheets/R2 clients) had no type declarations until `@types/node` was
  added — it had accidentally type-checked before only because `postgres`'s
  transitive deps happened to pull in Node types.
- **Vite+ toolchain** (`vite.config.ts`'s `lint`/`fmt` blocks, `vp` CLI,
  `pnpm-workspace.yaml` catalog): `typeCheck: true` (Oxlint's type-aware lint,
  powered by tsgolint) is deliberately left off in `lint.options` — as of
  vite-plus 0.2.6, its checker mis-flags the CSS side-effect import in
  `.storybook/preview.tsx` as an error that plain `tsc --noEmit` (still the
  real type-check gate — see `package.json`'s `type-check` script) correctly
  allows. Re-evaluate enabling it once tsgolint's CSS-module-ambient-type
  handling matures. `format:check` (`vp fmt --check .`) IS a CI gate — `fmt`
  ignores `**/*.md` (README.md's tables get `{{ project_name }}`-dependent
  column widths, so there's no single byte-for-byte-clean version to keep in
  the template source); everything else (code, `package.json`, `wrangler.jsonc`)
  is kept fmt-clean in the template itself, verified across every combination.
- ~~`data_source=google-sheets`'s worker bundle was ~21.7MB~~ — fixed:
  `lib/data/sheets-client.ts` now calls the Sheets REST API directly (hand-
  rolled RS256 JWT via Web Crypto + `fetch`) instead of the `googleapis` SDK,
  matching the real pattern in `financial-dashboard`'s `functions/api/data.js`
  (same service-account JWT flow, same REST endpoints). Worker bundle dropped
  to ~128KB. Env vars changed: `GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON` (one JSON
  blob) → `GOOGLE_SHEETS_CLIENT_EMAIL` + `GOOGLE_SHEETS_PRIVATE_KEY` (two
  plain vars, same as financial-dashboard's `GOOGLE_CLIENT_EMAIL`/
  `GOOGLE_PRIVATE_KEY`).
- `data_source=bigquery`'s worker bundle is ~1.3MB (`@google-cloud/bigquery`
  bundled whole) — likely within Workers' compressed-size limit, but not
  verified against a real `wrangler deploy`, and no real propfirm precedent
  for a REST-only BigQuery client was found to model a fix on (unlike
  google-sheets). Revisit if it ever fails a real deploy.
