# Pro SaaS Design System Guide

This guide outlines the principles and components of the new professional SaaS design system. It's inspired by modern platforms like Vercel and Stripe, focusing on clarity, consistency, and a clean aesthetic.

---

## 1. Core Principles

-   **Clarity First**: The UI should be intuitive and easy to understand. No distracting elements.
-   **Consistency is Key**: All components share a unified visual language.
-   **Whitespace is Essential**: A clean, breathable layout that doesn't feel cluttered.
-   **Subtle Interactivity**: Feedback is provided through subtle shadows and transitions, not flashy animations.

---

## 2. Color System

The color system is based on CSS variables for easy maintenance and theming.

| Variable          | Value     | Usage                               |
| ----------------- | --------- | ----------------------------------- |
| `--background`    | `#f7f8fa` | Main background color for the app   |
| `--foreground`    | `#ffffff` | Background for cards, modals, etc.  |
| `--card-stroke`   | `#e5e7eb` | Subtle borders for cards and inputs |
| `--text-primary`  | `#111827` | Headings and important text         |
| `--text-secondary`| `#6b7280` | Body text and secondary information |
| `--brand`         | `#4f46e5` | Primary brand color for buttons     |
| `--brand-light`   | `#e0e7ff` | Light brand color for active states |
| `--brand-text`    | `#ffffff` | Text on primary brand buttons       |
| `--success`       | `#059669` | Success states and badges           |
| `--warning`       | `#d97706` | Warning states and badges           |
| `--error`         | `#dc2626` | Error states and badges             |

---

## 3. Typography

The design uses the `Inter` font for its excellent readability on screens.

-   **Heading 1 (`<h1>`)**: `2.25rem` (36px), `font-weight: 700` - For main page titles.
-   **Heading 2 (`<h2>`)**: `1.875rem` (30px), `font-weight: 600` - For section titles.
-   **Heading 3 (`<h3>`)**: `1.5rem` (24px), `font-weight: 600` - For sub-section titles.
-   **Body Text (`<p>`)**: `1rem` (16px), `color: var(--text-secondary)` - For all general content.

---

## 4. Components

### Buttons

To use the button styles, apply the `.btn` class. For the primary button, add the `.primary` class.

```html
<!-- Primary Button -->
<button class="btn primary">Create Tournament</button>

<!-- Default Button -->
<button class="btn">View Details</button>
```

### Cards

Cards are simple containers for content. Just use the `.card` class.

```html
<div class="card">
  <div class="p-6">
    <h3>Card Title</h3>
    <p>Card content goes here.</p>
  </div>
</div>
```

### Badges

Badges are used for status indicators.

```html
<span class="badge badge-success">Approved</span>
<span class="badge badge-warning">Pending</span>
<span class="badge badge-error">Rejected</span>
<span class="badge badge-info">Active</span>
```

---

## 5. How to Use

This design system is implemented globally in `src/index.css`. Most styles will be applied automatically to standard HTML elements (`h1`, `button`, etc.). For specific components like cards and badges, use the utility classes defined above.

You can view all components in action on the **[Design System Showcase](/design-showcase)** page.
