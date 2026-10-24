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
const fallbackHost = '127.0.0.1';

const fallbackPort = 5429;

const defaultMaxConnections = 20;

const loopbackHosts = ['localhost', '::1', '[::1]'];

/**
 * PGlite is the only database the automated tests run against: it boots an in-memory
 * PostgreSQL (WASM) and serves it over the Postgres wire protocol, so neither TypeORM nor
 * any test had to be changed.
 */
export async function startPgliteServer(): Promise<PgliteTestServer> {
    const host = process.env.TYPEORM_HOST ?? fallbackHost;
    const port = Number(process.env.TYPEORM_PORT) || fallbackPort;
    const database = process.env.TYPEORM_DATABASE ?? 'ielts-gibberish';

    if (!isLocalHost(host)) {
        throw new Error(
            `PGlite can only serve a local database but TYPEORM_HOST="${host}". ` +
                'Point TYPEORM_HOST to localhost or 127.0.0.1.',
        );
    }

    // `uuid-ossp` ships with PGlite, but it is not enabled by default
    // while the migration creating the `User` table requires it.
    const db = await PGlite.create({ extensions: { uuid_ossp } });

    const server = new PGLiteSocketServer({
        db,
        host,
        port,
        maxConnections: Number(process.env.PGLITE_MAX_CONNECTIONS) || defaultMaxConnections,
        debug: process.env.PGLITE_DEBUG === 'true',
    });

    try {
        await server.start();
    } catch (error) {
        await db.close();
        throw new Error(
            `PGlite cannot listen on ${describeEndpoint(host, port, database)} (${(error as Error).message}). ` +
                'Another process is already using TYPEORM_PORT, change it (and TYPEORM_HOST accordingly) ' +
                'or stop that process.',
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

function isLocalHost(host: string): boolean {
    return loopbackHosts.includes(host) || host.startsWith('127.');
}

/**
 * Never render credentials: the endpoint is only meant for logs and error messages.
 */
export function describeEndpoint(host: string, port: number, database: string): string {
    return `${host}:${port}/${database}`;
}
