## 2026-01-11 - DropdownMenuTrigger and Tooltips
**Learning:** When adding a Tooltip to a DropdownMenuTrigger (like "More options" buttons), you must wrap the `DropdownMenuTrigger` with the `TooltipTrigger`. Both should likely use `asChild` if the underlying element is a Button, to preserve accessibility and styling.
**Action:** Use the following pattern:
```tsx
<DropdownMenu>
  <Tooltip>
    <TooltipTrigger asChild>
      <DropdownMenuTrigger asChild>
        <Button aria-label="Options" ... />
      </DropdownMenuTrigger>
    </TooltipTrigger>
    <TooltipContent>...</TooltipContent>
  </Tooltip>
  ...
</DropdownMenu>
```
