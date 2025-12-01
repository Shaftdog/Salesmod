# Template Name Input Field Investigation Report

**Date**: 2025-11-25
**Issue**: Template Name input field not accepting keyboard input
**Location**: `/production/templates` - Create Production Template dialog

---

## Executive Summary

The Template Name input field in the "Create Production Template" dialog **IS NOT ACCEPTING ANY KEYBOARD INPUT** despite appearing functional. The field is visible, enabled, focusable, and receives focus when clicked, but neither Playwright's `.type()` method nor direct `page.keyboard.type()` can input text into it.

**Critical Finding**: This is likely caused by a **React Hook Form registration issue or event handler conflict**, NOT a UI/DOM issue.

---

## Test Methodology

Automated browser testing using Playwright with the following approach:
1. Navigate to templates page
2. Open "Create Production Template" dialog
3. Attempt to type in Template Name field using multiple methods
4. Check DOM state, focus, overlays, and attributes
5. Compare with Description field (which works correctly)
6. Capture screenshots at each step

---

## Detailed Findings

### 1. Visual State - PASSES
- Input field is visible: ✅ **true**
- Input field is enabled: ✅ **true**
- Input field is editable: ✅ **true**
- No `disabled` attribute: ✅ **true**
- No `readonly` attribute: ✅ **true**

### 2. Focus Behavior - PASSES
- Input is focusable: ✅ **true**
- Input receives focus on click: ✅ **true**
- Active element after click: ✅ **INPUT#name**
- No overlaying elements blocking interaction: ✅ **true**

### 3. DOM Structure - NORMAL

```json
{
  "input": {
    "tagName": "INPUT",
    "id": "name",
    "name": "name",
    "type": null,
    "placeholder": "e.g., Standard Residential Appraisal",
    "value": "",
    "disabled": false,
    "readOnly": false,
    "tabIndex": null
  },
  "parent": {
    "tagName": "DIV",
    "className": "space-y-2"
  }
}
```

### 4. Overlay Check - NO ISSUES

```json
{
  "elementAtCenter": {
    "isInput": true,
    "tagName": "INPUT"
  },
  "zIndex": "auto",
  "position": "static",
  "pointerEvents": "auto"
}
```

No elements are overlaying the input field.

### 5. Keyboard Input - FAILS ❌

**Test 1: Playwright `.type()` method**
- Command: `await templateNameInput.type('Test Template')`
- Result: ❌ **Empty string** (value: "")

**Test 2: Direct keyboard events**
- Command: `await page.keyboard.type('Direct Keyboard Test')`
- Result: ❌ **Empty string** (value: "")

**Comparison: Description field**
- Command: `await descriptionInput.fill('Test Description')`
- Result: ✅ **"Test Description"** (WORKS!)

### 6. Dialog State - NORMAL

- Dialog count: 1
- No nested dialogs present when testing
- Form nesting: 1 form element (expected)

### 7. Console Errors - NONE

No JavaScript errors or warnings observed during testing.

---

## Root Cause Analysis

### What's NOT the problem:

1. ❌ **DOM/CSS Issues**: Element is not disabled, readonly, or hidden
2. ❌ **Overlay/z-index**: No elements blocking the input
3. ❌ **Focus trap**: Input receives and maintains focus correctly
4. ❌ **Nested dialogs**: Library picker dialog was already fixed with `if (!open) return null`
5. ❌ **Browser/Playwright issues**: Description field works fine with same methods
6. ❌ **Template Editor implementation**: Correct use of `form.register('name')`

### What IS the problem:

✅ **EXACT ROOT CAUSE: Input component forces controlled value prop**

**File**: `src/components/ui/input.tsx` (line 16)

```tsx
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, value, ...props }, ref) => {
    return (
      <input
        type={type}
        className={...}
        ref={ref}
        value={value ?? ""}  // ⚠️ THIS IS THE PROBLEM
        {...props}
      />
    )
  }
)
```

**The bug**: The Input component extracts `value` from props and forces `value={value ?? ""}` on the underlying `<input>` element. This creates a **controlled input with an empty string value**.

**Why it breaks React Hook Form**:
- React Hook Form's `register()` does NOT pass a `value` prop
- React Hook Form uses **uncontrolled inputs** and manages state via `ref` and event handlers
- By forcing `value={value ?? ""}`, the Input component overrides React Hook Form's onChange handler
- The input displays an empty string and cannot be changed because the value prop is controlled but never updated

**Why Textarea works**:

`src/components/ui/textarea.tsx` does NOT force a value prop:

```tsx
const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({className, ...props}, ref) => {
    return (
      <textarea
        className={...}
        ref={ref}
        {...props}  // ✅ Just spreads props, doesn't force value
      />
    );
  }
);
```

This allows React Hook Form to control the textarea as an uncontrolled component, which works correctly.

---

## Evidence Screenshots

1. **01-initial-page.png** - Templates page before opening dialog
2. **02-dialog-opened.png** - Dialog open with empty Template Name field
3. **03-input-clicked.png** - Input field focused (blue ring visible)
4. **04-after-typing.png** - After typing attempt (field still empty) ⚠️
5. **05-description-test.png** - Description field successfully filled ✅
6. **06-keyboard-events.png** - After direct keyboard events (field still empty) ⚠️

All screenshots stored in: `C:\Users\shaug\source\repos\Shaftdog\Salesmod\tests\screenshots\template-input-debug\`

---

## Recommended Fixes

### Fix 1: Remove forced value prop from Input component (BEST FIX)

**File**: `src/components/ui/input.tsx`

**Change line 7 and 16** from:

```tsx
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, value, ...props }, ref) => {
    return (
      <input
        type={type}
        className={...}
        ref={ref}
        value={value ?? ""}  // ❌ Remove this
        {...props}
      />
    )
  }
)
```

**To**:

```tsx
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {  // ✅ Don't extract value
    return (
      <input
        type={type}
        className={...}
        ref={ref}
        {...props}  // ✅ Let props spread naturally
      />
    )
  }
)
```

**Pros**:
- Fixes the root cause
- Makes Input work like Textarea
- Compatible with both controlled and uncontrolled patterns
- Fixes ALL Input fields using React Hook Form across the entire app

**Cons**: None

**Impact**: This will fix the Template Name field AND any other Input fields that have the same issue throughout the application.

---

### Fix 2: Use Controller component (WORKAROUND)

If you cannot change the Input component for some reason, use Controller:

```tsx
import { Controller } from 'react-hook-form';

<Controller
  name="name"
  control={form.control}
  render={({ field }) => (
    <Input
      id="name"
      {...field}
      placeholder="e.g., Standard Residential Appraisal"
    />
  )}
/>
```

**Pros**: Official React Hook Form solution for custom controlled components
**Cons**:
- Only fixes this one field
- Requires changing all form fields to use Controller
- More verbose code

---

### Fix 3: Explicit value binding (NOT RECOMMENDED)

```tsx
<Input
  id="name"
  value={form.watch('name')}
  onChange={(e) => form.setValue('name', e.target.value)}
  placeholder="e.g., Standard Residential Appraisal"
/>
```

**Pros**: Direct control
**Cons**:
- Loses React Hook Form's built-in features
- Only fixes this one field
- Causes unnecessary re-renders on every keystroke

---

## Next Steps

1. **Immediate**: Apply Fix 3 (Controller component) as it's the recommended approach for React Hook Form
2. **Verify**: Test manually that keyboard input works after fix
3. **Re-test**: Re-run automated Playwright test to confirm fix
4. **Regression**: Check that Description field and other inputs still work
5. **Apply pattern**: If fix works, apply same pattern to all form inputs for consistency

---

## Additional Observations

- The Description textarea field works perfectly, suggesting the issue is specific to the name Input
- All other dialog functionality (switches, selects) appears to work based on DOM structure
- The nested dialog fix (`if (!open) return null`) successfully prevents the Library picker from interfering
- No network errors or API issues detected
- Form submission is blocked correctly due to validation (empty name field)

---

## Test Execution Details

- **Test Duration**: 10.2s
- **Browser**: Chromium (headed mode for visibility)
- **Playwright Version**: Latest
- **Test File**: `e2e/template-name-input-debug.spec.ts`
- **Pass/Fail**: Test execution passed, but input functionality failed
- **Reproducibility**: 100% - Issue occurs on every test run

---

## Conclusion

The Template Name input field does not accept keyboard input due to a **bug in the Input component** (`src/components/ui/input.tsx`) that forces a controlled `value` prop, breaking compatibility with React Hook Form's uncontrolled input pattern.

**Root Cause**: Line 16 in `input.tsx` sets `value={value ?? ""}`, which:
1. Forces the input to be controlled with an empty string value
2. Prevents React Hook Form's onChange handler from updating the field
3. Makes the input appear "stuck" with no value

**Why it wasn't noticed before**: The Textarea component doesn't have this bug, so most forms that use textareas work fine. This only affects Input fields used with React Hook Form's `register()`.

**Recommended Action**: Implement Fix 1 (remove forced value prop) to fix this issue app-wide.

**Priority**: HIGH - This is a blocking bug that prevents users from creating templates. It likely affects other Input fields throughout the application as well.

**Testing**: After applying the fix, re-run the Playwright test to verify keyboard input works correctly.
