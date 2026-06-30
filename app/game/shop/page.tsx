"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  SHOP_ITEMS, equip, addInventory, getEquippedWeapon, getEquippedArmor,
  getInventoryItem, type ShopItem,
} from "@/lib/equipment";
import { MATERIALS, getMaterialQty, addMaterial } from "@/lib/materials";
import { getGold, spendGold } from "@/lib/gold";
import { RARITY_LABEL, RARITY_COLOR, RARITY_BORDER } from "@/lib/rarity";

type Tab = "weapon" | "armor" | "item" | "material";

const TAB_LABELS: Record<Tab, string> = {
  weapon:   "⚔️ 武器",
  armor:    "🛡️ 防具",
  item:     "🧪 アイテム",
  material: "🪨 素材",
};

export default function ShopPage() {
  const router = useRouter();
  const [tab, setTab]             = useState<Tab>("weapon");
  const [gold, setGold]           = useState(0);
  const [equippedWeapon, setEW]   = useState<ShopItem | null>(null);
  const [equippedArmor, setEA]    = useState<ShopItem | null>(null);
  const [message, setMessage]     = useState("");
  const [_tick, setTick]          = useState(0);

  useEffect(() => {
    setGold(getGold());
    setEW(getEquippedWeapon());
    setEA(getEquippedArmor());
  }, []);

  function showMsg(msg: string) {
    setMessage(msg); setTimeout(() => setMessage(""), 2500);
  }

  function handleBuyShop(item: ShopItem) {
    if (!spendGold(item.cost)) { showMsg("ゴールドがたりない！"); return; }
    if (item.category === "weapon") { equip(item); setEW(item); showMsg(`${item.name}をそうびした！`); }
    else if (item.category === "armor") { equip(item); setEA(item); showMsg(`${item.name}をそうびした！`); }
    else { addInventory(item.id, 1); showMsg(`${item.name}をかった！`); }
    setGold(getGold());
  }

  function handleBuyMaterial(matId: string, name: string, cost: number) {
    if (!spendGold(cost)) { showMsg("ゴールドがたりない！"); return; }
    addMaterial(matId, 1);
    setGold(getGold());
    setTick(t => t + 1);
    showMsg(`${name}を1個買った！`);
  }

  const shopItems = SHOP_ITEMS.filter(i =>
    tab === "item" ? ["potion","ether","throwable"].includes(i.category) : i.category === tab
  );
  const buyableMats = MATERIALS.filter(m => m.buyable);

  function isEquipped(item: ShopItem) {
    if (item.category === "weapon") return equippedWeapon?.id === item.id;
    if (item.category === "armor")  return equippedArmor?.id === item.id;
    return false;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-4 font-mono">
      <div className="w-full max-w-lg space-y-3">

        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-yellow-300">🏪 どうぐや</h1>
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

        {/* 現在の装備 */}
        <div className="rounded-xl border border-gray-700 bg-gray-900 p-3 text-xs space-y-1">
          <div className="flex items-center gap-2 text-gray-400">
            ⚔️ 装備中：
            <span className={`font-bold ${equippedWeapon ? RARITY_COLOR[equippedWeapon.rarity ?? "common"] : "text-white"}`}>
              {equippedWeapon?.name ?? "なし"}
            </span>
            {equippedWeapon?.specialEffect && <span className="text-purple-300">✨{equippedWeapon.specialEffect.label}</span>}
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            🛡️ 装備中：
            <span className={`font-bold ${equippedArmor ? RARITY_COLOR[equippedArmor.rarity ?? "common"] : "text-white"}`}>
              {equippedArmor?.name ?? "なし"}
            </span>
            {equippedArmor?.specialEffect && <span className="text-purple-300">✨{equippedArmor.specialEffect.label}</span>}
          </div>
        </div>

        {/* タブ */}
        <div className="grid grid-cols-4 gap-1.5">
          {(Object.keys(TAB_LABELS) as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg py-2 text-xs font-bold transition-all ${
                tab === t ? "bg-yellow-400 text-gray-900" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {/* 素材ショップ */}
        {tab === "material" && (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {buyableMats.map(mat => {
              const qty = getMaterialQty(mat.id);
              const canAfford = gold >= (mat.cost ?? 0);
              return (
                <div key={mat.id} className={`rounded-xl border p-3 ${RARITY_BORDER[mat.rarity]} bg-gray-900`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${RARITY_COLOR[mat.rarity]}`}>[{RARITY_LABEL[mat.rarity]}]</span>
                        <span className="text-sm font-bold text-white">{mat.name}</span>
                        <span className="text-xs text-gray-400">所持:{qty}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{mat.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-400 font-bold text-sm">{mat.cost}G</div>
                      <button
                        onClick={() => handleBuyMaterial(mat.id, mat.name, mat.cost!)}
                        disabled={!canAfford}
                        className={`mt-1 rounded px-3 py-1 text-xs font-bold transition-all ${
                          canAfford ? "bg-indigo-600 text-white hover:bg-indigo-500" : "bg-gray-700 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        かう
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 通常ショップ */}
        {tab !== "material" && (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {shopItems.map(item => {
              const equipped = isEquipped(item);
              const qty = getInventoryItem(item.id)?.qty ?? 0;
              const canAfford = gold >= item.cost;
              const rarity = item.rarity ?? "common";
              return (
                <div
                  key={item.id}
                  className={`rounded-xl border-2 p-3 ${RARITY_BORDER[rarity]} ${equipped ? "bg-yellow-950/30" : "bg-gray-900"}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${RARITY_COLOR[rarity]}`}>[{RARITY_LABEL[rarity]}]</span>
                        <span className="text-sm font-bold text-white">{item.name}</span>
                        {equipped && <span className="text-xs text-yellow-400">装備中</span>}
                        {qty > 0 && <span className="text-xs text-gray-400">所持:{qty}</span>}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{item.description}</div>
                      <div className="text-xs text-gray-500 mt-0.5 space-x-2">
                        {item.attackBonus  ? <span>ATK+{item.attackBonus}</span>  : null}
                        {item.defenseBonus ? <span>DEF+{item.defenseBonus}</span> : null}
                        {item.magicBonus   ? <span>MAG+{item.magicBonus}</span>   : null}
                        {item.statusResist ? <span>耐性+{Math.round(item.statusResist*100)}%</span> : null}
                        {item.hpRestore    ? <span>HP+{item.hpRestore}</span>     : null}
                        {item.mpRestore    ? <span>MP+{item.mpRestore}</span>     : null}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-400 font-bold text-sm">{item.cost}G</div>
                      <button
                        onClick={() => handleBuyShop(item)}
                        disabled={!canAfford}
                        className={`mt-1 rounded px-3 py-1 text-xs font-bold transition-all ${
                          canAfford ? "bg-indigo-600 text-white hover:bg-indigo-500" : "bg-gray-700 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        {["weapon","armor"].includes(item.category) ? "そうびする" : "かう"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
