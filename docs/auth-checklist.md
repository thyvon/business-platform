# Authentication Implementation Checklist

This is the living progress tracker for [Authentication and Authorization Scope](./auth-scope.md).

## Status Key

- [x] Completed and verified
- [ ] Not completed

Only mark work complete after its relevant validation passes.

## Phase 0: Scope

- [x] Define authentication and authorization scope
- [x] Define organization-scoped roles and permissions
- [x] Define API and web page boundaries
- [x] Create this implementation checklist

## Phase 1: Foundation

### Security decisions

- [x] Recheck current OWASP implementation guidance
- [x] Select and document password-hashing dependency
- [x] Select and document cookie/session parsing dependency
- [x] Select and document rate-limit and CSRF approach

### Database

- [x] Add organizations and users
- [x] Add organization memberships
- [x] Add roles, permissions, and assignment tables
- [x] Add server-side sessions
- [x] Add invitations and password reset tokens
- [x] Add security audit events
- [x] Generate migration
- [x] Review generated SQL
- [x] Pass workspace type-check and existing tests
- [x] Pass API and web production compilation
- [x] Apply migration to the development database
- [x] Verify migration on an empty database

### Shared contracts

- [x] Add authentication schemas and types
- [x] Add user administration schemas and types
- [x] Add role and permission schemas and types
- [x] Add contract unit tests

### Authorization foundation

- [x] Add typed authenticated principal
- [x] Add authentication middleware
- [x] Add permission middleware
- [x] Add CSRF protection for authentication mutations
- [ ] Protect existing Product API routes
- [x] Add authorization service tests

### Bootstrap

- [x] Seed stable permission keys
- [x] Seed built-in role definitions
- [x] Create one-time Owner provisioning command
- [x] Provision the first development Owner with approved real details
- [ ] Test last-Owner protection rules

## Phase 2: Login and Sessions

### API

- [x] Implement login
- [x] Implement logout
- [x] Implement current-session endpoint
- [x] Implement password change
- [x] Implement session expiry and cleanup
- [x] Add login rate limiting and generic errors
- [x] Add authentication audit events

### Web

- [x] Create public authentication layout
- [x] Create accessible login page
- [x] Add protected application layout
- [x] Add safe return-path handling
- [x] Add account menu and logout
- [x] Add Access Denied and expired-session states

### Tests

- [x] Add login service tests
- [x] Add session integration tests
- [ ] Add login/logout browser journey
- [ ] Test keyboard, mobile, dark mode, and Dynamic UI

## Phase 3: User Administration

- [x] Implement paginated user list API
- [x] Implement user detail API
- [x] Implement user update
- [x] Implement suspend/reactivate
- [x] Implement role assignment
- [x] Implement session revocation
- [x] Create `/settings/users` page
- [x] Add search, status filter, and role filter
- [x] Add user action dialogs
- [ ] Add user administration tests

## Phase 4: Roles and Permissions

- [x] Implement role list API (GET /roles, GET /roles/:id)
- [x] Implement permission list API (GET /permissions)
- [x] Implement role create/update/delete API
- [x] Implement permission assignment API
- [ ] Enforce built-in role protections
- [x] Create `/settings/roles` page
- [x] Create permission matrix editor
- [x] Add permission-aware navigation
- [ ] Add role and permission tests

## Phase 5: Invitations and Recovery

- [x] Select and configure production email delivery
- [x] Implement user invitations
- [x] Implement invitation acceptance
- [ ] Implement forgot-password request
- [ ] Implement password reset
- [ ] Revoke sessions after password reset
- [ ] Add invitation and recovery tests

## Phase 6: Production Hardening

- [ ] Resolve or formally assess the current moderate Next.js transitive PostCSS advisory
- [ ] Review HTTPS and cookie configuration
- [ ] Review CORS and CSRF configuration
- [ ] Review rate limits
- [ ] Review audit event coverage
- [ ] Add expired-record cleanup job
- [ ] Run dependency and security review
- [ ] Run complete Playwright auth suite
- [ ] Test organization isolation
- [ ] Prepare MFA and external identity-provider decision

## Current Step

Implement forgot-password request and password reset flow.

## Next Step

Phase 6: Production hardening — security review, rate limits, audit, tests.
