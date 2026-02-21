# RestoFlow ERP — Backup & Restore Guide

## 1. Automated Backups (Docker Production)

The production Docker Compose includes an automatic `db-backup` service that:
- Runs `pg_dump` every 24 hours
- Saves compressed dumps to `./backups/`
- Retains the last 30 days of backups
- Auto-deletes older backups

### Verify backups are running:
```bash
docker compose -f docker-compose.prod.yml logs db-backup
```

### Check backup files:
```bash
ls -la ./backups/
```

---

## 2. Manual Backup

### Full database dump:
```bash
# From host (Docker)
docker exec restoflow-db pg_dump -U restoflow -Fc restoflow > backups/manual_$(date +%Y%m%d_%H%M%S).dump

# Direct connection
pg_dump -h localhost -U restoflow -Fc restoflow > backup.dump
```

### Schema only:
```bash
pg_dump -h localhost -U restoflow --schema-only restoflow > schema.sql
```

### Data only:
```bash
pg_dump -h localhost -U restoflow --data-only -Fc restoflow > data_only.dump
```

---

## 3. Restore Procedures

### Full restore (⚠️ replaces all data):
```bash
# Stop the backend first
docker compose -f docker-compose.prod.yml stop backend

# Restore
docker exec -i restoflow-db pg_restore -U restoflow -d restoflow --clean --if-exists < backups/restoflow_YYYYMMDD_HHMMSS.dump

# Restart
docker compose -f docker-compose.prod.yml start backend
```

### Restore to a new database:
```bash
# Create new database
docker exec restoflow-db createdb -U restoflow restoflow_restored

# Restore into it
docker exec -i restoflow-db pg_restore -U restoflow -d restoflow_restored < backups/restoflow_YYYYMMDD.dump
```

### Point-in-time recovery:
Not available with basic pg_dump. For PITR, enable WAL archiving in PostgreSQL.

---

## 4. Backup Verification

### Test every backup by restoring to a test database:
```bash
# Create test DB
docker exec restoflow-db createdb -U restoflow restoflow_test

# Restore latest backup
LATEST=$(ls -t backups/restoflow_*.dump | head -1)
docker exec -i restoflow-db pg_restore -U restoflow -d restoflow_test < $LATEST

# Verify row counts
docker exec restoflow-db psql -U restoflow -d restoflow_test -c "
  SELECT 'orders' as tbl, count(*) as cnt FROM orders
  UNION ALL SELECT 'users', count(*) FROM users
  UNION ALL SELECT 'menu_items', count(*) FROM menu_items
  UNION ALL SELECT 'audit_logs', count(*) FROM audit_logs;
"

# Drop test DB
docker exec restoflow-db dropdb -U restoflow restoflow_test
```

---

## 5. Recovery Metrics

| Metric | Target | Notes |
|--------|--------|-------|
| RPO (Recovery Point Objective) | ≤ 24 hours | Based on daily backup frequency |
| RTO (Recovery Time Objective) | ≤ 4 hours | Including notification + restore |
| Backup size (typical) | ~50-200 MB | Depends on order volume |
| Restore time (typical) | 5-15 minutes | For databases up to 5 GB |

---

## 6. Off-site Backup (Recommended)

### Sync to S3:
```bash
# Install AWS CLI
# Configure: aws configure

# Sync backups to S3
aws s3 sync ./backups/ s3://restoflow-backups/$(hostname)/ --storage-class STANDARD_IA
```

### Cron job for off-site sync:
```cron
0 6 * * * aws s3 sync /app/backups/ s3://restoflow-backups/$(hostname)/ --storage-class STANDARD_IA
```

---

## 7. Emergency Contacts

| Role | Contact | When to reach |
|------|---------|---------------|
| DB Admin | [TBD] | Any restore operation |
| CTO | [TBD] | Data loss > 1 hour |
| Client | [TBD] | Any production downtime |
