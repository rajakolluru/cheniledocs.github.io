---
title: Chenile Testing
keywords: shiftleft testing chenile
tags: [shiftleft, introduction, chenile]
sidebar: chenile_sidebar
permalink: /chenile-testing-strategy.html
summary: We explain the concepts of shifting left in testing
---
A test harness must enable users to test early and test often. This should also be combined with modulith principles. We want testing to happen independent of the packaging. Conceptually, there are two types of testing strategies:
1. Strategies that require an environment - such as acceptance testing (whether it is QA, end user etc.), performance testing etc.
2. Strategies that can run on ephemeral environments - such as unit testing, limited integration testing etc.

## Permanent Environments
For testing in an environment, we need to deploy or mock all the required code packages for that environment. If all the code packages are deployed as docker containers, then we need a docker-compose file to instantiate the entire environment. This strategy works well for smaller ecosystems. For large and complex ecosystems, we may have to identify specific mini monoliths and mock them. Otherwise, it can get untenable to provision such complex ecosystems. 

## Ephemeral Environments
Ephemeral environments are created for fully automated tests such as unit tests or integration tests. The test harness for ephemeral environments must not depend on code packages. It should instead be done within the code modules. Code modules do not package their dependencies as stated here in the [design principles](/chenile-design-principles.html). Hence dependencies would not be available for testing. Our code can rely on a few strategies for this:
1. **Mock thy neighbour** - Let us say that service1 depends on service2 which in turn depends on service3. In this scenario, if we have to test service1 then we mock only service2. We do not mock service3. Otherwise, we would end up having to mock a whole slew of services which becomes untenable for complex ecosystems. All ecosystems become complex over a period of time. So we would use wire mock or mockito to mock our immediate dependencies. 
2. **Consume  your dependencies** (Let thy neighbour mock their neighbours) - For certain cohesive ecosystems we may have to work with our neighbours rather than mocking them. In this scenario, we don't mock the neighbours. Instead we consume the actual services. However, our neighbours may have to mock their neighbours. Someone has to do this if you don't want to provision the entire ecosystem!






