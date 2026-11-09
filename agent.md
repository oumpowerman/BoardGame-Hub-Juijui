# AI Agent Guidelines & Architecture Constitution: TabletopNexus

คู่มือและมาตรฐานสถาปัตยกรรมระดับ Enterprise สำหรับ AI Agent และทีมพัฒนาในการสร้างเกมใหม่บนแพลตฟอร์ม **TabletopNexus** เพื่อให้โค้ดทุกส่วนเป็นระเบียบ สะอาด บำรุงรักษาง่าย และรองรับการสเกลอย่างยั่งยืน

---

## 1. กฎเหล็กระดับ Enterprise (Strict Enterprise Rules)

1. **Strict File Modularization (< 800 บรรทัด)**:
   - **ห้าม**ให้ไฟล์ใดๆ ในโปรเจกต์มีจำนวนบรรทัดเกิน 800 บรรทัดโดยเด็ดขาด
   - หากคาดว่าไฟล์ใดจะมีความยาวเข้าใกล้ขีดจำกัด ให้ทำการสกัด (Extract) ออกเป็น Sub-components หรือ Custom Hooks ทันที
2. **Strict Portal Modal Rendering**:
   - Modal ทุกตัวต้องสร้างโดยสืบทอดจาก `src/components/common/BaseModal.tsx` หรือครอบด้วย `React.createPortal` เพื่อเรนเดอร์อยู่นอกสุดของ DOM Tree เสมอ แก้ปัญหา z-index ชนกับเลย์เอาต์หลัก 100%
   - จัดการแอนิเมชันเปิด/ปิดด้วย Framer Motion (`AnimatePresence`, `motion.div`)
3. **Host Disband Safeguard (ระบบป้องกันการทิ้งห้องของโฮสต์)**:
   - เมื่อผู้เล่นที่เป็นโฮสต์กดปุ่ม "กลับสู่คลังบอร์ดเกม" หรือกดปุ่มออกจากห้องในขณะที่ห้องยังทำงานอยู่ ระบบต้องแสดง `DisbandRoomConfirmModal` เพื่อถามยืนยันการยุบห้องเสมอ
   - หากเป็นผู้เล่นทั่วไป ให้ถอนชื่อออกจากห้องโดยอัตโนมัติแล้วกลับสู่คลังเกมทันที
4. **Light Pastel Design System**:
   - การออกแบบต้องอยู่ในโทน **"พาสเทลสีสว่าง" (Light Pastel)** ตามธีมของแต่ละเกม เช่น:
     - หนูขโมยชีส (Cheese Thief): Light Pastel Amber (`amber-50`, `amber-100`, `amber-400`)
     - จอมบงการคำใบ้ (Insider): Light Pastel Rose/Crimson (`rose-50`, `rose-100`, `rose-500`)
     - สายลับสลับคำ (Undercover): Light Pastel Lavender/Purple (`violet-50`, `violet-100`, `violet-500`)
   - Scrollbar ของเบราว์เซอร์ต้องเป็นแบบ Slim มินิมอล ไม่เกะกะสายตา

---

## 2. โครงสร้างโฟลเดอร์สำหรับเกมใหม่ (New Game Architecture)

เมื่อเพิ่มเกมใหม่ (เช่น `avalon`, `couptable`, `codenames`) ให้สร้างโฟลเดอร์ไว้ที่ `src/components/<game-id>/` และแยก Sub-components ตามแพทเทิร์นมาตรฐานต่อไปนี้:

```
src/components/<game-id>/
├── <GameName>Screen.tsx             (Core Orchestrator: ~400-650 บรรทัด)
├── <GameName>TopBar.tsx             (Sticky Top Bar: ย้อนกลับ, ป้องกันยุบห้อง, QR, เพื่อน, โปรไฟล์)
├── <GameName>ActiveRoomHeader.tsx   (แถบหัวห้องเล่นสด: รหัสห้อง, สวิตช์เสียง/แชร์ QR, ปุ่มยุบ/ออก)
├── <GameName>InvitesBanner.tsx      (แถบแจ้งเตือนคำเชิญเข้าห้องเล่นจากเพื่อน)
├── <GameName>SpeakerBar.tsx         (แถบลำโพง Game Master กลางโต๊ะ - สำหรับเกมที่มีเสียงพากย์)
├── <GameName>Lobby.tsx              (หน้าห้องรอผู้เล่น: การตั้งค่ากติกา, บอทซ้อมมือ, ที่นั่งผู้เล่น)
├── <GameName>Phases.tsx             (หน้ากระดานและขั้นตอนการเล่นเกมตามลำดับ Step)
└── use<GameName>GameMaster.ts       (Custom Hook: เสียงบรรยาย Game Master TTS, ตัวจับเวลานับถอยหลัง)
```

---

## 3. หน้าที่และความรับผิดชอบของแต่ละโมดูล (Module Contracts)

### A. `<GameName>Screen.tsx` (Orchestrator)
- ทำหน้าที่เป็นศูนย์กลางเชื่อมโยง State และ Firestore Subscription:
  - `listenToRoom(roomId, callback)`
  - `listenToRoomPlayers(roomId, callback)`
  - `useRoomTransition('<game-id>')` ร่วมกับ `<GameSceneTransition />`
- เรียกใช้ `<GameHubScreen />` เมื่อยังไม่มีห้องที่กำลังเล่น (`!activeRoom`)
- ประกอบ Sub-components ต่างๆ เข้าด้วยกันเมื่ออยู่ในห้องเล่นสด

### B. `<GameName>TopBar.tsx`
- แถบเมนูด้านบนแบบ Sticky:
  - ปุ่ม `กลับสู่คลังบอร์ดเกม` (ผูกกับฟังก์ชัน Intercept ตรวจสอบโฮสต์)
  - ไอคอน Emoji ประจำเกมและชื่อเกมพร้อมคำบรรยายสั้น
  - ปุ่ม `ชวนเพื่อน / QR` (แสดงเมื่อมีห้องเล่น)
  - ปุ่มเปิด Modal เพื่อนออนไลน์พร้อม Badge แสดงจำนวนคำขอค้าง
  - ป้ายข้อมูลบัญชีและ Friend Code ของผู้ใช้

### C. `<GameName>ActiveRoomHeader.tsx`
- ส่วนหัวของห้องเล่นสดในกระดาน:
  - รหัสห้อง 4 หลัก (เช่น `#5821`) และชื่อห้อง
  - ปุ่ม `แชร์ห้อง / QR Code`
  - ปุ่ม `ยุบห้อง / ออก` (สำหรับโฮสต์) หรือ `ออกจากห้อง` (สำหรับผู้เล่นทั่วไป)

### D. `<GameName>InvitesBanner.tsx`
- แถบแจ้งเตือนเมื่อมีเพื่อนส่งคำเชิญเข้าห้องเกมนี้:
  - แสดงชื่อผู้ชวนและรหัสห้อง
  - ปุ่ม `เข้าร่วมห้องทันที`
  - ปุ่มปิด (`X`) การแจ้งเตือน

### E. `<GameName>SpeakerBar.tsx` (สำหรับเกมที่ใช้เสียงนำเล่น)
- แถบควบคุมลำโพง Game Master ภาษาไทย:
  - สัญญาณไฟกะพริบ Pulse แสดงสถานะลำโพง
  - ปุ่ม `🔊 ทดสอบเสียงพากย์` (เรียกใช้ `thaiGameMaster`)
  - ปุ่มเปิด/ปิดเสียงบรรยาย Game Master

### F. `<GameName>Lobby.tsx`
- หน้าจอห้องรอผู้เล่นและตั้งค่ากติกาก่อนเริ่มเกม:
  - ป้ายประกาศรหัสห้องขนาดใหญ่
  - แถบดึงเพื่อนที่นั่งโต๊ะเดียวกันเข้าร่วมห้องทันที
  - การ์ดตั้งค่ากติกาและโหมดพิเศษของเกม (เช่น โหมด AI, หมวดหมู่คำ, ตัวจับเวลา)
  - ตารางที่นั่งผู้เล่น (แสดงสถานะความพร้อม, มงกุฎโฮสต์, ปุ่มลบผู้เล่น)
  - ปุ่ม `+ เพิ่มบอทซ้อมมือ` สำหรับทดสอบ
  - ปุ่มกดยืนยันความพร้อม และปุ่ม `เริ่มเกม` ของโฮสต์

### G. `<GameName>Phases.tsx`
- หน้ากระดานเกมตาม Step ต่างๆ (แจกบทบาท, แอ็กชันกลางคืน/กลางวัน, ถกเถียง, โหวต, สรุปผลชัยชนะ)
- แยก UI แต่ละช่วงให้กระชับและตอบสนองได้ทั้ง Desktop และ Mobile

### H. `use<GameName>GameMaster.ts` (Custom Hook)
- สกัด Logic การจับเวลาและเสียงบรรยายทั้งหมดออกจากคอมโพเนนต์ UI:
  - ตัวนับเวลาถอยหลัง (Intervals) เช่น ช่วงกลางคืน 10 วินาที, เวลาถามคำถาม 3 นาที
  - การสั่งการ Web Speech API ของ `thaiGameMaster`
  - เสียงซาวด์เอฟเฟกต์ `tableAudio` (กระดิ่ง, ฆ้อง, ทอยเต๋า)
  - เอฟเฟกต์เปิดการ์ดและ Confetti เฉลองชัยชนะ
  - ล้างเสียงพากย์และ Timer ในฟังก์ชัน Cleanup (`return () => ...`) เมื่อ Unmount เสมอ

---

## 4. Checklist ก่อนส่งมอบงานของ Agent (Pre-flight Checklist)

- [ ] ทุกไฟล์ใน `src/components/<game-id>/` มีจำนวนบรรทัดต่ำกว่า 800 บรรทัด
- [ ] Modal ทุกตัวใช้ Portal และแอนิเมชันของ Framer Motion ไม่ถูก z-index หน้าหลักบัง
- [ ] มีระบบป้องกันโฮสต์เผลอกดออกจนห้องค้าง (`DisbandRoomConfirmModal`)
- [ ] รันการตรวจสอบแบบคู่ขนาน:
  ```bash
  npm run build  # หรือ compile_applet
  npm run lint   # หรือ lint_applet (tsc --noEmit)
  ```
  โดยต้องผ่าน 100% ไม่มีข้อผิดพลาด (Zero Errors / Zero Warnings)
- [ ] โทนสีและสไตล์ของเกมเป็น Light Pastel สว่างตา และ Scrollbar เป็นแบบ Slim ไม่เกะกะ
