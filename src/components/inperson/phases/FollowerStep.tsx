import React from 'react';
import { motion } from 'motion/react';
import { Users, Sun } from 'lucide-react';
import { FirestoreRoom, FirestorePlayer } from '../../../firebase/tableService';

interface FollowerStepProps {
  currentRoom: FirestoreRoom;
  players: FirestorePlayer[];
  currentUid: string;
  myPlayer?: FirestorePlayer;
  thiefPlayer?: FirestorePlayer;
  followersList: FirestorePlayer[];
  selectedFollowerTargets: string[];
  onToggleFollowerSelection: (pid: string, maxNeeded: number) => void;
  onSelectFollowers: (targetIds: string[]) => void;
  onConfirmFollowerPhase: () => void;
}

export const FollowerStep: React.FC<FollowerStepProps> = ({
  currentRoom,
  players,
  currentUid,
  myPlayer,
  thiefPlayer,
  followersList,
  selectedFollowerTargets,
  onToggleFollowerSelection,
  onSelectFollowers,
  onConfirmFollowerPhase,
}) => {
  const totalPlayers = players.length;

  return (
    <motion.div
      key="phase-follower"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="space-y-5 text-center"
    >
      <div className="space-y-1">
        <span className="px-3 py-1 bg-rose-100 text-rose-900 rounded-full text-xs font-bold inline-flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-rose-600" />
          <span>
            STEP 4 (ช่วงท้ายคืน): ระบบลูกน้อง (Follower) สำหรับ {totalPlayers} คน
          </span>
        </span>
        <h3 className="text-xl font-extrabold text-slate-900">
          {totalPlayers === 5
            ? 'กติกา 5 คน: หนูที่เห็นตอนจอมโจรขโมยชีส จะกลายเป็นลูกน้องทันที!'
            : totalPlayers === 6
            ? 'กติกา 6 คน: จอมโจรชีสเลือกลูกน้อง 1 คน'
            : `กติกา ${totalPlayers} คน: จอมโจรชีสเลือกลูกน้อง 2 คน`}
        </h3>
      </div>

      <div className="p-6 bg-white border border-rose-200 rounded-3xl shadow-xs space-y-4">
        {/* Case: 6-8 players and Follower selection not yet completed by human Cheese Thief */}
        {totalPlayers >= 6 &&
        (currentRoom.followerIds?.length || 0) === 0 &&
        myPlayer?.role === 'cheese_thief' ? (
          <div className="space-y-4">
            <p className="text-xs sm:text-sm font-bold text-rose-900">
              คุณคือจอมโจรชีส! เลือกผู้เล่น{' '}
              <strong>{totalPlayers === 6 ? '1 คน' : '2 คน'}</strong>{' '}
              เพื่อดึงมาเป็นลูกน้อง (Follower) ช่วยปั้นแพะในตอนเช้า:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
              {players
                .filter((p) => p.id !== currentUid)
                .map((p) => {
                  const isPicked = selectedFollowerTargets.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        onToggleFollowerSelection(
                          p.id,
                          totalPlayers === 6 ? 1 : 2
                        )
                      }
                      className={`p-3.5 rounded-2xl border font-bold text-xs sm:text-sm flex items-center justify-between cursor-pointer transition-all ${
                        isPicked
                          ? 'bg-rose-50 border-rose-400 text-rose-950 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-rose-50/40'
                      }`}
                    >
                      <span>{p.name}</span>
                      {isPicked && (
                        <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] rounded-full">
                          เลือกเป็นลูกน้อง
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
            <button
              type="button"
              disabled={
                selectedFollowerTargets.length !== (totalPlayers === 6 ? 1 : 2)
              }
              onClick={() => onSelectFollowers(selectedFollowerTargets)}
              className="w-full py-3.5 px-5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-extrabold text-sm rounded-2xl cursor-pointer"
            >
              ยืนยันการเลือกลูกน้อง ({selectedFollowerTargets.length}/
              {totalPlayers === 6 ? 1 : 2} คน)
            </button>
          </div>
        ) : totalPlayers >= 6 &&
          (currentRoom.followerIds?.length || 0) === 0 ? (
          <div className="py-6 space-y-2 text-slate-600">
            <div className="text-3xl">🕵️</div>
            <div className="font-bold text-sm text-slate-800">
              จอมโจรชีสกำลังแอบจิ้มเลือกลูกน้อง (
              {totalPlayers === 6 ? '1 คน' : '2 คน'})...
            </div>
          </div>
        ) : (
          /* Followers have been determined: Show private Follower status to each player */
          <div className="space-y-3">
            {myPlayer?.isFollower ? (
              <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl space-y-2 text-rose-950">
                <div className="text-3xl">🕵️</div>
                <div className="text-base sm:text-lg font-black">
                  คุณกลายเป็น &ldquo;ลูกน้อง (Follower)&rdquo; ของจอมโจรชีสแล้ว!
                </div>
                {totalPlayers === 7 ? (
                  <p className="text-xs leading-relaxed">
                    กติกา 7 คน: ลูกน้องทั้ง 2 คนลืมตามารู้จักกันเอง
                    (เพื่อนลูกน้องของคุณคือ{' '}
                    <strong>
                      {followersList
                        .filter((f) => f.id !== currentUid)
                        .map((f) => f.name)
                        .join(', ') || 'ไม่มี'}
                    </strong>
                    ) แต่ลูกน้องจะไม่รู้ว่าใครคือจอมโจรชีส!
                  </p>
                ) : (
                  <p className="text-xs leading-relaxed">
                    จอมโจรชีสตัวจริงคือ{' '}
                    <strong className="underline">{thiefPlayer?.name}</strong>
                    {followersList.length > 1
                      ? ` และเพื่อนลูกน้องของคุณคือ ${followersList
                          .filter((f) => f.id !== currentUid)
                          .map((f) => f.name)
                          .join(', ')}`
                      : ''}{' '}
                    · กติกาสำคัญ: ลูกน้องห้ามบอกข้อมูลเต๋าช่วงกลางคืน
                    และต้องช่วยปั้นแพะให้จอมโจรชีสรอดจากการถูกโหวต!
                  </p>
                )}
              </div>
            ) : myPlayer?.role === 'cheese_thief' ? (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-1.5 text-amber-950">
                <div className="font-extrabold text-sm">
                  🧀 สรุปลูกน้องของคุณในคืนนี้:
                </div>
                <p className="text-xs">
                  {followersList.length > 0
                    ? `ลูกน้องที่อยู่ฝั่งเดียวกับคุณคือ: ${followersList
                        .map((f) => f.name)
                        .join(', ')}`
                    : 'ไม่มีหนูตัวใดตื่นมาเห็นตอนคุณขโมยชีสในคืนนี้ (คุณลุยเดี่ยว!)'}
                </p>
              </div>
            ) : (
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl space-y-1.5 text-sky-950">
                <div className="font-extrabold text-sm">
                  🐭 คุณยังคงเป็นฝ่ายหนูขี้เซา (ไม่ได้ถูกเลือกเป็นลูกน้อง)
                </div>
                <p className="text-xs text-slate-600">
                  ระวังให้ดี!
                  ตอนนี้ในโต๊ะมีผู้เล่นที่กลายเป็นลูกน้องคอยช่วยปั้นแพะปกป้องจอมโจรชีสอยู่
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={onConfirmFollowerPhase}
              className="w-full py-3.5 px-5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-extrabold text-sm rounded-2xl shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <Sun className="w-4 h-4" />
              <span>เข้าสู่ตอนเช้า: ถกเถียง & โหวตจับจอมโจรชีส →</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
