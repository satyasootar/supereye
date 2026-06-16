import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { verifyCronSecret } from '../api-auth.ts';

describe('security api-auth', () => {
  it('allows cron without secret in non-production', () => {
    const originalSecret = process.env.CRON_SECRET;
    const originalNodeEnv = process.env.NODE_ENV;
    delete process.env.CRON_SECRET;
    process.env.NODE_ENV = 'development';

    assert.equal(verifyCronSecret(new Request('http://localhost')), true);

    if (originalSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalSecret;
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('requires bearer token when secret is set', () => {
    const originalSecret = process.env.CRON_SECRET;
    process.env.CRON_SECRET = 'cron-test-secret';

    const bad = new Request('http://localhost/api/cron/process');
    const good = new Request('http://localhost/api/cron/process', {
      headers: { authorization: 'Bearer cron-test-secret' },
    });
    assert.equal(verifyCronSecret(bad), false);
    assert.equal(verifyCronSecret(good), true);

    if (originalSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalSecret;
  });
});
