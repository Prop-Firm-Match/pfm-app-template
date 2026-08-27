import { defineConfig, lazyPlugins } from 'vite-plus';
import react from '@vitejs/plugin-react';
import { cloudflare } from '@cloudflare/vite-plugin';

// Vite-flavor deploy target: Cloudflare Workers, matching apps/support-dashboard.
// @cloudflare/vite-plugin runs server/worker.ts (the tRPC API) inside `vite dev`
// itself, alongside the client — one process, no separate `wrangler dev`.
//
// Toolchain is Vite+ (https://viteplus.dev): a single `vp` CLI wrapping Vite,
// Vitest, Oxlint and Oxfmt. lint/fmt config below replaces the old standalone
// .oxlintrc.json. Type-aware lint (`typeCheck: true`) is deliberately left
// off -- its tsgolint engine currently misflags the CSS side-effect import in
// .storybook/preview.tsx (present when enable_storybook=true) that plain
// `tsc --noEmit` (the real type-check gate, see package.json) handles
// correctly. Harmless when Storybook is disabled -- there's simply no such
// import for tsgolint to misflag.
//
// fmt ignores markdown: README.md's tables get padded with `{{ project_name }}`
// substituted in at generation time, so their column widths vary by app --
// there's no single byte-for-byte oxfmt-clean version to keep in the template
// source. Code (the part `format:check` actually gates in CI) has no such
// generation-time variance and is kept fmt-clean.
export default defineConfig({
  // Pre-commit hook (wired up by `vp config`, run automatically via the
  // package.json "prepare" script): fixes staged files' lint/fmt issues
  // before they land in a commit, instead of catching them later in CI.
  staged: {
    '*': 'vp check --fix',
  },
  fmt: {
    singleQuote: true,
    ignorePatterns: ['**/*.md'],
  },
  lint: {
    categories: {
      correctness: 'error',
    },
    env: {
      browser: true,
      es2024: true,
    },
    ignorePatterns: ['node_modules', 'dist', '.wrangler'],
    jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
    rules: {
      'vite-plus/prefer-vite-plus-imports': 'error',
    },
  },
  plugins: lazyPlugins(() => [react(), cloudflare()]),
});
