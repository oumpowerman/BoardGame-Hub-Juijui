# Implementation Plan - Hues and Cues Phone Companion Mode

## Problem & Need
The user clarified that on personal phones, the large 480-color tile board (`"กระดานเลือกสีของคุณ"`) is unnecessary and distracting. Players sit together around a central iPad board; therefore, phones should act as a clean **Companion Controller**:
- Remove the huge 480-color spectrum grid from the phone view.
- Players look at the central iPad board to view all 480 colors and real-time player tokens.
- On the phone, players only need:
  1. Coordinate pickers: Column (`A`–`T`) and Row (`1`–`24`) dropdowns.
  2. 4-way arrow buttons (`▲` `▼` `◄` `►`) to nudge their token 1 tile at a time while looking at the iPad.
  3. Visual feedback: a single color swatch showing their selected tile coordinate, color, and sync status with the iPad.
  4. Clear, friendly prompt reminding players to look up at the central iPad screen.
  5. The iPad mode remains the full 480-tile interactive board with draggable tokens and bullseye scoring target.

## User Review Required
> [!NOTE]
> When `isIpadBoardView` is active (the central iPad screen), it continues to render the full 480-color interactive board with drag-and-drop player tokens. When viewed as a normal player on a phone, it renders the streamlined Companion Controller instead of duplicate 480 tiles.

## Proposed Changes

### 1. `src/components/huescues/HuesCuesCentralBoard.tsx`
- Split the component cleanly between:
  - **iPad Board Mode (`isIpadMode = true`)**: The full 480-tile spectrum grid, player token dock, drag-and-drop targets, reveal bullseye & 3x3 scoring rings.
  - **Phone Mode (`isIpadMode = false`)**: A streamlined mobile controller card with:
    - Current selected color preview & coordinate indicator (e.g. `K12`).
    - Prominent Column (`A`–`T`) and Row (`1`–`24`) coordinate selectors.
    - Large, responsive directional buttons (`▲ ▼ ◄ ►`) to nudge position easily while looking at the iPad.
    - Tablet guidance card: *"มองกระดานสีบน iPad กลางโต๊ะ แล้วเลือกพิกัดหรือกดปุ่มลูกศรเพื่อขยับหมากของคุณ"*
    - If the user is the Clue Giver, show guidance to look at the iPad while thinking of a clue.

### 2. `src/components/huescues/HuesCuesScreen.tsx`
- Adjust responsive layout grid: on phone mode, the companion controller and clue controls stack naturally in a compact, scroll-free mobile view. On iPad mode, the board takes the full screen width.

## Verification Plan
- Run `compile_applet` and `lint_applet` to ensure zero compilation or TypeScript errors.
- Test both phone companion mode and iPad board view transitions.
