# Architecture

## Principles

1. **Modular monolith first.** Product, supplier, procurement, and inventory modules stay independently organized while sharing one deployment and database. Split into microservices only when operational evidence justifies it.
2. **Contracts at boundaries.** Zod validates untrusted HTTP input; TypeScript types are inferred from the same schemas.
3. **Business logic is framework-independent.** Express routes translate HTTP, services enforce rules, and repositories own persistence.
4. **Schema changes are versioned.** Production never relies on automatic table alteration during server startup.
5. **Server Components by default.** Next.js Client Components are limited to interactive browser behavior.
6. **Secure defaults.** Helmet, explicit CORS, body limits, environment validation, opaque errors, request IDs, and no framework disclosure.

## Dependency direction

```text
Next.js UI → shared contracts ← Express routes
                                  ↓
                              services
                                  ↓
                            repositories
                                  ↓
                         Drizzle schema/MySQL
```

A lower layer must not import a higher layer. Database code never imports Express, and shared contracts never import application code.

## API conventions

- All business endpoints begin with `/api/v1`.
- Successful responses use `{ "data": ... }`.
- Failures use `{ "error": { "code", "message", "requestId", "details?" } }`.
- Validation failures return HTTP 422; conflicts return 409; missing records return 404.
- IDs are UUIDs rather than timestamps or sequential public identifiers.

## Recommended next capabilities

- Authentication: Auth.js or an external OpenID Connect provider
- Authorization: organization-scoped roles and explicit permissions
- Auditing: append-only audit events for approvals and financial changes
- Background work: a job queue for imports, notifications, and document processing
- Object storage: Cloudinary or S3-compatible storage behind an integration interface
- Testing: Vitest for services/contracts and Playwright for critical user journeys
- Observability: OpenTelemetry traces, centralized structured logs, uptime monitoring

## Deployment

The web and API are independently deployable workspaces. Production should use managed MySQL, HTTPS, secret management, backups, and a migration step before API rollout. XAMPP is local development only.
