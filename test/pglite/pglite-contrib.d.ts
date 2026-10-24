/**
 * PGlite exposes its bundled extensions through subpath exports which the
 * project's `module`/`moduleResolution` (commonjs/node) combination cannot resolve.
 * Declaring the subpath keeps the type-safety while the runtime resolution is
 * handled by Node's package exports.
 */
declare module '@electric-sql/pglite/contrib/uuid_ossp' {
    import type { Extension } from '@electric-sql/pglite';

    export const uuid_ossp: Extension;
}
