# Undercover (สายลับสลับคำ) — Real-Time Party Deduction Game

แผนงานออกแบบและสร้างระบบเกม **Undercover (สายลับสลับคำ)** เพิ่มเติมลงในแพลตฟอร์ม TabletopNexus โดยใช้มาตรฐานสถาปัตยกรรมเดียวกับเกมที่มีอยู่ (หนูขโมยชีส และ Insider) ทั้งในด้านการจัดเก็บข้อมูลห้องบน Firebase Firestore, การเปลี่ยนผ่านหน้าจอเกม (Scene Transition) พร้อมโทนสีธีมนักสืบเงียบขรึม, การกระจายบทบาท (Civilians, Undercover, Mr. White), ระบบคำใบ้รอบต่อรอบพร้อมจับเวลา, การโหวตคัดคนออก และการผสานรวม Gemini 3.8 Flash API ฝั่งเซิร์ฟเวอร์เพื่อสร้างชุดคำคู่ภาษาไทยใหม่แบบไม่รู้จบ

---

## User Review & Critical Decisions

> [!IMPORTANT]
> สรุปข้อตกลงและทิศทางระบบที่ได้รับการยืนยันจากผู้ใช้งานใน Phase 1:
> 1. **บทบาท Mr. White**: สามารถเลือกเปิดหรือปิดบทบาท Mr. White ได้อย่างอิสระในห้องล็อบบี้ก่อนเริ่มเกม
> 2. **ระบบการบอกคำใบ้ (Clue Giving)**: รองรับทั้งการพิมพ์ข้อความคำใบ้ในแอป (Turn-Based Chat/Log) และการจับเวลาสำหรับการพูดใบ้ต่อหน้าพร้อมปุ่มกดส่งเทิร์น
> 3. **คลังคำคู่เปรียบเทียบ (Word Pairs)**: มีชุดคำศัพท์ภาษาไทยในชีวิตประจำวันและหมวดฮิตเป็นค่าเริ่มต้น พร้อมปุ่มเรียก Server-Side Gemini 3.8 Flash เพื่อสร้างคำคู่ภาษาไทยหมวดหมู่ใหม่ตามสั่งแบบอัตโนมัติ

---

## 1. Overview & Core Concept

- **What It Does**: เกมปาร์ตี้บลัฟและจับโกหกคำศัพท์ (4–10 คน) โดยแบ่งผู้เล่นเป็น 3 ฝ่าย:
  - **พลเมือง (Civilians)**: ได้รับ "คำลับ A" เช่น "ชานมไข่มุก"
  - **สายลับ (Undercover)**: ได้รับ "คำลับ B" ที่ใกล้เคียงกันมาก เช่น "กาแฟเย็น"
  - **มิสเตอร์ไวท์ (Mr. White)**: ไม่ได้รับคำใดๆ เลย (การ์ดว่างเปล่า/ความลับ)
  ผู้เล่นจะผลัดกันบอกคำใบ้ 1 ประโยคโดยไม่พูดคำลับของตนเอง จากนั้นเปิดโหวตจับคนน่าสงสัย หาก Mr. White ถูกโหวตออกจะมีโอกาส 1 ครั้งในการทายคำของพลเมืองเพื่อชิงสิทธิ์ชนะทันที
- **Target Audience & Context**: กลุ่มเพื่อนที่เล่นด้วยกันต่อหน้า (In-Person Party) หรือกลุ่มผู้เล่นที่เชื่อมต่อห้องผ่าน Master Server ออนไลน์
- **Key Value**: ขยายขีดความสามารถของ TabletopNexus ให้มีเกมที่ 3 ที่เล่นได้จริง มีระบบเสียงบรรยากาศนักสืบ และเชื่อมโยง ELO เข้าสู่กระดาน Leaderboard เดียวกัน

---

## 2. User Experience & Visual Design

### 2.1 Key User Flows

```
[คลังบอร์ดเกม (Catalog)] ──► [การ์ด Undercover (พร้อมป้ายเล่นได้จริง)]
                                    │
                                    ▼
[Transition จอสีน้ำเงินเทานักสืบ (#0F172A / Indigo Stealth)]
                                    │
                                    ▼
[UndercoverScreen: แท็บล็อบบี้ / สร้างห้อง / ค้นหารหัสห้อง 4 ตัว]
                                    │
  ┌─────────────────────────────────┴─────────────────────────────────┐
  ▼                                                                   ▼
[ห้องล็อบบี้ (Host / Player Seats)]                        [ตั้งค่ากติกาในห้อง]
- รายชื่อผู้เล่น + ปุ่มดึงเพื่อน/บอทเสริม               - เปิด/ปิด Mr. White
- ตรวจสอบความพร้อม                                         - เลือกหมวดคำไทย (อาหาร/สัตว์/สิ่งของ)
                                                           - ปุ่ม "AI สร้างคำคู่สด (Gemini Flash)"
                                    │
                                    ▼ [เจ้าของห้องกดเริ่มเกม]
[ขั้นตอนที่ 1: แจกบทบาท & เปิดการ์ดคำลับ (Secret Word Card Reveal)]
- แตะค้างเพื่อแง้มดูคำลับ ป้องกันคนข้างๆ แอบมอง (Haptic/Card Flip)
- พลเมืองเห็นคำ A, สายลับเห็นคำ B, Mr. White เห็นคำเตือน "คุณคือ Mr. White"
                                    │
                                    ▼
[ขั้นตอนที่ 2: รอบการบอกคำใบ้ (Clue Round - Turn by Turn)]
- แสดงลำดับเทิร์นชัดเจน (Turn Indicator) พร้อมนาฬิกานับถอยหลังและเสียงเตือน
- ช่องพิมพ์คำใบ้ หรือกดปุ่ม "ส่งเทิร์น (พูดใบ้เสร็จแล้ว)"
- กระดานบันทึกประวัติคำใบ้ของผู้เล่นทุกคนในแต่ละรอบ (Clue History Log)
                                    │
                                    ▼
[ขั้นตอนที่ 3: รอบอภิปรายและลงคะแนน (Discussion & Elimination Vote)]
- เปิดไมค์คุย/พิมพ์จับพิรุธ
- แต่ละคนเลือกโหวตผู้เล่นที่น่าสงสัยที่สุด 1 คน
- ประกาศผลผู้ถูกคัดออกและเปิดเผยบทบาทจริง
                                    │
  ┌─────────────────────────────────┴─────────────────────────────────┐
  ▼ (หากเป็น Mr. White)                                              ▼ (หากไม่ใช่ Mr. White)
[ช่วง Mr. White ทายคำลับ]                                    [ตรวจสอบเงื่อนไขชนะทันที]
- ให้เวลา Mr. White พิมพ์ทายคำลับของพลเมือง                - พลเมืองกำจัด Undercover & White หมด = ชนะ
- ถ้าทายถูก = Mr. White ชนะคนเดียวทันที!                   - Undercover เหลือเท่ากับพลเมือง = สายลับชนะ
- ถ้าทายผิด = Mr. White ออกจากเกมและการแข่งขันดำเนินต่อรอบถัดไป
                                    │
                                    ▼
[ขั้นตอนที่ 4: สรุปผลการแข่งขัน (Game Over & ELO Results)]
- เปิดเผยคำคู่ลับทั้งสองคำ (Word A vs Word B)
- สรุปรายชื่อผู้ชนะ + แจกแต้ม ELO Delta
- ปุ่ม "เล่นใหม่อีกตา (Rematch)" เพื่อสับบทบาทและสุ่มคำคู่ใหม่ทันที
```

### 2.2 Visual Identity & Theme Tokens

- **Aesthetic Direction**: *Noir Modern Detective* — เรียบหรู เงียบสงบ น่าค้นหา ไม่ใช้แสงนีออนแสบตา
- **Color Palette (60-30-10 Rule)**:
  - Canvas (60%): สีกรมท่าน้ำเงินเข้มลึกและเทาดำสนิท (`#090D16` / `#0F172A`)
  - Structural Panels (30%): ผิวการ์ดโทนเทาน้ำเงินสุภาพ (`#1E293B` / `#334155`) พร้อมเส้นขอบคมกริบ (`border-slate-800`)
  - Focal Accents (10%): สีส้มอำพันเรืองรอง (`#F59E0B`) สำหรับเวลานับถอยหลัง และสีครามเงียบขรึม (`#6366F1`) สำหรับบทบาทสายลับ
- **Typography**:
  - หัวเรื่อง & ชื่อเกม: `Plus Jakarta Sans` / `Outfit` น้ำหนัก Bold ดูลึกลับและมั่นคง
  - เนื้อหา & คำใบ้: ฟอนต์ภาษาไทยมาตรฐานที่อ่านง่ายสบายตา (`Sarabun` / `Noto Sans Thai` fallback)
  - ตัวเลขจับเวลา & ผลคะแนน: `tabular-nums` จัดระเบียบชิดแนวเดียวกันเสมอ
- **Audio Feedback**: เสียงคลิกการ์ด, เสียงระฆังเริ่มเทิร์นใบ้คำ, เสียงนับถอยหลัง 5 วินาทีสุดท้าย และเสียงเปิดเผยบทบาท

---

## 3. Key Product Decisions & Trade-Offs

1. **สถาปัตยกรรมไฟล์แบบ Modular ตามรอย Cheese Thief & Insider**:
   - สร้างโมดูลในระดับชั้นที่ชัดเจน:
     - Data: `src/data/undercoverWords.ts` (คลังคำคู่ภาษาไทยแบ่ง 5 หมวดหลัก)
     - Firebase Service: `src/firebase/table/undercoverService.ts` (State logic, deal roles, submit clue, advance turn, process vote, Mr. White guess)
     - UI Views: `src/components/undercover/UndercoverScreen.tsx` และ `src/components/undercover/UndercoverPhases.tsx`
     - Transition: ขยาย `GameSceneTransition.tsx` ให้มีตัวแปร `undercover`
   - *เหตุผล*: ป้องกันโค้ดปะปน รักษามาตรฐานของโปรเจกต์ และสามารถตรวจสอบ TypeScript ได้ 100%

2. **Server-Side Gemini 3.8 Flash Integration**:
   - สร้าง Express Endpoint `/api/undercover/generate-words` ใน `server.ts`
   - ใช้ `@google/genai` SDK ด้วยโมเดล `'gemini-3.8-flash'`
   - *เหตุผล*: ป้องกัน API Key หลุดสู่ Client ตามมาตรฐานความปลอดภัย และตอบสนองต่อคำขอสร้างคำคู่ภาษาไทยเฉพาะทางได้อย่างรวดเร็ว

3. **Hybrid Input for Clue Rounds**:
   - ผู้เล่นสามารถพิมพ์ข้อความส่งลงกระดาน หรือกดปุ่ม "ข้ามเทิร์น (พูดใบ้ต่อหน้าเรียบร้อยแล้ว)" ได้
   - *เหตุผล*: รองรับทั้งคนที่นั่งล้อมวงเปิดมือถือจอเดียว/หลายจอ และคนที่เล่นผ่านคอมพิวเตอร์ระยะไกล

---

## 4. Technical Architecture & Data Strategy

### 4.1 System Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TabletopNexus Frontend                          │
│                                                                        │
│  [Navbar] ──► [GameCatalogGrid] ──► [GameSceneTransition ('undercover')] │
│                                             │                          │
│                                             ▼                          │
│                       [UndercoverScreen.tsx]                           │
│     ┌───────────────────────────────────────┴────────────────────┐     │
│     ▼                                                            ▼     │
│ [In-Game Lobby / Config]                            [UndercoverPhases] │
│ - Host controls (Mr. White toggle, timer)           - RoleRevealStep   │
│ - Word Category / AI Generate Button                - ClueRoundStep    │
│                                                     - VoteStep         │
│                                                     - MrWhiteGuessStep │
│                                                     - ResultsStep      │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌───────────────────────────────┐           ┌────────────────────────────────────┐
│      Firebase Firestore       │           │      Express Server (server.ts)    │
│  rooms/{roomId}               │           │                                    │
│  ├── players/{playerId}       │           │  POST /api/undercover/generate-    │
│  │   - role: 'civilian' |     │           │       words                        │
│  │           'undercover' |   │           │   ├── calls @google/genai          │
│  │           'mr_white'       │           │   └── model: 'gemini-3.8-flash'    │
│  │   - secretWord             │           │  WebSocket Presence & Chat         │
│  │   - clueHistory: string[]  │           └────────────────────────────────────┘
│  └── status: 'undercover_...' │
└───────────────────────────────┘
```

### 4.2 Data Models & Room Schema Extension

ใน `src/firebase/table/types.ts`:
- **GamePhase เพิ่ม**: `'undercover_deal' | 'undercover_clue' | 'undercover_vote' | 'undercover_mrwhite_guess' | 'undercover_over'`
- **PlayerRoleCard เพิ่ม**: `'undercover_civilian' | 'undercover_spy' | 'undercover_mrwhite'`
- **FirestoreRoom ฟิลด์สำหรับ Undercover**:
  - `undercoverCivilianWord?: string;`
  - `undercoverSpyWord?: string;`
  - `enableMrWhite?: boolean;`
  - `undercoverCurrentTurnIndex?: number;`
  - `undercoverRoundNumber?: number;`
  - `undercoverTurnPlayerId?: string;`
  - `undercoverEliminatedIds?: string[];`
  - `mrWhiteGuessedWord?: string;`
  - `mrWhiteGuessSuccess?: boolean;`
- **FirestorePlayer ฟิลด์เพิ่มเติม**:
  - `isEliminated?: boolean;`
  - `currentRoundClue?: string;`
  - `cluesSubmitted?: string[];`

---

## 5. Verification & Testing Strategy

- **Build & Compilation**: รัน `compile_applet` เพื่อยืนยันความถูกต้องของประเภทข้อมูล TypeScript ทุกโมดูล
- **Lint Inspection**: รัน `lint_applet` เพื่อป้องกันตัวแปรตกหล่นหรือการ import ผิดพลาด
- **Server Endpoint Verification**: ทดสอบเรียก API `/api/undercover/generate-words` เพื่อให้แน่ใจว่าโมเดล `gemini-3.8-flash` สร้างคำคู่ภาษาไทยที่มีความสัมพันธ์กันจริง
- **Gameplay Simulation**: ทดสอบการสร้างห้อง เพิ่มบอท สุ่มบทบาท กระจายคำลับ ส่งคำใบ้ โหวตผู้เล่น และการทายคำของ Mr. White จนจบเกม
