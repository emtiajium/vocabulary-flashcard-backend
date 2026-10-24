/**
 * Stops the PGlite server started by `global-setup.ts` and releases the WASM database.
 */
export default async function globalTeardown(): Promise<void> {
    const server = globalThis.pgliteTestServer;

    if (!server) {
        return;
    }

    await server.stop();
    globalThis.pgliteTestServer = undefined;

    console.log('[pglite] Stopped');
}
