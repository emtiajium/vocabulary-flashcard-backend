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

const defaultMaxConnections = 20;

const loopbackHosts = ['localhost', '::1', '[::1]'];

export async function startPgliteServer(): Promise<PgliteTestServer> {
    const host = process.env.TYPEORM_HOST;
    const port = Number(process.env.TYPEORM_PORT);
    const database = process.env.TYPEORM_DATABASE;

    if (!isLocalHost(host)) {
        throw new Error(
            `PGlite can only serve a local database but TYPEORM_HOST="${host}". ` +
                'Point TYPEORM_HOST to localhost or 127.0.0.1.',
        );
    }

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
            await new Promise((resolve) => setTimeout(resolve, 0));
            await db.close();
        },
    };
}

function isLocalHost(host: string): boolean {
    return loopbackHosts.includes(host) || host.startsWith('127.');
}

export function describeEndpoint(host: string, port: number, database: string): string {
    return `${host}:${port}/${database}`;
}
