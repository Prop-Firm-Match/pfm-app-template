import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Home from './page';
import { Providers } from './providers';

describe('Home', () => {
  // Not asserting on rendered content: some auth toggles (clerk,
  // google-oauth) legitimately render nothing until a real session/network
  // round-trip resolves, which never happens in a test environment. This
  // only confirms the whole provider/gate stack doesn't throw on mount.
  it('renders without crashing', () => {
    expect(() =>
      render(
        <Providers>
          <Home />
        </Providers>,
      ),
    ).not.toThrow();
  });
});
