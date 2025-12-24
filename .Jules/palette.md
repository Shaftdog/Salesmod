## 2024-05-23 - Native Tooltips vs Tooltip Component
**Learning:** Native `title` attributes on buttons provide poor accessibility (delayed appearance, not customizable, inconsistent screen reader support) compared to the design system's `Tooltip` component.
**Action:** Replace `title` attributes on icon-only buttons with `Tooltip` components, ensuring `aria-label` is preserved on the trigger button for screen readers.
