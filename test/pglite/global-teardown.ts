export default async function globalTeardown(): Promise<void> {
    const server = globalThis.pgliteTestServer;

    if (!server) {
        return;
    }

    await server.stop();
    globalThis.pgliteTestServer = undefined;

    console.log('[pglite] Stopped');
}
