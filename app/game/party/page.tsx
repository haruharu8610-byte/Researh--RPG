"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { COMPANIONS, getParty, addPartyMember, removePartyMember, isInParty, type PartyMemberData } from "@/lib/party";
import { calcPlayerStats } from "@/lib/battle";
import { getGold, spendGold } from "@/lib/gold";

const JOB_KEY = "rpg_job_class";

const JOB_LABEL: Record<string, string> = { warrior:"戦士", mage:"魔法使い", cleric:"僧侶", rogue:"盗賊" };

export default function PartyPage() {
  const router = useRouter();
  const [gold, setGold]           = useState(0);
  const [party, setParty]         = useState<PartyMemberData[]>([]);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [playerJob, setPlayerJob]     = useState("warrior");
  const [message, setMessage]     = useState("");

  useEffect(() => {
    setGold(getGold());
    setParty(getParty());
    setPlayerJob(localStorage.getItem(JOB_KEY) ?? "warrior");
    // Get player level from stats if available; fallback to stored points
    async function loadLevel() {
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch(process.env.NEXT_PUBLIC_STATS_API_URL!, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const stats = await res.json();
        const pts = (stats.totalPoints ?? 0) + (stats.studyTotalMinutes ?? 0);
        setPlayerLevel(Math.floor(pts / 100) + 1);
      } catch { /* use default level 1 */ }
    }
    loadLevel();
  }, []);

  function showMsg(msg: string) {
    setMessage(msg); setTimeout(() => setMessage(""), 3000);
  }

  function handleHire(companion: typeof COMPANIONS[number]) {
    if (party.length >= 2) { showMsg("これ以上仲間を増やせない！（最大2人）"); return; }
    if (isInParty(companion.id)) { showMsg(`${companion.name}はすでに仲間だ！`); return; }
    if (!spendGold(companion.cost)) { showMsg("ゴールドがたりない！"); return; }
    addPartyMember({ id: companion.id, name: companion.name, jobClass: companion.jobClass });
    setParty(getParty());
    setGold(getGold());
    showMsg(`${companion.name}が仲間になった！`);
  }

  function handleDismiss(id: string) {
    const member = COMPANIONS.find(c => c.id === id);
    removePartyMember(id);
    setParty(getParty());
    showMsg(`${member?.name ?? "仲間"}を解雇した。`);
  }

  const memberLevel = Math.max(1, playerLevel - 1);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-4 font-mono">
      <div className="w-full max-w-lg space-y-4">

        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-green-300">👥 なかまを増やす</h1>
          <div className="flex items-center gap-3">
            <span className="text-yellow-400 font-bold">💰 {gold}G</span>
            <button onClick={() => router.push("/game")} className="text-xs text-gray-500 hover:text-gray-300">もどる</button>
          </div>
        </div>

        {/* メッセージ */}
        {message && (
          <div className="rounded-lg border border-yellow-700 bg-yellow-950 px-4 py-2 text-sm text-yellow-300">
            {message}
          </div>
        )}

        {/* 現在の仲間 */}
        <div className="rounded-xl border border-gray-700 bg-gray-900 p-4">
          <div className="text-sm font-bold text-gray-300 mb-3">
            現在のパーティ（{party.length + 1}/3人）
          </div>
          {/* プレイヤー */}
          <div className="flex items-center justify-between rounded-lg border border-yellow-700 bg-yellow-950/20 px-3 py-2 mb-2">
            <div>
              <span className="text-sm font-bold text-yellow-300">あなた</span>
              <span className="ml-2 text-xs text-gray-400">{JOB_LABEL[playerJob] ?? "戦士"}</span>
            </div>
            <span className="text-xs text-gray-400">Lv.{playerLevel}</span>
          </div>
          {party.length === 0 && (
            <div className="text-xs text-gray-500 text-center py-2">仲間がいない…</div>
          )}
          {party.map(m => {
            const comp = COMPANIONS.find(c => c.id === m.id);
            return (
              <div key={m.id} className="flex items-center justify-between rounded-lg border border-green-800 bg-green-950/20 px-3 py-2 mb-1">
                <div>
                  <span className="text-sm font-bold text-green-300">{comp?.emoji} {m.name}</span>
                  <span className="ml-2 text-xs text-gray-400">{JOB_LABEL[m.jobClass]}</span>
                  <span className="ml-2 text-xs text-gray-500">Lv.{memberLevel}</span>
                </div>
                <button
                  onClick={() => handleDismiss(m.id)}
                  className="text-xs text-red-400 hover:text-red-300 border border-red-800 rounded px-2 py-0.5"
                >
                  解雇
                </button>
              </div>
            );
          })}
        </div>

        {/* 仲間候補 */}
        <div className="text-sm font-bold text-gray-300 px-1">仲間候補</div>
        <div className="space-y-2">
          {COMPANIONS.map(comp => {
            const inParty = party.some(m => m.id === comp.id);
            const stats = calcPlayerStats(memberLevel, comp.jobClass);
            const canAfford = gold >= comp.cost;
            return (
              <div
                key={comp.id}
                className={`rounded-xl border p-4 ${inParty ? "border-green-700 bg-green-950/20" : "border-gray-700 bg-gray-900"}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{comp.emoji}</span>
                      <span className="text-sm font-bold text-white">{comp.name}</span>
                      <span className="text-xs text-gray-400">{JOB_LABEL[comp.jobClass]}</span>
                      {inParty && <span className="text-xs text-green-400 font-bold">仲間中</span>}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{comp.description}</div>
                    <div className="text-xs text-gray-500 mt-1.5 space-x-3">
                      <span>Lv.{memberLevel}</span>
                      <span>HP:{stats.maxHp}</span>
                      <span>ATK:{stats.attack}</span>
                      <span>DEF:{stats.defense}</span>
                      <span>MAG:{stats.magic}</span>
                      <span>⚡{stats.speed}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    {inParty ? (
                      <span className="text-xs text-green-400">✓ 仲間</span>
                    ) : (
                      <>
                        <div className="text-yellow-400 font-bold text-sm mb-1">{comp.cost}G</div>
                        <button
                          onClick={() => handleHire(comp)}
                          disabled={!canAfford || party.length >= 2}
                          className={`rounded px-3 py-1 text-xs font-bold transition-all ${
                            canAfford && party.length < 2
                              ? "bg-green-600 text-white hover:bg-green-500"
                              : "bg-gray-700 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          {party.length >= 2 ? "満員" : "雇う"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-xs text-gray-600 text-center">
          仲間はプレイヤーの1レベル下で加入。自動でAI行動します。
        </div>
      </div>
    </div>
  );
}
