---
title: Chenile File Watch
keywords: chenile filewatch file watcher batch ingestion production
tags: [developer chenile filewatch]
sidebar: developer
permalink: /developer-chenile-filewatch.html
summary: Production usage guide for the Chenile file-watch framework.
---

## Purpose

`chenile-filewatch` watches configured folders for completed input files and publishes each parsed record into Chenile's event processing pipeline. It is meant for file-based integrations where an upstream system drops a data file and a companion `.header` file.

The `.header` file is the completion marker. The data file can be copied first; the watcher processes only when the `.header` file arrives and contains `last.property`.

## Maven Dependency

Add the module to the Spring Boot application that owns the file-ingestion package:

```xml
<dependency>
  <groupId>org.chenile</groupId>
  <artifactId>chenile-filewatch</artifactId>
</dependency>
```

Import `FileWatchConfiguration` with the normal Chenile application configuration.

## Configuration

Existing properties remain supported:

```properties
chenile.file.watch.json.package=classpath*:filewatch/*.json
chenile.file.watch.source.folder=/data/in
chenile.file.watch.dest.folder=/data/processed
chenile.file.watch.error.folder=/data/error
chenile.file.watch.polltime.seconds=1
chenile.file.watch.stability-check-delay-ms=250
chenile.file.watch.scan-existing-on-startup=true
chenile.file.watch.reconciliation-scan-seconds=60
chenile.file.watch.max-concurrent-files=3
```

Key behavior:

- `source.folder` is the base input folder. Each file-watch definition appends its `dirToWatch`.
- `dest.folder` receives successfully processed header and data files.
- `error.folder` is optional. If configured, invalid or failed files are moved there instead of being retried forever.
- `polltime.seconds` controls the `WatchService` poll wait.
- `stability-check-delay-ms` gives writers time to finish before processing the header.
- `scan-existing-on-startup=true` processes files that were already present before startup.
- `reconciliation-scan-seconds` rescans watch folders to recover from missed OS watch events.
- `max-concurrent-files` limits file-processing workers. The watch loop uses a separate control thread.

## File-Watch Definition

Define file-watch metadata in JSON files loaded by `chenile.file.watch.json.package`.

Example:

```json
{
  "fileWatchId": "customerUpload",
  "dirToWatch": "customers",
  "recordClass": "com.acme.upload.CustomerRow"
}
```

The effective watch folder is:

```text
${chenile.file.watch.source.folder}/${dirToWatch}
```

The processed folder is:

```text
${chenile.file.watch.dest.folder}/${dirToWatch}
```

The error folder, when configured, is:

```text
${chenile.file.watch.error.folder}/${dirToWatch}
```

## Header Contract

For a data file named `customer-001.csv`, create `customer-001.header` after the data file is fully available.

```properties
tenant=tenant1
correlationId=upload-123
actual.file=customer-001.csv
actual.file.encoding=csv
last.property=done
```

Required headers:

- `actual.file`: Data file name relative to the watch directory.
- `actual.file.encoding`: Encoding understood by Chenile `Looper`, for example `csv` or `json`.
- `last.property`: Completion marker. Without this marker the header is ignored and files remain in place.

All remaining header values are passed to `EventProcessor.handleEvent(eventId, record, headers)`. This lets downstream code receive tenant, user, correlation, or client metadata without reparsing the header file.

Path traversal is rejected. A header cannot point to `../other-file.csv` or any file outside the configured watch directory.

## Processing Flow

1. Upstream writes the data file into the watch directory.
2. Upstream writes the `.header` file after the data file is complete.
3. The watcher suppresses duplicate filesystem events for the same header while processing is in flight.
4. The framework waits for `stability-check-delay-ms`.
5. `FileProcessor` validates required headers and resolves the data file inside the watch directory.
6. `Looper` parses the data file and sends each record to Chenile `EventProcessor`.
7. On success, both files move to the processed folder.
8. On validation or processing failure, both files move to the error folder when configured.

## Production Guidance

- Use a durable mounted volume for source, processed, and error folders.
- Make the upstream producer write the data file first and the header last.
- Keep `reconciliation-scan-seconds` enabled in production. Filesystem watch events can be dropped by the OS or container runtime.
- Keep `error.folder` enabled. This prevents one poison file from blocking the folder forever.
- Tune `max-concurrent-files` based on downstream event-processing capacity, not just CPU.
- Include tenant/client/correlation headers in every header file so failures can be traced.
- Monitor the error folder and publish operational alerts when files appear there.

## Tests

Framework coverage includes:

- Binding of legacy dotted properties such as `source.folder`, `json.package`, and `polltime.seconds`.
- Safe defaults for polling, startup scanning, reconciliation, and concurrency.
- Header filtering so non-header files are ignored.
- Successful CSV processing, header propagation, and processed-folder movement.
- Missing `last.property` behavior.
- Path traversal rejection and movement to the error folder.
- Spring integration using Jimfs to validate end-to-end watch, parse, event delivery, and file movement.

Run the filewatch tests:

```bash
cd /ajapro/chenile-others
mvn -pl chenile-filewatch -am test
```
