---
title: Chenile Process Manager Bulk Upload
keywords: chenile process manager bulk upload keda postgres workers
tags: [developer chenile process manager bulk upload keda postgres]
sidebar: developer
permalink: /developer-chenile-process-manager-bulk-upload.html
summary: How to use Chenile process-manager for production bulk upload split, execute, aggregate workflows
---

## Purpose

Chenile process-manager is suitable for long-running bulk workflows when work is split into subprocesses and aggregated after completion.

The production pattern is:

- API stores file metadata and starts a root process.
- Splitter creates deterministic child processes.
- Workers claim durable work from Postgres.
- Executors store idempotent row/chunk results.
- Aggregator writes final status and summary.
- KEDA scales workers from the Postgres backlog.

## Framework Modules

- `process-service`: state machine, process persistence, subprocess creation, parent notification, and aggregation trigger.
- `process-utils`: `BatchServiceBase`, `SplitterBase`, `ExecutorBase`, and `AggregatorBase`.
- `jdbc-process-starter`: durable worker starter backed by `chenile_process_work_item`.

Use `jdbc-process-starter` for bulk upload or batch execution where retry, lease, and idempotency matter.

## Database Contract

The JDBC starter owns `chenile_process_work_item`.

Important columns:

- `idempotency_key`: unique process work key.
- `status`: `PENDING`, `RUNNING`, `SUCCESS`, or `DEAD`.
- `attempt`: number of claims.
- `locked_by` and `locked_until`: worker lease.
- `payload`: serialized `WorkerDto`.

Workers claim rows using `FOR UPDATE SKIP LOCKED`, so multiple replicas can run safely.

## KEDA Scaling

Use Postgres as the scaler source:

```sql
select count(*)
from chenile_process_work_item
where status = 'PENDING'
   or (status = 'RUNNING' and locked_until < now())
```

This avoids RabbitMQ-based scaling and ties capacity directly to durable unprocessed work.

## Sample

Reference implementation:

`chenile-samples/bulk-upload-process-sample`

The sample includes:

- `POST /bulk-uploads`
- `GET /bulk-uploads/{uploadId}`
- `GET /bulk-uploads/{uploadId}/processes`
- Postgres schema for upload, chunk, and row results
- MinIO/S3-compatible object storage
- Docker Compose local setup
- Kubernetes manifests with worker Deployment and KEDA ScaledObject

## Developer Checklist

- Define process types in `bulk-upload-process-def.json`.
- Name workers by convention, for example `bulkUploadSplitter`, `bulkUploadChunkExecutor`, and `bulkUploadAggregator`.
- Make child process IDs deterministic.
- Store row/chunk results with unique business keys.
- Treat worker retries as normal.
- Do not use in-memory state for aggregation.

## DevOps Checklist

- Run API pods with `chenile.process.worker.jdbc.run-worker=false`.
- Run worker pods with `spring.profiles.active=postgres,worker`.
- Install KEDA and apply the Postgres `ScaledObject`.
- Use managed Postgres and object storage in production.
- Tune lock timeout, max attempts, worker resources, and max replicas.
