# Reusable Components Guide

## Purpose

This guide defines how reusable UI components are organized, built, and verified in the web application.

Do not build every possible component in advance. Create a shared component when:

- At least two screens need the same behavior
- Consistency or accessibility justifies a shared primitive
- The component has a clear, business-independent responsibility

Every shared component must be typed, responsive where appropriate, accessible, compatible with Dynamic UI, and tested in proportion to its risk.

## Current Stack

The web application uses Next.js App Router, React 19, strict TypeScript, Tailwind CSS v4, Lucide icons, and **shadcn/ui** (Base UI variant).

shadcn/ui provides the UI primitives: `Button`, `Input`, `Label`, `Card`, `Sheet`, `Progress`. These use `@base-ui/react` for headless behavior. Always check `apps/web/package.json` before importing additional packages. React Hook Form, Storybook, and browser component tests are not currently configured.

## Project Structure

Use the existing structure:

```txt
apps/web/src/
├── app/                         # Routes and route-level Server Components
├── components/
│   ├── ui/                      # Generic UI primitives
│   └── layout/                  # App shell, navbar, sidebar, and footer
├── features/
│   └── <feature>/
│       └── components/          # Business feature components
├── hooks/                       # Truly shared client hooks
├── lib/                         # Utilities, contexts, and API helpers
└── types/                       # Types shared by unrelated features
```

Examples:

- `components/ui/button.tsx` is generic and reusable.
- `components/layout/sidebar.tsx` belongs to the application shell.
- `features/products/components/product-form.tsx` belongs to product management.
- Product-specific components must not be placed in `components/ui`.

Prefer colocating helpers, types, and tests with the feature that owns them. Add another folder only when the number of files makes it useful.

## Component Levels

### UI primitives

Small components with no business knowledge: buttons, form controls, cards, feedback elements, and accessible overlays.

### Shared application components

Components used across routes but coupled to this application: the app shell, navigation, page headers, empty states, error states, and pagination.

### Feature components

Components that understand business concepts, such as ProductForm, SupplierTable, or InventoryAdjustmentDialog.

Feature components may compose UI primitives. UI primitives must never import feature components.

## Server and Client Components

Follow the architecture rule: use Server Components by default.

Add `"use client"` only for browser behavior such as state, effects, event handlers, browser storage, DOM measurement, or a client-only context. Keep the client boundary small; move isolated interactions into focused child components.

## Component API Standards

Each reusable component should:

- Export a clear props type
- Extend relevant native HTML attributes when practical
- Accept `className` for layout-level customization
- Forward supported accessibility attributes
- Use controlled and uncontrolled APIs consistently
- Use clear variants such as `primary`, `secondary`, `danger`, and `ghost`
- Use a small size set such as `sm`, `md`, and `lg`
- Provide safe defaults
- Avoid boolean combinations that create invalid states

Prefer composition over one component with dozens of options. Do not use `any` in a public API; use `unknown` for untrusted values and narrow it safely.

## Planned Component Catalog

This catalog is a roadmap, not an instruction to generate everything at once. Implement components only when a real workflow needs them.

### Basic

Candidates:

* Button
* IconButton
* Input
* Textarea
* Select
* Checkbox
* RadioGroup
* Switch
* Label
* Badge
* Avatar

Requirements:

* Variants and sizes only when they serve a real use case
* Loading and disabled states where the control supports them
* Native HTML props and accessibility attributes
* Fully typed public props

---

### Layout

Candidates:

* Card
* Container
* Divider
* Stack
* Grid
* Accordion
* Collapsible

Requirements:

* Responsive
* Customizable spacing
* Tailwind utility support

---

### Navigation

Candidates:

* Navbar
* Sidebar
* Breadcrumb
* Tabs
* Pagination
* Dropdown Menu

Requirements:

* Mobile support
* Keyboard navigation
* Accessible

---

### Feedback

Candidates:

* Alert
* Toast
* Progress Bar
* Spinner
* Skeleton Loader
* Empty State
* Error State

Requirements:

* Multiple variants
* Success
* Warning
* Error
* Info

---

### Overlays

Candidates:

* Dialog
* Confirmation Dialog
* Drawer
* Popover
* Tooltip

Requirements:

* ESC close
* Click outside close
* Focus trap
* Accessibility support

---

### Forms

Candidates:

* Form Wrapper
* Form Field
* Search Input
* Combobox
* Multi Select
* Date Picker
* Date Range Picker
* File Upload
* OTP Input

Requirements:

* Native props and ref compatibility
* Accessible validation and error display
* Form-library adapters only after that library is approved and installed

---

### Data Display

Candidates:

* Table
* Data Table
* List
* Timeline
* Statistics Card
* Chart Container
* Carousel

Requirements:

* Sorting
* Filtering
* Pagination
* Responsive

---

### Dashboard Components

Candidates:

* KPI Card
* Analytics Card
* Activity Feed
* Notification Panel
* User Profile Card
* Quick Action Card

Requirements:

* Stored inside the feature that owns the business data
* Composed from shared primitives rather than duplicated styling
* Clear loading, empty, error, and populated states

---

### Utility Components

Candidates:

* Theme Toggle
* Language Switcher
* Copy Button
* Back Button
* Scroll To Top
* Page Header
* Section Header

---

## Class Name Utility

Available at `@/lib/utils` — `cn(...inputs: ClassValue[])` joins conditional classes and resolves conflicting Tailwind classes using `clsx` and `tailwind-merge`. Used by all shadcn components. Import it when building variant-based components.

## Dynamic UI and Styling

Use Tailwind CSS first. Shared CSS variables are allowed and required for Dynamic UI.

### Accent colors

The Dynamic UI provider remaps Tailwind's `indigo-*` variables to the selected accent palette.

- Use `indigo-*` for primary actions, active navigation, focus indicators, and brand accents.
- Use `emerald-*` for success, `amber-*` for warnings, and `red-*` for errors or destructive actions.
- Do not hardcode brand hex colors in reusable components.
- Do not use a semantic success color as a general accent.

### Corner radius

Use Tailwind classes such as `rounded-lg`, `rounded-xl`, and `rounded-2xl`. Dynamic UI changes their shared radius variables.

Avoid fixed inline radius values except for documented shapes such as a circular avatar.

### Themes and surfaces

Check every visual component in light and dark mode.

- Page: slate 50 / slate 950
- Card or overlay: white / slate 900
- Border: slate 200 / slate 700
- Muted text: slate 500 / slate 400

A shared component must contain its required dark-mode styles. Callers should not need to repair it.

### Responsive behavior

Design for the smallest screen first. Components must not assume desktop width. Tables, forms, navigation, and overlays require an explicit narrow-screen behavior.

## Accessibility

Target WCAG 2.2 Level AA.

All components require:

- Semantic HTML before ARIA
- Visible keyboard focus
- Keyboard access to every action
- Accessible names for icon-only controls
- Correct disabled behavior
- Sufficient contrast
- Zoom and narrow-screen support
- Reduced motion for nonessential animation

Form controls must connect labels, descriptions, and errors using stable IDs and appropriate ARIA attributes. Color must not be the only status indicator.

### Dialog and Drawer

Overlays require:

- Dialog semantics and an accessible title
- Escape closing when dismissal is allowed
- Safe outside-click behavior
- Initial focus placement and focus trapping
- Focus restored to the trigger after closing
- Background interaction disabled
- Page scrolling locked
- Correct stacking and mobile sizing

Popover, Tooltip, Dropdown Menu, and Dialog are different interaction patterns. Do not implement all of them as renamed modals.

### Progress and loading

A determinate Progress component must expose its value to assistive technology. A decorative route progress bar should be hidden from screen readers when it does not communicate meaningful progress.

## Forms

Build native, accessible foundations first:

1. Label
2. Input and Textarea
3. Select and Checkbox
4. Field wrapper with description and error
5. Form-level error summary

Add Combobox, Multi Select, Date Picker, File Upload, and OTP Input only for a real workflow with acceptance criteria.

If React Hook Form is adopted, keep basic inputs compatible with native props and refs instead of tightly coupling them to the library.

File Upload needs security rules beyond its visual component: file type, size, storage, authorization, and malware handling.

## Data Display

Keep `Table` separate from `DataTable`:

- `Table` supplies accessible markup and styling.
- `DataTable` adds sorting, filtering, selection, and pagination.

Responsive data must preserve important values, expose keyboard-accessible sorting, and support loading, empty, error, and populated states. Prefer server-side sorting and pagination for large datasets.

Charts need a text summary or accessible data alternative. Color alone must not communicate values.

## Avoid Duplicate Components

- Use `Toast` rather than duplicating it as `Snackbar`.
- Use `Dialog` as the primitive; `ConfirmationDialog` may compose it.
- Use `Table` for structure and `DataTable` for behavior.
- Use `Spinner` for an indeterminate wait and `Progress` for measurable progress.
- Keep `Card` generic; KPI and analytics cards belong to their feature.

Search the repository before creating a component.

## Performance

Measure before optimizing. Avoid unnecessary client boundaries and re-renders, and lazy-load genuinely heavy components. Do not add memoization automatically; it adds complexity and should solve an observed problem.

## Testing Strategy

The web workspace does not yet have a complete component-test setup. Until it does, lint, type-check, production build, and careful keyboard testing are the minimum checks.

When testing tools are added, use:

- Unit tests for variants and pure utilities
- Component tests for interaction, keyboard use, and accessibility
- Playwright for critical user journeys
- Visual checks at mobile and desktop widths
- Checks for light mode, dark mode, and every Dynamic UI option

High-risk components such as Dialog, Drawer, Combobox, File Upload, and DataTable need stronger tests than a static Card.

## Component Documentation

Document each shared component with:

1. Purpose and import path
2. Basic compiling example
3. Props, sizes, and variants
4. Controlled or uncontrolled behavior
5. Accessibility behavior
6. Responsive behavior
7. Dynamic UI and dark-mode behavior
8. Relevant loading, empty, error, and disabled states

Do not document an API that has not been implemented.

## Implementation Roadmap

### Phase 1: foundations

- `cn` utility
- Button and IconButton
- Label, Input, Textarea, Select, and Checkbox
- Card, Badge, Alert, Spinner, and Skeleton

### Phase 2: application patterns

- PageHeader and Breadcrumbs
- EmptyState and ErrorState
- FormField and validation display
- Pagination

### Phase 3: accessible overlays

- Dialog and ConfirmationDialog
- Complete the existing Drawer's focus management
- Add Dropdown Menu, Popover, and Tooltip as workflows require them

### Phase 4: business data

- Table
- DataTable for the first real listing workflow
- Search and filtering controls

### Phase 5: advanced controls

- Combobox and Multi Select
- Date Picker and Date Range Picker
- File Upload
- Toast system

Implement, review, and reuse each foundation before building the next layer.

## Current Inventory

UI primitives (shadcn/ui — `@base-ui/react`):

```txt
apps/web/src/components/ui/
├── button.tsx           # Variants: default, outline, secondary, ghost, destructive, link
├── card.tsx             # Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
├── input.tsx            # Base UI input with focus and disabled states
├── label.tsx            # Accessible label with peer-disabled styling
├── progress.tsx         # Progress, ProgressTrack, ProgressIndicator, ProgressLabel, ProgressValue
├── progress-bar.tsx     # Route-level navigation progress bar (decorative only)
└── sheet.tsx            # Overlay drawer with focus trap, ESC close, and backdrop
```

Layout components are in `apps/web/src/components/layout/`. Feature-specific UI is in `apps/web/src/features/<feature>/components/`.

When adding new shadcn components:

```bash
cd apps/web
npx shadcn@latest add <component-name>
```

Update this inventory whenever components are added or removed.

## Definition of Done

A reusable component is complete when:

- Its responsibility and folder are clear
- TypeScript and ESLint pass
- Keyboard interaction and semantics are correct
- Mobile and desktop behavior are verified
- Light and dark mode work
- Every Dynamic UI accent and radius option works
- Relevant loading, error, empty, and disabled states are handled
- Documentation includes a compiling example
- Tests match the component's risk
- The production build passes

Production readiness comes from a small, dependable system—not from the number of components in the library.
