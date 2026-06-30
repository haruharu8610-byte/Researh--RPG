"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EnemySprite from "@/components/EnemySprite";
import { ENEMIES } from "@/lib/battle";
import { getDefeatedEnemyIds } from "@/lib/bestiary";

export default function MaterialSelectPage() {
  const router = useRouter();
  const [defeatedIds, setDefeatedIds] = useState<string[]>([]);

  useEffect(() => { setDefeatedIds(getDefeatedEnemyIds()); }, []);

  const selectable = ENEMIES.filter(e => !e.isRare && !e.goldOnly && defeatedIds.includes(e.id));

  function enter(enemyId?: string) {
    const url = enemyId ? `/game/battle?mode=material&enemy=${enemyId}` : "/game/battle?mode=material";
    window.location.href = url;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-4 font-mono">
      <div className="w-full max-w-lg space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-teal-300">🪨 素材ダンジョン</h1>
          <button onClick={() => router.push("/game")} className="text-xs text-gray-500 hover:text-gray-300">もどる</button>
        </div>

        <p className="text-xs text-gray-500">
          倒したことのある敵（レアモンスターを除く）だけを選んで出現させられます。選ばずに入るとランダムで出現します。
        </p>

        <button
          onClick={() => enter()}
          className="w-full rounded-xl border-2 border-teal-600 bg-teal-950 py-3 text-sm font-bold text-teal-300 hover:bg-teal-900 transition-colors"
        >
          🎲 ランダムで挑む
        </button>

        {selectable.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            まだ倒した敵がいません。まずは通常ダンジョンや素材ダンジョンを「ランダムで挑む」でプレイしてみよう！
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {selectable.map(e => (
              <button
                key={e.id}
                onClick={() => enter(e.id)}
                className="flex flex-col items-center gap-1 rounded-xl border border-gray-700 bg-gray-900 p-2 hover:border-teal-500 hover:bg-gray-800 transition-colors"
              >
                <EnemySprite shape={e.shape} color={e.color} size={56} />
                <span className="text-[11px] text-white text-center leading-tight">{e.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
