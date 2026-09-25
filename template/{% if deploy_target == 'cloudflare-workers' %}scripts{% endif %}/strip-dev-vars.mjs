// @cloudflare/vite-plugin copies .env into dist/<worker>/.dev.vars as part
// of its local-dev tooling -- harmless while .env only holds the
// .env.example placeholders, but a real credential-in-build-artifact risk
// the moment .env points at something real. Deploy-time secrets always
// come from the Cloudflare dashboard (see README "Secrets"), so this file
// is never needed in a shipped build -- strip it after every build rather
// than relying on .assetsignore, which only stops it being *served*, not
// *shipped*.
import { readdirSync, rmSync } from 'node:fs';

for (const entry of readdirSync('dist', { withFileTypes: true })) {
  if (entry.isDirectory()) {
    rmSync(`dist/${entry.name}/.dev.vars`, { force: true });
  }
}
