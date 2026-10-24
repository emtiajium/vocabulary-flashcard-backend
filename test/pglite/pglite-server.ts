import { PGlite } from '@electric-sql/pglite';
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';

declare global {
    var pgliteTestServer: PgliteTestServer | undefined;
}

export interface PgliteTestServer {
    host: string;
    port: number;
    database: string;
    db: PGlite;
    server: PGLiteSocketServer;
    stop: () => Promise<void>;
}

// `TYPEORM_HOST`/`TYPEORM_PORT` are the single source of truth for the connection
// details: TypeORM keeps reading them, this server just listens on the very same address.
// The fallbacks only cover a completely missing `.env`, which `global-setup.ts` rejects.
const FALLBACK_HOST = '127.0.0.1';

const FALLBACK_PORT = 5429;

const DEFAULT_MAX_CONNECTIONS = 20;

const LOOPBACK_HOSTS = ['localhost', '::1', '[::1]'];

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

export function getDatabaseHost(): string {
    return process.env.TYPEORM_HOST ?? FALLBACK_HOST;
}

export function getDatabasePort(): number {
    return Number(process.env.TYPEORM_PORT) || FALLBACK_PORT;
}

export function getDatabaseName(): string {
    return process.env.TYPEORM_DATABASE ?? 'ielts-gibberish';
}

function isLocalHost(host: string): boolean {
    return LOOPBACK_HOSTS.includes(host) || host.startsWith('127.');
}

export async function startPgliteServer(): Promise<PgliteTestServer> {
    const host = getDatabaseHost();
    const port = getDatabasePort();
    const database = getDatabaseName();

    if (!isLocalHost(host)) {
        throw new Error(
            `PGlite can only replace a local database but TYPEORM_HOST="${host}". ` +
                'Either point TYPEORM_HOST to localhost/127.0.0.1, or run the suites against the real ' +
                'PostgreSQL with PGLITE_ENABLED=false.',
        );
    }

    // `uuid-ossp` ships with PGlite, but it is not enabled by default
    // while the migration creating the `User` table requires it.
    const db = await PGlite.create({ extensions: { uuid_ossp } });

    const server = new PGLiteSocketServer({
        db,
        host,
        port,
        maxConnections: Number(process.env.PGLITE_MAX_CONNECTIONS) || DEFAULT_MAX_CONNECTIONS,
        debug: process.env.PGLITE_DEBUG === 'true',
    });

    try {
        await server.start();
    } catch (error) {
        await db.close();
        throw new Error(
            `PGlite cannot listen on ${describeEndpoint(host, port, database)} (${(error as Error).message}). ` +
                'Is the Docker test database (or another process) already using that port? ' +
                'Change TYPEORM_PORT, or run the suites against it with PGLITE_ENABLED=false.',
        );
    }

    return {
        host,
        port,
        database,
        db,
        server,
        stop: async (): Promise<void> => {
            await server.stop();
            await db.close();
        },
    };
}

/**
 * Never render credentials: the endpoint is only meant for logs and error messages.
 */
export function describeEndpoint(host: string, port: number, database: string): string {
    return `${host}:${port}/${database}`;
}
