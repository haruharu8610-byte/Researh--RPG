"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { pullGachaSession, GACHA_COST, GACHA_KIND_LABEL, type GachaKind, type GachaResult } from "@/lib/gacha";
import { getGold, spendGold } from "@/lib/gold";
import { addMaterial } from "@/lib/materials";
import { addInventory, addOwnedWeapon, addOwnedArmor, type ShopItem } from "@/lib/equipment";
import { RARITY_LABEL, RARITY_COLOR, RARITY_BORDER, RARITY_BG, equipRarityFx } from "@/lib/rarity";

const KINDS: GachaKind[] = ["item", "weapon", "armor"];

export default function GachaPage() {
  const router = useRouter();
  const [gold, setGold] = useState(0);
  const [tab, setTab] = useState<GachaKind>("item");
  const [phase, setPhase] = useState<"idle" | "spinning" | "result">("idle");
  const [revealed, setRevealed] = useState<GachaResult[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [spinGuaranteed, setSpinGuaranteed] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { setGold(getGold()); }, []);

  function showMsg(msg: string) {
    setMessage(msg); setTimeout(() => setMessage(""), 3000);
  }

  function applyResult(r: GachaResult): string {
    if (r.kind === "material") {
      addMaterial(r.ref.id, r.qty);
      return `${r.ref.name}を${r.qty}個手に入れた！`;
    }
    const item = r.ref as ShopItem;
    if (item.category === "weapon") { addOwnedWeapon(item.id); return `${item.name}を手に入れた！（そうび変更で装備できます）`; }
    if (item.category === "armor")  { addOwnedArmor(item.id);  return `${item.name}を手に入れた！（そうび変更で装備できます）`; }
    addInventory(item.id, r.qty);
    return `${item.name}を${r.qty}個手に入れた！`;
  }

  function handlePull(times: number) {
    if (phase === "spinning") return;
    const cost = GACHA_COST[tab] * times;
    if (!spendGold(cost)) { showMsg("ゴールドがたりない！"); return; }
    setGold(getGold());

    const session = pullGachaSession(tab, times);
    setSpinGuaranteed(session.guaranteed);
    setPhase("spinning");
    setRevealed([]); setVisibleCount(0);

    const spinDuration = session.guaranteed ? 2000 : 1100;
    setTimeout(() => {
      const msgs = session.results.map(applyResult);
      setRevealed(session.results);
      setPhase("result");
      session.results.forEach((_, i) => {
        setTimeout(() => setVisibleCount(c => Math.max(c, i + 1)), i * 220);
      });
      showMsg(msgs[msgs.length - 1]);
    }, spinDuration);
  }

  const hasLegendary = revealed.some(r => r.ref.rarity === "legendary");

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

        {/* タブ */}
        <div className="grid grid-cols-3 gap-2">
          {KINDS.map(k => (
            <button
              key={k}
              onClick={() => { if (phase !== "spinning") { setTab(k); setPhase("idle"); setRevealed([]); } }}
              className={`rounded-lg py-2 text-xs font-bold transition-colors ${
                tab === k ? "bg-fuchsia-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {GACHA_KIND_LABEL[k]}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-500">
          {tab === "item" ? "素材・どうぐ" : tab === "weapon" ? "武器（そうび変更画面で装備できます）" : "防具（そうび変更画面で装備できます）"}
          がランダムで手に入ります。1回{GACHA_COST[tab]}G。低確率で確定演出が発生すると最高レアリティが1つ確定。10連はエピック以上1つ以上保証。
        </p>

        {tab !== "item" && (
          <button
            onClick={() => router.push("/game/equipment")}
            className="text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-700 rounded-lg px-3 py-1.5"
          >
            🎽 そうび変更画面へ
          </button>
        )}

        {message && (
          <div className="rounded-lg border border-yellow-700 bg-yellow-950 px-4 py-2 text-sm text-yellow-300">
            {message}
          </div>
        )}

        {/* ガチャ演出 */}
        <div className="relative rounded-xl border-2 border-fuchsia-800 bg-gray-900 p-6 flex items-center justify-center min-h-[120px] overflow-hidden">
          {phase === "spinning" && spinGuaranteed && (
            <>
              <div className="absolute inset-0 bg-yellow-400/30 animate-pulse" />
              <div className="text-center">
                <div className="text-5xl animate-gacha-shake">🌟</div>
                <p className="mt-2 text-sm font-bold text-yellow-300 animate-pulse">✨ 確定演出 ✨</p>
                <p className="text-[10px] text-yellow-200">最高レアリティ確定！</p>
              </div>
            </>
          )}
          {phase === "spinning" && !spinGuaranteed && (
            <>
              <div className="absolute inset-0 bg-fuchsia-500/30 animate-gacha-flash" />
              <div className="text-6xl animate-gacha-shake">🎰</div>
              <p className="absolute bottom-3 text-xs text-fuchsia-300 animate-pulse">ガチャ回転中…</p>
            </>
          )}
          {phase === "idle" && <div className="text-5xl opacity-30">🎰</div>}
          {phase === "result" && (
            <>
              {hasLegendary && visibleCount === revealed.length && (
                <div className="absolute inset-0 bg-yellow-400/20 animate-gacha-flash" />
              )}
              <div className="flex flex-wrap gap-2 justify-center w-full">
                {revealed.slice(0, visibleCount).map((r, i) => {
                  const cat = r.kind === "item" ? (r.ref as ShopItem).category : undefined;
                  const fx = equipRarityFx(r.ref.rarity, cat);
                  return (
                    <div
                      key={i}
                      className={`relative animate-gacha-card-in rounded-lg border-2 px-3 py-2 text-center w-[100px] ${RARITY_BORDER[r.ref.rarity!]} ${RARITY_BG[r.ref.rarity!]} ${fx}`}
                    >
                      {r.forced && (
                        <span className="absolute -top-2 -left-2 text-[9px] font-bold bg-yellow-400 text-gray-900 rounded px-1">確定</span>
                      )}
                      <div className={`text-[10px] font-bold ${RARITY_COLOR[r.ref.rarity!]}`}>{RARITY_LABEL[r.ref.rarity!]}</div>
                      <div className="text-xs text-white mt-1 leading-tight">{r.ref.name}</div>
                      <div className="text-[10px] text-gray-400 mt-1">×{r.qty}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handlePull(1)}
            disabled={gold < GACHA_COST[tab] || phase === "spinning"}
            className="rounded-xl border border-fuchsia-600 bg-fuchsia-950 py-3 text-sm font-bold text-fuchsia-300 hover:bg-fuchsia-900 disabled:opacity-40 transition-colors"
          >
            1回引く（{GACHA_COST[tab]}G）
          </button>
          <button
            onClick={() => handlePull(10)}
            disabled={gold < GACHA_COST[tab] * 10 || phase === "spinning"}
            className="rounded-xl border border-fuchsia-600 bg-fuchsia-950 py-3 text-sm font-bold text-fuchsia-300 hover:bg-fuchsia-900 disabled:opacity-40 transition-colors"
          >
            10連引く（{GACHA_COST[tab] * 10}G）
          </button>
        </div>
      </div>
    </div>
  );
}
