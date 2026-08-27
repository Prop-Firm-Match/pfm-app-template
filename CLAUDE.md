# pfm-app-template — agent instructions

This repo is a **copier template** distributed as a Claude Code plugin, not
an app. Read `MAINTAINING.md` fully before making any change or running
any raw `copier` command here — it has the complete reference (answers,
toggle table, update workflow, troubleshooting). This file is just the
load-bearing rules, so you don't skip them by accident.

## Non-negotiable rules

1. **Never hand-edit `.copier-answers.yml`** in any repo generated from this
   template, except `_src_path` and `_commit` specifically (copier
   bookkeeping, not rendered answers — `_commit` only needs touching if this
   template's history was squashed/rewritten, orphaning the recorded commit;
   see `MAINTAINING.md`'s Troubleshooting section).
2. **A conditional path (`{% if %}name{% endif %}`) must stay within one
   path segment** — it cannot span a `/`. Breaking this silently produces a
   Jinja parse error or, worse, a literal `{%...%}`-named file in generated
   output. See `MAINTAINING.md` §4 if you need to add a new conditional
   file.
3. **The answers file is not automatic.** `template/{{ _copier_conf.answers_file }}.jinja`
   must exist or `copier update` has nothing to read.
4. **Before committing any change under `template/` or `copier.yml`, run:**
   ```sh
   bash scripts/test-matrix.sh
   ```
   It generates every toggle combination and fails loudly on render errors
   or leftover unrendered `{% %}`/`{{ }}` filenames. Do not skip this even
   for a one-line change — the path-conditional rule above is easy to
   violate without noticing.
5. **`main` is the published ref.** No release tags exist yet, so
   `--vcs-ref=HEAD` (used throughout `MAINTAINING.md`) resolves to
   latest `main`. Small fixes can go straight to `main`; anything that
   changes generated output (new/changed files under `template/`, new
   `copier.yml` questions) should go through a branch so it's reviewable
   before every downstream app's next `copier update` picks it up.
6. If you add/remove/rename a question in `copier.yml`, update
   `scripts/test-matrix.sh`'s answer axes in the same change.
7. **Every commit to `main` bumps `.claude-plugin/plugin.json`'s `version`**
   (patch bump for a normal fix/change). Do this in the same commit as the
   change, not a separate follow-up.

## Quick orientation

- `copier.yml` — the questions (`project_name`, `data_source`, `auth`,
  `enable_i18n`, `enable_testing`, `enable_file_storage`,
  `enable_storybook`). Every generated app is Vite + React on Cloudflare
  Workers — there is no framework choice.
- `template/` — everything a generated app receives. Nothing outside this
  dir (except `copier.yml`) reaches generated apps.
- `template/src/components/ui/`, `template/src/lib/utils.ts`,
  `template/src/styles/globals.css` — vendored Prop Firm Match brand
  tokens + trimmed Radix/cva components, sourced from propfirm's
  `packages/tailwind` + `packages/ui`. Edits here are what a generated
  app's next `copier update` will pick up.
- `scripts/test-matrix.sh` — the render-correctness check (rule 4 above).

Everything else — full answers reference, toggle→file table, update
workflow, troubleshooting for specific error messages — is in
`MAINTAINING.md`. Don't duplicate it here; keep this file short so it
stays useful.
