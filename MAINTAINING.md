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
| `auth` | `clerk`, `google-oauth`, `cloudflare-access`, `none` | `cloudflare-access` | `cloudflare-access` = zero app code, gate the route in the CF Zero Trust dashboard. Simplest default for internal tools. `none` = no sign-in at all, `protectedProcedure` becomes a no-op (`server/trpc.ts`) — a deliberate choice for something genuinely public, never an inferred default; the skill must say so explicitly before generating. |
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
is the explicit opt-in for a single route that genuinely doesn't need auth
(a health check, say), distinct from `auth=none` (the app-level toggle —
see the answers table above), which makes `protectedProcedure` itself a
no-op instead — baked-in
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
| `auth=none` | `lib/auth/AuthGate.tsx` (passthrough) + `lib/auth/verify-identity.ts` (always resolves `null`) + `server/trpc.ts`'s `protectedProcedure` is aliased to `publicProcedure` in this mode, so `router.ts` needs no auth-specific branches. No identity system at all — see the README/`CLAUDE.md` warnings this toggle renders. |
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
  enable_testing × enable_file_storage × enable_storybook` combination (256 total as of this
  writing) into a temp dir and exits non-zero on any render error or
  leftover unrendered `{% %}`/`{{ }}` filename. Last run: **256/256 passed**.

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

**On Windows, `copier update` fails outright with `error: invalid path
'template/lib/auth/{% if auth == "clerk" %}...'` / `fatal: Could not reset
index file to revision 'HEAD'`, for an app whose recorded `_commit` predates
the Windows-portability fixes (see Known gaps).** This is a harder failure
than the diff described in the next entry — the update never gets far
enough to produce one. `copier update` checks out *both* the old and new
template revision to compute its three-way merge, and the rename that fixed
Windows checkout doesn't help checking out the *old* revision, which still
has the `"`-quoted filenames Windows can't create. Every app whose
`_commit` predates that fix is stuck on Windows until it crosses that one
boundary some other way — new apps generated after it are unaffected, and
once an app is past it, ordinary updates work fine again. Two ways across:

1. Run that one `copier update` on Linux/macOS/WSL, then continue on
   Windows as normal.
2. Render-and-merge locally (fully offline, no non-Windows machine needed):
   ```sh
   copier copy --vcs-ref=<the fix commit> --defaults \
     --data project_name=<name> --data owner=<owner> \
     --data auth=<...> --data data_source=<...> \
     <template-clone> /tmp/pristine
   # diff /tmp/pristine against the app, merge per file by hand,
   # then set _commit: <the fix commit> in .copier-answers.yml
   ```
   `_commit`, not `_src_path`, is the field to set here — see the
   `_commit`-doesn't-exist entry above for why hand-editing it is safe.

**`copier update` on an app generated before the Windows-portability fixes
(see Known gaps) shows every auth/data-source conditional file as delete +
add, plus a whole-repo CRLF→LF renormalisation diff.** Expected, one-time,
and only reachable once the entry above gets the app across that boundary.
Those fixes renamed 13 `"`-quoted conditional filenames to `'` (Windows
can't check out `"` in a filename at all) and added
`template/.gitattributes` (`eol=lf`, so Git for Windows'
`core.autocrlf=true` default stops producing CRLF files that fail
`format:check` while `git status` reports clean). Review the diff — it
should be pure renames plus line-ending normalisation, no content changes —
then commit as usual. If `.gitattributes` alone produces a large diff,
`git add --renormalize .` in the downstream app first makes that part of
the diff explicit before `copier update` runs.

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
- Three bugs found via a real Windows test run (generating an actual app and
  running it, not just the render matrix) — all fixed:
  1. `pnpm dev` exited 1 on a clean `data_source=postgres` checkout —
     `@cloudflare/vite-plugin` refuses to boot a hyperdrive binding with no
     `localConnectionString`. Fixed: `wrangler.jsonc` now sets it, matching
     `docker-compose.yml`.
  2. The `HYPERDRIVE`/`BIGQUERY_*`/`GOOGLE_SHEETS_*` bindings were never
     reached at runtime — `Context` had no `env` field, so
     `lib/db/client.ts`/`lib/data/*` always fell through to `process.env`
     (which Workers don't populate from dashboard secrets) or a hardcoded
     local default. The bindings the README tells you to configure were
     decorative. Fixed: `Env` now lives in `server/trpc.ts`, threaded onto
     `Context`, and every data-source client takes `env` as a required
     param instead of reading `process.env` (drizzle-kit is the one
     legitimate `process.env.DATABASE_CONNECTION_STRING` user left — it's a
     Node CLI outside the Worker, see `drizzle.config.ts`).
  3. Root `wrangler.jsonc`'s `assets.directory` was `"./dist"`, but the
     build emits `dist/client/` (frontend) + `dist/{project_name}/` (worker,
     with its own generated `wrangler.json`) — a real `wrangler deploy`
     would've served neither correctly (SPA 404 at `/`, worker bundle
     downloadable at a guessable path). Fixed: `"./dist/client"`. **Not yet
     verified against a real `wrangler deploy`** — confirmed via build
     output paths matching, not an actual deploy.
  Also fixed alongside: a third, dead, never-set env var in
  `drizzle.config.ts`'s fallback chain was removed.
  Not fixed — informational only: `@cloudflare/vite-plugin` copies `.env`
  into `dist/{project_name}/.dev.vars` on build (its own documented
  behavior, not this template's) — harmless while `.env` only holds the
  local-dev placeholders in `.env.example`, but a real risk the first time
  someone points local `.env` at production-shaped values; `dist/` is
  gitignored so this doesn't reach source control at least.
- A detailed Windows 11 test report (generating and running an actual app,
  not just the render matrix) surfaced these, all fixed at the same commit:
  1. **13 filenames used `"` for the Jinja conditional** (e.g.
     `{% if data_source == "postgres" %}client.ts{% endif %}`) — `"` is
     illegal in a Windows filename, so `git clone`/`copier update` failed
     checkout entirely on Windows, for exactly the files that render for a
     default `postgres`/`cloudflare-access` app. Fixed: swapped to `'`
     (Jinja treats both the same) across all 13 — a pure rename, verified
     against the render matrix.
  2. **No `.gitattributes`**, so Git for Windows' default
     `core.autocrlf=true` checks generated repos out as CRLF, which
     `format:check` (oxfmt) rejects — while `git status` reports the tree
     clean, so the failure looks causeless and isn't caught by CI (which
     runs `ubuntu-24.04` and never sees CRLF). Fixed: `template/.gitattributes`
     forces `eol=lf` on checkout, on every platform.
  3. **A `pg.Pool` cached at module scope in `lib/db/client.ts`** — this
     session's earlier "leak fix" (below) was itself the bug: a Workers
     isolate cannot carry a TCP socket across requests, and reusing one
     produces "the Worker's code had hung and would never generate a
     response" on the second request. Confirmed against Cloudflare's own
     Hyperdrive docs (`developers.cloudflare.com/workers/best-practices/` —
     "create a new client per request, Hyperdrive maintains the underlying
     pool") and reproduced/fixed: `getDb()` now creates a fresh `Pool` (`max:
     1`) per call, no module-level singleton. Verified live: 5 consecutive
     `listExamples` requests against a real local Postgres, all ~10-20ms, no
     hang.
  4. **`protectedProcedure` always 401'd under `pnpm dev` for
     `auth=cloudflare-access`** — no `Cf-Access-Jwt-Assertion` header exists
     locally (dev never runs behind Access), so every protected call failed
     and `.env.example`'s "everything else works" comment was wrong. Fixed:
     `verify-identity.ts` returns a fake `dev@localhost` identity when the
     header is absent, gated on `import.meta.env.DEV` (statically replaced
     at build time, so the branch is dead-code-eliminated from production
     bundles — not an env-var-only guard that could be misconfigured into an
     auth bypass). Verified live: `whoami` returns `dev@localhost` locally.
  5. All three `verify-identity.ts` variants (cloudflare-access, clerk,
     google-oauth) had the same dead `process.env` fallback pattern as the
     data-source clients did before the earlier fix (`env?.X ??
     process.env.X`, when `worker.ts` always passes a real `env`). Removed;
     `env` is now a required param in all three.
  6. **No initial migration shipped** — `drizzle/` was absent, so
     `pnpm db:migrate` against a fresh database succeeded and created
     nothing, and `listExamples` then failed on a missing relation. First
     fixed by shipping a real `drizzle-kit generate` output as template
     content; **superseded** by the fix below (this was `drizzle/**` app
     state shipped as template content, which is the wrong shape — see
     that entry for why and what replaced it).
  7. `pnpm install` printed `Ignored build scripts: esbuild, workerd` on
     every install in every generated app (pnpm's supply-chain-safety
     prompt). Fixed: `onlyBuiltDependencies: [esbuild, workerd]` in
     `pnpm-workspace.yaml` allows exactly those two instead of leaving every
     app owner to `pnpm approve-builds` blind.
  8. `vitest.setup.ts` had no `afterEach(cleanup)` — this config
     intentionally imports `describe`/`it`/`expect` explicitly rather than
     using Vitest's `test.globals: true`, so `@testing-library/react`'s
     usual auto-registration never kicks in. A second `render()`/query in
     the same test file failed with "found multiple elements"; the shipped
     `App.test.tsx` never exercised this because it renders once. Fixed:
     explicit `afterEach(cleanup)` in `vitest.setup.ts`.
  9. `corepack enable pnpm` needs an elevated shell on Windows (writes shims
     into `C:\Program Files\nodejs`); the obvious `winget install
     OpenJS.NodeJS` package doesn't carry the exact `.node-version` patch;
     `docker compose up -d` (the README's only documented local-DB path)
     needs Docker Desktop, which needs WSL2/Hyper-V, and a native Postgres
     needs both `wrangler.jsonc`'s `localConnectionString` and `.env`'s
     `DATABASE_CONNECTION_STRING` pointed at it (different consumers: the
     dev server vs. `drizzle-kit`). All three documented in README's Local
     development section now.
  10. `wrangler.jsonc`'s Hyperdrive `id` ships as the literal placeholder
      `"REPLACE_WITH_HYPERDRIVE_ID"`, and nothing catches a deploy that
      still has it — it fails at query time, not build time. Documented as
      an explicit numbered step in README's Deploy section
      (`wrangler hyperdrive create`) for `data_source=postgres`; still not
      enforced by any automated check.
  11. CODEOWNERS uses a bare email; GitHub only resolves that to a reviewer
      if it's a *verified* email on a GitHub account with repo access, and
      fails silently otherwise. Not changed (bare email is the only thing
      `owner` collects), but now called out in a comment in the generated
      `CODEOWNERS` file itself.
  Not reproduced / not changed: a stray committed `tsconfig.tsbuildinfo` in
  a generated app (the report's theory — produced at template-authoring
  time and copied — didn't hold up: `*.tsbuildinfo` is gitignored, and a
  fresh `copier copy` against this template's current tree carries no such
  file; the one the report saw was very likely `tsc -b`'s own normal build
  cache in that developer's working tree, not a template defect). The
  README's `TEST_DATABASE_URL` row was reworded instead of wiring a
  Postgres service into `ci.yml` — no test in the template actually touches
  a database yet, so a real CI service for it would be speculative
  infrastructure for a feature that doesn't exist.
- A follow-up audit at `55f60c4` (the commit above) found two issues that
  were *consequences* of that same commit's own fixes, plus three smaller
  ones. All fixed:
  1. Crossing from a pre-`55f60c4` app to `55f60c4`+ via `copier update`
     still fails on Windows — the filename rename fixed checking out the
     *new* revision, but `copier update` also checks out the *old* one to
     three-way-merge against, and the old revision still has the
     `"`-quoted filenames. Not a code fix (nothing to fix — the old
     revision's history is what it is); documented as a Troubleshooting
     entry with two ways across the boundary (update once on a non-Windows
     machine, or render-and-merge locally with `copier copy
     --vcs-ref=<commit>`).
  2. **The shipped `drizzle/` migration was template-managed content for
     app *state*.** `_journal.json` is an append-only registry drizzle-kit
     owns; any app with a real schema has moved past `idx: 0` with its own
     tag, so without a skip rule `copier update` would try to reconcile the
     template's `0000_init`/journal against the app's on every future
     update, corrupting it. First fixed with `_skip_if_exists: [drizzle/**]`
     in `copier.yml`, which is *name*-based: it stops the corruption (real
     apps' `_journal.json`/`meta/*.json` already exist under those names, so
     they're skipped) but doesn't stop a `0000_init.sql` reappearing on
     every update for an app whose own first migration has a different
     drizzle-generated name (`0000_wild_betty_ross.sql`, etc.) — harmless
     (not referenced by the journal, drizzle-kit never runs it) but a
     recurring untracked stray. **Superseded**: don't ship a migration at
     all. `lib/db/schema.ts` already starts with one table specifically so
     `pnpm db:generate` has something to diff against on a fresh clone;
     README's local-dev steps now run `db:generate && db:migrate` before
     first `pnpm dev`, which solves the original "fresh `db:migrate` is a
     silent no-op" problem without putting app state in the template at
     all. `_skip_if_exists` removed from `copier.yml` — nothing left that
     needs it.
  3. `.gitignore`'s `.vite-hooks/_` matched a file literally named `_`
     inside that directory, not the directory itself — so the pre-commit
     hook `vp config` writes was neither ignored nor tracked, and landed in
     the first `git add -A`. This was previously masked: generated repos
     had no `.git`, so the hook was never created at all. Fixed:
     `.vite-hooks/`.
  4. `pnpm build` copies `.env`'s contents into
     `dist/{project_name}/.dev.vars` (`@cloudflare/vite-plugin`'s own local-
     dev behavior) — harmless with `.env.example` defaults, a real
     credential-in-build-artifact risk the first time `.env` points at
     something real. `dist/` is gitignored so `gitleaks` never sees it, and
     `.assetsignore` only stops the file being *served*, not *shipped*.
     Fixed: `scripts/strip-dev-vars.mjs` runs as part of `build`, deleting
     any `.dev.vars` under `dist/*/` after every build.
  5. `wrangler.jsonc`'s `"REPLACE_WITH_HYPERDRIVE_ID"` placeholder reached
     the deploy config unvalidated — a deploy with it still in place
     succeeded and only failed at query time, in production. Fixed:
     `scripts/check-deploy-config.mjs` (new `predeploy` script) fails the
     build if any `REPLACE_WITH_*` placeholder survives in `wrangler.jsonc`;
     README's documented CF dashboard deploy command is now `pnpm run
     predeploy && pnpm dlx wrangler deploy --keep-vars`.
  6. Cosmetic: `.storybook/` shipped as an empty directory when
     `enable_storybook=false` (its two files were already individually
     gated, the directory name wasn't). Fixed the same way as `drizzle/`:
     `template/{% if enable_storybook %}.storybook{% endif %}/` — no
     directory at all when disabled.
