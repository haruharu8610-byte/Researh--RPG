"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { runAutoBattle, AUTO_BATTLE_FIGHTS, type AutoBattleSummary } from "@/lib/autoBattle";
import { RARITY_LABEL, RARITY_COLOR } from "@/lib/rarity";

export default function MaterialAutoBattlePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"loading" | "running" | "result">("loading");
  const [summary, setSummary] = useState<AutoBattleSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/"); return; }
      const res = await fetch(process.env.NEXT_PUBLIC_STATS_API_URL!, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const stats = await res.json();
      const pts = (stats.totalPoints ?? 0) + (stats.studyTotalMinutes ?? 0);
      const level = Math.floor(pts / 100) + 1;

      if (cancelled) return;
      setPhase("running");
      setTimeout(() => {
        if (cancelled) return;
        const result = runAutoBattle(level);
        setSummary(result);
        setPhase("result");
      }, 1400);
    }
    run();
    return () => { cancelled = true; };
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-4 font-mono">
      <div className="w-full max-w-lg space-y-4">
        {(phase === "loading" || phase === "running") && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="text-5xl animate-bounce">⚡</div>
            <p className="text-sm text-fuchsia-300 font-bold animate-pulse">
              {phase === "loading" ? "準備中…" : `素材ダンジョンで${AUTO_BATTLE_FIGHTS}連戦オート中…`}
            </p>
          </div>
        )}

        {phase === "result" && summary && (
          <>
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold text-fuchsia-300">⚡ オート戦闘結果</h1>
            </div>

            <div className={`rounded-xl border-2 p-4 text-center ${summary.stoppedByDefeat ? "border-red-600 bg-red-950/30" : "border-yellow-500 bg-yellow-950/20"}`}>
              {summary.stoppedByDefeat ? (
                <p className="text-red-300 font-bold">💀 {summary.fightsCompleted}戦目でやられてしまい、オート戦闘が中断しました</p>
              ) : (
                <p className="text-yellow-300 font-bold">🎉 {AUTO_BATTLE_FIGHTS}連戦すべてに勝利しました！</p>
              )}
              <p className="text-xs text-gray-400 mt-1">戦闘数 {summary.fightsCompleted} / 勝利 {summary.victories}</p>
            </div>

            <div className="rounded-xl border border-gray-700 bg-gray-900 p-4 space-y-2">
              <div className="text-sm font-bold text-gray-300">けっか</div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">獲得ゴールド</span>
                <span className="text-yellow-400 font-bold">💰 {summary.totalGold}G</span>
              </div>
              <div className="text-sm text-gray-400">獲得素材</div>
              {summary.materialsGained.length === 0 ? (
                <div className="text-xs text-gray-600">素材のドロップはありませんでした</div>
              ) : (
                <div className="space-y-1">
                  {summary.materialsGained.map(({ material, qty }) => (
                    <div key={material.id} className="flex items-center justify-between text-xs">
                      <span>
                        <span className={`font-bold ${RARITY_COLOR[material.rarity]}`}>[{RARITY_LABEL[material.rarity]}]</span>
                        <span className="text-white ml-1">{material.name}</span>
                      </span>
                      <span className="text-gray-400">×{qty}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => router.push("/game")}
              className="w-full rounded-xl border-2 border-indigo-600 bg-indigo-950 py-3 text-sm font-bold text-indigo-300 hover:bg-indigo-900 transition-colors"
            >
              ホームにもどる
            </button>
          </>
        )}
      </div>
    </div>
  );
}
