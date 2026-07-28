# pfm-app-template

A Claude Code plugin that generates and updates internal Prop Firm Match
apps from a shared, on-brand template — already wired with the right
tech, ready for engineering to deploy.

## Install

```
/plugin marketplace add Prop-Firm-Match/pfm-app-template
/plugin install pfm-app-template
```

## Use it

Every generated app is a Vite + React SPA on Cloudflare Workers (see
[Known gaps](MAINTAINING.md#known-gaps) if you need SSR/SEO — that's not
what this template is for). Just ask Claude Code, in plain language.
Naming a stack explicitly:

> Make me a new app from pfm-app-template called loyalty-ops-tool. It's a
> simple internal dashboard, connects to our existing internal API, gated
> by Cloudflare Access.

Or without naming any toggles — Claude infers sensible defaults and only
asks when something's genuinely ambiguous:

> Spin up a small internal tool for tracking refund requests, reads/writes
> our postgres db directly. Call it refund-tracker.

**Not a developer?** Ask engineering to create an empty
`Prop-Firm-Match/<your-app-name>` repo for you first. Once it exists, this
skill generates directly into it, verifies the app actually builds, and
pushes straight to `main` — it's your repo, so there's no PR to wait on.
Engineering picks it up from there for Cloudflare setup and deploy; your
README/CLAUDE.md tell them exactly what's needed.

If you want to pick things yourself:

| Question | Options | What to pick |
|---|---|---|
| Data source | `postgres`, `bigquery`, `google-sheets`, `external-api-only` | Wherever the data already lives. If it just calls an existing internal API, use `external-api-only`. |
| Login | `clerk`, `google-oauth`, `cloudflare-access` | `cloudflare-access` is simplest — no login code, access controlled in Cloudflare directly. |

Not sure? `external-api-only` + `cloudflare-access` is a safe default.
Deploy setup is handled by engineering either way.

To pull a template update (design tokens, shared components, scaffold
changes) into an app you already generated:

> Update the design in this repo from pfm-app-template.

Claude always shows the diff before committing anything — nothing gets
applied silently.

To bring an existing ad-hoc internal app onto the template — stack,
design-system, CI, and deploy conventions:

> Migrate this repo onto pfm-app-template.

This one is real engineering work, not a mechanical copier operation —
Claude reads the existing app first, proposes a plan, and checks in with
you at each major decision (stack mapping, auth-flow changes, what
happens to the old repo) rather than pushing straight through.

## Docs

- [`MAINTAINING.md`](MAINTAINING.md) — for engineers maintaining this
  template itself: raw `copier` commands, the full answers/toggle
  reference, template-authoring rules, troubleshooting, known gaps.
- [`CLAUDE.md`](CLAUDE.md) — agent rules for whoever edits this repo.
- [`skills/pfm-app-template/SKILL.md`](skills/pfm-app-template/SKILL.md) —
  the skill implementation itself.

## Repo

`https://github.com/Prop-Firm-Match/pfm-app-template.git`
