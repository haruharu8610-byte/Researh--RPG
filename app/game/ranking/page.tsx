"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchRanking, subscribeRanking, type PlayerState } from "@/lib/playerState";
import { supabase } from "@/lib/supabase";

const JOB_LABEL: Record<string, string> = { warrior: "戦士", mage: "魔法使い", cleric: "僧侶", rogue: "盗賊" };
const JOB_EMOJI: Record<string, string> = { warrior: "⚔️", mage: "🔮", cleric: "✨", rogue: "🗡️" };

export default function RankingPage() {
  const router = useRouter();
  const [ranking, setRanking] = useState<PlayerState[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: () => void = () => {};

    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/"); return; }
      setMyId(session.user.id);

      const load = async () => setRanking(await fetchRanking());
      await load();
      setLoading(false);

      unsubscribe = subscribeRanking(load);
    }
    init();
    return () => unsubscribe();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-4 font-mono">
      <div className="w-full max-w-lg space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-yellow-300">🏆 リアルタイムランキング</h1>
          <button onClick={() => router.push("/game")} className="text-xs text-gray-500 hover:text-gray-300">もどる</button>
        </div>

        <p className="text-xs text-gray-500">他のプレイヤーのレベル・装備・到達階がリアルタイムで反映されます。</p>

        {loading && <div className="text-center text-gray-400 text-sm py-8">読み込み中...</div>}

        {!loading && ranking.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">まだ誰もプレイしていません</div>
        )}

        <div className="space-y-2">
          {ranking.map((p, i) => {
            const isMe = p.user_id === myId;
            return (
              <div
                key={p.user_id}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-colors ${
                  isMe ? "border-yellow-600 bg-yellow-950/30" : "border-gray-800 bg-gray-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center text-sm font-bold text-gray-400">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </span>
                  <span className="text-lg">{JOB_EMOJI[p.job_class] ?? "⚔️"}</span>
                  <div>
                    <div className="text-sm font-bold text-white">
                      {p.display_name}{isMe && <span className="ml-1 text-xs text-yellow-400">（あなた）</span>}
                    </div>
                    <div className="text-xs text-gray-400">{JOB_LABEL[p.job_class] ?? p.job_class}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-indigo-300">Lv.{p.level}</div>
                  <div className="text-xs text-gray-400">地下{p.floor}階</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
