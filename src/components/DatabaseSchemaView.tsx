import React, { useState } from 'react';
import { Database, Layers, Server, Table2, Key, CheckCircle2, Cpu } from 'lucide-react';
import { DATABASE_ARCHITECTURE_SCHEMAS } from '../data/seedData';

export const DatabaseSchemaView: React.FC = () => {
  const [selectedTableIndex, setSelectedTableIndex] = useState(0);
  const activeSchema = DATABASE_ARCHITECTURE_SCHEMAS[selectedTableIndex];

  return (
    <section aria-label="ข้อมูลระบบและโครงสร้างเกมออนไลน์" className="space-y-6">
      <div className="pb-4 border-b border-rose-100">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200/80 rounded-xl text-xs font-semibold mb-2">
          <Database className="w-3.5 h-3.5 text-teal-600" />
          <span>Game System Overview</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          ข้อมูลระบบเกม & โครงสร้างการซิงค์โต๊ะออนไลน์
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          รายละเอียดการจัดเก็บข้อมูลบัญชีผู้เล่น รายชื่อเพื่อน โต๊ะเกมหนูขโมยชีส (4–8 คน) และระบบคำนวณคะแนนอันดับ ELO
        </p>
      </div>

      {/* Table Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {DATABASE_ARCHITECTURE_SCHEMAS.map((schema, idx) => {
          const isSelected = idx === selectedTableIndex;
          return (
            <button
              key={schema.tableName}
              type="button"
              onClick={() => setSelectedTableIndex(idx)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-mono rounded-xl border transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-teal-100 text-teal-950 font-bold border-teal-300 shadow-xs'
                  : 'bg-white text-slate-600 border-rose-100 hover:border-teal-200 hover:bg-teal-50/40'
              }`}
            >
              <Table2 className="w-4 h-4 text-teal-600" />
              <span>{idx + 1}. {schema.tableName}</span>
            </button>
          );
        })}
      </div>

      {/* Active Schema Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 bg-white border border-rose-100 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-5 border-b border-rose-100 space-y-1.5 bg-rose-50/30">
            <div className="text-xs font-mono font-bold text-teal-700 inline-flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              <span>หมวดระบบ: {activeSchema.domainGroup}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-mono">
              {activeSchema.tableName}
            </h3>
            <p className="text-sm text-slate-600">{activeSchema.description}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-rose-100 bg-rose-50/50 text-xs text-slate-600 font-bold">
                  <th className="py-3 px-4">ชื่อฟิลด์ข้อมูล</th>
                  <th className="py-3 px-4">ชนิดข้อมูล</th>
                  <th className="py-3 px-4">เงื่อนไข / คีย์หลัก</th>
                  <th className="py-3 px-4">หน้าที่ในระบบเกม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-50">
                {activeSchema.columns.map((col) => (
                  <tr key={col.name} className="hover:bg-rose-50/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-800">
                      {col.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-700 font-semibold">
                      {col.type}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500 inline-flex items-center gap-1">
                      {col.constraints.includes('PRIMARY') ? <Key className="w-3 h-3 text-amber-500" /> : null}
                      <span>{col.constraints}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{col.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Scaling Strategy & Real-Time Channels */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 bg-white border border-rose-100 rounded-2xl space-y-3 shadow-xs">
            <div className="inline-flex items-center gap-2 text-sm font-bold text-teal-900">
              <Database className="w-4 h-4 text-teal-600" />
              <span>การจัดดัชนีและการค้นหาข้อมูล</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {activeSchema.scalingStrategy}
            </p>
            <div className="pt-2 border-t border-rose-100 space-y-1.5">
              <div className="text-xs font-semibold text-slate-700">ดัชนีหลัก (Indexes):</div>
              {activeSchema.indexes.map((idxName) => (
                <div
                  key={idxName}
                  className="px-3 py-1.5 bg-rose-50/60 border border-rose-200/80 rounded-xl font-mono text-xs text-slate-700 font-medium"
                >
                  {idxName}
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 bg-white border border-rose-100 rounded-2xl space-y-3 shadow-xs">
            <div className="inline-flex items-center gap-2 text-sm font-bold text-emerald-900">
              <Server className="w-4 h-4 text-emerald-600" />
              <span>ระบบซิงค์สถานะแบบเรียลไทม์</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-700 font-mono">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong className="text-teal-700">Account & Friends</strong> — ค้นหาและรับแอดเพื่อนด้วยรหัสประจำตัวทันที</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong className="text-teal-700">Tabletop Sync</strong> — ซิงค์ลำดับการเล่น 6 สเต็ปและเวลาตื่นตี 1–6 น.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong className="text-teal-700">Room Invites</strong> — แจ้งเตือนคำเชิญเข้าโต๊ะเกมจากเพื่อนแบบสด</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong className="text-teal-700">ELO Rating</strong> — คำนวณและอัปเดตอันดับผู้เล่นหลังจบแมตช์</span>
              </li>
            </ul>
          </div>

          <div className="p-5 bg-white border border-rose-100 rounded-2xl space-y-2 shadow-xs">
            <div className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
              <Cpu className="w-4 h-4 text-pink-500" />
              <span>โครงสร้างระบบแบบแยกโมดูล</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              แยกการทำงานเป็นโมดูลย่อยอิสระ (<code className="text-rose-700 bg-rose-50 px-1 py-0.5 rounded">CheeseThiefScreen</code>, <code className="text-rose-700 bg-rose-50 px-1 py-0.5 rounded">InPersonLobby</code>, <code className="text-rose-700 bg-rose-50 px-1 py-0.5 rounded">InPersonPhases</code>, <code className="text-rose-700 bg-rose-50 px-1 py-0.5 rounded">FriendManagerModal</code>, <code className="text-rose-700 bg-rose-50 px-1 py-0.5 rounded">GameSceneTransition</code>) รองรับการขยายบอร์ดเกมใหม่ในอนาคต
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
