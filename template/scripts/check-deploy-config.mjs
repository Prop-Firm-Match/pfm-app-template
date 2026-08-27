// wrangler.jsonc ships REPLACE_WITH_* placeholders for values that must be
// filled in with something real before the first deploy (currently just
// the Hyperdrive id -- see README's Deploy section). Left in place, a
// deploy still succeeds at build time and only fails at query time in
// production. Run this before `wrangler deploy` so it fails the build
// instead.
import { readFileSync } from 'node:fs';

const config = readFileSync('wrangler.jsonc', 'utf8');
const placeholder = /REPLACE_WITH_\w+/.exec(config);

if (placeholder) {
  console.error(
    `wrangler.jsonc still has the placeholder "${placeholder[0]}" -- replace it with the real value before deploying (see README.md's Deploy section).`,
  );
  process.exit(1);
}
