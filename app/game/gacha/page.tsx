"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { pullGacha, GACHA_COST, type GachaResult } from "@/lib/gacha";
import { getGold, spendGold } from "@/lib/gold";
import { addMaterial } from "@/lib/materials";
import { addInventory } from "@/lib/equipment";
import { RARITY_LABEL, RARITY_COLOR, RARITY_BORDER, RARITY_BG } from "@/lib/rarity";

export default function GachaPage() {
  const router = useRouter();
  const [gold, setGold] = useState(0);
  const [results, setResults] = useState<GachaResult[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => { setGold(getGold()); }, []);

  function showMsg(msg: string) {
    setMessage(msg); setTimeout(() => setMessage(""), 2500);
  }

  function applyResult(r: GachaResult) {
    if (r.kind === "material") addMaterial(r.ref.id, r.qty);
    else addInventory(r.ref.id, r.qty);
  }

  function handlePull(times: number) {
    const cost = GACHA_COST * times;
    if (!spendGold(cost)) { showMsg("ゴールドがたりない！"); return; }
    const drawn = Array.from({ length: times }, () => pullGacha());
    drawn.forEach(applyResult);
    setResults(drawn);
    setGold(getGold());
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-4 font-mono">
      <div className="w-full max-w-lg space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-fuchsia-300">🎰 ガチャ</h1>
          <div className="flex items-center gap-3">
            <span className="text-yellow-400 font-bold">💰 {gold}G</span>
            <button onClick={() => router.push("/game")} className="text-xs text-gray-500 hover:text-gray-300">もどる</button>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          素材・どうぐがランダムで手に入ります。1回{GACHA_COST}G。レア度が高いほど出にくくなります。
        </p>

        {message && (
          <div className="rounded-lg border border-yellow-700 bg-yellow-950 px-4 py-2 text-sm text-yellow-300">
            {message}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handlePull(1)}
            disabled={gold < GACHA_COST}
            className="rounded-xl border border-fuchsia-600 bg-fuchsia-950 py-3 text-sm font-bold text-fuchsia-300 hover:bg-fuchsia-900 disabled:opacity-40 transition-colors"
          >
            1回引く（{GACHA_COST}G）
          </button>
          <button
            onClick={() => handlePull(10)}
            disabled={gold < GACHA_COST * 10}
            className="rounded-xl border border-fuchsia-600 bg-fuchsia-950 py-3 text-sm font-bold text-fuchsia-300 hover:bg-fuchsia-900 disabled:opacity-40 transition-colors"
          >
            10連引く（{GACHA_COST * 10}G）
          </button>
        </div>

        {results.length > 0 && (
          <div className="rounded-xl border border-gray-700 bg-gray-900 p-4 space-y-2">
            <div className="text-sm font-bold text-gray-300 mb-2">けっか</div>
            {results.map((r, i) => (
              <div
                key={i}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 ${RARITY_BORDER[r.ref.rarity!]} ${RARITY_BG[r.ref.rarity!]}`}
              >
                <div>
                  <span className={`text-xs font-bold mr-2 ${RARITY_COLOR[r.ref.rarity!]}`}>
                    [{RARITY_LABEL[r.ref.rarity!]}]
                  </span>
                  <span className="text-sm text-white">{r.ref.name}</span>
                </div>
                <span className="text-xs text-gray-400">×{r.qty}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
