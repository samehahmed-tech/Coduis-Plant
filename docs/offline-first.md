# Offline-First Workflow (Phase 1)

This document explains how offline-first works in RestoFlow and how to validate it.

## How It Works
- **Local cache:** IndexedDB via Dexie (`src/db/localDb.ts`) stores local data (orders, menu, customers, tables, etc).
- **Sync queue:** `syncQueue` holds pending changes with de-dup + retry.
- **De-dup:** Every queued action gets a `dedupeKey` (entity + action + id), so repeated retries do not create duplicates.
- **Retries:** Failed actions back off with exponential delay up to 5 minutes; max retries are capped.
- **Server authority:** On a 409 conflict (e.g., order already exists), the item is marked as synced locally.

## Queue Behavior
- When offline, stores push to `syncQueue`.
- When back online, `syncService` processes queued items.
- Items are locked to avoid double-processing.
- The queue automatically retries failed items.

## Manual Validation (Required)
1. Disconnect internet.
2. Create orders, update order status, update stock, save table layout.
3. Reconnect internet.
4. Confirm:
   - Orders appear once (no duplicates).
   - Local status updates are reflected server-side.
   - Queue is empty or only shows valid failures.

## Debugging
Use `syncService.getQueueStats()` to inspect queue health.
