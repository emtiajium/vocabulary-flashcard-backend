import { PGlite } from '@electric-sql/pglite';
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';

declare global {
    var pgliteTestServer: PgliteTestServer | undefined;
}

export interface PgliteTestServer {
    host: string;
    port: number;
    db: PGlite;
    server: PGLiteSocketServer;
    connectionString: string;
    stop: () => Promise<void>;
}

const DEFAULT_PGLITE_PORT = 5429;

const DEFAULT_PGLITE_MAX_CONNECTIONS = 20;

/**
 * PGlite plays the role of the Postgres Docker container the automated tests used to need.
 * The suites connect to it over the Postgres wire protocol (`PGLiteSocketServer`), therefore
 * neither TypeORM nor any test had to be changed to switch between both.
 *
 * Set `PGLITE_ENABLED=false` to fall back to an externally managed Postgres instance
 * (the very same behaviour the test suites had before this integration).
 */
export function isPgliteEnabled(): boolean {
    return (process.env.PGLITE_ENABLED ?? 'true').toLowerCase() !== 'false';
}

export function getPglitePort(): number {
    return Number(process.env.PGLITE_PORT ?? process.env.TYPEORM_PORT) || DEFAULT_PGLITE_PORT;
}

export async function startPgliteServer(): Promise<PgliteTestServer> {
    const host = process.env.PGLITE_HOST ?? '127.0.0.1';
    const port = getPglitePort();

    // `uuid-ossp` ships with PGlite, but it is not enabled by default
    // while one of the migrations (creating the `User` table) requires it.
    const db = await PGlite.create({ extensions: { uuid_ossp } });

    const server = new PGLiteSocketServer({
        db,
        host,
        port,
        maxConnections: Number(process.env.PGLITE_MAX_CONNECTIONS) || DEFAULT_PGLITE_MAX_CONNECTIONS,
        debug: process.env.PGLITE_DEBUG === 'true',
    });

    try {
        await server.start();
    } catch (error) {
        await db.close();
        throw new Error(
            `PGlite cannot listen on ${host}:${port} (${(error as Error).message}). ` +
                'Is the Docker test database (or another process) already using that port? ' +
                'Set PGLITE_PORT to a free port, or run the suites against it with PGLITE_ENABLED=false.',
        );
    }

    return {
        host,
        port,
        db,
        server,
        connectionString: `postgres://${process.env.TYPEORM_USERNAME ?? 'postgres'}:${
            process.env.TYPEORM_PASSWORD ?? '123'
        }@${host}:${port}/${process.env.TYPEORM_DATABASE ?? 'ielts-gibberish'}`,
        stop: async (): Promise<void> => {
            await server.stop();
            await db.close();
        },
    };
}
