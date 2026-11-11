import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronDown,
  MessageSquare,
  Play,
  Users,
  Clock,
  Zap,
  BookOpen,
  Sparkles,
  Shield,
  Dice5,
  ArrowRight,
  Link,
  Unlock,
} from 'lucide-react';
import { BoardGame } from '../types/boardgame';
import { parseGoogleDriveUrl } from '../utils/googleDriveMedia';

interface GameCatalogGridProps {
  games: BoardGame[];
  realCheeseRoomsCount: number;
  realInsiderRoomsCount?: number;
  realUndercoverRoomsCount?: number;
  realDetectiveClubRoomsCount?: number;
  realAvalonRoomsCount?: number;
  realHuesCuesRoomsCount?: number;
  realDyingMessageRoomsCount?: number;
  onEnterCheeseThiefScreen: () => void;
  onEnterInsiderScreen?: () => void;
  onEnterUndercoverScreen?: () => void;
  onEnterDetectiveClubScreen?: () => void;
  onEnterAvalonScreen?: () => void;
  onEnterHuesCuesScreen?: () => void;
  onEnterDyingMessageScreen?: () => void;
  onOpenGameSubForum: (gameSlug: BoardGame['slug']) => void;
  onResetFilter: () => void;
}

export const GameCatalogGrid: React.FC<GameCatalogGridProps> = ({
  games,
  realCheeseRoomsCount,
  realInsiderRoomsCount = 0,
  realUndercoverRoomsCount = 0,
  realDetectiveClubRoomsCount = 0,
  realAvalonRoomsCount = 0,
  realHuesCuesRoomsCount = 0,
  realDyingMessageRoomsCount = 0,
  onEnterCheeseThiefScreen,
  onEnterInsiderScreen,
  onEnterUndercoverScreen,
  onEnterDetectiveClubScreen,
  onEnterAvalonScreen,
  onEnterHuesCuesScreen,
  onEnterDyingMessageScreen,
  onOpenGameSubForum,
  onResetFilter,
}) => {
  const [expandedGameId, setExpandedGameId] = useState<string | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  // Developer mode unlock state via triple-click on cover images
  const [isDevUnlocked, setIsDevUnlocked] = useState<boolean>(false);
  const [unlockToast, setUnlockToast] = useState<boolean>(false);
  const clickTrackerRef = useRef<{ count: number; lastTime: number }>({
    count: 0,
    lastTime: 0,
  });

  // Custom Google Drive cover/video overrides stored in localStorage
  const [customCovers, setCustomCovers] = useState<Record<string, string>>({});
  const [editingGameSlug, setEditingGameSlug] = useState<string | null>(null);
  const [gdriveInput, setGdriveInput] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loaded: Record<string, string> = {};
      for (const g of games) {
        const saved = localStorage.getItem(`tabletop_gdrive_cover_${g.slug}`);
        if (saved) {
          loaded[g.slug] = saved;
        }
      }
      setCustomCovers(loaded);
    }
  }, [games]);

  const handleCoverClick = () => {
    const now = Date.now();
    const diff = now - clickTrackerRef.current.lastTime;
    if (diff < 450) {
      const nextCount = clickTrackerRef.current.count + 1;
      if (nextCount >= 3) {
        setIsDevUnlocked(true);
        setUnlockToast(true);
        setTimeout(() => setUnlockToast(false), 3000);
        clickTrackerRef.current = { count: 0, lastTime: 0 };
      } else {
        clickTrackerRef.current = { count: nextCount, lastTime: now };
      }
    } else {
      clickTrackerRef.current = { count: 1, lastTime: now };
    }
  };

  const handleSaveCover = (slug: string) => {
    const trimmed = gdriveInput.trim();
    if (typeof window !== 'undefined') {
      if (trimmed) {
        localStorage.setItem(`tabletop_gdrive_cover_${slug}`, trimmed);
        setCustomCovers((prev) => ({ ...prev, [slug]: trimmed }));
      } else {
        localStorage.removeItem(`tabletop_gdrive_cover_${slug}`);
        setCustomCovers((prev) => {
          const copy = { ...prev };
          delete copy[slug];
          return copy;
        });
      }
    }
    setEditingGameSlug(null);
    setGdriveInput('');
  };

  if (games.length === 0) {
    return (
      <div className="py-16 px-6 text-center bg-white/80 border border-rose-100 rounded-2xl shadow-xs space-y-4">
        <p className="text-base font-semibold text-slate-800">
          ไม่พบบอร์ดเกมที่ตรงกับคำค้นหาหรือหมวดหมู่ที่เลือก
        </p>
        <p className="text-sm text-slate-500">
          ลองเปลี่ยนหมวดหมู่เป็น &ldquo;ทุกหมวดหมู่&rdquo; หรือล้างคำค้นหาเพื่อดูบอร์ดเกมทั้งหมด
        </p>
        <button
          type="button"
          onClick={onResetFilter}
          className="px-4 py-2 text-xs font-bold text-rose-950 bg-rose-200 hover:bg-rose-300 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
        >
          แสดงบอร์ดเกมทั้งหมด
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Unlock Toast Notification */}
      <AnimatePresence>
        {unlockToast && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="p-3 bg-amber-500 text-amber-950 rounded-2xl shadow-lg flex items-center justify-between gap-3 text-xs font-black max-w-md mx-auto"
          >
            <div className="flex items-center gap-2">
              <Unlock className="w-4 h-4" />
              <span>ปลดล็อกโหมดตั้งค่า Google Drive ปกเกมสำเร็จ! (แสดงปุ่มตั้งค่าบนปกเกม)</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {games.map((game) => {
          const isExpanded = expandedGameId === game.id;
          const hasError = imgErrors[game.id];
          const isCheeseThief = game.slug === 'cheese-thief';
          const isInsider = game.slug === 'insider';
          const isUndercover = game.slug === 'undercover';
          const isDetectiveClub = game.slug === 'detective-club';
          const isAvalon = game.slug === 'avalon';
          const isHuesCues = game.slug === 'hues-cues';
          const isDyingMessage = game.slug === 'dying-message';

          // Resolve cover image or Google Drive link
          const activeCoverSource = customCovers[game.slug] || game.coverImage;
          const parsedMedia = parseGoogleDriveUrl(activeCoverSource);
          const isVideoPreview =
            parsedMedia.isDrive &&
            (activeCoverSource.toLowerCase().includes('video') ||
              activeCoverSource.toLowerCase().endsWith('.mp4') ||
              activeCoverSource.toLowerCase().includes('export=download'));

          return (
            <article
              key={game.id}
              className={`flex flex-col justify-between bg-white rounded-3xl overflow-hidden transition-all duration-200 ${
                isCheeseThief
                  ? 'border-2 border-amber-400 shadow-md ring-2 ring-amber-200/60'
                  : isInsider
                  ? 'border-2 border-rose-400 shadow-md ring-2 ring-rose-200/60'
                  : isUndercover
                  ? 'border-2 border-indigo-500 shadow-md ring-2 ring-indigo-200/60'
                  : isDetectiveClub
                  ? 'border-2 border-amber-600 shadow-md ring-2 ring-amber-300/60'
                  : isAvalon
                  ? 'border-2 border-emerald-600 shadow-md ring-2 ring-emerald-300/60'
                  : isHuesCues
                  ? 'border-2 border-pink-500 shadow-md ring-2 ring-pink-200/60'
                  : isDyingMessage
                  ? 'border-2 border-sky-500 shadow-md ring-2 ring-sky-200/60'
                  : 'border border-rose-100/90 shadow-xs hover:shadow-md'
              }`}
            >
              <div>
                {/* Cover Image / Google Drive Looping Preview Container */}
                <div
                  onClick={handleCoverClick}
                  className="relative aspect-[16/9] w-full bg-rose-50 overflow-hidden group cursor-pointer"
                  title="คลิกติดกัน 3 ครั้งเพื่อปลดล็อกตั้งค่า GDrive ปกเกม"
                >
                  {editingGameSlug === game.slug ? (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute inset-0 z-20 bg-slate-900/95 p-5 flex flex-col justify-center space-y-3"
                    >
                      <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Link className="w-4 h-4" />
                        <span>วางลิงก์ Google Drive หรือ File ID สำหรับหน้าปก</span>
                      </div>
                      <input
                        type="text"
                        value={gdriveInput}
                        onChange={(e) => setGdriveInput(e.target.value)}
                        placeholder="https://drive.google.com/file/d/... หรือ File ID"
                        className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-xs text-white placeholder-slate-400 outline-none focus:border-amber-400 font-mono"
                        autoFocus
                      />
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingGameSlug(null);
                            setGdriveInput('');
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg cursor-pointer"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveCover(game.slug)}
                          className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-black rounded-lg cursor-pointer shadow-xs"
                        >
                          บันทึกปก GDrive
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {isVideoPreview ? (
                    <video
                      src={parsedMedia.directVideoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : !hasError ? (
                    <img
                      src={parsedMedia.isDrive ? parsedMedia.directImageUrl : activeCoverSource}
                      alt={`ภาพหน้าปกบอร์ดเกม ${game.titleTh}`}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setImgErrors((prev) => ({ ...prev, [game.id]: true }))
                      }
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-rose-100 via-amber-50 to-pink-100 p-6 text-center">
                      <span className="text-lg font-bold text-rose-900">
                        {game.titleTh}
                      </span>
                      <span className="text-xs text-rose-600 mt-1">
                        {game.titleEn}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/25 to-transparent pointer-events-none" />

                  {/* Google Drive Link Config Button (Visible only when isDevUnlocked is true) */}
                  {isDevUnlocked && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingGameSlug(game.slug);
                        setGdriveInput(customCovers[game.slug] || '');
                      }}
                      className="absolute top-3 right-4 px-2.5 py-1 bg-black/70 hover:bg-black/90 backdrop-blur-md text-white border border-white/30 text-[11px] font-bold rounded-lg shadow-md transition cursor-pointer inline-flex items-center gap-1.5 z-10"
                      title="ปรับแต่งรูปหน้าปกหรือวิดีโอวนลูปจาก Google Drive"
                    >
                      <Link className="w-3 h-3 text-amber-300" />
                      <span>GDrive ปก</span>
                    </button>
                  )}

                  {isCheeseThief && (
                    <div className="absolute top-3 left-4 px-3 py-1 bg-amber-400 text-amber-950 text-xs font-extrabold rounded-xl shadow-xs">
                      🧀 เกมไฮไลต์ยอดนิยม · เปิดโต๊ะเล่นออนไลน์
                    </div>
                  )}

                  {isInsider && (
                    <div className="absolute top-3 left-4 px-3 py-1 bg-rose-600 text-white text-xs font-extrabold rounded-xl shadow-xs">
                      🕵️ จอมบงการคำใบ้ · เปิดโต๊ะเล่นออนไลน์ + เสียง GM
                    </div>
                  )}

                  {isUndercover && (
                    <div className="absolute top-3 left-4 px-3 py-1 bg-indigo-600 text-white text-xs font-extrabold rounded-xl shadow-xs">
                      🕶️ สายลับสลับคำ · เปิดโต๊ะเล่นออนไลน์ + AI คำคู่สด
                    </div>
                  )}

                  {isDetectiveClub && (
                    <div className="absolute top-3 left-4 px-3 py-1 bg-amber-700 text-white text-xs font-extrabold rounded-xl shadow-xs">
                      🔍 สมาคมนักสืบ · ดิจิทัล Companion คู่การ์ดภาพจริง
                    </div>
                  )}

                  {isAvalon && (
                    <div className="absolute top-3 left-4 px-3 py-1 bg-emerald-600 text-white text-xs font-extrabold rounded-xl shadow-xs">
                      👑 Avalon · ดิจิทัล Companion ช่วยโหวตทีม & แอบส่องบทบาท
                    </div>
                  )}

                  {isHuesCues && (
                    <div className="absolute top-3 left-4 px-3 py-1 bg-pink-600 text-white text-xs font-extrabold rounded-xl shadow-xs">
                      🎨 Hues & Cues · สแกน iPad เป็นกระดานกลาง + ซิงค์มือถือ
                    </div>
                  )}

                  {isDyingMessage && (
                    <div className="absolute top-3 left-4 px-3 py-1 bg-sky-600 text-white text-xs font-extrabold rounded-xl shadow-xs">
                      🔎 เบาะแสมรณะ · เชื่อม iPad กลางโต๊ะ + ซ่อนข้อมูลซ้ำบนมือถือ
                    </div>
                  )}

                  <div className="absolute bottom-3 left-5 right-5 flex items-end justify-between gap-4 text-white pointer-events-none">
                    <div>
                      <p className="text-xs text-amber-200 font-semibold drop-shadow-xs">
                        {game.categoryLabel} · {game.titleEn}
                      </p>
                      <h2 className="text-xl font-bold tracking-tight drop-shadow-sm">
                        {game.titleTh}
                      </h2>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Clean Unboxed Metadata with Typographic Separators */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 font-mono tabular-nums">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                      <Users className="w-3.5 h-3.5 text-amber-600" />
                      {game.minPlayers}–{game.maxPlayers} คน
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      {game.durationMinutes} นาที
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 font-sans">
                      <Zap className="w-3.5 h-3.5 text-rose-500" />
                      ความยาก: {game.difficulty}
                    </span>
                    {isCheeseThief && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-bold text-emerald-700">
                          โต๊ะออนไลน์ขณะนี้: {realCheeseRoomsCount} ห้อง
                        </span>
                      </>
                    )}
                    {isInsider && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-bold text-rose-700">
                          โต๊ะออนไลน์ขณะนี้: {realInsiderRoomsCount} ห้อง
                        </span>
                      </>
                    )}
                    {isUndercover && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-bold text-violet-700">
                          โต๊ะออนไลน์ขณะนี้: {realUndercoverRoomsCount} ห้อง
                        </span>
                      </>
                    )}
                    {isDetectiveClub && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-bold text-amber-800">
                          โต๊ะสืบคดีขณะนี้: {realDetectiveClubRoomsCount} ห้อง
                        </span>
                      </>
                    )}
                    {isAvalon && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-bold text-emerald-700">
                          โต๊ะอัศวินขณะนี้: {realAvalonRoomsCount} ห้อง
                        </span>
                      </>
                    )}
                    {isHuesCues && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-bold text-pink-700">
                          โต๊ะทายสีขณะนี้: {realHuesCuesRoomsCount} ห้อง
                        </span>
                      </>
                    )}
                    {isDyingMessage && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-bold text-sky-700">
                          โต๊ะสืบคดีขณะนี้: {realDyingMessageRoomsCount} ห้อง
                        </span>
                      </>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {game.shortSummary}
                  </p>

                  {/* Expandable Rules & Secret Roles Section */}
                  <div className="pt-2 border-t border-rose-100">
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() =>
                        setExpandedGameId(isExpanded ? null : game.id)
                      }
                      className="w-full flex items-center justify-between py-1.5 text-xs font-semibold text-rose-700 hover:text-rose-900 transition-colors cursor-pointer select-none"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-rose-500" />
                        <span>
                          กติกาการเล่น & บทบาทสำคัญ ({game.rolesList.length} บทบาท)
                        </span>
                      </span>
                      <motion.span
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                        className="inline-flex items-center justify-center"
                      >
                        <ChevronDown className="w-4 h-4 text-rose-500" />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          key="rules-accordion-content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 space-y-3 text-xs text-slate-700 bg-rose-50/50 p-4 rounded-xl border border-rose-100">
                            <div>
                              <h3 className="font-bold text-rose-900 mb-1.5 inline-flex items-center gap-1.5">
                                <Dice5 className="w-3.5 h-3.5 text-rose-600" />
                                <span>สรุปลำดับการเล่น</span>
                              </h3>
                              <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1">
                                {game.rulesOverview.map((rule, idx) => (
                                  <li key={idx} className="leading-relaxed">
                                    {rule}
                                  </li>
                                ))}
                              </ol>
                            </div>

                            <div className="pt-2 border-t border-rose-200/60">
                              <h3 className="font-bold text-rose-900 mb-1.5 inline-flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5 text-rose-600" />
                                <span>บทบาทตัวละครในเกม</span>
                              </h3>
                              <div className="space-y-2">
                                {game.rolesList.map((role, rIdx) => (
                                  <div
                                    key={rIdx}
                                    className="flex flex-col sm:flex-row sm:items-baseline gap-1 bg-white/70 p-2 rounded-lg border border-rose-100/80"
                                  >
                                    <span className="font-bold text-slate-900 shrink-0 inline-flex items-center gap-1">
                                      <Sparkles className="w-3 h-3 text-amber-500" />
                                      {role.name}
                                    </span>
                                    <span
                                      className="hidden sm:inline text-slate-400"
                                      aria-hidden="true"
                                    >
                                      —
                                    </span>
                                    <span className="text-slate-600">
                                      {role.ability}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="px-5 sm:px-6 py-4 bg-amber-50/50 border-t border-amber-100 flex flex-wrap items-center justify-between gap-2">
                {isCheeseThief ? (
                  <button
                    type="button"
                    onClick={onEnterCheeseThiefScreen}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-extrabold text-amber-950 bg-amber-400 hover:bg-amber-300 border border-amber-400 rounded-xl shadow-xs hover:scale-[1.01] active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer min-h-[42px]"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>เข้าสู่โต๊ะเล่นหนูขโมยชีส</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : isInsider && onEnterInsiderScreen ? (
                  <button
                    type="button"
                    onClick={onEnterInsiderScreen}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white bg-rose-600 hover:bg-rose-700 border border-rose-600 rounded-xl shadow-xs hover:scale-[1.01] active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer min-h-[42px]"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>เข้าสู่โต๊ะเล่น Insider</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : isUndercover && onEnterUndercoverScreen ? (
                  <button
                    type="button"
                    onClick={onEnterUndercoverScreen}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-600 rounded-xl shadow-xs hover:scale-[1.01] active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer min-h-[42px]"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>เข้าสู่โต๊ะเล่น Undercover</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : isDetectiveClub && onEnterDetectiveClubScreen ? (
                  <button
                    type="button"
                    onClick={onEnterDetectiveClubScreen}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white bg-amber-700 hover:bg-amber-800 border border-amber-700 rounded-xl shadow-xs hover:scale-[1.01] active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer min-h-[42px]"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>เปิดสมุดสืบคดี Detective Club</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : isAvalon && onEnterAvalonScreen ? (
                  <button
                    type="button"
                    onClick={onEnterAvalonScreen}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-600 rounded-xl shadow-xs hover:scale-[1.01] active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer min-h-[42px]"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>เปิดโต๊ะ Avalon Companion</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : isHuesCues && onEnterHuesCuesScreen ? (
                  <button
                    type="button"
                    onClick={onEnterHuesCuesScreen}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white bg-pink-600 hover:bg-pink-500 border border-pink-600 rounded-xl shadow-xs hover:scale-[1.01] active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer min-h-[42px]"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>เข้าสู่โต๊ะเล่น Hues & Cues</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : isDyingMessage && onEnterDyingMessageScreen ? (
                  <button
                    type="button"
                    onClick={onEnterDyingMessageScreen}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white bg-sky-600 hover:bg-sky-500 border border-sky-600 rounded-xl shadow-xs hover:scale-[1.01] active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer min-h-[42px]"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>เข้าสู่โต๊ะเล่นเบาะแสมรณะ</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded-xl whitespace-nowrap shrink-0">
                    <span>คู่มือกติกาและข้อมูลบทบาท</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => onOpenGameSubForum(game.slug)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200/80 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                  <span>คอมมูนิตี้พูดคุย</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
