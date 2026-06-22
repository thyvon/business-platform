# Reusable Components Guide

## Purpose

This guide defines how reusable UI components are organized, built, and verified in the web application.

Do not build every possible component in advance. Create a shared component when:

- At least two screens need the same behavior
- Consistency or accessibility justifies a shared primitive
- The component has a clear, business-independent responsibility

Every shared component must be typed, responsive where appropriate, accessible, compatible with Dynamic UI, and tested in proportion to its risk.

## Current Stack

The web application currently uses Next.js App Router, React, strict TypeScript, Tailwind CSS, and Lucide icons.

Always check `apps/web/package.json` before importing a package. React Hook Form, a headless component library, Storybook, and browser component tests are not currently configured. Add dependencies only when an approved component needs them.

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

* Multiple variants
* Multiple sizes
* Loading state
* Disabled state
* Fully typed props

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

* React Hook Form compatible
* Validation support
* Error display

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

* Modern SaaS dashboard design

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

# Coding Standards

## TypeScript

* Strict typing
* No any
* Reusable interfaces
* Generic support where appropriate

## Accessibility

* Proper ARIA labels
* Keyboard navigation
* Screen reader support

## Styling

* Tailwind CSS only
* Use utility function:

```ts
cn(...classes)
```

* Consistent spacing
* Consistent colors
* Dark mode support

## Performance

* Memoize expensive components
* Avoid unnecessary re-renders
* Lazy load heavy components

---

# Deliverables

For each component generate:

1. Component source code
2. Type definitions
3. Example usage
4. Props documentation
5. Accessibility notes
6. Responsive behavior notes

---

# Design System

Create design tokens:

## Colors

* Primary
* Secondary
* Success
* Warning
* Danger
* Info

## Sizes

* xs
* sm
* md
* lg
* xl

## Radius

* sm
* md
* lg
* xl

## Shadows

* sm
* md
* lg
* xl

---

# Final Goal

Produce a reusable component library similar to modern SaaS products and design systems, suitable for enterprise applications, dashboards, admin panels, and business platforms.
