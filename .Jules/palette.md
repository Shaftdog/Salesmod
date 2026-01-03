## 2024-05-23 - Task Card Accessibility
**Learning:** Elements that use `opacity-0` and `group-hover:opacity-100` for reveal-on-hover effects are invisible to keyboard users when they receive focus. This is a common accessibility trap.
**Action:** Always pair `group-hover:opacity-100` with `focus:opacity-100` (or similar focus styles) to ensure keyboard users can see what they are focusing on.
