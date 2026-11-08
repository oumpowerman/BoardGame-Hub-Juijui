# Real-Time Cloud Firestore Master Server & Step-by-Step Cheese Thief Integration

Eliminate all mock data from the Master Server and Navbar, connecting the room hub directly to live Cloud Firestore collections (`rooms`, `rooms/{roomId}/players`, and `leaderboard`) with strict step-by-step authoritative phase progression for Cheese Thief (หนูขโมยชีส).

## User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed during clarification:
> - **Live Firestore Room Display**: Show active rooms querying directly from Firestore with real-time status and quick join capabilities.
> - **Clean Empty State**: When no rooms exist yet in Firestore, present a clean, friendly empty state with a prominent button to open the first live room, eliminating all fake seeded mockup rooms.

---

### 1. Overview & Core Concept

- **What It Delivers**:
  - Replaces all legacy static mock rooms (`INITIAL_MASTER_ROOMS`) with a live Firestore listener (`listenToActiveRooms`).
  - **Navbar Live Counter**: Updates the Navbar's Master Server badge dynamically with the real count of active Firestore rooms.
  - **Clean Zero-State**: If no rooms are open in Firestore, renders a polished pastel empty state inviting users to host the first live table or enter a 4-digit code.
  - **Authoritative Step-by-Step Phase Progression**:
    1. **Lobby (สเต็ป 1: ล็อบบี้เตรียมตัว)**: Real-time seated players in Firestore, ready status toggles, and optional practice tablemates.
    2. **Role Deal (สเต็ป 2: แจกบทบาทลับ)**: Random roles (Cheese Thief, Accomplice, Sleepy Mouse) dealt and saved in Firestore with touch-and-hold privacy shield.
    3. **Dice Roll (สเต็ป 3: เขย่าทอยเต๋าเวลาตื่น)**: Players roll real 1–6 dice; thief's roll authoritative sets `stolenHour`.
    4. **Night Timeline (สเต็ป 4: กลางคืนตามล่าชีส ตี 1 - ตี 6 น.)**: Synchronized hourly clock with Web Audio chimes, sleeping vs. awake states, and host-safe step controls.
    5. **Morning Debate & Voting (สเต็ป 5: สอบถาม & โหวตจับโจร)**: Countdown timer and simultaneous secret accusation voting stored in Firestore.
    6. **Verdict & ELO (สเต็ป 6: สรุปผล & บันทึก ELO จริง)**: Calculates winner, awards confetti, and persists updated ELO into Firestore's `leaderboard` collection.

---

### 2. User Experience & Visual Design

- **Master Server Hub (Live Firestore View)**:
  - Header displays live connection status with Firestore database (`ai-studio-tabletopnexusmas-...`).
  - Active room cards display the real 4-digit room code, host name, current phase (Lobby, Night, Voting), seated player count, and 1-click "เข้าร่วมโต๊ะ (Join Table)".
  - Empty state with pastel illustration, clear explanatory copy, and a large primary CTA: `+ เปิดโต๊ะหนูขโมยชีสสดรอบใหม่`.
- **Navbar Real-Time Badge**:
  - Dynamically displays the live count of active rooms directly from Firestore.
- **Unified BaseModal Integration**:
  - When clicking "เปิดกระดานเล่นสด" or "+ เปิดโต๊ะใหม่", opens the full in-person companion modal wrapped in `BaseModal` (slide-up on mobile, centered on desktop).

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Single Source of Truth via Firestore `rooms` Collection**:
  - *Chosen Approach*: Unify the Master Server view and the In-Person Tabletop companion to both read and write to the same Firestore `rooms` collection.
  - *Why*: Eliminates dual-state synchronization bugs. When a player opens a table on mobile or desktop, it immediately appears live in the Master Server room list for everyone.
- **Decision 2: Clean Zero-Data Architecture (No Mock Fallbacks)**:
  - *Chosen Approach*: Completely remove `INITIAL_MASTER_ROOMS` from the active application flow. If Firestore has 0 rooms, display an intuitive creation card rather than fake seeded rooms.
  - *Why*: Directly aligns with user requirement ("ไม่เอาข้อมูล Mockup เลย ต้องการให้ใช้ได้จริง").
- **Decision 3: Step-by-Step State Machine Safeguards**:
  - *Chosen Approach*: Room document tracks `status` as an explicit finite state machine (`lobby` -> `role_deal` -> `dice_roll` -> `night_phases` -> `voting` -> `game_over`).
  - *Why*: Guarantees players cannot skip phases or access voting before the night timeline finishes.

---

### 4. Technical Architecture & Component Flow

```
┌─────────────────────────────────────────────────────────────┐
│                       Navigation Bar                        │
│   [บอร์ดเกมทั้งหมด]  [Master Server (Live Count)]  [จัดอันดับ]  │
└───────────────────────────────┬─────────────────────────────┘
                                │ Real-time room count
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Master Server Hub View                   │
│                                                             │
│  ├── If rooms.length === 0 ──> [Clean Empty State Card]     │
│  │                              └── [Button: + เปิดโต๊ะสด]    │
│  │                                                          │
│  └── If rooms.length > 0   ──> [Live Firestore Room Grid]   │
│                                 ├── Room Code (e.g. 1552)   │
│                                 ├── Phase Badge & Players   │
│                                 └── [Button: เข้าร่วมโต๊ะ]   │
└───────────────────────────────┬─────────────────────────────┘
                                │ onJoin / onCreate
                                ▼
┌─────────────────────────────────────────────────────────────┐
│      BaseModal (Framer Motion: Slide-Up / Centered)         │
│                                                             │
│  Step 1: Seated Lobby (รหัส 4 หลัก & สถานะพร้อม)           │
│       │                                                     │
│  Step 2: Privacy Shield Secret Role Deal                    │
│       │                                                     │
│  Step 3: Secret Wake-up Dice Shaker (ตี 1-6 น.)             │
│       │                                                     │
│  Step 4: Synchronized Night Timeline & Chimes               │
│       │                                                     │
│  Step 5: Morning Debate & Simultaneous Voting               │
│       │                                                     │
│  Step 6: Verdict Reveal & Real Firestore ELO Update         │
└─────────────────────────────────────────────────────────────┘
```

- **Data Flow & Collections**:
  1. `rooms`: Document ID `room_{timestamp}_{code}`, fields `roomCode`, `hostName`, `status`, `nightHour`, `stolenHour`, `winnerTeam`.
  2. `rooms/{roomId}/players`: Real seated player documents (`id`, `name`, `isHost`, `isReady`, `role`, `diceHour`, `voteTargetId`).
  3. `leaderboard`: Global persistent player rankings updated authoritatively upon game completion.
