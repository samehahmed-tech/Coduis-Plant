# Go-Live Readiness (Execution)

## How To Use
1. Run `npm run go-live:preflight`.
   - Gate flags:
     - `GO_LIVE_REQUIRE_STRICT_CORS=true`
     - `GO_LIVE_REQUIRE_ETA=true` (if fiscal is in launch scope)
     - `GO_LIVE_REQUIRE_SMTP=true` (if day-close email is in launch scope)
     - `GO_LIVE_REQUIRE_S3=true` (if image upload is in launch scope)
2. Run `npm run smoke:core` with:
   - `SMOKE_API_BASE_URL`
   - `SMOKE_TOKEN`
   - `SMOKE_BRANCH_ID`
3. Fix all `FAIL` items first.
4. Review `WARN` items and decide if in scope for this launch.
5. Re-run until `ok: true`.

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
  - `npm run ops:realtime-gate` must pass (`adapter=redis`, `redisConnected=true`)

## Unified Launch Gates Runner
- Run `npm run ops:launch-gates` to execute:
  - `eta:check`
  - `eta:smoke`
  - `ops:realtime-gate`
- JSON evidence is written to `artifacts/gates/launch-gates.json`.
- The command exits with non-zero status if any required gate fails.

## Unified Evidence Collection
- Run `npm run ops:collect-evidence` to execute:
  - `ops:launch-gates`
  - `load:realtime:bench`
- Manifest output is written to `artifacts/evidence/launch-evidence-manifest.json`.
- This command is intended as the single handover artifact before go-live decision.

## UAT Sign-off (Per Role)
- Cashier: POS workflows
- Kitchen: KDS workflow and SLA timing
- Call Center: customer + delivery flow
- Inventory/Production: stock movement integrity
- Finance: postings, reconciliation, day close
- Admin: permissions and settings governance
- Template file: `docs/UAT_ROLE_SIGNOFF_TEMPLATE.json`
- Validation command: `npm run ops:uat-signoff-check`
  - Input path via `UAT_SIGNOFF_PATH` (default: `artifacts/uat/role-signoff.json`)
  - Gate passes only when all required roles are `PASS`

## Launch Decision Rule
- Launch only when:
  - no `FAIL` in preflight
  - no blocker in role UAT
  - rollback steps tested and documented
  - `npm run ops:rollback-drill-check` passes on latest drill report
