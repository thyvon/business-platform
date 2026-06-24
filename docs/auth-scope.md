# Authentication and Authorization Scope

## Purpose

This document defines the production scope for:

- Login and logout
- Session management
- User list and user administration
- Roles and permissions
- Organization-scoped access control

Authentication answers, “Who is this user?” Authorization answers, “What is this user allowed to do?”

The API is the final security boundary. The web application may hide unavailable actions for usability, but hidden buttons are never a permission check.

## Current State

The project currently has:

- Versioned authentication and authorization database tables
- Seeded stable permissions and built-in role definitions
- One-time Owner provisioning
- Typed API principals with session authentication and permission middleware
- Login, logout, and current-session API endpoints
- Exact Origin or Referer validation on authentication mutations
- Bounded in-memory login throttling for one API instance
- Public web login and server-validated protected application layout
- Current-user display and logout are available in the protected navigation
- Product routes intentionally remain unprotected until route-level authorization is approved
## Decisions

### Account model

- A person has one global user account.
- Access to business data is through an organization membership.
- A membership may have one or more roles.
- Roles belong to an organization.
- Permissions use stable code keys and are seeded by the application.
- Access is denied unless a required permission is explicitly granted.

This supports one organization today without preventing multiple organizations later.

### Authentication method

Phase 1 uses email and password with an opaque server-side session.

- The browser receives only a random session token.
- The database stores a hash of that token, never the raw token.
- Passwords are stored with a modern password-hashing algorithm, never encryption or plain text.
- Do not build custom cryptography.
- Select and configure the password-hashing and session dependencies during implementation, then record the decision.

External OpenID Connect and multi-factor authentication are future extensions. The authorization model must remain independent from the login provider.

### Session cookie

The API uses the focused cookie package to parse the request cookie header. Application code owns session lookup and validation; it does not accept session tokens from URLs, request bodies, or custom headers.

Use one cookie dedicated to authentication:

- Suggested name: `bp_session`
- `HttpOnly`
- `Secure` in production
- `SameSite=Lax`
- `Path=/`
- No user, role, or permission data inside the cookie
- Expiration matching the server-side session
- Twelve-hour default lifetime, configurable through SESSION_TTL_HOURS

Rotate the session token after login and important security changes. Revoke sessions on logout, password reset, suspension, or forced sign-out.

### Request protection

- Keep the browser API path same-origin where possible.
- Keep CORS restricted to the configured web origin.
- State-changing requests require CSRF protection in addition to SameSite cookies.
- Validate `Origin` or `Referer` for browser mutations.
- Never place session or reset tokens in logs.
- Authentication mutations require an exact configured Origin or Referer match.
- Login failures are limited per network and per network-account pair in a bounded 15-minute window.
- The in-memory limiter must use a shared store before the API is horizontally scaled.

## Database Scope

All public IDs remain UUIDs.

### `organizations`

| Column | Purpose |
|---|---|
| `id` | Organization UUID |
| `name` | Display name |
| `status` | `active` or `suspended` |
| `created_at` / `updated_at` | Audit timestamps |

### `users`

| Column | Purpose |
|---|---|
| `id` | User UUID |
| `email` | Normalized login email with a unique index |
| `display_name` | User-facing name |
| `password_hash` | Password hash only |
| `status` | `pending`, `active`, or `suspended` |
| `password_changed_at` | Security and session invalidation |
| `last_login_at` | Operational visibility |
| `created_at` / `updated_at` | Audit timestamps |

Email lookup should use one documented normalization rule. Preserve a display value separately only if the product needs it.

### `organization_memberships`

| Column | Purpose |
|---|---|
| `id` | Membership UUID |
| `organization_id` | Owning organization |
| `user_id` | Member |
| `status` | `invited`, `active`, or `suspended` |
| `created_at` / `updated_at` | Audit timestamps |

Add a unique index on `organization_id + user_id`.

### `roles`

| Column | Purpose |
|---|---|
| `id` | Role UUID |
| `organization_id` | Organization boundary |
| `name` | Organization-unique role name |
| `description` | Administrator guidance |
| `is_system` | Protects required built-in roles |
| `created_at` / `updated_at` | Audit timestamps |

### `permissions`

| Column | Purpose |
|---|---|
| `id` | Permission UUID |
| `key` | Globally unique stable key |
| `description` | Human-readable meaning |
| `module` | UI grouping |

Administrators may assign permissions, but they do not create arbitrary permission keys.

### `role_permissions`

Unique pair: `role_id + permission_id`.

### `membership_roles`

Unique pair: `membership_id + role_id`.

Both records must belong to the same organization. Enforce this in the service layer and with database constraints where practical.

### `sessions`

| Column | Purpose |
|---|---|
| `id` | Session UUID |
| `user_id` | Authenticated user |
| `organization_id` | Active organization for this session |
| `token_hash` | Hash of the random cookie token |
| `expires_at` | Absolute expiry |
| `last_seen_at` | Activity tracking |
| `ip_address` | Optional security metadata |
| `user_agent` | Optional security metadata |
| `revoked_at` | Explicit revocation |
| `created_at` | Creation time |

Expired sessions require scheduled or opportunistic cleanup.

The service must verify that the user has an active membership in `organization_id` when the session is created and on authenticated requests.

### `user_invitations`

Store organization, normalized email, token hash, expiry, inviter, acceptance time, and revocation time. Never store the raw invitation token.

### `invitation_roles`

Store the unique invitation and role pairs requested for the new member. The service must verify that the invitation and roles belong to the same organization.

### `password_reset_tokens`

Store user, token hash, expiry, use time, and creation time. Tokens are single-use and short-lived.

### `audit_events`

Record security-sensitive actions:

- Login success and failure
- Logout and session revocation
- User invitation, activation, suspension, and reactivation
- Role creation, update, deletion, and assignment
- Permission changes
- Password change and reset

Store actor, organization, action, target type, target ID, request ID, timestamp, and safe metadata. Never store passwords or raw tokens.

## Permission Model

Permission keys use `module.action`.

### Initial permissions

| Module | Permissions |
|---|---|
| Dashboard | `dashboard.read` |
| Products | `products.read`, `products.create`, `products.update`, `products.delete` |
| Suppliers | `suppliers.read`, `suppliers.create`, `suppliers.update`, `suppliers.delete` |
| Users | `users.read`, `users.invite`, `users.update`, `users.suspend`, `users.roles.assign` |
| Roles | `roles.read`, `roles.create`, `roles.update`, `roles.delete` |
| Organization | `organization.read`, `organization.update`, `organization.ownership.transfer` |
| Audit | `audit.read` |

Add procurement and inventory permissions when those modules are implemented. Do not grant a broad wildcard permission to normal roles.

### Built-in roles

| Role | Intended access |
|---|---|
| Owner | All organization permissions and ownership protection |
| Administrator | Operational and security administration except ownership-only actions |
| Manager | Business module management without user or role administration |
| Viewer | Read-only access to permitted business modules |

Built-in roles provide safe defaults. Organizations may create custom roles.

### Default role matrix

| Permission group | Owner | Administrator | Manager | Viewer |
|---|:---:|:---:|:---:|:---:|
| Dashboard read | Yes | Yes | Yes | Yes |
| Product read | Yes | Yes | Yes | Yes |
| Product create/update/delete | Yes | Yes | Yes | No |
| Supplier read | Yes | Yes | Yes | Yes |
| Supplier create/update/delete | Yes | Yes | Yes | No |
| User read/invite/update/suspend | Yes | Yes | No | No |
| Assign user roles | Yes | Yes | No | No |
| Role read/create/update/delete | Yes | Yes | No | No |
| Organization read/update | Yes | Yes | No | No |
| Transfer organization ownership | Yes | No | No | No |
| Audit read | Yes | Yes | No | No |

This matrix is seed data, not hardcoded UI logic. Permission keys remain the source of truth.

### Authorization rules

- Authorization checks use the active membership and its effective permissions.
- A suspended user, organization, or membership has no access.
- A user cannot grant permissions they do not effectively hold.
- A role from one organization cannot be assigned in another.
- The last active Owner cannot be removed, suspended, or demoted.
- Users cannot suspend themselves through the normal user-management action.
- Role deletion is blocked while assigned unless assignments are safely migrated.
- Permission changes take effect on the next API request or after a short, documented cache lifetime.

## API Scope

All endpoints use `/api/v1` and the existing success/error response conventions.

### Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/login` | Verify credentials and create a session |
| POST | `/auth/logout` | Revoke the current session and clear the cookie |
| GET | `/auth/me` | Return the current user, organization, roles, and permissions |
| POST | `/auth/change-password` | Change the authenticated user's password |
| POST | `/auth/forgot-password` | Request a reset without revealing account existence |
| POST | `/auth/reset-password` | Consume a single-use reset token |

Login responses and timing must not reveal whether an email exists. Add rate limiting by account and network source, with safe backoff rather than an easy denial-of-service lockout.

### Users

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/users` | `users.read` |
| GET | `/users/:id` | `users.read` |
| POST | `/users/invitations` | `users.invite` |
| PATCH | `/users/:id` | `users.update` |
| POST | `/users/:id/suspend` | `users.suspend` |
| POST | `/users/:id/reactivate` | `users.suspend` |
| PUT | `/users/:id/roles` | `users.roles.assign` |
| POST | `/users/:id/revoke-sessions` | `users.update` |

`GET /users` supports server-side search, status filtering, role filtering, pagination, and stable sorting.

### Roles

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/roles` | `roles.read` |
| POST | `/roles` | `roles.create` |
| GET | `/roles/:id` | `roles.read` |
| PATCH | `/roles/:id` | `roles.update` |
| PUT | `/roles/:id/permissions` | `roles.update` |
| DELETE | `/roles/:id` | `roles.delete` |
| GET | `/permissions` | `roles.read` |

### Middleware flow

`authenticate`:

1. Read the session cookie.
2. Hash the token and find an active, unexpired session.
3. Load the active user and organization membership.
4. Attach a typed principal to the request context.
5. Reject missing or invalid sessions with `401 AUTHENTICATION_REQUIRED`.

`authorize(permission)`:

1. Require an authenticated principal.
2. Check the effective permission inside the active organization.
3. Reject missing permission with `403 PERMISSION_DENIED`.

Repositories load data, services enforce security rules, and routes translate HTTP. Keep permission policy out of React components and repositories.

### Existing route protection

Apply authorization to the current Product API when authentication is enabled:

| Method | Endpoint | Access |
|---|---|---|
| GET | `/health` | Public operational endpoint with no sensitive data |
| GET | `/products` and `/products/:id` | `products.read` |
| POST | `/products` | `products.create` |
| PATCH | `/products/:id` | `products.update` |
| DELETE | `/products/:id` | `products.delete` |

New business routes must declare their required permission during route creation. A route with no declared policy must be treated as protected by default unless it is explicitly registered as public.

## Web Scope

### Public authentication layout

Authentication routes use a small public layout without the protected sidebar.

#### `/login`

- Email and password fields
- Show/hide password control
- Submit loading and disabled states
- Generic invalid-credentials message
- Forgot-password link only when the reset flow is available
- Accessible validation summary
- Safe redirect to an allowed internal path
- Redirect authenticated users to the dashboard

Do not add public self-registration in Phase 1. New users join through an administrator invitation.

### Protected application layout

- Resolve the current session on the server before rendering protected pages.
- Redirect unauthenticated users to `/login`.
- Preserve only a validated internal return path.
- Show the current user and organization in the navigation.
- Provide logout from the account menu.
- Filter navigation using permissions for usability.
- Continue enforcing every permission in the API.

### `/settings/users`

User list requirements:

- Search by name or email
- Filter by status and role
- Server-side pagination
- Columns: user, status, roles, last login, created date, actions
- Invite user action
- View/edit user action
- Assign roles
- Suspend/reactivate
- Revoke sessions
- Clear empty, loading, and error states
- Mobile presentation that preserves essential data

Actions appear only when the current user has the relevant permission.

### `/settings/roles`

- List built-in and custom roles
- Create and edit custom roles
- Group permissions by module
- Explain each permission in plain language
- Show member count
- Prevent unsafe deletion
- Clearly mark protected system roles
- Warn before security-sensitive permission changes

### Unauthorized and expired states

- `401`: redirect to login and clear unusable local session state.
- `403`: show an Access Denied page without exposing protected data.
- Expired session during a mutation: keep non-sensitive form input where practical and ask the user to log in again.

## Bootstrap and Invitations

The first Owner must be created through a one-time provisioning command, not a public registration endpoint.

The command should:

- Refuse to run when an Owner already exists unless explicitly designed for recovery
- Prompt securely for credentials or accept them through a protected deployment mechanism
- Avoid printing the password
- Create the organization, user, membership, Owner role, and audit event transactionally

Run the command from the repository root:

```powershell
npm run db:provision-owner
```

In an interactive terminal it asks for organization name, Owner email, display name, and a hidden password with confirmation.

For protected non-interactive deployment, supply `BOOTSTRAP_ORGANIZATION_NAME`, `BOOTSTRAP_OWNER_EMAIL`, `BOOTSTRAP_OWNER_NAME`, and `BOOTSTRAP_OWNER_PASSWORD` only as temporary process environment variables. Do not save the Owner password in `.env`, shell history, deployment logs, or source control.

The command refuses to run after an organization exists. Permission definitions can be safely synchronized separately with:

```powershell
npm run db:seed-auth
```

Normal users are invited:

1. Administrator submits email and roles.
2. API creates a short-lived hashed invitation token.
3. Email sends a one-time setup link.
4. User chooses a password.
5. API activates the user and membership transactionally.

Email delivery is required before invitation and password-reset flows can be called production-ready.

## Shared Contracts

Add Zod schemas and inferred types for:

- Login input and current-session response
- User list query and paginated response
- Invitation and user update input
- Role create/update input
- Role assignment and permission assignment
- Password change and reset input

Never include `password_hash`, session token hashes, or reset token hashes in API response types.

## Suggested Module Structure

```txt
apps/api/src/
├── modules/
│   ├── auth/
│   │   ├── auth.repository.ts
│   │   ├── auth.service.ts
│   │   └── auth.routes.ts
│   ├── users/
│   └── roles/
└── shared/
    └── auth/
        ├── authenticate.ts
        ├── authorize.ts
        └── principal.ts

apps/web/src/
├── app/
│   ├── (auth)/login/
│   └── (protected)/settings/
│       ├── users/
│       └── roles/
└── features/
    ├── auth/
    ├── users/
    └── roles/
```

## Security Requirements

- Passwords never appear in logs, analytics, URLs, or audit metadata.
- Use generic login and password-reset responses.
- Rate-limit login, reset, and invitation endpoints.
- Validate all redirect targets.
- Revoke sessions after password reset and suspension.
- Do not expose whether a user exists through public endpoints.
- Do not trust organization IDs, roles, or permissions submitted by the browser.
- Scope every business query by the authorized organization before multi-tenant data is enabled.
- Record security mutations in the audit log.
- Secrets belong in environment or secret management, never source control.
- Production authentication requires HTTPS.

MFA, recovery codes, trusted devices, and enterprise SSO are out of Phase 1, but should be planned before serving higher-risk clients.

## Testing Scope

### Unit and service tests

- Correct password verifies; incorrect password fails generically.
- Expired, revoked, and unknown sessions fail.
- Effective permissions combine assigned roles.
- Cross-organization role assignment fails.
- Last Owner protections work.
- Suspended users and memberships lose access.
- Invitation and reset tokens are single-use and expire.

### API integration tests

- Login sets the correct cookie attributes.
- Logout revokes the server session and clears the cookie.
- Unauthenticated requests return `401`.
- Unauthorized requests return `403`.
- Authorized requests succeed.
- CSRF protection blocks invalid mutation requests.
- User and role queries cannot cross organization boundaries.
- Validation errors follow the shared API format.

### Browser tests

- Login success, failure, logout, and session expiry
- Protected-route redirect
- User search, filtering, pagination, invitation, and suspension
- Role creation and permission editing
- Access Denied behavior
- Keyboard-only login and administration
- Mobile, light mode, dark mode, and Dynamic UI options

## Implementation Phases

### Phase 1: foundation

- Approve authentication dependencies
- Add database schema and migration
- Seed permissions and built-in roles
- Add shared contracts
- Add principal, authentication, authorization, and CSRF middleware
- Add bootstrap Owner command

### Phase 2: login and sessions

- Login, logout, and current-session API
- Protected web layout
- Login page and logout action
- Session cleanup and security audit events

### Phase 3: users

- User list and detail APIs
- User list page
- Suspension, reactivation, role assignment, and session revocation
- Invitation flow after email delivery is available

### Phase 4: roles and permissions

- Role and permission APIs
- Role list and editor
- Built-in role protections
- Permission-aware navigation

### Phase 5: recovery and hardening

- Forgot/reset password
- Full rate-limit policy
- Security event monitoring
- Playwright journeys
- MFA and external identity-provider decision

Do not start with the pages alone. Complete each vertical slice through database, contracts, API enforcement, web UI, and tests.

## Phase 1 Acceptance Criteria

The initial auth release is complete when:

- A provisioned Owner can log in and log out.
- Unauthenticated users cannot render or call protected areas.
- Permission checks protect API routes.
- Owners can view users and manage roles safely.
- The last Owner cannot be removed or suspended.
- Sessions are revocable and expire correctly.
- Passwords and raw tokens never enter the database or logs.
- Security actions create audit events.
- Lint, type-check, tests, and production builds pass.
- Critical browser journeys pass.

## Out of Scope for the First Release

- Public registration
- Social login
- Enterprise SSO
- MFA and recovery codes
- User impersonation
- API keys
- Fine-grained record ownership rules
- Cross-organization administration

These require separate threat modeling and acceptance criteria.

## Security References

Use the current OWASP Authentication, Session Management, Password Storage, and CSRF Prevention Cheat Sheets during implementation. OWASP session, authorization, and CSRF guidance was rechecked before implementing the authentication boundary. Dependency-specific settings must still be reviewed during production hardening.
