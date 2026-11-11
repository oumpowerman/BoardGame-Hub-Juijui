import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { FirestoreRoom, FirestorePlayer } from '../../firebase/tableService';
import { STEP_LIST } from './phases/phaseUtils';
import { RoleDealStep } from './phases/RoleDealStep';
import { DiceRollStep } from './phases/DiceRollStep';
import { NightTimelineStep } from './phases/NightTimelineStep';
import { FollowerStep } from './phases/FollowerStep';
import { MorningVoteStep } from './phases/MorningVoteStep';
import { GameOverVerdictStep } from './phases/GameOverVerdictStep';

export interface InPersonPhasesProps {
  currentRoom: FirestoreRoom;
  players: FirestorePlayer[];
  currentUid: string;
  isPeekingRole: boolean;
  rollingDice: boolean;
  rolledDicePair: number[];
  chosenWakeHour: number | null;
  hourSecondsLeft: number;
  selectedVoteTarget: string;
  debateSecondsLeft: number;
  isLoading: boolean;
  onPeekRoleStart: () => void;
  onPeekRoleEnd: () => void;
  onTogglePeekRole?: () => void;
  onAcknowledgeRole: () => void;
  onRollDiceInCup: () => void;
  onConfirmDiceCupChoice: (primaryHour: number, secondaryHour?: number) => void;
  onGrabCheese: () => void;
  onPeekPlayerCup: (targetPlayerId: string) => void;
  onSelectFollowers: (targetIds: string[]) => void;
  onConfirmFollowerPhase: () => void;
  onAdvanceNightHour: (hour: number) => void;
  onToggleNightPause?: (isPaused: boolean) => void;
  onChangeNightDuration?: (seconds: number) => void;
  onSelectVoteTarget: (targetId: string) => void;
  onCastVote: () => void;
  onPlayAgain: () => void;
  onOpenScoreModal?: () => void;
  onForceAdvancePhase?: () => void;
}

export const InPersonPhases: React.FC<InPersonPhasesProps> = ({
  currentRoom,
  players,
  currentUid,
  isPeekingRole,
  rollingDice,
  rolledDicePair,
  chosenWakeHour,
  hourSecondsLeft,
  selectedVoteTarget,
  debateSecondsLeft,
  isLoading,
  onPeekRoleStart,
  onPeekRoleEnd,
  onTogglePeekRole,
  onAcknowledgeRole,
  onRollDiceInCup,
  onConfirmDiceCupChoice,
  onGrabCheese,
  onPeekPlayerCup,
  onSelectFollowers,
  onConfirmFollowerPhase,
  onAdvanceNightHour,
  onToggleNightPause,
  onChangeNightDuration,
  onSelectVoteTarget,
  onCastVote,
  onPlayAgain,
  onOpenScoreModal,
  onForceAdvancePhase,
}) => {
  const [selectedFollowerTargets, setSelectedFollowerTargets] = useState<
    string[]
  >([]);

  const totalPlayers = players.length;
  const isFourPlayerDualDice = totalPlayers === 4;
  const myPlayer = players.find((p) => p.id === currentUid);
  const myWakeHour = myPlayer?.diceHour || chosenWakeHour || 0;
  const mySecondHour = myPlayer?.secondaryDiceHour || 0;

  // In 4-player mode, Cheese Thief wakes on BOTH dice hours; Sleepyheads wake on their chosen 1 die hour
  const isMyHour =
    currentRoom.nightHour === myWakeHour ||
    (isFourPlayerDualDice &&
      myPlayer?.role === 'cheese_thief' &&
      mySecondHour > 0 &&
      currentRoom.nightHour === mySecondHour);

  const thiefPlayer = players.find((p) => p.role === 'cheese_thief');

  // Who else is awake at the current nightHour?
  const awakePlayersAtCurrentHour = players.filter((p) => {
    const wakesPrimary = p.diceHour === currentRoom.nightHour;
    const wakesSecondary =
      isFourPlayerDualDice &&
      p.role === 'cheese_thief' &&
      (p.secondaryDiceHour || 0) === currentRoom.nightHour;
    return wakesPrimary || wakesSecondary;
  });

  const coAwakeWithMeNow = awakePlayersAtCurrentHour.filter(
    (p) => p.id !== currentUid
  );

  // Co-awake players during my primary wake hour (for morning summary)
  const coAwakeInMyPrimaryHour = players.filter((p) => {
    if (p.id === currentUid) return false;
    return (
      p.diceHour === myWakeHour ||
      (isFourPlayerDualDice &&
        p.role === 'cheese_thief' &&
        (p.secondaryDiceHour || 0) === myWakeHour)
    );
  });

  const activeStepNumber =
    STEP_LIST.find((s) => s.phases.includes(currentRoom.status))?.step || 2;

  const toggleFollowerSelection = (pid: string, maxNeeded: number) => {
    setSelectedFollowerTargets((prev) => {
      if (prev.includes(pid)) {
        return prev.filter((id) => id !== pid);
      }
      if (prev.length >= maxNeeded) {
        return [...prev.slice(1), pid];
      }
      return [...prev, pid];
    });
  };

  const followersList = players.filter(
    (p) => p.isFollower || currentRoom.followerIds?.includes(p.id)
  );
  const isHost = currentRoom.hostId === currentUid;

  return (
    <div className="space-y-5 pb-6">
      {/* 6-Step Progress Bar */}
      <div className="grid grid-cols-6 gap-1.5 p-2 bg-white/90 border border-amber-200/80 rounded-2xl">
        {STEP_LIST.map((item) => {
          const isCurrent = item.step === activeStepNumber;
          const isCompleted = item.step < activeStepNumber;
          return (
            <div
              key={item.step}
              className={`py-1.5 px-1 rounded-xl text-center transition-all ${
                isCurrent
                  ? 'bg-amber-400 text-amber-950 font-extrabold shadow-2xs scale-[1.02]'
                  : isCompleted
                  ? 'bg-emerald-100 text-emerald-900 font-bold'
                  : 'bg-slate-50 text-slate-400 font-medium'
              }`}
            >
              <div className="text-[10px] font-mono">STEP {item.step}</div>
              <div className="text-[10px] truncate">{item.label}</div>
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 2: INITIAL ROLE CARD DEAL */}
        {currentRoom.status === 'role_deal' && (
          <RoleDealStep
            currentRoom={currentRoom}
            players={players}
            myPlayer={myPlayer}
            isHost={isHost}
            isPeekingRole={isPeekingRole}
            onTogglePeekRole={onTogglePeekRole}
            onPeekRoleStart={onPeekRoleStart}
            onPeekRoleEnd={onPeekRoleEnd}
            onAcknowledgeRole={onAcknowledgeRole}
            onForceAdvancePhase={onForceAdvancePhase}
          />
        )}

        {/* STEP 3: ROLL DICE IN CUP & SLIDE CUP TOWARD THE CHEESE */}
        {currentRoom.status === 'dice_roll' && (
          <DiceRollStep
            players={players}
            myPlayer={myPlayer}
            isHost={isHost}
            isFourPlayerDualDice={isFourPlayerDualDice}
            rollingDice={rollingDice}
            rolledDicePair={rolledDicePair}
            onRollDiceInCup={onRollDiceInCup}
            onConfirmDiceCupChoice={onConfirmDiceCupChoice}
            onForceAdvancePhase={onForceAdvancePhase}
          />
        )}

        {/* STEP 4A: NIGHT PHASE (1:00 - 6:00 AM) */}
        {currentRoom.status === 'night_phases' && (
          <NightTimelineStep
            currentRoom={currentRoom}
            players={players}
            currentUid={currentUid}
            myPlayer={myPlayer}
            thiefPlayer={thiefPlayer}
            isFourPlayerDualDice={isFourPlayerDualDice}
            myWakeHour={myWakeHour}
            mySecondHour={mySecondHour}
            isMyHour={isMyHour}
            coAwakeWithMeNow={coAwakeWithMeNow}
            hourSecondsLeft={hourSecondsLeft}
            onGrabCheese={onGrabCheese}
            onPeekPlayerCup={onPeekPlayerCup}
            onAdvanceNightHour={onAdvanceNightHour}
            onToggleNightPause={onToggleNightPause}
            onChangeNightDuration={onChangeNightDuration}
          />
        )}

        {/* STEP 4B: FOLLOWER PHASE (5-8 PLAYERS) */}
        {currentRoom.status === 'follower_phase' && (
          <FollowerStep
            currentRoom={currentRoom}
            players={players}
            currentUid={currentUid}
            myPlayer={myPlayer}
            thiefPlayer={thiefPlayer}
            followersList={followersList}
            selectedFollowerTargets={selectedFollowerTargets}
            onToggleFollowerSelection={toggleFollowerSelection}
            onSelectFollowers={onSelectFollowers}
            onConfirmFollowerPhase={onConfirmFollowerPhase}
          />
        )}

        {/* STEP 5: MORNING DEBATE & SIMULTANEOUS VOTE */}
        {currentRoom.status === 'voting' && (
          <MorningVoteStep
            players={players}
            currentUid={currentUid}
            myPlayer={myPlayer}
            myWakeHour={myWakeHour}
            mySecondHour={mySecondHour}
            coAwakeInMyPrimaryHour={coAwakeInMyPrimaryHour}
            debateSecondsLeft={debateSecondsLeft}
            selectedVoteTarget={selectedVoteTarget}
            isLoading={isLoading}
            onSelectVoteTarget={onSelectVoteTarget}
            onCastVote={onCastVote}
          />
        )}

        {/* STEP 6: FLIP ACCUSED CARD & WIN CONDITION VERDICT */}
        {currentRoom.status === 'game_over' && (
          <GameOverVerdictStep
            currentRoom={currentRoom}
            players={players}
            currentUid={currentUid}
            isLoading={isLoading}
            onPlayAgain={onPlayAgain}
            onOpenScoreModal={onOpenScoreModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
