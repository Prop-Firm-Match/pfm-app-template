---
name: pfm-app-template
description: Generate a new internal Prop Firm Match app/tool/dashboard from the pfm-app-template copier template, pull a template update (design tokens, shared components, scaffold changes) into an app that was already generated from it, or migrate an existing ad-hoc internal app onto this template's stack, design-system, CI, and deploy conventions. Use this whenever someone asks to create, scaffold, spin up, or build a new internal PFM tool/dashboard/app — even if they don't name "pfm-app-template" or "copier" explicitly, since this is the team's standard way to start one. Also use when someone asks to update, sync, or refresh an existing app's design/branding/scaffold "from the template"; and when someone asks to bring an existing/legacy internal tool onto the template, rebrand it, or migrate it to "our standard stack."
---

# pfm-app-template

This skill wraps three workflows against the `pfm-app-template` copier
template: generating a new app, updating an existing generated app, and
migrating an existing app onto the template. Full technical reference
lives in this plugin's own repo —
`${CLAUDE_PLUGIN_ROOT}/MAINTAINING.md` (complete answers/toggle
reference, troubleshooting) and `${CLAUDE_PLUGIN_ROOT}/CLAUDE.md`
(maintainer rules) — consult those for anything not covered here.
`${CLAUDE_PLUGIN_ROOT}` only resolves inside a Claude Code plugin install;
if this skill was installed some other way (e.g. via `npx skills` into a
different agent) and that variable is literally empty/unresolved, use
`https://github.com/Prop-Firm-Match/pfm-app-template` instead — clone it or
fetch the two files directly.

## Before either workflow

Works the same on macOS and Windows — none of the commands below are
platform-specific, but don't assume any of these are already installed;
check and install whichever is missing rather than asking the user to do it
themselves first, since most requesters (especially non-devs) won't have
this set up:

- **`copier`**: `copier --version`. If missing, install via `pipx` (see
  below) with `pipx install copier`.
- **`pipx`** (only needed if the `copier` check above failed): `pipx
  --version`. If missing, bootstrap it through Python's own package
  manager rather than an OS-specific one (works identically on macOS and
  Windows): find a working Python first — try `python3 --version`, then
  `python --version` (Windows commonly only has `python`, no `python3`) —
  then run `<that-python> -m pip install --user pipx` followed by
  `<that-python> -m pipx ensurepath`. If neither `python3` nor `python`
  resolves at all, Python itself is missing — tell the user, don't attempt
  to install a whole Python runtime yourself.
- **`node`**: `node --version`. Needed for `pnpm` and the verify-before-push
  step below (generated apps pin `engines.node: ^24` in `package.json`, but
  any reasonably current Node works for install/build — only install a
  fresh one if `node` is missing entirely).
- **`pnpm`**: `pnpm --version`. If missing, `corepack enable` then
  `corepack prepare pnpm@latest --activate` (ships with Node ≥16.9, same
  two commands on both OSes); fall back to `npm install -g pnpm` if
  `corepack` isn't available.
- **`gh`**: `gh auth status`. If not authenticated, run `gh auth login`
  interactively rather than proceeding — don't attempt to clone/push
  without confirmed auth. Prefer `gh`-mediated HTTPS over raw SSH remotes
  for every git operation in this skill (see below) — SSH key setup is a
  common missing prerequisite, especially on a non-dev's Windows machine,
  and `gh auth login` handles credential setup for both clone and push
  without one.

None of this is optional tooling to skip past — a requester blocked on a
missing CLI is the single most common reason this skill stalls out before
doing anything useful.

## Workflow 1: generate a new app

1. Get a `project_name` (kebab-case, e.g. `loyalty-ops`). If the user gave a
   descriptive name with spaces/caps, convert it yourself rather than
   asking them to reformat it.
2. Get an `owner` email — the human accountable for this app, not a bot/
   service account. Ask directly if it's not obvious from context (default
   to the requester's own email if they're clearly the one who'll maintain
   it, but confirm rather than assume for someone else). Required — copier
   has no default for this question, so it must be collected before step 4.
3. Infer the two main answers from what the user describes, and only ask
   if genuinely ambiguous (every generated app is Vite + React on
   Cloudflare Workers — there's no framework choice to make):
   - `data_source`: `postgres` (owns its own database), `bigquery`,
     `google-sheets`, or `external-api-only` (default — just calls an
     existing internal API/service, no owned datastore).
   - `auth`: `cloudflare-access` (default — simplest, zero login code,
     right for internal-only tools), `clerk`, `google-oauth`, or `none`
     (no sign-in at all — see below).
   If the user doesn't specify and nothing in their description implies
   otherwise, use the two defaults above — don't interrogate them with
   both questions when the defaults clearly fit an "internal tool" request.

   **`auth: none` is never an inferred default, only an explicit choice.**
   Even if a request sounds public ("anyone in the company can see this",
   "no login needed"), confirm out loud before generating — say plainly
   that this means *no identity check anywhere, in dev and in production,
   forever until someone regenerates with a real auth answer* — anyone who
   gets the URL has full access, not just "no login screen." Only proceed
   with `none` after that's been said and the user still wants it; if
   they're unsure, `cloudflare-access` is the safer default that still
   needs zero app code.
4. Ask if a destination repo already exists (e.g. `Prop-Firm-Match/<project_name>`
   on GitHub, created by a dev on request — the common case for a non-dev
   requester who doesn't have repo-creation rights). Two paths:
   - **Repo already exists**: `gh repo clone Prop-Firm-Match/<project_name>
     ./<project_name>` (HTTPS via `gh`'s own auth, not a raw SSH `git
     clone` — see "Before either workflow" above) — this is where
     generation happens, and it's already wired to the real `origin`, so
     later steps can push straight to it.
   - **No repo yet** (a dev spinning this up themselves): confirm the
     destination path with the user if it's not obvious (default: a new
     directory named `project_name` in the current working directory). No
     clone — generation happens in a plain local directory and pushing
     anywhere is the dev's own call, not this skill's.
5. Run:
   ```sh
   copier copy https://github.com/Prop-Firm-Match/pfm-app-template.git ./<project_name> \
     --vcs-ref=HEAD \
     --data project_name=<project_name> \
     --data owner=<owner> \
     --data data_source=<data_source> \
     --data auth=<auth> \
     --data enable_i18n=false \
     --data enable_testing=true \
     --data enable_file_storage=false \
     --data enable_storybook=false \
     --defaults
   ```
   Adjust `enable_i18n`/`enable_file_storage` to `true` only if the user
   asked for internationalization or file uploads. Adjust
   `enable_storybook` to `true` only if they asked for Storybook or a
   component workshop/preview for the design-system pieces — it's dev
   tooling weight most apps don't need, so leave it off unless requested.
6. `git init -b main` if step 4 didn't already clone a repo (skip this if it
   did — the clone already has a `main` branch and an `origin`). Then
   `git add -A` and commit ("Initial generation from pfm-app-template").
7. **Verify before pushing anything** — this app may go straight to a repo
   the requester can't otherwise debug, so catch problems now, not after
   handoff: `pnpm install`, then `pnpm run lint`, `format:check`,
   `type-check`, `test`, `build`. Fix anything that fails; don't push a
   generation that doesn't pass its own checks.
8. If step 4 cloned an existing repo, push: `git push origin main`. It's the
   requester's own repo, so pushing straight to `main` is fine — no PR/review
   gate needed for an initial generation.
9. Tell the user: the toggle choices made, that deploy setup is
   engineering's job (Cloudflare Workers Builds, not this skill) — point at
   the generated app's own `README.md` (Secrets section) and `CLAUDE.md` for
   exactly what a dev will need to set up (which vars/secrets, in the CF
   dashboard) — and that they don't need to do anything else themselves.
   Don't attempt to configure Cloudflare yourself.

## Workflow 2: update an existing generated app

1. `cd` into the target repo. Run `git status` — if it's not clean, stop
   and ask the user to commit or stash first. Copier refuses to update a
   dirty tree, and this check exists so you never silently discard
   someone's uncommitted work.
2. Check `.copier-answers.yml` exists at the repo root. If it's missing,
   this repo wasn't generated from this template (or the file was
   deleted) — don't proceed, tell the user.
3. Run:
   ```sh
   copier update --vcs-ref=HEAD --defaults
   ```
4. Run `git diff` and show the user what changed before doing anything
   else. This diff is the entire point of using copier instead of a
   one-shot generator — never skip straight to committing.
5. Only commit after the user has seen the diff and is fine with it.

### If `copier update` fails

Read `${CLAUDE_PLUGIN_ROOT}/MAINTAINING.md`'s Troubleshooting section
— it covers the specific failure modes already hit in practice (stale
`_src_path`, a squashed/rewritten template history orphaning `_commit`,
missing answers file). Don't guess at a fix; that section has the exact
error strings to match against.

## Workflow 3: migrate an existing app onto the template

This is a full migration onto the template's stack, not a mechanical
copier operation — treat it as supervised engineering work. Read the real
code, form a plan, and check in with the user at the decision points
below rather than pushing straight through on assumptions the way
Workflows 1/2 can.

1. **Understand the existing app before touching anything:**
   - Its current stack (read `package.json`, entry points, framework). If
     it's not already Vite + React, moving it onto this template means a
     real framework migration (e.g. off Next.js/Remix/CRA), not just a
     restyle — say so explicitly, it's a bigger lift than the other steps.
   - What it actually does — the main user-facing flows, well enough to
     know what "still works" means after migrating.
   - Its data layer: does it own a database (which kind?), or call an
     API? Read the actual queries/schema, not just the connection config.
   - Its auth mechanism, if any.
   - Where and how it currently deploys.
   Report this back to the user before proposing a plan — confirm your
   read of the app is right before betting a migration plan on it.
2. **Map the existing app onto copier answers** based on what you found —
   `data_source`/`auth` should match what the app needs, using the same
   reasoning as Workflow 1 step 2 (matched to the app's real requirements,
   not just its current implementation choices, since the goal is landing
   on this template's supported shape, not preserving incidental old-stack
   decisions).
3. **Generate a fresh scaffold** via Workflow 1's `copier copy` command
   into a **new directory**, never in place over the existing repo —
   `copier update` only works on a repo whose `.copier-answers.yml` says
   it came from this template, which an arbitrary existing app never
   will. Confirm the destination and what happens to the old repo
   (archived? replaced? kept alongside during a transition period?) with
   the user before generating.
4. **Port the app over, piece by piece, not as a bulk file copy:**
   - Business logic, routes, and data-access code move into the new
     structure's `lib/`, adapted to the new conventions (e.g. a real
     Drizzle `schema.ts` capturing the existing tables) — preserve the
     actual behavior, don't rewrite logic gratuitously while moving it.
   - Rebuild the UI using the vendored `src/components/ui/` components
     (`Button`, `Card`) instead of whatever styling the old app had —
     this is an explicit rebrand onto the PFM design system, not a
     lift-and-shift of the old look.
   - Auth gets swapped to whichever `auth` toggle was picked in step 2.
     If the old app has its own login flow, replacing it is a real,
     user-visible change — flag it explicitly, don't silently drop it.
5. **Deploy setup**: the new scaffold already has `wrangler.jsonc`, the
   `{project_name}.propfirmmatch.solutions` route, and `ci.yml` (lint/test/
   build/secret-scan) baked in — verify it's correct for this app, but
   connecting the repo in the Cloudflare dashboard (Workers Builds) is
   still engineering's job, same as Workflow 1. Bringing an app "onto the
   template" includes bringing it onto this CI/deploy pipeline, not just
   the code shape — a manual/ad-hoc deploy process the old app used isn't
   carried forward. If the old app deployed somewhere else, decommissioning
   that is a real cutover — confirm with the user, don't do it
   unilaterally.
6. **Verify parity before calling it done**: run the new app's own CI
   (lint/type-check/test) and, where practical, exercise the main flows
   identified in step 1 to confirm nothing regressed. "It renders" is not
   the same bar as "it still does what the old app did."
7. Check in with the user at each major fork above (the answers mapping,
   any auth-flow replacement, the deploy cutover, what happens to the old
   repo) — this workflow has too much judgment in it to run unsupervised
   end to end.

## Rules

- Never hand-edit `.copier-answers.yml`, except `_src_path` (if it needs to
  point somewhere else) or `_commit` (if the template's history was
  squashed/rewritten and `copier update` can't find the recorded commit
  anymore) — both are copier's own bookkeeping, not rendered answers; see
  `MAINTAINING.md`'s Troubleshooting section for when each comes up.
- Never invent a `--vcs-ref` other than `HEAD` unless the user asks for a
  specific tag/branch/commit — `HEAD` is what the published template
  expects right now (no release tags exist yet).
- Deploy is out of scope for this skill. If asked to deploy, point at the
  generated app's `README.md` (Cloudflare Workers Builds instructions) and
  suggest looping in engineering.
