"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import GameCanvas, { type JobClass } from "@/components/GameCanvas";
import JobClassSelector from "@/components/JobClassSelector";
import { checkLoginBonus, checkTaskBonus, checkStudyBonus, getGold } from "@/lib/gold";

type Stats = {
  totalTasks: number;
  completedTasks: number;
  totalPoints: number;
  primaryTheme: string | null;
  studyTotalMinutes?: number;
};

const JOB_KEY = "rpg_job_class";

function calcLevel(points: number) { return Math.floor(points / 100) + 1; }
function calcExp(points: number) { return points % 100; }

export default function GamePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [jobClass, setJobClass] = useState<JobClass>("warrior");
  const [showJobSelect, setShowJobSelect] = useState(false);
  const [error, setError] = useState("");
  const [celebration, setCelebration] = useState<string | null>(null);
  const [gold, setGold] = useState(0);
  const [bonusMsg, setBonusMsg] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem(JOB_KEY) as JobClass | null;
    if (saved) setJobClass(saved);
  }, []);

  function handleJobChange(j: JobClass) {
    setJobClass(j);
    localStorage.setItem(JOB_KEY, j);
    setShowJobSelect(false);
  }

  const fetchStats = useCallback(async (token: string) => {
    const res = await fetch(process.env.NEXT_PUBLIC_STATS_API_URL!, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { setError("データの取得に失敗しました"); return; }
    const data: Stats = await res.json();
    setStats(data);

    // ログインボーナス・タスクボーナス
    const loginGold = checkLoginBonus();
    const taskGold  = checkTaskBonus(data.completedTasks);
    const studyGold = checkStudyBonus(data.studyTotalMinutes ?? 0);
    const msgs: string[] = [];
    if (loginGold > 0) msgs.push(`ログインボーナス +${loginGold}G！`);
    if (taskGold  > 0) msgs.push(`タスク完了ボーナス +${taskGold}G！`);
    if (studyGold > 0) msgs.push(`自習ボーナス +${studyGold}G！📚`);
    if (msgs.length) {
      setBonusMsg(msgs.join("　"));
      setTimeout(() => setBonusMsg(null), 4000);
    }
    setGold(getGold());
  }, []);

  useEffect(() => {
    let token: string;
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/"); return; }
      token = session.access_token;
      await fetchStats(token);

      const channel = supabase
        .channel("task-done")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "tasks", filter: `user_id=eq.${session.user.id}` },
          async (payload) => {
            if (payload.new?.status === "done" && payload.old?.status !== "done") {
              setCelebration(payload.new.title ?? "タスク");
              setTimeout(() => setCelebration(null), 3000);
              await fetchStats(token);
            }
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
    init();
  }, [router, fetchStats]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (error) return <div className="flex min-h-screen items-center justify-center text-red-400">{error}</div>;
  if (!stats) return <div className="flex min-h-screen items-center justify-center text-gray-400">読み込み中...</div>;

  const level = calcLevel(stats.totalPoints);
  const exp   = calcExp(stats.totalPoints);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      {/* タスク完了アニメ */}
      {celebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="animate-bounce rounded-2xl bg-indigo-600/90 px-8 py-6 text-center shadow-2xl">
            <div className="text-4xl">🎉</div>
            <div className="mt-2 text-lg font-bold">タスク完了！</div>
            <div className="mt-1 text-sm text-indigo-200">「{celebration}」</div>
            <div className="mt-1 text-xs text-indigo-300">EXP & ゴールド獲得！</div>
          </div>
        </div>
      )}

      {/* ボーナス通知 */}
      {bonusMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-yellow-500 px-6 py-3 text-sm font-bold text-gray-900 shadow-xl animate-bounce">
          💰 {bonusMsg}
        </div>
      )}

      <div className="w-full max-w-lg space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-wide">⚔️ Research RPG</h1>
          <div className="flex items-center gap-3">
            <span className="text-yellow-400 font-bold text-sm">💰 {gold}G</span>
            <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-gray-300">ログアウト</button>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 space-y-4">
          <GameCanvas level={level} jobClass={jobClass} />

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-semibold">Lv. {level}</span>
              <span className="text-gray-400">{exp} / 100 EXP</span>
            </div>
            <div className="h-3 rounded-full bg-gray-800">
              <div className="h-3 rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${exp}%` }} />
            </div>
          </div>

          <button
            onClick={() => setShowJobSelect((v) => !v)}
            className="w-full rounded-lg border border-gray-700 py-2 text-sm text-gray-300 hover:border-indigo-500 hover:text-white transition-colors"
          >
            {showJobSelect ? "閉じる" : "職業を変更する"}
          </button>
          {showJobSelect && <JobClassSelector current={jobClass} onChange={handleJobChange} />}
        </div>

        {/* アクションボタン */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push("/game/battle")}
            className="rounded-xl border border-yellow-600 bg-yellow-950 py-3 text-sm font-bold text-yellow-300 hover:bg-yellow-900 transition-colors"
          >
            ⚔️ バトルへ
          </button>
          <button
            onClick={() => router.push("/game/party")}
            className="rounded-xl border border-green-600 bg-green-950 py-3 text-sm font-bold text-green-300 hover:bg-green-900 transition-colors"
          >
            👥 なかま
          </button>
          <button
            onClick={() => router.push("/game/shop")}
            className="rounded-xl border border-purple-600 bg-purple-950 py-3 text-sm font-bold text-purple-300 hover:bg-purple-900 transition-colors"
          >
            🏪 ショップ
          </button>
          <button
            onClick={() => router.push("/game/craft")}
            className="rounded-xl border border-orange-600 bg-orange-950 py-3 text-sm font-bold text-orange-300 hover:bg-orange-900 transition-colors"
          >
            🔨 クラフト
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "総タスク",   value: stats.totalTasks },
            { label: "完了タスク", value: stats.completedTasks },
            { label: "総ポイント", value: stats.totalPoints },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
