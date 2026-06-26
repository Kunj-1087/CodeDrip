# CodeDrip Database Backup Strategy

## Overview

This document defines the backup, recovery, and verification procedures for the
CodeDrip PostgreSQL database. The strategy is designed for a growing Indian
ecommerce platform that must guarantee data durability even during festive-sale
traffic spikes.

---

## Automated Daily Backups

### Option A — Managed Database (Recommended for Production)

Use Railway, Supabase, or Neon PostgreSQL — all include automated daily backups
and point-in-time recovery. This eliminates the operational burden of managing
backup scripts, storage, and rotation.

- **Railway**: Automated daily backups with 7-day retention (paid plans).
- **Supabase**: Point-in-time recovery + daily backups (14-day retention on Pro).
- **Neon**: Built-in branching and point-in-time recovery to any point in the last 7 days.

### Option B — Self-Hosted PostgreSQL (VPS)

If running PostgreSQL on a VPS (DigitalOcean, AWS EC2, Hetzner), set up
automated `pg_dump` using a cron job:

```bash
# /etc/cron.d/codedrip-backup
# Runs daily at 2:00 AM IST (20:30 UTC previous day)
0 2 * * * postgres pg_dump "${DATABASE_URL}" | gzip > /backups/codedrip_$(date +\%Y\%m\%d).sql.gz

# Keep only the last 30 daily backups
0 3 * * * postgres find /backups -name "codedrip_*.sql.gz" -mtime +30 -delete
```

#### Off-site replication (S3 / R2)

Upload backups to object storage for geographic redundancy:

```bash
# Install AWS CLI or rclone, then run after the pg_dump completes
0 3 * * * postgres aws s3 cp /backups/codedrip_$(date +\%Y\%m\%d).sql.gz s3://codedrip-backups/daily/ --storage-class STANDARD_IA
```

Cloudflare R2 is a cost-effective alternative with no egress fees:
```bash
0 3 * * * postgres rclone copy /backups/codedrip_$(date +\%Y\%m\%d).sql.gz r2:codedrip-backups/daily/
```

---

## Backup Verification (Monthly)

A backup that cannot be restored is worthless. Run this checklist monthly:

1. Restore the latest backup to a staging/test database:
   ```bash
   createdb codedrip_restore_test
   gunzip -c /backups/codedrip_latest.sql.gz | psql codedrip_restore_test
   ```

2. Verify data integrity:
   - [ ] Table row counts match production expectations
   - [ ] Last 10 orders are present and complete
   - [ ] Product catalog count is correct
   - [ ] User count is within expected range
   - [ ] Store settings are present
   - [ ] No orphaned foreign key references

3. Document any discrepancies and fix the root cause.

---

## Recovery Procedure

### Step 1 — Assess the Damage

1. Check the `/health` endpoint — is the API running?
2. Check database connectivity: `psql $DATABASE_URL -c "SELECT 1"`
3. Check error logs for the root cause
4. Determine if recovery is needed (data corruption, accidental deletion, etc.)

### Step 2 — Stop the Application

```bash
# Prevent further writes
pm2 stop codedrip-api     # or: systemctl stop codedrip-api
# Or scale down to 0 on Railway / Vercel
```

### Step 3 — Restore from Backup

```bash
# Download the backup
aws s3 cp s3://codedrip-backups/daily/codedrip_YYYYMMDD.sql.gz .
gunzip codedrip_YYYYMMDD.sql.gz

# Drop and recreate the database
dropdb codedrip
createdb codedrip

# Restore
psql codedrip < codedrip_YYYYMMDD.sql
```

### Step 4 — Verify Restoration

Run the monthly verification checklist (above).

### Step 5 — Restart the Application

```bash
pm2 start codedrip-api
# Verify: curl http://localhost:4000/health
```

---

## Target RTO and RPO

| Metric | Target | Notes |
|--------|--------|-------|
| **RTO** (Recovery Time Objective) | < 2 hours | Time to restore service after a disaster |
| **RPO** (Recovery Point Objective) | < 24 hours | Maximum data loss with daily backups |
| **RPO (with WAL archiving)** | < 5 minutes | Continuous archiving for point-in-time recovery |

For better-than-daily RPO, enable continuous WAL archiving:

```bash
# postgresql.conf
archive_mode = on
archive_command = 'cp %p /backups/wal/%f'
```

Then restore to any point in time:
```bash
pg_restore --recover --target-time "2026-06-22 14:30:00 IST" codedrip_backup
```

---

## Monitoring Alerts

Configure these alerts in your monitoring system:

| Alert | Threshold | Action |
|-------|-----------|--------|
| Backup age | > 36 hours since last backup | Investigate cron job / storage |
| Backup size anomaly | > 50% deviation from 7-day average | Check for data corruption |
| Restore failure | Any restore test failure | Immediate investigation |
| Database disk usage | > 80% | Add storage or archive old data |

---

## Responsibility

- **DevOps lead**: Ensures backups run, storage is available, and restore tests pass monthly.
- **On-call engineer**: Follows the recovery procedure when alerted.
- **All engineers**: Know where this document lives and how to initiate recovery.
