import * as dotenv from 'dotenv';
import { isPgliteEnabled, startPgliteServer } from './pglite-server';
import { runMigrations } from './pglite-migration';

/**
 * Runs once, before any test suite is executed.
 *
 * 1. Boots an in-memory PGlite instance exposed through a Postgres wire protocol server.
 * 2. Applies the real migrations so the suites find the same schema as before.
 *
 * The server handle is kept on `globalThis` so `global-teardown.ts` can shut it down.
 */
export default async function globalSetup(): Promise<void> {
    // `.env` holds the "development" defaults, `.env.test` overrides them for tests.
    dotenv.config({ path: ['./.env'] });
    dotenv.config({ path: ['./test/.env.test'], override: true });

    if (!process.env.TYPEORM_HOST || !process.env.TYPEORM_LOGGING) {
        throw new Error('The environment is not configured, run `npm run create:env` first.');
    }

    if (!isPgliteEnabled()) {
        console.log('[pglite] Skipped (PGLITE_ENABLED=false), tests will use the configured Postgres.');
        return;
    }

    const startedAt = Date.now();
    const server = await startPgliteServer();
    globalThis.pgliteTestServer = server;
    const bootedAt = Date.now();

    await runMigrations();

    console.log(
        `[pglite] Booted in ${bootedAt - startedAt} ms, migrated in ${Date.now() - bootedAt} ms (${server.connectionString})`,
    );
}
