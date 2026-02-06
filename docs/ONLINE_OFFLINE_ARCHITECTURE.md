# Online / Offline Architecture (Production)

## Decision
- Source of truth: `PostgreSQL` only.
- Offline local storage on client: `IndexedDB` via `Dexie` (`src/db/localDb.ts`).
- Do **not** add `SQLite` or `MongoDB` for browser offline mode in this project.

Reason:
- Browser apps cannot reliably use native SQLite without extra runtime complexity.
- MongoDB does not add value for transactional POS consistency compared to PostgreSQL.
- Current stack already has queue + retry + dedupe and is aligned to PostgreSQL schema.

## Data Flow
1. Client writes online -> API -> PostgreSQL.
2. Client writes offline -> `syncQueue` in IndexedDB.
3. Connectivity restored -> `syncService.syncPending()` replays queue to API.
4. Server idempotency + version checks prevent duplicates/stale writes.

## Concurrency Guardrails
- Idempotent order creation by order id.
- Idempotent payment insertion by deterministic `paymentId`.
- Optimistic concurrency for order status updates using `expected_updated_at`.

## Realtime for 1000+ concurrent users
- Keep Socket.IO for event delivery.
- Scale with:
  - multiple API instances,
  - sticky sessions at load balancer,
  - Redis adapter for Socket.IO pub/sub across instances,
  - PostgreSQL read replicas for reporting.

## Operational Checklist
- Enable monitoring for queue depth (`pending`/`failed`).
- Alert on sync failures and ETA submission failures.
- Load-test websocket fanout and API write throughput before go-live.
