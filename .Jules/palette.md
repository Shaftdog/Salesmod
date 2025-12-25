## 2024-05-23 - Interactive Elements Visibility
**Learning:** Elements using `opacity-0 group-hover:opacity-100` for hover-only visibility are invisible to keyboard users when focused.
**Action:** Always add `focus:opacity-100` (or similar focus styles) to ensure keyboard users can perceive the element when they tab to it.
