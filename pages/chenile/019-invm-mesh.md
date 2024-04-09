---
title: Chenile In VM Service Mesh
keywords: chenile  servicemesh
sidebar: chenile_sidebar
toc: true
permalink: /chenile-service-mesh.html
folder: chenile
summary: Chenile - In VM Service Mesh
---

# In VM Service Mesh
The role of a Service Mesh is to weave the individual micro services into a mesh of services. These services are connected to each other and enforce policies automatically. This allows for separation of concerns between functional and non functional requirements. 

In typical micro services, the horizontal concerns are enforced by other containers that reside within the same VM. Several docker containers exist within a Kubernetes POD. One of the docker containers contains the service code. Other docker containers enforce non functional requirements. This approach suffers from a few limitations:
1. Since the service mesh exists outside the container, it is hard to communicate between the mesh and the service. 
2. This does require a K8S deployment with all its attendant complexity that might not be warranted for small organizations and start ups. In fact, most organizations do not need the scalability to warrant this complexity. 

In Chenile, we advocate that all the horizontal services must be implemented by interceptors that exist in the same VM as the service. They should be packaged together. The interceptors can be developed independently. However when services are deployed, they should be bundled together with the interceptors in deployment scripts. 

This achieves the benefits of the service mesh without its complexity.




