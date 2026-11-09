# Avalon: Smooth Table Creation Transition & Magical Seal Animation

A high-fidelity transition and loading experience when hosts click "เปิดโต๊ะใหม่ (Host)" in Avalon, replacing the sudden screen jump with a smooth zoom entrance, a pulsing King Arthur magical seal with progressive status messages, and pastel sparkle micro-animations.

## User Review & Critical Decisions

> [!IMPORTANT]
> The transition style and loading feedback have been confirmed based on user preferences in Phase 1:

- **Confirmed Decision 1 (Transition Style)**: Smooth zoom and card entrance with pastel sparkles. The landing card gracefully compresses and zooms forward while the lobby cards float and cascade in with pastel radiant glows.
- **Confirmed Decision 2 (Loading State Feedback)**: Pulsing magical seal with progressive room creation status ("กำลังสลักตราโต๊ะกลม...", "เตรียมที่นั่งอัศวินทั้ง 10...") before seamlessly unveiling the active lobby.

---

## 1. Overview & Core Concept

When a player taps **"เปิดโต๊ะใหม่ (Host)"**, the application currently triggers an async Firebase Firestore room creation call with only a standard button disabled state, causing a sudden snap directly into the lobby once the room document is written.

This feature introduces a cinematic yet lightweight transition:
1. **Interactive Tap Effect**: The "เปิดโต๊ะใหม่" button responds with a tactile scale-down and a subtle sparkle burst.
2. **Magical Seal Loading Modal / Portal**: A centered, pulsing Arthurian seal with rotating pastel runes and a progress indicator that tracks room setup stages without any perceptible lag.
3. **Smooth Zoom & Cascade Reveal**: As the Firestore snapshot synchronizes, the seal expands into a gentle light burst, and the Lobby cards (Room Header, Player Ratios, Role Setup) slide up and zoom into place with staggered Framer Motion spring physics.

---

## 2. User Experience & Visual Design

### Key User Flows

```
[ Landing Form ]
      │  (User clicks "เปิดโต๊ะใหม่ (Host)")
      ▼
[ Tap Feedback & Audio Chime ] ───▶ Play soft magical chime & button tactile press
      │
      ▼
[ Pulsing Magical Seal Overlay ] ──▶ Centered Arthurian seal with soft emerald/amber pulse
      │                              Progressive subtitle ("กำลังเปิดโต๊ะและสร้างรหัสผ่าน...")
      │
      ▼ (Firestore room doc created & subscribed)
[ Smooth Zoom & Cascade Reveal ] ──▶ Seal smoothly scales up & fades
      │                              ActiveRoomHeader slides in from top (-20px -> 0)
      │                              Player Ratio card scales from 0.96 -> 1.0 with soft pastel aura
      ▼
[ Active Lobby State ]
```

### Visual Identity & Theme
- **Color Palette**: Light pastel emerald (`#10B981` at 10-20% opacity), warm golden amber (`#F59E0B`), soft off-white surfaces (`#FFFFFF` with `border-emerald-200/90`), and deep readable slate typography (`#0F172A`).
- **Magical Seal**: Multi-layered SVG seal featuring the Round Table shield, crossed blades, and concentric orbital rings that slowly spin and pulse.
- **Pastel Sparkles**: 8-12 floating micro-sparkles (`Sparkles` / star glyphs) rendered with staggered float animations in soft lavender, mint, and golden yellow hues.

### Interactive Feedback & Motion
- **Entrance Duration**: 350ms total transition time to ensure snappy responsiveness without impeding user flow.
- **Spring Physics**: Settling curves (`type: "spring", stiffness: 380, damping: 28`) for a natural, tactile card entrance.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Overlay vs Inline Morphing**
  - *Chosen Approach*: Lightweight portal overlay that handles the brief async Firestore write (~300-600ms), followed by a cascading layout animation in `AvalonScreen.tsx`.
  - *Why*: Avoids awkward DOM element reflows while the user's name and room metadata are being written to Firestore.

- **Decision 2: Performance & Mobile Optimization**
  - *Chosen Approach*: Pure CSS/Framer Motion compositor properties (`transform: scale`, `opacity`, `filter`).
  - *Why*: Ensures 60fps silky smooth rendering on all mobile phones without triggering layout recalculations or jank.

---

## 4. Technical Architecture & Component Structure

### Component Flow

```
┌────────────────────────────────────────────────────────┐
│                   AvalonScreen.tsx                     │
│  - isCreatingRoom state                                │
│  - handleCreateRoom() wrapper                          │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │       AvalonCreationTransitionOverlay.tsx        │  │
│  │  - Pulsing Magical Seal (Shield + Orbit Rings)    │  │
│  │  - Progressive status text ticker                │  │
│  │  - Floating pastel sparkle particles             │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │       AnimatePresence (Mode="wait")              │  │
│  │  - Landing View  ──(Zoom Out / Fade)──▶          │  │
│  │  - Lobby View    ──(Zoom In / Spring Cascade)──▶ │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### Planned File Changes (Turn 3 upon approval)
1. **`src/components/avalon/AvalonCreationTransitionOverlay.tsx`** (New modular component, ~120 lines):
   - Renders the pulsing Arthurian seal with soft glow aura and rotating runes.
   - Displays gentle progressive text ("กำลังจัดเตรียมโต๊ะกลม...", "สลักรหัสห้อง 4 หลัก...").
   - Floats lightweight pastel sparkles around the seal.
2. **`src/components/avalon/AvalonScreen.tsx`** (Update ~30 lines):
   - Wrap view switches in `AnimatePresence`.
   - Trigger creation transition state and sound effect when "เปิดโต๊ะใหม่" is tapped.
   - Add staggered spring entrance variants for the newly revealed lobby.
