# PGlite as the test database

## Summary

Since `1.57.0` the automated suites (unit, integration, e2e) run against an **in-memory PGlite**
instance — PostgreSQL 18.6 compiled to WebAssembly — served to TypeORM over the **Postgres wire
protocol**. No Docker daemon, no database service, no image pull.

The trade-off is deliberate and narrow: **a green run proves the application works against PGlite,
not against the PostgreSQL 14 that runs in production.** This document records what the change
bought us and, more importantly, what it cannot cover, so it is clear when a real PostgreSQL
container has to come back.

## How it works

```
npm test
  └── jest (main process)
        ├── globalSetup  → test/pglite/global-setup.ts
        │     ├── PGlite.create({ extensions: { uuid_ossp } })
        │     ├── PGLiteSocketServer.listen(TYPEORM_HOST, TYPEORM_PORT)
        │     └── runMigrations()                     ← migrations/*.ts, one transaction
        └── test workers → `pg` → TYPEORM_HOST:TYPEORM_PORT → PGlite
              (globalTeardown stops the server)
```

| File                              | Responsibility                                           |
| --------------------------------- | -------------------------------------------------------- |
| `test/pglite/pglite-server.ts`    | boots/stops PGlite + the socket server, validates config |
| `test/pglite/pglite-migration.ts` | applies `migrations/*.ts` to the fresh database          |
| `test/pglite/global-setup.ts`     | Jest `globalSetup`                                       |
| `test/pglite/global-teardown.ts`  | Jest `globalTeardown`                                    |
| `test/pglite/pglite-contrib.d.ts` | types for the bundled `uuid_ossp` extension              |

`TYPEORM_HOST` / `TYPEORM_PORT` / `TYPEORM_DATABASE` are the single source of truth — the socket
server listens exactly where TypeORM connects, non-loopback hosts are rejected, and only
`host:port/database` is ever logged (never credentials). Optional knobs: `PGLITE_MAX_CONNECTIONS`
(default 20) and `PGLITE_DEBUG`.

## What we gained

- **Docker left the test path.** CI is `static-checks` + `tests`: no Docker Hub login, no service
  container, no compose stack, no 397 MB `postgres:14.10` image (the PGlite packages are ~27 MB of
  npm). A fresh clone needs only Node to run the whole suite.
- **A disposable database per run.** The schema is always built from `migrations/` by
  `globalSetup`, so no run can inherit state from a previous one.
- **Much faster schema setup:** 0.26–0.50 s versus 4.4–7.2 s for the container + `migration:run`.
- **Same end-to-end time, more stable:** 28.4 s median versus 28.0 s for the Docker path, but with a
  5.9 s spread instead of 10.1 s; on a cold CI runner the image pull disappears entirely.
- **Faster connection setup:** ~5 ms versus 16–29 ms (no container networking/authentication).
- **No application changes:** same TypeORM driver, same migrations, same tests — a socket server in
  front of PGlite is the whole integration. Migrations even run in TypeORM's default single
  transaction, exactly like `migration:run`.
- **Impossible to point at the wrong database:** the suites reject a remote `TYPEORM_HOST` and can
  never silently touch a shared database.

(Measured on this suite — 29 suites, 200 tests, 21 migrations, `TZ=UTC` — comparing
`npm run test` on PGlite with the previous Docker flow, including the migrations, n = 6 per mode.)

## What PGlite cannot do

### 1. It is not PostgreSQL 14

PGlite embeds a fixed engine version per release, and **no PostgreSQL 14 build exists**:

| PGlite release | engine   |
| -------------- | -------- |
| 0.1.0          | 15devel  |
| 0.2.x          | 16.4     |
| 0.3.x – 0.4.x  | 17.5     |
| 0.5.x (in use) | **18.6** |

Production runs 14.10, so version-sensitive work must be validated against a real 14:

- new SQL syntax/features, planner and index behaviour, `JSONB` operators;
- extension availability and `pg_catalog` / `information_schema` shape — the naming-convention
  assertions in `test/integration/database-keys.ts` now run against 18;
- **migrations**: the suite applies them on 18, and a migration that works there can fail on 14.

### 2. Concurrency

PGlite is a **single Postgres session**; the socket server multiplexes every client connection over
it and only serves the connection that owns an open transaction. Four parallel clients measure
~2.9x slower than a real server. Anything that depends on real concurrency needs a container:
connection pools under load, advisory locks, row-lock contention/`SELECT … FOR UPDATE`, deadlock
handling, `LISTEN`/`NOTIFY`, parallel query.

Related trap: a migration (or any code) that runs SQL through `queryRunner.connection.query(...)`
uses a second connection and will **dead-lock** against PGlite. The only legacy migration doing that
was fixed in this branch to use the runner it receives.

### 3. Missing PostgreSQL features

- no `LISTEN`/`NOTIFY`;
- no arbitrary extensions — only the ones bundled with PGlite (plus `@electric-sql/pglite-*`
  packages). `uuid-ossp` must be requested explicitly via `extensions: { uuid_ossp }`;
- no superuser-only operations (`COPY … FROM PROGRAM`, installing arbitrary extensions,
  `pg_stat_statements`), no background workers, no logical replication.

### 4. Server configuration and durability semantics

There is nothing to tune — no `fsync`, WAL, `shared_buffers`, `work_mem`, parallel workers, JIT or
autovacuum. Tests therefore cannot catch configuration-dependent behaviour, and performance numbers
(concurrency above all) are not representative of the production server.

### 5. Database tooling

`psql`, `pg_dump`/`pg_restore`, GUI clients and `pg_stat_*` dashboards cannot usefully attach to the
in-memory instance in a test process. Debugging a failing query with SQL tooling requires the
container.

## How to get a real PostgreSQL back

**Migrations against PostgreSQL 14 — available today, no code change.** `npm run migration:run`
applies the same `migrations/*.ts` through the local development database from `docker-compose.yml`
(PostgreSQL 14.10 on port 5431). Use it whenever a migration or raw SQL changes.

**The whole suite against a real server — needs the switch back.** The suites always boot PGlite;
`PGLITE_ENABLED` was removed on purpose in `1.57.0` together with `docker-compose-test.yml` and the
PostgreSQL 14 CI job. To restore it:

1. skip the PGlite boot in `test/pglite/global-setup.ts` when an env flag (e.g. `PGLITE_ENABLED=false`)
   is set, and drop `test:external-db`/migration wiring back into `package.json`;
2. start a container (`docker run -d --name ielts-gibberish-test-postgres -p 5429:5432 \
--tmpfs /var/lib/postgresql/data -e POSTGRES_PASSWORD=123 -e POSTGRES_USER=postgres \
-e POSTGRES_DB=ielts-gibberish postgres:14.10 -c fsync=off -c synchronous_commit=off \
-c full_page_writes=off`) and apply the migrations to it;
3. for CI, a job with `services: postgres:14.10` (health check `pg_isready`), then
   `npm run migration:run:local-test` and the suite pointed at that port.

A ready-made version of exactly that exists in the git history: commits `1a49dbd` (the
`PGLITE_ENABLED` switch, `test:external-db`, and the `tests-postgresql-14` service-container job)
and `665ae47` (the removal). Cherry-pick the pieces you need instead of rewriting them.

## History

- `1.57.0` — Docker removed from the test path: PGlite became the only test database, the escape
  hatch, `docker-compose-test.yml` and the PostgreSQL 14 CI job were deleted.
- `1.56.3` — unrelated to PGlite: the Leitner assertions compared an elapsed-time difference with
  calendar days and failed around the DST switch.
