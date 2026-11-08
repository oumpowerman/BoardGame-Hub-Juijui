import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Dices,
  LogIn,
  UserCheck,
  Sparkles,
  ShieldCheck,
  Users,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import {
  ensureAuthUser,
  setCustomClientUid,
  signInWithGooglePopup,
} from '../../firebase/config';
import {
  findUsersByQuery,
  registerOrUpdateUserProfile,
  UserProfile,
} from '../../firebase/userService';

interface AuthAccountScreenProps {
  onLoginSuccess: (profile: UserProfile) => void;
}

export const AuthAccountScreen: React.FC<AuthAccountScreenProps> = ({
  onLoginSuccess,
}) => {
  const [accountName, setAccountName] = useState<string>('');
  const [existingCodeOrName, setExistingCodeOrName] = useState<string>('');
  const [mode, setMode] = useState<'create' | 'existing'>('create');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreateOrLoginAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = accountName.trim();
    if (!trimmed || trimmed.length < 2) {
      setErrorMsg('กรุณาตั้งชื่อ Account อย่างน้อย 2 ตัวอักษร');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const authUser = await ensureAuthUser();
      const profile = await registerOrUpdateUserProfile(authUser.uid, trimmed);
      onLoginSuccess(profile);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างบัญชี'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginExistingAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const queryText = existingCodeOrName.trim();
    if (!queryText) {
      setErrorMsg('กรุณากรอกชื่อ Account หรือรหัส UID/Friend Code ของคุณ');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const matched = await findUsersByQuery(queryText);
      const exact =
        matched.find(
          (u) =>
            u.accountName.toLowerCase() === queryText.toLowerCase() ||
            u.friendCode.toLowerCase() === queryText.toLowerCase() ||
            u.uid.toLowerCase() === queryText.toLowerCase()
        ) || matched[0];

      if (!exact) {
        setErrorMsg(
          `ไม่พบบัญชี "${queryText}" ในระบบ กรุณาตรวจสอบชื่อบัญชีหรือสมัครตั้งชื่อใหม่`
        );
        return;
      }

      setCustomClientUid(exact.uid);
      if (typeof window !== 'undefined') {
        localStorage.setItem('tabletop_player_name', exact.accountName);
        localStorage.setItem('tabletop_account_logged_in', '1');
      }
      onLoginSuccess(exact);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'ไม่สามารถเข้าสู่ระบบด้วยบัญชีเดิมได้'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const googleUser = await signInWithGooglePopup();
      const chosenName =
        accountName.trim() ||
        googleUser.displayName ||
        `ผู้เล่น_${googleUser.uid.slice(0, 5)}`;
      const profile = await registerOrUpdateUserProfile(
        googleUser.uid,
        chosenName
      );
      onLoginSuccess(profile);
    } catch {
      setErrorMsg(
        'ไม่สามารถเปิดหน้าต่าง Google Sign-In ได้ในขณะนี้ กรุณาตั้งชื่อ Account ด้านล่างเพื่อเข้าใช้งานทันที'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-amber-50/80 via-rose-50/50 to-sky-50/60 text-slate-800 px-4 py-8">
      {/* Top Minimal Brand Header */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between">
        <div className="inline-flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-200 via-rose-100 to-pink-100 border border-amber-300/80 flex items-center justify-center shadow-xs">
            <Dices className="w-5 h-5 text-amber-800" />
          </span>
          <div>
            <span className="font-display font-extrabold text-lg text-slate-900 block leading-none">
              TabletopNexus
            </span>
            <span className="text-xs text-slate-500">
              คลังบอร์ดเกมพาสเทล · หนูขโมยชีส (Cheese Thief)
            </span>
          </div>
        </div>
        <span className="text-xs font-medium text-amber-900 bg-amber-100/80 border border-amber-200 px-3 py-1.5 rounded-xl">
          ขั้นตอนที่ 1 · ยืนยันตัวตนก่อนเข้าคลังเกม
        </span>
      </header>

      {/* Main Auth & Account Naming Card */}
      <main className="max-w-4xl w-full mx-auto my-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch bg-white/95 border border-amber-200/80 rounded-3xl p-6 sm:p-10 shadow-xl">
          {/* Left: Process Explanation */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-gradient-to-br from-amber-50 via-rose-50/70 to-amber-100/50 border border-amber-200/60 rounded-2xl p-6 space-y-6">
            <div className="space-y-3">
              <span className="text-3xl block">🧀</span>
              <h1 className="text-2xl font-extrabold text-slate-900 leading-snug">
                เข้าสู่ระบบและตั้งชื่อ Account ก่อนเริ่มเล่นกับเพื่อน
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                เพื่อให้สามารถเพิ่มเพื่อนและดึงเพื่อนเข้าโต๊ะเล่นเกม{' '}
                <strong className="text-amber-900">หนูขโมยชีส (Cheese Thief)</strong>{' '}
                ด้วยกันได้ ผู้เล่นทุกคนจะต้องตั้งชื่อบัญชีก่อนเข้าสู่คลังบอร์ดเกม
              </p>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="flex items-start gap-2.5 p-3 bg-white/80 rounded-xl border border-amber-200/60">
                <UserCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block">
                    1. Login & ตั้งชื่อ Account
                  </strong>
                  <span>รับรหัสประจำตัว (UID / Friend Code) เฉพาะของคุณ</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 bg-white/80 rounded-xl border border-rose-200/60">
                <Users className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block">
                    2. เพิ่มเพื่อนและกดรับแอด
                  </strong>
                  <span>ค้นหาชื่อบัญชีหรือ UID ของเพื่อนเพื่อแอดเพื่อนก่อนชวนเข้าห้อง</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 bg-white/80 rounded-xl border border-emerald-200/60">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block">
                    3. เข้าสู่โต๊ะเล่นหนูขโมยชีส
                  </strong>
                  <span>สร้างห้องหรือเข้าร่วมโต๊ะกับเพื่อนได้สูงสุด 4–8 คนแบบเรียลไทม์</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Login & Account Naming Form */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:col-span-7 flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              {/* Mode Switcher */}
              <div className="flex items-center gap-1 p-1 bg-amber-50 border border-amber-200/70 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setMode('create');
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    mode === 'create'
                      ? 'bg-white text-slate-900 shadow-xs border border-amber-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  เข้าสู่ระบบ & ตั้งชื่อบัญชีใหม่
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('existing');
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    mode === 'existing'
                      ? 'bg-white text-slate-900 shadow-xs border border-amber-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  เข้าด้วยชื่อบัญชีที่มีอยู่แล้ว
                </button>
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs font-semibold text-rose-800"
                >
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {mode === 'create' ? (
                <form onSubmit={handleCreateOrLoginAccount} className="space-y-4">
                  <div>
                    <label
                      htmlFor="account-name-input"
                      className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5"
                    >
                      ตั้งชื่อ Account ของคุณ (เพื่อนจะใช้ชื่อนี้ค้นหาเพื่อแอดเพื่อน):
                    </label>
                    <input
                      id="account-name-input"
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="เช่น กานต์จอมบลัฟ, หนูเนยสด, SherlockTH"
                      maxLength={40}
                      autoFocus
                      className="w-full px-4 py-3.5 bg-amber-50/40 border border-amber-200 rounded-2xl text-sm sm:text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 min-h-[48px]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-amber-950 font-extrabold text-sm sm:text-base rounded-2xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[50px]"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {isSubmitting
                        ? 'กำลังบันทึกข้อมูลบัญชีของคุณ...'
                        : 'บันทึกชื่อ Account & เข้าสู่คลังบอร์ดเกม'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLoginExistingAccount} className="space-y-4">
                  <div>
                    <label
                      htmlFor="existing-account-input"
                      className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5"
                    >
                      กรอกชื่อ Account หรือรหัสเพื่อน (Friend Code / UID) ที่เคยตั้งไว้:
                    </label>
                    <input
                      id="existing-account-input"
                      type="text"
                      value={existingCodeOrName}
                      onChange={(e) => setExistingCodeOrName(e.target.value)}
                      placeholder="เช่น กานต์จอมบลัฟ หรือ CT89..."
                      maxLength={60}
                      autoFocus
                      className="w-full px-4 py-3.5 bg-rose-50/40 border border-rose-200 rounded-2xl text-sm sm:text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 min-h-[48px]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[50px]"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>
                      {isSubmitting
                        ? 'กำลังค้นหาบัญชี...'
                        : 'เข้าสู่ระบบด้วยบัญชีนี้'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              <div className="relative py-2 flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-xs text-slate-400 font-medium shrink-0">
                  หรือเข้าสู่ระบบด้วยบัญชี Google
                </span>
                <div className="border-t border-slate-200 w-full" />
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleGoogleSignIn}
                className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-2 min-h-[46px]"
              >
                <LogIn className="w-4 h-4 text-amber-600" />
                <span>Login ด้วย Google Account</span>
              </button>
            </div>

            <div className="p-3.5 bg-sky-50/70 border border-sky-200/70 rounded-2xl text-xs text-slate-600 leading-relaxed">
              💡 <strong className="text-slate-800">วิธีเล่นกับเพื่อน:</strong>{' '}
              หลังจากเข้าสู่ระบบแล้ว คุณสามารถนำรหัสเพื่อน (Friend Code) หรือชื่อ Account ไปให้เพื่อนค้นหาเพื่อกดรับแอดกัน และชวนเข้าห้องเล่นหนูขโมยชีสได้ทันที
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="max-w-5xl w-full mx-auto text-center text-xs text-slate-400">
        TabletopNexus · แพลตฟอร์มบอร์ดเกมออนไลน์และปาร์ตี้เกมหนูขโมยชีส
      </footer>
    </div>
  );
};
