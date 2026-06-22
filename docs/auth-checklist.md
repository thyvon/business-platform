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

- [ ] Recheck current OWASP implementation guidance
- [x] Select and document password-hashing dependency
- [ ] Select and document cookie/session parsing dependency
- [ ] Select and document rate-limit and CSRF approach

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

- [ ] Add typed authenticated principal
- [ ] Add authentication middleware
- [ ] Add permission middleware
- [ ] Add CSRF protection for mutations
- [ ] Protect existing Product API routes
- [ ] Add authorization service tests

### Bootstrap

- [x] Seed stable permission keys
- [x] Seed built-in role definitions
- [x] Create one-time Owner provisioning command
- [ ] Provision the first development Owner with approved real details
- [ ] Test last-Owner protection rules

## Phase 2: Login and Sessions

### API

- [ ] Implement login
- [ ] Implement logout
- [ ] Implement current-session endpoint
- [ ] Implement password change
- [ ] Implement session expiry and cleanup
- [ ] Add login rate limiting and generic errors
- [ ] Add authentication audit events

### Web

- [ ] Create public authentication layout
- [ ] Create accessible login page
- [ ] Add protected application layout
- [ ] Add safe return-path handling
- [ ] Add account menu and logout
- [ ] Add Access Denied and expired-session states

### Tests

- [ ] Add login service tests
- [ ] Add session integration tests
- [ ] Add login/logout browser journey
- [ ] Test keyboard, mobile, dark mode, and Dynamic UI

## Phase 3: User Administration

- [ ] Implement paginated user list API
- [ ] Implement user detail API
- [ ] Implement user update
- [ ] Implement suspend/reactivate
- [ ] Implement role assignment
- [ ] Implement session revocation
- [ ] Create `/settings/users` page
- [ ] Add search, status filter, and role filter
- [ ] Add user action dialogs
- [ ] Add user administration tests

## Phase 4: Roles and Permissions

- [ ] Implement role CRUD API
- [ ] Implement permission assignment API
- [ ] Enforce built-in role protections
- [ ] Create `/settings/roles` page
- [ ] Create permission matrix editor
- [ ] Add permission-aware navigation
- [ ] Add role and permission tests

## Phase 5: Invitations and Recovery

- [ ] Select and configure production email delivery
- [ ] Implement user invitations
- [ ] Implement invitation acceptance
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

Provision the first development Owner with approved real organization and user details.

## Next Step

After provisioning the real Owner, implement the typed principal and authentication middleware.
