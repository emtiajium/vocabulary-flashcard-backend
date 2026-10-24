# Automated tests on PGlite (no Docker)

## Summary

The automated test suites (unit + integration + e2e) no longer need Docker, nor any database
service: every `npm run test` boots an **in-memory PGlite** instance (a WASM build of
PostgreSQL), exposes it through the **Postgres wire protocol** and applies the **real
migrations** from `migrations/`.

TypeORM, the app bootstrap and every single test are untouched: they still connect to
`TYPEORM_HOST:TYPEORM_PORT` with the same credentials, they just talk to PGlite instead of a
container. There is no other database mode in the test path.

> **PGlite is PostgreSQL, but not _your_ PostgreSQL.**
> PGlite 0.5.11 embeds PostgreSQL 18.6 while the Docker image (and production) run 14.10.
> A green run proves the application works against PGlite; it does not prove it works against
> PostgreSQL 14. This trade-off is accepted deliberately (see
> [PostgreSQL 14 coverage](#postgresql-14-coverage)) — validate engine-specific changes
> out of band.

## How it works

```
npm test
  └── jest (main process)
        ├── globalSetup  → test/pglite/global-setup.ts
        │     ├── dotenv: .env  +  test/.env.test
        │     ├── PGlite.create({ extensions: { uuid_ossp } })            ← in-memory PostgreSQL
        │     ├── PGLiteSocketServer.listen(TYPEORM_HOST, TYPEORM_PORT)   ← wire protocol
        │     └── runMigrations()                                         ← migrations/*.ts
        └── test workers (maxWorkers: 1) → `pg` → same host:port → PGlite
              (and `globalTeardown` stops the server)
```

Files:

| File                              | Responsibility                                                      |
| --------------------------------- | ------------------------------------------------------------------- |
| `test/pglite/pglite-server.ts`    | Boots/stops PGlite + the socket server, validates the configuration |
| `test/pglite/pglite-migration.ts` | Runs `migrations/*.ts` on the fresh database                        |
| `test/pglite/global-setup.ts`     | Jest `globalSetup` (env, server, migrations)                        |
| `test/pglite/global-teardown.ts`  | Jest `globalTeardown` (stops the server)                            |
| `test/pglite/pglite-contrib.d.ts` | Ambient module for the `uuid_ossp` subpath export                   |

### Configuration

`TYPEORM_HOST` / `TYPEORM_PORT` / `TYPEORM_DATABASE` are the **single source of truth**.
The socket server listens on exactly the address TypeORM is configured to connect to, so
there is no way to make the two disagree. `.env` provides the defaults, `.env.test` pins
`TYPEORM_PORT=5429` for the tests.

| Variable                 | Default | Purpose                                                |
| ------------------------ | ------- | ------------------------------------------------------ |
| `PGLITE_MAX_CONNECTIONS` | `20`    | Client connections multiplexed over the PGlite session |
| `PGLITE_DEBUG`           | `false` | Verbose socket/protocol logging                        |

`globalSetup` fails fast, with an actionable message, when:

- `.env` is missing (`npm run create:env`);
- `TYPEORM_HOST` is not a loopback address (PGlite can only serve a local database);
- the port is already taken (e.g. a locally running PostgreSQL on 5429).

Credentials are never logged: only `host:port/database` appears in the output.

`docker-compose.yml` is still the local **development** stack (PostgreSQL 14 on 5431 for
`npm run start:dev` / `npm run migration:run`). It plays no part in the tests, and the test
database service it used to define (port 5429) was removed so it cannot collide with PGlite.

## CI

```
push / pull request
  ├── static-checks          prettier, eslint, production-only build
  └── tests                  npm run test (PGlite, no Docker, no service container)
                                   ↓
                        both green → tag / release
```

Branch protection must list `static-checks` and `tests` as required status checks (the
pre-PR check was the `build (22.23.4)` matrix job, which no longer exists).

Cost note: the two jobs each install the dependencies. If that is too expensive, the
`tests` job can be merged into `static-checks` — there is no longer any parallelism benefit
worth a second `npm ci`.

## Performance

### Methodology

One wall-clock span per iteration, covering **"fresh schema → all tests finished"**:

- **PostgreSQL 14 in Docker** (the previous setup): `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` → `npm run migration:run:local-test` → `npm test`
- **PGlite** (current): `npm test` (the boot + the migrations happen inside `globalSetup`)

Environment: Linux, Node 24.22.1 (project targets 22.23.4 via `.nvmrc`), Docker 29.1.3,
`postgres:14.10` container with a `tmpfs` data directory, `TZ=UTC`, `n = 6` per mode,
identical jest command (`--detectOpenHandles`, coverage on) and `maxWorkers: 1`.

### Test suite

| Metric                           | PostgreSQL 14 (Docker, before)                             | PGlite (now)                |
| -------------------------------- | ---------------------------------------------------------- | --------------------------- |
| Full flow, median                | 28.0 s                                                     | **28.4 s**                  |
| Full flow, mean                  | 29.4 s                                                     | 29.3 s                      |
| Full flow, min–max               | 26.3 – 36.4 s                                              | **27.7 – 33.6 s**           |
| Jest execution only, median      | 20.6 s                                                     | 23.8 s                      |
| Database boot                    | container start (~0.2–0.5 s warm, 397 MB image on cold CI) | 1.7 – 2.0 s (WASM + initdb) |
| Schema setup (all 21 migrations) | 4.4 – 7.2 s                                                | **0.26 – 0.50 s**           |
| Peak memory of the test tree     | ~1.19 GB (+28 MB container)                                | ~1.48 GB                    |

Reading of these numbers:

- **Test execution is ~15 % slower with PGlite** (20.6 s → 23.8 s): the WASM engine plus the
  socket multiplexer that relays every protocol message. Nothing changed in the tests.
- **Schema setup is ~15x faster** (4.4–7.2 s → 0.26–0.50 s) and always starts from a clean
  database.
- **End-to-end the two are a wash locally** (28.0 s vs 28.4 s) and PGlite is noticeably more
  stable (5.9 s spread vs 10.1 s).
- On a **cold CI runner** the Docker path paid the `postgres:14.10` image (397 MB
  uncompressed) plus `docker compose` orchestration, which is where the reported CI job
  improvement (1m46s vs 2m00s) most likely came from. That comparison was **not controlled**;
  it should be re-measured over several runs.

> **Correction to an earlier revision of this document.** The first version of this report
> compared Docker's _jest-only_ wall time against PGlite's _jest + boot + migration_ wall time
> and concluded PGlite was "24 % slower end-to-end". That accounting was wrong: the Docker
> migration span was printed in its own column but not added to the total. With both sides
> measured over the same span, the end-to-end difference disappears. The numbers above replace
> the earlier ones.

### Database level micro benchmarks

Single client, `pg` over TCP on both sides, 2 runs each:

| Benchmark                              | PostgreSQL 14 (Docker) | PGlite       | PGlite vs Docker |
| -------------------------------------- | ---------------------- | ------------ | ---------------- |
| Connect                                | 16–29 ms               | 5.4–5.9 ms   | **3–5x faster**  |
| 200 round trips (`select 1`)           | 31–80 ms               | 39–40 ms     | ~equal           |
| 1,000 row-by-row inserts               | 204–359 ms             | 343–348 ms   | ~1.3x slower     |
| 1,000 rows in one `INSERT`             | 6.9–7.2 ms             | 8.1–8.8 ms   | ~1.2x slower     |
| 50,000 rows `generate_series` (engine) | 164–215 ms             | 238–243 ms   | ~1.3x slower     |
| Index creation                         | 24–26 ms               | 19–21 ms     | ~1.2x faster     |
| 1,000 indexed lookups                  | 255–367 ms             | 314 ms       | ~equal           |
| `count`/`sum` over 52k rows            | 4.7–7.3 ms             | 6.2–6.7 ms   | ~1.1x slower     |
| `UPDATE` of 50,000 rows                | 135–220 ms             | 281–284 ms   | ~1.5x slower     |
| 4 parallel clients × 100 round trips   | 484–512 ms             | 1435–1527 ms | **~2.9x slower** |

- Sequential, connection-oriented workloads are close (0–50 % slower) and connection setup is
  much faster (no container networking/authentication).
- **Concurrency is the weak spot.** PGlite is a single Postgres session and the socket server
  multiplexes every client over it, serialising the queries. This suite is barely affected
  (`maxWorkers: 1`, sequential awaits) but a future test that fans out parallel database work
  would pay for it.
- Memory: the WASM instance adds ~250–300 MB to the test process tree.

## PostgreSQL 14 coverage

PGlite cannot be pinned to PostgreSQL 14 (no such WASM build exists), so the automated suites
no longer exercise the engine that runs in production. This is an accepted trade-off, not an
oversight. Consequences to keep in mind:

- migrations are applied by PGlite in PostgreSQL 18 mode; a migration that works there can
  still fail on 14 (syntax, planner behaviour, extension availability);
- constraint/index names and `information_schema`/`pg_catalog` results are asserted by
  `test/integration/database-keys.ts` — those assertions now run against 18;
- anything touching raw SQL, indexes, migrations or `JSONB` operators deserves a manual run
  against a real PostgreSQL 14 before release.

If this needs to be automated again, the cheapest option is a second CI job using a
`postgres:14.10` service container plus `TYPEORM_PORT=5429` (the previous revision of this PR
had exactly that, and it took the total pipeline from 2 jobs to 3).

## Known limitations

1. **Engine version.** PGlite 0.5.11 embeds PostgreSQL 18.6, production runs 14.10 — see
   [PostgreSQL 14 coverage](#postgresql-14-coverage).
2. **One PGlite session for all connections.** Queries from different connections are
   serialised, and only the connection owning an open transaction is served while it is open.
   Consequently, a migration that runs its SQL through `queryRunner.connection.query(...)`
   (a second pooled connection) would dead-lock if the migrations ran transactionally.
   `migrations/1622268797427-create-user-table.ts` was the only offender and now uses the
   `queryRunner` it receives, so **PGlite applies the migrations with TypeORM's default `all`
   transaction mode, exactly like `migration:run`**. The SQL is unchanged (only the runner
   differs) and the migration is already recorded in the `migrations` table everywhere it has
   been applied, so nothing is re-run in existing environments.
   New migrations must keep using `queryRunner.query(...)`.
3. **PostgreSQL features PGlite does not have**: no `LISTEN`/`NOTIFY`, no arbitrary native
   extensions, no superuser-only features. Not used by this codebase today.
4. **`uuid-ossp` must be enabled explicitly** (`extensions: { uuid_ossp }`), otherwise the
   `User` table migration fails.
5. **Local-only.** `globalSetup` rejects a non-loopback `TYPEORM_HOST`, so PGlite can never
   silently point the suites at a shared/remote database.
6. **No second database mode.** `PGLITE_ENABLED=false` and the `test:external-db` script were
   removed on purpose: the suites always run on PGlite.
7. **Jest path aliases do not exist inside `globalSetup`/`globalTeardown`.** Jest runs those
   hooks outside its module sandbox, so `moduleNameMapper` is not applied there: only relative
   imports are allowed anywhere in the `global-setup.ts` import chain (`test/pglite/*`).
   Importing `@/…` in those files breaks the whole test run.

## History

| Change                                                                       | Where                                                          |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------- |
| PGlite replaces the Docker test database                                     | first revision of this PR                                      |
| After review: PostgreSQL 14 CI job, transaction fix, config/log fixes        | second revision (commit `1a49dbd`)                             |
| PostgreSQL 14 CI job, `docker-compose-test.yml` and the escape hatch removed | third revision — PGlite is the only test database (this state) |

The review that drove the second revision is worth reading before touching this area again:
its main objection was exactly the PostgreSQL 14 coverage that has now been dropped on
purpose.

## Unrelated finding

Three tests in `test/e2e/leitner-systems-controller-entry.ts` ("moving from Box 1 to Box 2/3/4")
fail when the machine runs in `Europe/Dublin` around the DST switch (25 October 2026).
`makeItNewer(..., DAYS, n)` adds _calendar_ days, so across a DST boundary the difference is
25 h and `floor(-25/24) = -2`. This is a pre-existing, environment-dependent flake (CI runs in
UTC, which is why it is normally invisible) and it is **not** related to this change.
