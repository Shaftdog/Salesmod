## 2025-05-23 - Dynamic ARIA Labels for Navigation

**Learning:** Navigation buttons (Next/Previous) often lack context when using generic icons. Using dynamic ARIA labels (e.g., "Next month" vs "Next week") based on the current view state significantly improves screen reader experience without cluttering the UI.

**Action:** When implementing view-dependent navigation, always ensure the `aria-label` reflects the current context (view mode, period, etc.) rather than a generic "Next" or "Previous".

**Note on pnpm-lock.yaml:** Always be careful not to commit `pnpm-lock.yaml` if it's not intended to be updated, especially in tasks where the instruction is to avoid large changes.
