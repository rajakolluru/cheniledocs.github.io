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
- Root splitter creates deterministic group subprocesses.
- Group splitters create deterministic chunk subprocesses.
- Workers claim durable work from Postgres.
- Executors store idempotent row/chunk results.
- Group and root aggregators write final status, audit events, and summary.
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
- `GET /bulk-uploads/{uploadId}/report`
- `GET /bulk-uploads/{uploadId}/audit`
- Postgres schema for upload, group, chunk, row result, and audit rows
- MinIO/S3-compatible object storage
- Docker Compose local setup
- Kubernetes manifests with worker Deployment and KEDA ScaledObject
- Docker Desktop local scripts for image build, KEDA install, E2E run, and audit collection
- kubeadm-local scripts for teams that run local kubeadm clusters

The sample process tree is:

```text
bulkUpload
  bulkUploadGroup
    bulkUploadChunk
```

## Run The Local Cluster

For Docker Desktop Kubernetes:

```bash
cd chenile-samples/bulk-upload-process-sample
./scripts/docker-desktop-local/preflight.sh
./scripts/docker-desktop-local/build-image.sh
./scripts/docker-desktop-local/install-keda.sh
./scripts/docker-desktop-local/run-e2e.sh
```

The E2E script deploys Postgres, MinIO, API pods, worker Deployment, KEDA `ScaledObject`, and HPA. It uploads a CSV, waits for KEDA to scale workers from the database backlog, waits for aggregation, and writes operational evidence to:

```text
target/docker-desktop-bulk-upload-audit/
```

For local kubeadm clusters, use the equivalent scripts under `scripts/kubeadm-local/`. The kubeadm image build script imports the local image into containerd when required.

## Inspect Runtime State

Check what is running:

```bash
kubectl -n chenile-bulk-upload get deploy,pods,svc,scaledobject,hpa
```

The expected steady state after processing is:

- API pods are running.
- Postgres and MinIO are running.
- Worker Deployment is scaled to `0`.
- KEDA `ScaledObject` is `READY=True` and `ACTIVE=False`.

Watch worker scaling during an upload:

```bash
kubectl -n chenile-bulk-upload get deploy bulk-upload-worker -w
kubectl -n chenile-bulk-upload get hpa,scaledobject
kubectl -n chenile-bulk-upload logs deploy/bulk-upload-worker --tail=300
```

KEDA scales from the query result over `chenile_process_work_item`. No RabbitMQ queue is required.

## Audit And Data

The sample captures both API-facing and database-facing evidence:

- `report.json`: upload status, total rows, successful rows, failed rows, group count, chunk count, worker summaries, and row errors.
- `audit.json`: business audit timeline returned by the API.
- `db-upload.txt`: final upload row from Postgres.
- `db-groups.txt`: group aggregation results.
- `db-chunks.txt`: chunk aggregation results.
- `db-workers.txt`: durable process work status by worker type.
- `db-audit.txt`: persisted audit events.
- `keda-summary.txt`: KEDA/HPA state.
- `events.txt`: Kubernetes event timeline.
- `api.log` and `worker.log`: pod logs.

The default E2E CSV intentionally contains invalid rows, so the final status should be `SUCCESS_WITH_ERRORS`. That validates idempotent row errors and partial-success aggregation.

The important data ownership split is:

- Framework owns `chenile_process_work_item`.
- Application owns upload, group, chunk, row result, audit, and report tables.
- Framework should not know CSV, file storage, tenant-specific upload rules, or product audit vocabulary.

## Shutdown

Stop only the sample namespace:

```bash
./scripts/docker-desktop-local/shutdown.sh
```

KEDA is left installed by default because it is reusable cluster infrastructure. Remove KEDA only when the local cluster is dedicated to this sample:

```bash
REMOVE_KEDA=true ./scripts/docker-desktop-local/shutdown.sh
```

## Developer Checklist

- Define process types in `bulk-upload-process-def.json`.
- Name workers by convention, for example `bulkUploadSplitter`, `bulkUploadGroupSplitter`, `bulkUploadChunkExecutor`, `bulkUploadGroupAggregator`, and `bulkUploadAggregator`.
- Make child process IDs deterministic.
- Store row/group/chunk results with unique business keys.
- Treat worker retries as normal.
- Do not use in-memory state for aggregation.
- Verify local behavior with `mvn test` and Docker Desktop behavior with `scripts/docker-desktop-local/run-e2e.sh`.

## DevOps Checklist

- Run API pods with `chenile.process.worker.jdbc.run-worker=false`.
- Run worker pods with `spring.profiles.active=postgres,worker`.
- Install KEDA and apply the Postgres `ScaledObject`.
- Use managed Postgres and object storage in production.
- Tune lock timeout, max attempts, worker resources, and max replicas.
- For Docker Desktop, use the local image `chenile/bulk-upload-process-sample:local` directly.
- For local kubeadm, import the same image into the node container runtime before applying manifests.
