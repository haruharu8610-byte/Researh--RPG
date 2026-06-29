"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  SHOP_ITEMS, equip, addInventory, getEquippedWeapon, getEquippedArmor,
  getInventoryItem, type ShopItem,
} from "@/lib/equipment";
import { getGold, spendGold } from "@/lib/gold";

type Tab = "weapon" | "armor" | "item";

const TAB_LABELS: Record<Tab, string> = { weapon: "⚔️ 武器", armor: "🛡️ 防具", item: "🧪 アイテム" };

export default function ShopPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("weapon");
  const [gold, setGold] = useState(0);
  const [equippedWeapon, setEquippedWeapon] = useState<ShopItem | null>(null);
  const [equippedArmor, setEquippedArmor] = useState<ShopItem | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setGold(getGold());
    setEquippedWeapon(getEquippedWeapon());
    setEquippedArmor(getEquippedArmor());
  }, []);

  function showMsg(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2500);
  }

  function handleBuy(item: ShopItem) {
    if (!spendGold(item.cost)) {
      showMsg("ゴールドがたりない！"); return;
    }
    if (item.category === "weapon") {
      equip(item); setEquippedWeapon(item);
      showMsg(`${item.name}をそうびした！`);
    } else if (item.category === "armor") {
      equip(item); setEquippedArmor(item);
      showMsg(`${item.name}をそうびした！`);
    } else {
      addInventory(item.id, 1);
      showMsg(`${item.name}をかった！`);
    }
    setGold(getGold());
  }

  const items = SHOP_ITEMS.filter((i) =>
    tab === "item" ? ["potion","ether"].includes(i.category) : i.category === tab
  );

  function isEquipped(item: ShopItem) {
    if (item.category === "weapon") return equippedWeapon?.id === item.id;
    if (item.category === "armor")  return equippedArmor?.id === item.id;
    return false;
  }

  function getOwnedQty(item: ShopItem) {
    if (["weapon","armor"].includes(item.category)) return null;
    return getInventoryItem(item.id)?.qty ?? 0;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-4 font-mono">
      <div className="w-full max-w-lg space-y-3">

        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-yellow-300">🏪 どうぐや</h1>
          <div className="flex items-center gap-3">
            <span className="text-yellow-400 font-bold">💰 {gold}G</span>
            <button onClick={() => router.push("/game")} className="text-xs text-gray-500 hover:text-gray-300">
              もどる
            </button>
          </div>
        </div>

        {/* メッセージ */}
        {message && (
          <div className="rounded-lg border border-yellow-700 bg-yellow-950 px-4 py-2 text-sm text-yellow-300">
            {message}
          </div>
        )}

        {/* 現在の装備 */}
        <div className="rounded-xl border border-gray-700 bg-gray-900 p-3 text-xs text-gray-400 space-y-1">
          <div>⚔️ 装備中の武器：<span className="text-white">{equippedWeapon?.name ?? "なし"}</span>
            {equippedWeapon && <span className="ml-2 text-gray-500">ATK+{equippedWeapon.attackBonus??0}{equippedWeapon.magicBonus?` MAG+${equippedWeapon.magicBonus}`:""}</span>}
          </div>
          <div>🛡️ 装備中の防具：<span className="text-white">{equippedArmor?.name ?? "なし"}</span>
            {equippedArmor && <span className="ml-2 text-gray-500">DEF+{equippedArmor.defenseBonus??0}{equippedArmor.magicBonus?` MAG+${equippedArmor.magicBonus}`:""}</span>}
          </div>
        </div>

        {/* タブ */}
        <div className="flex gap-2">
          {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${
                tab === t ? "bg-yellow-400 text-gray-900" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {/* 商品リスト */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {items.map((item) => {
            const equipped = isEquipped(item);
            const qty = getOwnedQty(item);
            const canAfford = gold >= item.cost;
            return (
              <div
                key={item.id}
                className={`rounded-xl border p-3 ${equipped ? "border-yellow-600 bg-yellow-950" : "border-gray-700 bg-gray-900"}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{item.name}</span>
                      {equipped && <span className="text-xs text-yellow-400">装備中</span>}
                      {qty !== null && qty > 0 && <span className="text-xs text-gray-400">所持:{qty}</span>}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{item.description}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {item.attackBonus  ? `ATK+${item.attackBonus} `  : ""}
                      {item.defenseBonus ? `DEF+${item.defenseBonus} ` : ""}
                      {item.magicBonus   ? `MAG+${item.magicBonus} `   : ""}
                      {item.hpRestore    ? `HP+${item.hpRestore} `     : ""}
                      {item.mpRestore    ? `MP+${item.mpRestore} `     : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400 font-bold text-sm">{item.cost}G</div>
                    <button
                      onClick={() => handleBuy(item)}
                      disabled={!canAfford}
                      className={`mt-1 rounded px-3 py-1 text-xs font-bold transition-all ${
                        canAfford
                          ? "bg-indigo-600 text-white hover:bg-indigo-500"
                          : "bg-gray-700 text-gray-500 cursor-not-allowed"
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

      </div>
    </div>
  );
}
