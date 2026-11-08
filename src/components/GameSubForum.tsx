import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Search,
  Send,
  ThumbsUp,
  Pin,
  Tag,
  Award,
  Sparkles,
} from 'lucide-react';
import { BaseModal } from './BaseModal';
import { BoardGame, ForumThread, ThreadTag } from '../types/boardgame';
import { filterForumThreads } from '../utils/gameLogic';

interface GameSubForumProps {
  threads: ForumThread[];
  games: BoardGame[];
  selectedGameFilter: 'all' | BoardGame['slug'];
  onSelectGameFilter: (slug: 'all' | BoardGame['slug']) => void;
  activePlayerName: string;
  activePlayerRank: string;
  activePlayerElo: number;
  onCreateThread: (payload: {
    gameId: BoardGame['slug'];
    gameTitleTh: string;
    tag: Exclude<ThreadTag, 'ทั้งหมด'>;
    title: string;
    content: string;
  }) => Promise<void>;
  onAddComment: (threadId: string, content: string) => Promise<void>;
  onLikeThread: (threadId: string) => Promise<void>;
}

const THREAD_TAGS: ThreadTag[] = [
  'ทั้งหมด',
  'เทคนิคการเล่น',
  'วิเคราะห์เมต้า',
  'หาเพื่อนตี้',
  'พูดคุยทั่วไป',
];

export const GameSubForum: React.FC<GameSubForumProps> = ({
  threads,
  games,
  selectedGameFilter,
  onSelectGameFilter,
  activePlayerName,
  onCreateThread,
  onAddComment,
  onLikeThread,
}) => {
  const [selectedTag, setSelectedTag] = useState<ThreadTag>('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeThreadId, setActiveThreadId] = useState<string>(threads[0]?.id || 'thread-ct-1');
  const [showNewThreadForm, setShowNewThreadForm] = useState(false);

  // New Thread Form States
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newGameId, setNewGameId] = useState<BoardGame['slug']>(
    selectedGameFilter === 'all' ? 'cheese-thief' : selectedGameFilter
  );
  const [newTag, setNewTag] = useState<Exclude<ThreadTag, 'ทั้งหมด'>>('เทคนิคการเล่น');
  const [threadError, setThreadError] = useState('');

  // Live Comment Input State
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');

  const visibleThreads = filterForumThreads(
    threads,
    selectedGameFilter,
    selectedTag,
    searchQuery
  );

  const selectedThread =
    visibleThreads.find((t) => t.id === activeThreadId) ||
    visibleThreads[0] ||
    threads[0];

  const handleCreateThreadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      setThreadError('กรุณากรอกทั้งหัวข้อกระทู้และเนื้อหารายละเอียดก่อนโพสต์');
      return;
    }
    setThreadError('');
    const gameObj = games.find((g) => g.slug === newGameId) || games[0];
    await onCreateThread({
      gameId: newGameId,
      gameTitleTh: gameObj.titleTh,
      tag: newTag,
      title: newTitle.trim(),
      content: newContent.trim(),
    });
    setNewTitle('');
    setNewContent('');
    setShowNewThreadForm(false);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread) return;
    if (!commentText.trim()) {
      setCommentError('กรุณาพิมพ์ข้อความความคิดเห็นก่อนกดส่ง');
      return;
    }
    setCommentError('');
    const content = commentText.trim();
    setCommentText('');
    await onAddComment(selectedThread.id, content);
  };

  return (
    <section aria-label="ฟอรัมย่อยสำหรับแต่ละเกมและคอมเมนต์เรียลไทม์" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-rose-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-800 border border-sky-200/80 rounded-xl text-xs font-semibold mb-2">
            <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
            <span>Community Discussions</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            คอมมูนิตี้พูดคุย & แลกเปลี่ยนเทคนิคการเล่น
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            ตั้งกระทู้พูดคุย แชร์เทคนิคการบลัฟฟ์ วิเคราะห์แผนการเล่น และหาเพื่อนร่วมตี้แบบเรียลไทม์
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewThreadForm((prev) => !prev)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-sky-950 bg-gradient-to-r from-sky-200 via-indigo-100 to-pink-200 hover:from-sky-300 hover:to-pink-300 border border-sky-300/80 rounded-xl transition-all shadow-xs hover:shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-sky-700" />
          <span>{showNewThreadForm ? 'ปิดฟอร์มตั้งกระทู้' : 'ตั้งกระทู้ใหม่'}</span>
        </button>
      </div>

      {/* New Thread Modal via BaseModal */}
      <BaseModal
        isOpen={showNewThreadForm}
        onClose={() => setShowNewThreadForm(false)}
        title="ตั้งกระทู้พูดคุยในฟอรัมย่อย"
        icon={<Plus className="w-4 h-4 text-sky-600" />}
        subtitle="GAME SUB-FORUM"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateThreadSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="thread-game-select" className="block text-xs font-semibold text-slate-700 mb-1">
                เลือกฟอรัมย่อยของเกม
              </label>
              <select
                id="thread-game-select"
                value={newGameId}
                onChange={(e) => setNewGameId(e.target.value as BoardGame['slug'])}
                className="w-full px-3 py-2.5 text-sm bg-rose-50/40 border border-rose-200 rounded-xl text-slate-900 focus:outline-none focus:border-sky-400 min-h-[44px]"
              >
                {games.map((g) => (
                  <option key={g.slug} value={g.slug}>
                    {g.titleTh}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="thread-tag-select" className="block text-xs font-semibold text-slate-700 mb-1">
                หมวดหมู่หัวข้อ
              </label>
              <select
                id="thread-tag-select"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value as Exclude<ThreadTag, 'ทั้งหมด'>)}
                className="w-full px-3 py-2.5 text-sm bg-rose-50/40 border border-rose-200 rounded-xl text-slate-900 focus:outline-none focus:border-sky-400 min-h-[44px]"
              >
                <option value="เทคนิคการเล่น">เทคนิคการเล่น</option>
                <option value="วิเคราะห์เมต้า">วิเคราะห์เมต้า</option>
                <option value="หาเพื่อนตี้">หาเพื่อนตี้</option>
                <option value="พูดคุยทั่วไป">พูดคุยทั่วไป</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="thread-title-input" className="block text-xs font-semibold text-slate-700 mb-1">
              หัวข้อกระทู้
            </label>
            <input
              id="thread-title-input"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="พิมพ์หัวข้อกระทู้ที่น่าสนใจ..."
              className="w-full px-3.5 py-2.5 text-sm bg-rose-50/40 border border-rose-200 rounded-xl text-slate-900 focus:outline-none focus:border-sky-400 min-h-[44px]"
            />
          </div>

          <div>
            <label htmlFor="thread-content-input" className="block text-xs font-semibold text-slate-700 mb-1">
              รายละเอียดเนื้อหา
            </label>
            <textarea
              id="thread-content-input"
              rows={3}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="เขียนเทคนิค ข้อมูลวิเคราะห์ หรือรหัสห้อง Master Server..."
              className="w-full px-3.5 py-2.5 text-sm bg-rose-50/40 border border-rose-200 rounded-xl text-slate-900 focus:outline-none focus:border-sky-400"
            />
          </div>

          {threadError && <p className="text-xs text-rose-500 font-medium">{threadError}</p>}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-rose-100">
            <button
              type="button"
              onClick={() => setShowNewThreadForm(false)}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer min-h-[44px]"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-sky-950 bg-sky-200 hover:bg-sky-300 border border-sky-300 rounded-xl transition-colors cursor-pointer shadow-xs min-h-[44px]"
            >
              โพสต์กระทู้ลงบอร์ด
            </button>
          </div>
        </form>
      </BaseModal>

      {/* Sub-Forum Selector Bar + Tag Filter + Search */}
      <div className="space-y-3">
        {/* Sub-forum per game tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-rose-50/70 border border-rose-100 rounded-2xl w-fit max-w-full">
          <button
            type="button"
            onClick={() => onSelectGameFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              selectedGameFilter === 'all'
                ? 'bg-white text-sky-950 font-bold shadow-xs border border-sky-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            รวมทุกฟอรัมย่อย ({threads.length})
          </button>
          {games.map((g) => {
            const count = threads.filter((t) => t.gameId === g.slug).length;
            return (
              <button
                key={g.slug}
                type="button"
                onClick={() => onSelectGameFilter(g.slug)}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedGameFilter === g.slug
                    ? 'bg-white text-sky-950 font-bold shadow-xs border border-sky-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {g.titleTh} ({count})
              </button>
            );
          })}
        </div>

        {/* Tag Filter & Search */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1 bg-white border border-rose-100 rounded-xl p-1 shadow-2xs">
            {THREAD_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-sky-100/80 text-sky-900 font-bold'
                    : 'text-slate-600 hover:bg-rose-50/60'
                }`}
              >
                <Tag className="w-3 h-3 text-sky-500" />
                <span>{tag}</span>
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <label htmlFor="forum-search-input" className="sr-only">
              ค้นหากระทู้ในฟอรัม
            </label>
            <Search className="w-3.5 h-3.5 text-rose-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="forum-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหากระทู้..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-rose-200 rounded-xl text-slate-800 placeholder:text-slate-400 shadow-2xs focus:outline-none focus:border-sky-400"
            />
          </div>
        </div>
      </div>

      {/* Main Split: Thread List (Left 5 cols) + Active Thread & Real-time Comments (Right 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Threads List */}
        <div className="lg:col-span-5 space-y-3">
          {visibleThreads.length === 0 ? (
            <div className="p-8 text-center bg-white border border-rose-100 rounded-2xl shadow-xs space-y-3">
              <p className="text-sm font-bold text-slate-800">
                ยังไม่มีกระทู้ในหมวดหมู่นี้
              </p>
              <p className="text-xs text-slate-500">
                ร่วมประเดิมตั้งกระทู้พูดคุย แชร์เทคนิคการเล่น หรือชวนเพื่อนเข้าตี้เป็นคนแรกได้เลย
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNewThreadForm(true)}
                  className="px-4 py-2 text-xs font-bold text-sky-950 bg-sky-200 hover:bg-sky-300 rounded-xl transition-colors cursor-pointer"
                >
                  + ตั้งกระทู้แรก
                </button>
                {(selectedGameFilter !== 'all' ||
                  selectedTag !== 'ทั้งหมด' ||
                  searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectGameFilter('all');
                      setSelectedTag('ทั้งหมด');
                      setSearchQuery('');
                    }}
                    className="text-xs text-sky-600 font-bold hover:underline cursor-pointer px-2 py-1"
                  >
                    ล้างตัวกรอง
                  </button>
                )}
              </div>
            </div>
          ) : (
            visibleThreads.map((thread) => {
              const isSelected = selectedThread?.id === thread.id;
              return (
                <article
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50/70 border-sky-300 shadow-xs'
                      : 'bg-white border-rose-100 hover:border-sky-200 hover:bg-rose-50/30 shadow-2xs'
                  }`}
                >
                  {/* Clean Visual Metadata Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <span className="font-bold text-sky-800 bg-sky-100/70 px-2 py-0.5 rounded-md border border-sky-200/60">
                      {thread.gameTitleTh}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="text-slate-600">{thread.tag}</span>
                    {thread.isPinned && (
                      <>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="inline-flex items-center gap-0.5 text-pink-700 font-bold bg-pink-100 px-1.5 py-0.5 rounded-md">
                          <Pin className="w-3 h-3 text-pink-600" />
                          <span>ปักหมุด</span>
                        </span>
                      </>
                    )}
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-2 leading-snug">
                    {thread.title}
                  </h3>

                  <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-rose-100/80 text-xs text-slate-500 font-mono tabular-nums">
                    <span className="font-sans truncate text-slate-600">
                      โดย <strong className="text-slate-800 font-semibold">{thread.authorName}</strong> ({thread.authorElo})
                    </span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="inline-flex items-center gap-1 text-pink-700 font-semibold">
                        <ThumbsUp className="w-3 h-3" />
                        <span>{thread.likes}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-sky-700 font-semibold">
                        <MessageSquare className="w-3 h-3" />
                        <span>{thread.comments.length}</span>
                      </span>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* Right: Active Thread Reader + Real-time Comment Section */}
        {selectedThread ? (
          <div className="lg:col-span-7 bg-white border border-rose-100 rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-6 shadow-xs">
            <div className="space-y-5">
              {/* Thread Header */}
              <div className="space-y-2 pb-4 border-b border-rose-100">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-bold text-sky-800 bg-sky-100/70 px-2 py-0.5 rounded-md border border-sky-200/60">
                    {selectedThread.gameTitleTh}
                  </span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span>หมวด: {selectedThread.tag}</span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span>{selectedThread.createdAt}</span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                  {selectedThread.title}
                </h3>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-slate-600 inline-flex items-center gap-1.5 flex-wrap">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>ผู้เขียน: <strong className="text-slate-900 font-semibold">{selectedThread.authorName}</strong></span>
                    <span>·</span>
                    <span className="text-sky-700 font-medium">{selectedThread.authorRankTitle}</span>
                    <span>·</span>
                    <span className="font-mono tabular-nums font-bold text-slate-700">{selectedThread.authorElo} ELO</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onLikeThread(selectedThread.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-pink-700 bg-pink-50 hover:bg-pink-100 border border-pink-200 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-pink-600" />
                    <span className="font-mono tabular-nums">ถูกใจ ({selectedThread.likes})</span>
                  </button>
                </div>
              </div>

              {/* Thread Content */}
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {selectedThread.content}
              </p>

              {/* Real-Time Comments List */}
              <div className="pt-4 border-t border-rose-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 inline-flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-sky-500" />
                    <span>
                      ความคิดเห็นแบบเรียลไทม์ ({selectedThread.comments.length} รายการ)
                    </span>
                  </h4>
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    <span>ซิงค์สด</span>
                  </span>
                </div>

                {selectedThread.comments.length === 0 ? (
                  <div className="py-4 text-xs text-slate-400">
                    ยังไม่มีความคิดเห็นในกระทู้นี้ ร่วมประเดิมแลกเปลี่ยนข้อมูลเป็นคนแรกได้เลย!
                  </div>
                ) : (
                  <div className="divide-y divide-rose-100 max-h-80 overflow-y-auto pr-1">
                    {selectedThread.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="py-3.5 first:pt-1 space-y-1 bg-white hover:bg-rose-50/20 px-2 rounded-lg transition-colors"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="inline-flex items-center gap-1.5">
                            <span className="font-bold text-sky-900">
                              {comment.authorName}
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="text-slate-500">{comment.authorRankTitle}</span>
                            <span className="text-slate-300">·</span>
                            <span className="font-mono tabular-nums text-slate-600 font-semibold">
                              {comment.authorElo} ELO
                            </span>
                          </div>
                          <span className="text-slate-400 font-mono tabular-nums">
                            {comment.createdAt}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Real-time Comment Composer */}
            <form onSubmit={handleCommentSubmit} className="pt-3 border-t border-rose-100 space-y-2">
              <label htmlFor="realtime-comment-input" className="block text-xs text-slate-600">
                แสดงความคิดเห็นในชื่อ <strong className="text-slate-900 font-semibold">{activePlayerName}</strong>
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="realtime-comment-input"
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="พิมพ์ความคิดเห็นหรือเทคนิคเสริม (อัปเดตแบบ Real-time)..."
                  className="flex-1 px-3.5 py-2 text-sm bg-rose-50/50 border border-rose-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-400"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-sky-950 bg-sky-200 hover:bg-sky-300 border border-sky-300 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ส่งความเห็น</span>
                </button>
              </div>
              {commentError && <p className="text-xs text-rose-500 font-medium">{commentError}</p>}
            </form>
          </div>
        ) : (
          <div className="lg:col-span-7 bg-white/80 border border-rose-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3 shadow-xs min-h-[260px]">
            <MessageSquare className="w-8 h-8 text-sky-400" />
            <div className="text-base font-bold text-slate-800">
              เลือกกระทู้เพื่ออ่านรายละเอียด หรือตั้งกระทู้พูดคุยใหม่
            </div>
            <p className="text-xs text-slate-500 max-w-md">
              แลกเปลี่ยนเทคนิคการเล่นหนูขโมยชีส การอ่านจังหวะเวลาตื่น และการจับพิรุธคนบลัฟฟ์ร่วมกับผู้เล่นคนอื่นในคอมมูนิตี้
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
