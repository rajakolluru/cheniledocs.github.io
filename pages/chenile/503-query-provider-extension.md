---
title: Query Provider Extension
keywords: chenile query provider extension mybatis
sidebar: chenile_sidebar
toc: true
permalink: /query-provider-extension.html
folder: chenile
summary: Extending Chenile Query with application-owned query providers
---

# Query Provider Extension

Chenile query ships with one production provider: `mybatis`. This provider is the default and works for JDBC databases when the mapper SQL is compatible with that database.

For JDBC databases where the existing MyBatis mapper SQL is valid, applications should normally only change datasource and mapper configuration:

```yaml
query:
  mapperFiles: classpath*:query/mapper/*.xml
  definitionFiles: classpath*:query/mapper/*.json
  datasources:
    tenant1:
      type: com.zaxxer.hikari.HikariDataSource
      driverClassName: com.example.Driver
      jdbcUrl: jdbc:example://localhost:9000/default
      username: app
      password: secret
```

Do not set `query.provider` for this case. It defaults to `mybatis`.

## When To Add A Provider

Create a custom `QueryExecutionProvider` only when datasource changes are not enough:

- The database needs different pagination or sorting syntax.
- Query execution is not MyBatis/JDBC.
- The backend is not SQL, for example a document store or search engine.
- The result mapping or count execution is backend-specific.

## Custom JDBC Provider

For a JDBC database that still uses MyBatis mappers, extend `MybatisQueryExecutionProvider` and override only the behavior that differs:

```java
package com.example.query;

import java.util.Map;

import org.chenile.query.service.impl.MybatisQueryExecutionProvider;
import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class WarehouseQueryProviderConfiguration {

    @Bean
    public MybatisQueryExecutionProvider warehouseQueryExecutionProvider(SqlSessionTemplate sqlSessionTemplate) {
        return new WarehouseQueryExecutionProvider(sqlSessionTemplate);
    }

    static class WarehouseQueryExecutionProvider extends MybatisQueryExecutionProvider {
        WarehouseQueryExecutionProvider(SqlSessionTemplate sqlSessionTemplate) {
            super(sqlSessionTemplate);
        }

        @Override
        public String getProviderName() {
            return "warehouse";
        }

        @Override
        public void applyPagination(Map<String, Object> filters, int startRow, int numRowsInPage) {
            filters.put(PAGINATION_PART, "fetch " + numRowsInPage + " skip " + (startRow - 1));
        }
    }
}
```

Enable it with:

```yaml
query:
  provider: warehouse
```

The provider is selected by `getProviderName()`. Provider names are case-insensitive.

## Non-SQL Provider

For a backend that does not use MyBatis, implement `QueryExecutionProvider` directly:

```java
package com.example.query;

import java.util.List;
import java.util.Map;

import org.chenile.query.model.QueryMetadata;
import org.chenile.query.model.SortCriterion;
import org.chenile.query.service.impl.QueryExecutionProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DocumentQueryProviderConfiguration {

    @Bean
    public QueryExecutionProvider documentQueryExecutionProvider(DocumentQueryClient client) {
        return new DocumentQueryExecutionProvider(client);
    }

    static class DocumentQueryExecutionProvider implements QueryExecutionProvider {
        private final DocumentQueryClient client;

        DocumentQueryExecutionProvider(DocumentQueryClient client) {
            this.client = client;
        }

        @Override
        public String getProviderName() {
            return "document";
        }

        @Override
        public void applySort(Map<String, Object> filters, List<SortCriterion> sortCriteria,
                QueryMetadata queryMetadata) {
            filters.put("sortCriteria", sortCriteria);
        }

        @Override
        public void applyPagination(Map<String, Object> filters, int startRow, int numRowsInPage) {
            filters.put("startRow", startRow);
            filters.put("numRowsInPage", numRowsInPage);
        }

        @Override
        public Object executeCount(String queryName, Map<String, Object> filters) {
            return client.count(queryName, filters);
        }

        @Override
        public List<Object> executeQuery(String queryName, Map<String, Object> filters) {
            return client.search(queryName, filters);
        }
    }
}
```

For a non-MyBatis provider, disable the framework MyBatis infrastructure:

```yaml
query:
  provider: document
  mybatis:
    enabled: false
  definitionFiles: classpath*:query/definitions/*.json
```

The query definition JSON is still used for filter enrichment, security metadata, pagination flags, and response metadata. The custom provider owns the actual backend execution.

