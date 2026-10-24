# Automated tests: PGlite instead of a Postgres Docker container

## Summary

The automated test suites (unit + integration + e2e) no longer need Docker.
Every `npm run test` boots an **in-memory PGlite** instance (a WASM build of Postgres),
exposes it through the **Postgres wire protocol** and applies the **real migrations**
before the suites start.

TypeORM, the app bootstrap and every single test are untouched: they still connect to
`TYPEORM_HOST:TYPEORM_PORT` with the same credentials, they just talk to PGlite instead of
a container.

Measured on the current suite (29 suites, 200 tests, 21 migrations, `TZ=UTC`):

|                              | Docker Postgres 14     | PGlite (Postgres 18.6) |
| ---------------------------- | ---------------------- | ---------------------- |
| Boot the database            | container (~0.2–0.5 s warm, image pull on cold CI) | 1.7 s (WASM + initdb) |
| Apply all migrations         | 4.4–7.2 s (5.4 s avg)  | 0.26–0.29 s            |
| `npm test` (jest time)       | 19.5–22.5 s (20.8 s)   | 22.6–26.8 s (24.4 s)   |
| End to end, fresh schema     | 21.7–24.9 s (23.0 s)   | 26.6–31.0 s (28.6 s)   |
| Peak memory of the test tree | ~1.19 GB (+28 MB container) | ~1.48 GB         |
| Requires a Docker daemon     | yes                    | no                     |
| Requires Docker Hub login    | yes (CI secret)        | no                     |
| Postgres version             | 14.10                  | 18.6                   |

**Verdict:** ~24 % slower end-to-end on a machine that already has a warm container,
but it removes the Docker requirement, is ~19x faster at schema setup, and is faster on a
cold CI runner where the 397 MB `postgres:14.10` image must be pulled first.

## How it works

```
npm test
  └── jest (main process)
        ├── globalSetup  → test/pglite/global-setup.ts
        │     ├── dotenv: .env  +  test/.env.test
        │     ├── PGlite.create({ extensions: { uuid_ossp } })   ← in-memory Postgres
        │     ├── PGLiteSocketServer.listen(127.0.0.1:5429)      ← wire protocol
        │     └── runMigrations()                                ← migrations/*.ts
        └── test workers (maxWorkers: 1) → `pg` → 127.0.0.1:5429 → PGlite
              (and `globalTeardown` stops the server)
```

Files added:

| File                                   | Responsibility                                                |
| -------------------------------------- | ------------------------------------------------------------- |
| `test/pglite/pglite-server.ts`         | Boots/stops PGlite + the socket server, reads the env toggles  |
| `test/pglite/pglite-migration.ts`      | Runs `migrations/*.ts` against the fresh database              |
| `test/pglite/global-setup.ts`          | Jest `globalSetup` (env, server, migrations)                   |
| `test/pglite/global-teardown.ts`       | Jest `globalTeardown` (stops the server)                       |
| `test/pglite/pglite-contrib.d.ts`      | Ambient module for the `uuid_ossp` subpath export              |

Configuration (all optional):

| Variable                  | Default                  | Purpose                                                         |
| ------------------------- | ------------------------ | --------------------------------------------------------------- |
| `PGLITE_ENABLED`          | `true`                   | `false` → use an externally managed Postgres (old behaviour)    |
| `PGLITE_PORT`             | `TYPEORM_PORT` (5429)    | Port the socket server listens on                               |
| `PGLITE_HOST`             | `127.0.0.1`              | Bind address                                                    |
| `PGLITE_MAX_CONNECTIONS`  | `20`                     | Concurrent client connections multiplexed over the PGlite session |
| `PGLITE_DEBUG`            | `false`                  | Verbose socket/protocol logging                                 |

## Running against a real Postgres

The previous setup is still available for cases where the real PostgreSQL 14 engine matters
(engine specific syntax, release validation, reproducing a production-only problem):

```bash
npm run backing-services:test      # docker-compose -f docker-compose-test.yml up -d
npm run migration:run:local-test
npm run test:external-db           # PGLITE_ENABLED=false npm test
```

## Performance analysis

### Test suite timings

`npm test` (which includes `--detectOpenHandles` and coverage), 3 runs each, `TZ=UTC`:

| Mode   | Run | Migrations | Jest    | Total   |
| ------ | --- | ---------- | ------- | ------- |
| Docker | 1   | 4.37 s     | 19.55 s | 21.69 s |
| Docker | 2   | 7.17 s     | 22.54 s | 24.92 s |
| Docker | 3   | 4.50 s     | 20.30 s | 22.47 s |
| PGlite | 1   | 0.29 s\*   | 23.93 s | 28.31 s |
| PGlite | 2   | 0.27 s\*   | 22.57 s | 26.63 s |
| PGlite | 3   | 0.27 s\*   | 26.79 s | 30.98 s |

\* included in the jest time (it happens inside `globalSetup`), on top of ~1.7 s of WASM
boot/initdb that Docker does not pay inside the test run.

Observations:

- The **test execution itself** is ~17 % slower (20.8 s → 24.4 s). Nothing changed in the
  tests; the difference comes from the WASM engine plus the socket multiplexer that has to
  relay every protocol message.
- The **schema setup** is ~19x faster (5.4 s → 0.28 s) and it is always a *fresh* database,
  so the suites are fully isolated from whatever previous runs left behind.
- On a **cold CI runner** the Docker path additionally pays the `postgres:14.10` image pull
  (397 MB) and the `docker compose up` orchestration; the PGlite path needs only `npm i`.

### Database level micro benchmarks

Single client, `pg` over TCP on both sides, `bench.items` table, 2 runs each:

| Benchmark                                | Postgres 14 (Docker) | PGlite       | PGlite vs Docker |
| ---------------------------------------- | -------------------- | ------------ | ---------------- |
| Connect                                  | 16–29 ms             | 5.4–5.9 ms   | **3–5x faster**  |
| 200 round trips (`select 1`)             | 31–80 ms             | 39–40 ms     | ~equal           |
| 1,000 row-by-row inserts                 | 204–359 ms           | 343–348 ms   | ~1.3x slower     |
| 1,000 rows in one `INSERT`               | 6.9–7.2 ms           | 8.1–8.8 ms   | ~1.2x slower     |
| 50,000 rows `generate_series` (engine)   | 164–215 ms           | 238–243 ms   | ~1.3x slower     |
| Index creation                           | 24–26 ms             | 19–21 ms     | ~1.2x faster     |
| 1,000 indexed lookups                    | 255–367 ms           | 314 ms       | ~equal           |
| `count`/`sum` over 52k rows              | 4.7–7.3 ms           | 6.2–6.7 ms   | ~1.1x slower     |
| `UPDATE` of 50,000 rows                  | 135–220 ms           | 281–284 ms   | ~1.5x slower     |
| 4 parallel clients × 100 round trips     | 484–512 ms           | 1435–1527 ms | **~2.9x slower** |

What this means:

- **Sequential, connection-oriented workloads are close** (0–50 % slower) and connection
  setup is actually much faster because there is no container networking/authentication.
- **Concurrency is the weak spot.** PGlite is a single Postgres session and the socket
  server multiplexes every client over it, serialising the queries (~3x slower with 4
  concurrent clients). This suite is not affected much: `maxWorkers: 1` and the tests await
  their calls sequentially. A future change that fans out parallel DB work inside one suite
  would pay for it.
- Memory: the WASM instance grows the resident set by ~250–300 MB for the test tree
  (1.48 GB vs 1.19 GB peak). Acceptable for CI, worth knowing for small runners.

## Limitations and gotchas

1. **Migrations run with `transaction: 'none'`.** Most migrations execute their SQL through
   `queryRunner.connection.query(...)`, which uses a different pooled connection than the
   migration runner. The PGlite socket server only drains the queue of the connection that
   owns the open transaction, so wrapping the migrations in a transaction dead-locks
   (reproduced: the query stays queued forever). Running them without an explicit
   transaction is atomicity-loss-free for the tests, because the database is created from
   scratch on every run.
2. **Do not set a custom naming strategy on the migration DataSource.** Migrations such as
   `1628361318143-not-nullable-vocabulary-id` drop the constraint names generated by
   TypeORM's *default* naming strategy. `test/pglite/pglite-migration.ts` therefore mirrors
   `src/common/persistence/TypeormConfig.ts` exactly.
3. **Postgres 18 instead of 14.** PGlite 0.5.11 embeds PostgreSQL 18.6, while the Docker
   container and (most likely) production run 14. The suites pass on both, but the engine
   version is a real difference: new syntax/behaviour can slip through. Recommendation: keep
   a scheduled (nightly) CI job, or a pre-release job, that runs `npm run test:external-db`
   against `postgres:14.10`.
4. **`uuid-ossp` must be enabled explicitly** (`extensions: { uuid_ossp }`), otherwise the
   `User` table migration fails.
5. **Port collisions.** PGlite binds `TYPEORM_PORT` (5429). If the optional test container is
   already running there, `globalSetup` throws an actionable error; set `PGLITE_PORT` or stop
   the container.
6. **No `LISTEN`/`NOTIFY`, custom extensions or superuser-ish features.** Not used by this
   codebase today.
7. `.env` must exist (`npm run create:env`); `globalSetup` verifies it and fails with a clear
   message.

## Unrelated finding

While benchmarking, three tests in `test/e2e/leitner-systems-controller-entry.ts`
("moving from Box 1 to Box 2/3/4") fail with **both** PGlite and Docker Postgres when the
machine runs in `Europe/Dublin` around the DST switch (25 October 2026). `makeItNewer(...,
DAYS, n)` adds *calendar* days, so across a DST boundary the difference is 25 h and
`floor(-25/24) = -2`. This is a pre-existing, environment-dependent flake (CI runs in UTC,
which is why it is normally invisible) and it is **not** related to this change.
