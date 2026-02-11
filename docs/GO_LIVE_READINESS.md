# Go-Live Readiness (Execution)

## How To Use
1. Run `npm run go-live:preflight`.
2. Fix all `FAIL` items first.
3. Review `WARN` items and decide if in scope for this launch.
4. Re-run until `ok: true`.

## Mandatory Before Launch
- `tsc/test/build` all green:
  - `npx tsc --noEmit`
  - `npm test`
  - `npm run build`
- Production env configured:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `AUDIT_HMAC_SECRET`
  - `CORS_ORIGINS` without wildcard `*`
- Database connectivity verified (`select 1`).
- Data bootstrap completed for each branch:
  - users/roles
  - menu categories + items
  - tables/floor zones
  - printers
  - inventory + warehouses
- Operational E2E validated:
  - POS -> KDS -> payment -> day close

## Conditional (If Used In Your Launch Scope)
- Fiscal/ETA:
  - `npm run eta:check`
  - `npm run eta:smoke`
  - `ETA_*` all configured
- Day Close email:
  - `SMTP_*` configured
  - send-email endpoint validated
- Image uploads:
  - `S3_*` configured and tested
- Multi-instance realtime:
  - `SOCKET_REDIS_ENABLED=true`
  - `SOCKET_REDIS_URL` configured
  - `/api/ops/realtime-health` validated

## UAT Sign-off (Per Role)
- Cashier: POS workflows
- Kitchen: KDS workflow and SLA timing
- Call Center: customer + delivery flow
- Inventory/Production: stock movement integrity
- Finance: postings, reconciliation, day close
- Admin: permissions and settings governance

## Launch Decision Rule
- Launch only when:
  - no `FAIL` in preflight
  - no blocker in role UAT
  - rollback steps tested and documented
