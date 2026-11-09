# Cheese Thief: Customizable Night Hour Duration & Pause/Resume Controls

Empowering the Cheese Thief (หนูขโมยชีส) table host with full control over the 6 Night Hours (ตี 1 ถึง ตี 6): customizable countdown duration per hour (5s–20s) configurable in both the lobby and on-the-fly, synchronized pause/resume playback controls, and immediate next-hour skip buttons.

## User Review & Critical Decisions

> [!IMPORTANT]
> The controls and configuration placement have been confirmed based on user answers in Phase 1:

- **Confirmed Decision 1 (Night Countdown Controls)**: Pause and resume button with next hour skip controls. The host can pause/freeze the countdown timer at any moment (e.g. if a cup is knocked, a player opens their eyes late, or the group needs extra time), and resume smoothly when ready.
- **Confirmed Decision 2 (Duration Configuration Placement)**: Both in lobby settings before starting and on-the-fly during the night phase, featuring quick presets (`[5s] [8s] [10s (มาตรฐาน)] [15s] [20s]`).

---

## 1. Overview & Core Concept

In **Cheese Thief**, during Step 4 (Night Phase / คืนขโมยชีส):
- The digital moderator counts through 6 hours sequentially: ตี 1, ตี 2, ตี 3, ตี 4, ตี 5, ตี 6.
- Currently, the timer is rigidly hardcoded to 10 seconds per hour and auto-advances uncontrollably, with no pause mechanism if players need more time or a brief pause at the table.

This enhancement introduces:
1. **Synchronized Play/Pause Host Controls**: The host can freeze the night timer across all player screens with a clear "⏸️ พักเวลาชั่วคราว" indicator.
2. **On-the-Fly & Lobby Duration Tuning**: Presets of 5s, 8s, 10s, 15s, and 20s per night hour to fit casual fast-paced groups or beginner slower-paced tables.
3. **Manual Next Hour Skip**: Immediate jump to the next hour when all awake players have finished their action without waiting for the timer to expire.

---

## 2. User Experience & Visual Design

### Key User Flows

```
[ In-Person Lobby ]
  └── Host selects Night Duration: [5s] [8s] [10s (ค่าเริ่มต้น)] [15s] [20s]
          │
          ▼
[ Step 4: Night Phase (ตี 1 - ตี 6) ]
  ├── Countdown Bar: Ticks down from selected duration (e.g. 15s)
  ├── Host Playback Controls (Sticky / Inline HUD):
  │     ├── [ ⏸️ หยุดเวลาชั่วคราว ] / [ ▶️ นับเวลาต่อ ]
  │     ├── [ ⏭️ ข้ามไปชั่วโมงถัดไป (ตี 2 น.) ]
  │     └── Quick On-the-Fly Presets: [8s] [10s] [15s] [20s]
  │
  └── When Paused:
        • Timer halts across all player devices
        • Status pill shows: "⏸️ หัวหน้าโต๊ะหยุดเวลานับถอยหลังชั่วคราว"
        • Host voice narration pauses until resumed
```

### Visual Identity & Theme
- **Color Palette**: Warm amber (`#F59E0B`), cheese gold (`#FBBF24`), midnight indigo (`#312E81`), and soft light pastel surfaces (`#FFFBEB`, `#FFFFFF`, `border-amber-200`).
- **Playback HUD**: Compact rounded-2xl media-style control panel with Lucide icons (`Pause`, `Play`, `SkipForward`, `Clock`, `Sliders`).
- **Responsive & Mobile-First**: Fits comfortably on mobile viewports with `min-h-[44px]` touch targets.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Firestore Real-Time Sync vs Local Timer**
  - *Chosen Approach*: Store `cheeseNightDuration` and `cheeseNightPaused` in the `rooms/{roomId}` Firestore document.
  - *Why*: Ensures that when the host hits Pause, all players seated around the table immediately see the paused state and the countdown stops synchronously on every device.

- **Decision 2: Audio & Thai TTS Speech Synchronization**
  - *Chosen Approach*: When paused, cancel/defer the "sleep" reminder voice prompt at the 4-second mark until the timer resumes and actually passes second 4.
  - *Why*: Prevents awkward spoken commands ("หนูตีสามหลับตา...") while the table is paused.

---

## 4. Technical Architecture & Component Flow

```
┌────────────────────────────────────────────────────────┐
│               Firestore Room Document                  │
│  - cheeseNightDuration: number (default 10)            │
│  - cheeseNightPaused: boolean (default false)          │
└───────────────────────────┬────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌───────────────────────┐       ┌────────────────────────┐
│  InPersonLobby.tsx    │       │ NightTimelineStep.tsx  │
│  - Preset duration    │       │ - Play / Pause button  │
│    selector in lobby  │       │ - Next Hour skip       │
│  - Fall Mouse toggle  │       │ - Live countdown bar   │
└───────────────────────┘       │ - On-the-fly duration  │
                                └────────────────────────┘
```

### Planned File Changes (Turn 3 upon approval)
1. **`src/firebase/table/types.ts`**:
   - Add `cheeseNightDuration?: number;` and `cheeseNightPaused?: boolean;` to `FirestoreRoom`.
2. **`src/firebase/table/cheeseThiefService.ts`**:
   - Add `setCheeseNightDuration(roomId, seconds)` and `toggleCheeseNightPause(roomId, isPaused)`.
3. **`src/components/cheesethief/useCheeseThiefGameMaster.ts`**:
   - Respect `activeRoom.cheeseNightDuration` (replacing hardcoded 10s) and halt the interval when `activeRoom.cheeseNightPaused === true`.
4. **`src/components/inperson/phases/NightTimelineStep.tsx`**:
   - Add Host Playback Control bar: Pause/Resume, Skip Next Hour, and On-the-Fly duration tabs.
   - Show paused banner for all participants.
5. **`src/components/inperson/InPersonLobby.tsx`**:
   - Add Night Hour Duration selector in the Lobby Settings card.
