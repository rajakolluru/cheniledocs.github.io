---
title: OAuth2, OIDC and Keycloak
keywords: chenile  security 
sidebar: chenile_sidebar
toc: true
permalink: /oauth2.html
folder: chenile
summary: A quick intro to OAuth2, OIDC and Keycloak
---
No framework can afford to ignore security. No security framework can afford to ignore OAuth2 and of late Open ID Connect (OIDC). There are fantastic discussions in Youtube and elswhere on these topics. We will use this article to brush up these concepts quickly and then discuss Chenile's approach to security. 

First, let us cover some OAuth2 friendly terms though we will take our own liberties here:

Resource
: This is an asset that is worth protecting. Chenile services will be protecting resources such as employees, orders, customers, products etc.

Resource Owner
: The owner of this resource who is typically the user of the software. We use the terms resource owner and user interchageably in this document.  Resource owners own their information, their orders and other resources. Users will be examined for their scope to see if they have the requisite authority to access resources. 

Resource Server
: The service that manages resources. E.g, Order Management software acts as the resource server for the Orders resource. 

Authorization Server or Service
: The service that owns the user information - stuff such as first name, password, email etc. This can also control user roles and the "scopes" that are attached to these roles along with some terms that we will see in this document.

Role
: Multiple users are attached to a role. Roles are in turn attached to scopes. 

Group
: Multiple users can be attached to a group which is then assigned to a role. In this way, we avoid individual assignments. There can be default groups that newly created users can belong to by default. This makes it easy for us to attach roles to new users.

Scope
: The permissions that are typically attached to a role. Scopes define what a user can or cannot do with specific resources. Each resource can potentially define its own scope (e.g, order.write can be a scope that grants write permissions on orders)  Scopes can be mapped to individual users, roles or groups. However, we recommend that scopes be attached to a role as a best practice in Chenile. In Chenile, we also use the word Authorities to denote scopes. Acls or Access Control Lists denote the authorities that are attached to a resource (as opposed to a user). In short, we say that a user can access a resource if their scope (or authorities) map to the ACLS of the resource. 

Client
: A client is a program that gets a token from an authentication server to obtain an access token which will make it possible for the client to access resources in the resource server on behalf of the resource owner. In case of Chenile applications the front end or the BFF(Backend for Frontend) will be the client which will obtain the access token to communicate securely with the backend (resource server)

OAuth2 and OAuth2.1 
: Specifications that define workflows that would enable a resource owner to delegate access to some or all of the scopes to a client. These scopes will enable the client to access the resources protected by a resource manager on behalf of the user. OAuth2.1 is the latest version of OAuth2 spec that deprecates a few flows. Chenile will not honor those flows. (e.g., Implicit flow, Hybrid flow etc.)

OIDC (Open ID Connect)
: Open ID connect is a protocol built on top of OAuth2 that includes authentication in addition to Authorization.

Access Token (aka JWT or JSON Web Token)
: A JWT is a signed bearer key that allows a client to access specific resources that belong to a resouce owner and which are controlled by the resouce server. These resources can be only be accessed in accordance with the scopes that are granted to the client by the resource owner. 

## How does Chenile handle the Access token
It must be remembered that OAuth2 is a **delegation** flow. This means that _resource owners_ can delegate some of their _scopes_ to the _client_ application. However, when we write services we are expecting them to be more than clients with delegated access by the resource owners. Chenile Services are expected to be resource servers as well. Hence it is important to know all the scopes that a user possesses rather than just knowing what the user has delegated.  We treat the access token as a full scope token that contains _all_ the scopes owned by the user (resource owner). This is an important distinction. 

Every Chenile service call must have an access token. Without access tokens, the requests will be denied. If the HTTP Accept header is HTML (i.e. the call came from a browser) then a 302 (Redirection) HTTP status code is sent to redirect the user to an authorization server. The authorization server accepts User ID and password from the user in a HTML form. It might even do things like Two Factor Authorization or can delegated authentication to an Open ID provider. If the user successfully signs in, then the authorization server will redirect the user back to the service with an authorization code which will be exchanged for an access token. Please see the OAuth2 documentation [^1]. We have too many videos on the subject as well [^2]. There is an excellent article [^3] by Okta - the creators of Auth0 on the subject as well. Auth0 has some nice ebooks as well.

## Modular approach to Security
Chenile is obsessed with modularization. We think of security as a feature that can be turned on and off by the inclusion of suitable modules and interceptors. In the absence of these modules, security must not be there. Accordingly, we have modules for security called "chenile-security-api", chenile-security" and "security-interceptor". chenile-security defines basic security contracts whilst the interceptor module builds on top of them to construct a Security interceptor that implements authorization. 

Packaging of security interfaces will be discussed in a separate chapter.

While we understand that HTTP is central to OAuth2 and OIDC flows, it is also true that services must be secured irrespective of the way they are invoked. So we want security to be implemented not just in the HTTP path (by using a Http Filter) but as a generic Chenile interceptor. 

We use a hybrid approach to implement security by leveraging the [Http Security Filter chain](https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/web/SecurityFilterChain.html) of Spring security. We augment this by choosing our own way to implement Role based access control (RBAC), Attributes based Access control (ABAC), Domain access control (where specific domain objects cannot be manipulated by anyone other than their owners) etc.  Please read our articles on these subjects (work in progress) for more details. 

Spring security made it easy to implement authorization using a fluid language. We dig their simplicity. But we feel it comes at an expense. It is not a very modular approach. We use the best parts of Spring security and augment these with our own rules.

## Some Guidelines
_**Service/Operation level Secuirity Policy:**_ We don't want to tightly couple URL patterns and security. We want security to be implemented at a service and operation level. Services must have the ability to choose their own authorities.

_**Security policies reside in the service:**_ We also don't want all authorization rules to be cluttered in one place. This approach makes it too monolithic. Instead, service policies must reside with the respective services. When the services come together all the service policies are combined to implement the overall security. This makes the approach modular. This also facilitates our guideline about separating development from deployment. See our [design principles](/chenile-design-principles.html).

_**Multi-Tenancy:**_ We want to support multi-tenancy out of the box and want to discover new tenants on the fly. Addition of new tenants should not result in changes to application.yml or property files. Instead, we want to make new realms in our authorization server for new tenants using  templates. This means that we cannot employ strategies where we delegate to different client repositories that are created at startup of the application. Instead, we should be able to build these repositories depending on the tenancy. 

## Keycloak as Authorization Server
We picked keycloak as our authorization server. It gives a simple but effective interface to configure realms, users, roles, scopes, groups etc. It is completely open source. Keycloak supports federated user management with support for multiple OIDC providers, LDAP integration, Kerberos integration etc. Here is a running list of some of the features that we have leveraged from Keycloak.

### Tenants as Realms
Each tenant is a realm. As new tenants join, we will create new realms using a realm template. This will ensure that we will implement base policies at the tenant level while giving maximum flexibility to create users, roles, groups etc. This also means that for each tenant, we will have different client repositories (since URLs differ from one realm to the other)

### Applications as Clients
Each Chenile application will be registered as a separate client in Keycloak. It can reuse the same realm as the other applications but can create its own roles and scopes.

### Client Scopes
Client Scopes are the scopes that can be made available to a client in a realm. Users are matched with scopes via roles. Client scopes are configured to be made available in the token so that the client can decide on what services are available to a user. 

### Keycloak Policy Server 
Keycloak supports a policy server for enforcing authorization. We are considering that as an alternative. However, we are not enforcing that currently since we suspect that there may be performance implications if every authorization request is directed back to the Keycloak server. We will test this out before we recommend that as an alternative.

## Backend for Frontend(BFF) for SPA 
BFF is a recommended practice for Single Page Applications(SPA). Please see this video[^4] for instance. In this video, [Dr.Phillippe de Ryck](https://pragmaticwebsecurity.com/about) talks about some best practices of securing the front end with BFF. Chenile uses Spring security to use sessions in lieu of access tokens to secure the backend from XSS[^5] attacks. This does mean that HTTP sessions need to be persisted for maximum scalability. Stateless applications are recommended with persistent user sessions. Alternately, we can use Session based affinity to direct the browser to the same application. 

Keeping security in mind, we will discuss the architecture of a Chenile secured application.

## Architecture
[![Application Architecture](/images/chenile/chenile-security.png)](/images/chenile/chenile-security.png)

The application architecture is shown above. The chief components are explained here. At startup, the BFF enrolls itself as a client to the authorization server and obtains a client secret. 

The user's browser accesses the front end application that is hosted in the assets folder (via an optional reverse proxy). The reverse proxy provides a common entry point to both the APIs and assets.
The APIs are accessed via a BFF (Backend for front end). BFF provides and secures all static assets using the spring boot static controller. The user will be forced to authenticate using keycloak before accessing the static assets. 

Upon first request, the BFF deflects the browser (via a 302 Redirection) to the authorization server. The authorization server validates the user's credentials and generates an authorization code. It then returns a response to the browser and automatically submits the authorization code to the BFF. The BFF uses the authorization code to obtain an access token which it stores in the session. It returns the session ID as a secure cookie back to the browser along with any static asset that has been requested.

From then on, the BFF interacts with the browser using the cookie. It uses the access token that is shared in the session to access the resource server (i.e services). The resource server can validate the token with the authorization server as required.


## References
[^1]: [OAuth2 web site.](https://oauth.net/2/)
[^2]: [You tube videos on OAuth2. (Too many to pick a favorite)](https://www.youtube.com/results?search_query=oauth2)
[^3]: [Auth0 paper on different flows.](https://auth0.com/docs/get-started/authentication-and-authorization-flow/which-oauth-2-0-flow-should-i-use)
[^4]: [BFF for SPA applications video](https://www.youtube.com/watch?v=XoBtUn4XczU&t=12s)
[^5]: [XSS - Cross Site Scripting attacks](https://owasp.org/www-community/attacks/xss/)




