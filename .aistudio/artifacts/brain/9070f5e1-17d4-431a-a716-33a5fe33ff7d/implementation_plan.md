# Implementation Plan - Navbar Refinement (Remove Cheese Thief Button & Merge Profile/Friends)

Modify `/src/components/Navbar.tsx` according to user requirements:
1. **Remove "เข้าเล่น หนูชีส" Button**:
   - Remove the quick jump button for Cheese Thief from the top right navbar area.
2. **Merge Profile & Friend Badge**:
   - Combine user profile name, avatar/initial, and friend count into a single clickable pill badge that triggers `onOpenFriendModal`.
3. **Ensure Sticky Positioning**:
   - Keep navbar sticky at the top (`sticky top-0 z-30`).
4. **Strict Scope**:
   - Do not touch any other code files or features.

## Proposed Changes

### 1. `/src/components/Navbar.tsx`
- Remove the "เข้าเล่น หนูชีส" button element from the navbar right-side zone.
- Combine the user profile display and friend badge into a single unified clickable container that calls `onOpenFriendModal`.

## Verification Plan
- Run `compile_applet` and `lint_applet` to verify zero TypeScript errors.
