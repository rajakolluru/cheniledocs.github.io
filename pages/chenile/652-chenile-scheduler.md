---
title: Chenile Scheduler
keywords: chenile scheduler cron quartz launcher jobs
sidebar: chenile_sidebar
toc: true
permalink: /chenile-scheduler.html
folder: chenile
summary: Cron scheduling support for Chenile services with generic launcher dispatch and execution status tracking.
---

Chenile Scheduler runs cron-based jobs against Chenile services. It is deliberately framework-only: Quartz decides when work is due, then the scheduler dispatches each execution to a named launcher. The framework does not know about Kubernetes, in-memory stores, queues, or a specific database engine.

The current implementation keeps Quartz as the trigger engine. Quartz decides when a job is due. The scheduler then dispatches the execution to a named launcher:

- `local`: built-in launcher that invokes a Chenile service operation in the same JVM.
- Any application-defined launcher: queue, cloud scheduler, Kubernetes Job, or another worker system.

## Job Definition

Scheduler JSON files are loaded from `chenile.scheduler.json.package`.

The older format is still valid:

```json
{
  "serviceName": "fooService",
  "operationName": "schedule",
  "cronSchedule": "0/1 * * * * ? *",
  "jobName": "Test_Job",
  "jobDescription": "Test_Job_Description",
  "triggerGroup": "Test trigger group1",
  "triggerName": "testTrigger1"
}
```

An enhanced definition can choose a launcher and execution policy:

```json
{
  "serviceName": "reportService",
  "operationName": "run",
  "cronSchedule": "0 2 * * * ?",
  "jobName": "daily-report",
  "launcher": "worker",
  "worker": "report-worker",
  "payload": "{ \"report_type\": \"daily\" }",
  "retryCount": 3,
  "timeoutSeconds": 300,
  "jobLabels": {
    "team": "reports"
  }
}
```

Important fields:

| Field | Meaning |
| --- | --- |
| `serviceName` | Chenile service to invoke or pass to the worker. |
| `operationName` | Chenile operation to invoke or pass to the worker. |
| `cronSchedule` | Quartz cron expression. |
| `jobName` | Stable scheduler job id. |
| `launcher` | Named launcher such as `local`, `queue`, or an application-defined worker launcher. Defaults to `chenile.scheduler.launcher.default`. |
| `worker` | Logical worker/task type for custom launchers. |
| `payload` | String payload passed to the local Chenile exchange or worker pod. |
| `retryCount` | Retry count used by synchronous launchers. Asynchronous launchers may map it to their own retry mechanism. |
| `timeoutSeconds` | Timeout used by synchronous launchers. Asynchronous launchers may map it to their own timeout/deadline mechanism. |
| `jobLabels` / `jobAnnotations` | Optional metadata available to custom launchers. |

## Configuration

Default properties:

```properties
chenile.scheduler.launcher.default=local
```

Applications must provide a `SchedulerExecutionStore` bean. Use the framework JDBC implementation when execution status must survive restarts:

```properties
chenile.scheduler.store.type=jdbc
```

Initialize the status table with `chenile-scheduler-schema.sql` from the scheduler jar.

## Execution Flow

For local jobs:

```text
Quartz trigger
  -> ScheduledTaskDispatcher
  -> duplicate check in SchedulerExecutionStore
  -> LocalChenileTaskLauncher
  -> ChenileEntryPoint
  -> status update
```

For custom worker launchers:

```text
Quartz trigger
  -> ScheduledTaskDispatcher
  -> duplicate check in SchedulerExecutionStore
  -> application ScheduledTaskLauncher
  -> queue/cloud/Kubernetes/worker system
```

The dispatcher derives an execution id from `jobName + scheduledFireTime`. This prevents duplicate execution for the same scheduled fire time when the same trigger is observed more than once.

## Launcher Extension Contract

Custom launchers implement `ScheduledTaskLauncher`. A launcher receives `ScheduledExecutionRequest`, which contains the job definition, payload, headers, service and operation metadata, execution id, scheduled fire time, actual fire time, and attempt number.

Use this contract for application-owned launchers such as queue dispatchers or specialized dynamic-job launchers. Keep Kubernetes-specific client code out of the framework unless a product requirement says the scheduler app must create Kubernetes Jobs dynamically.

For production Kubernetes scheduling, prefer Kubernetes-native CronJobs for one Job per schedule, or DB-backed KEDA scaling when a backlog should be processed by multiple worker replicas. In both shapes, DevOps owns the schedule and scaler, and the worker image consumes a stable environment variable contract:

```text
CHENILE_SCHEDULER_EXECUTION_ID
CHENILE_SCHEDULER_JOB_NAME
CHENILE_SCHEDULER_WORKER
CHENILE_SCHEDULER_PAYLOAD
CHENILE_SCHEDULER_SERVICE_NAME
CHENILE_SCHEDULER_OPERATION_NAME
```

The Kubernetes sample includes a normal `batch/v1` CronJob. A representative worker pod shape is:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: daily-report
  labels:
    app.kubernetes.io/part-of: chenile-scheduler-sample
spec:
  schedule: "0 2 * * *"
  concurrencyPolicy: Forbid
  jobTemplate:
    spec:
      backoffLimit: 3
      activeDeadlineSeconds: 300
      template:
        metadata:
          labels:
            app.kubernetes.io/part-of: chenile-scheduler-sample
        spec:
          restartPolicy: Never
          containers:
            - name: worker
              image: example/report-worker:1
              env:
                - name: CHENILE_SCHEDULER_JOB_NAME
                  value: daily-report
                - name: CHENILE_SCHEDULER_WORKER
                  value: report-worker
                - name: CHENILE_SCHEDULER_PAYLOAD
                  value: '{ "report_type": "daily" }'
                - name: CHENILE_SCHEDULER_SERVICE_NAME
                  value: reportService
                - name: CHENILE_SCHEDULER_OPERATION_NAME
                  value: run
```

If a team must dynamically create Kubernetes Jobs from an application, keep that launcher application-owned and test it separately. Fabric8 is appropriate for those tests. It should not be presented as the default production setup for scheduled workers.

## Kubernetes DevOps Setup

The reference production setup lives in `chenile-samples/scheduler-sample/k8s`.

It includes:

- namespace and shared configuration
- Postgres-backed scheduler status store for the long-running scheduler app
- scheduler Deployment and Service
- Kubernetes CronJob worker
- HPA for the long-running scheduler app
- KEDA PostgreSQL scaler for DB-backed worker Deployments

Developer responsibilities:

- implement the worker image
- keep the worker idempotent for a repeated execution id or payload
- document payload schema and environment variables
- publish logs and metrics that identify job name and execution id

DevOps responsibilities:

- own CronJob schedules, timeouts, history limits, and concurrency policy
- own namespace, RBAC, secrets, resource requests, and rollout strategy
- own scaler configuration such as HPA or KEDA PostgreSQL scaling
- alert on failed Jobs and stale scheduler status rows

Apply the JDBC scheduler deployment:

```bash
cd chenile-samples/scheduler-sample
kubectl apply -f k8s/base/
```

Apply the Kubernetes-native CronJob worker path:

```bash
cd chenile-samples/scheduler-sample
kubectl apply -f k8s/base/00-namespace.yaml
kubectl apply -f k8s/base/12-serviceaccounts.yaml
kubectl apply -f k8s/cron-workers/
```

Trigger one manual worker run:

```bash
kubectl -n chenile-scheduler-sample create job scheduled-report-manual \
  --from=cronjob/scheduled-report-worker
```

Watch worker execution:

```bash
kubectl -n chenile-scheduler-sample get cronjobs,jobs,pods
```

Do not run both the Chenile JDBC scheduler job and a Kubernetes CronJob for the same business action unless the operation is explicitly designed for duplicate scheduling.

## DB-backed Worker Scaling

Use DB-backed worker scaling when scheduled work can create a backlog and multiple replicas should process it safely.

The sample uses `chenile_scheduler_work_item` as the coordination table:

- `idempotency_key` has a unique constraint
- scheduler inserts one row per logical work item
- workers claim rows with `FOR UPDATE SKIP LOCKED`
- `locked_until` allows expired `RUNNING` work to be reclaimed
- KEDA scales from the Postgres backlog query

Apply the DB-backed worker scaler:

```bash
cd chenile-samples/scheduler-sample
kubectl apply -f k8s/scaling/scheduled-report-worker-deployment.yaml
kubectl apply -f k8s/scaling/keda-postgres-trigger-auth.yaml
kubectl apply -f k8s/scaling/keda-postgres-worker-scaledobject.yaml
```

The KEDA PostgreSQL scaler runs a query that returns a single numeric value, as required by KEDA. The sample query counts `PENDING` work plus expired `RUNNING` work and scales the worker Deployment from `0` to `10` replicas.

## Status Tracking

The execution store records:

- execution id
- job name
- scheduled fire time
- actual fire time
- started and finished time
- status
- attempt
- duration
- error message
- launcher metadata

Supported statuses:

- `RUNNING`
- `SUCCESS`
- `FAILED`
- `TIMED_OUT`

`SchedulerExecutionService` can be used by application code or worker callbacks to inspect and update execution status.

## Testing

Run the scheduler test suite from `chenile-others/chenile-scheduler`:

```bash
mvn test
```

The test suite covers:

- existing Quartz-based local scheduling
- enhanced JSON parsing
- test-only memory duplicate prevention
- JDBC execution lifecycle with an embedded test database
- dispatcher retry, timeout, and duplicate behavior
- Kubernetes `Job` spec generation
- real Kubernetes `Job` creation in Testcontainers K3s through Fabric8

The Kubernetes integration test does not require a live external cluster. It starts a real K3s Kubernetes API with Testcontainers, creates a `batch/v1 Job` using a test-only Fabric8 launcher, and reads the created Job back from the cluster. This validates the extension contract without making Fabric8 the recommended production path.

## Reference sample

Use `chenile-samples/scheduler-sample` as the implementation reference for application teams.

It includes:

- `jdbc` profile: local launcher plus `JdbcSchedulerExecutionStore`
- scheduler JSON definition under `src/main/resources/org/chenile/samples/scheduler/jobs`
- production Kubernetes manifests under `k8s/base`
- scaler examples under `k8s/scaling`
- DB-backed work item table and worker claim implementation
- worker image skeleton under `workers/scheduled-report-worker`
- tests for JDBC duplicate detection/status updates and Kubernetes Job spec generation

Run the sample in JDBC mode:

```bash
cd chenile-samples/scheduler-sample
mvn spring-boot:run -Dspring-boot.run.profiles=jdbc
```

Apply the Kubernetes-native worker sample:

```bash
cd chenile-samples/scheduler-sample
kubectl apply -f k8s/base/00-namespace.yaml
kubectl apply -f k8s/base/12-serviceaccounts.yaml
kubectl apply -f k8s/cron-workers/
```
