"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getOwnedWeapons, getOwnedArmors, getEquippedWeapon, getEquippedArmor, equip, findItemById,
  registerCraftedItems, removeOwnedWeapon, removeOwnedArmor, sellPriceFor, getSeriesSetBonus,
  EQUIPMENT_EXCHANGE_COST, getEquipmentNextRarity, exchangeEquipment,
  type ShopItem, type OwnedShopItem,
} from "@/lib/equipment";
import { CRAFT_RECIPES, type CraftRecipe } from "@/lib/materials";
import { getParty, setPartyMemberWeapon, setPartyMemberArmor, type PartyMemberData } from "@/lib/party";
import { addGold } from "@/lib/gold";
import { RARITY_LABEL, RARITY_COLOR, RARITY_BORDER, RARITY_BG, equipRarityFx, type Rarity } from "@/lib/rarity";

const HIGH_RARITIES: Rarity[] = ["epic", "legendary"];

const CRAFTED_KEY = "rpg_crafted_list";
function getCraftedList(): string[] {
  if (typeof localStorage === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(CRAFTED_KEY) ?? "[]"); } catch { return []; }
}
function recipeToShopItem(recipe: CraftRecipe): ShopItem {
  return {
    id: recipe.id, name: recipe.name, category: recipe.category, cost: 0, description: recipe.description,
    attackBonus: recipe.attackBonus, defenseBonus: recipe.defenseBonus, magicBonus: recipe.magicBonus,
    statusResist: recipe.statusResist, rarity: recipe.rarity, specialEffect: recipe.specialEffect,
  };
}

const JOB_LABEL: Record<string, string> = { warrior: "戦士", mage: "魔法使い", cleric: "僧侶", rogue: "盗賊" };
const JOB_KEY = "rpg_job_class";

type Target = { id: "player" | string; name: string; jobClass: string };

export default function EquipmentPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"weapon" | "armor">("weapon");
  const [targetId, setTargetId] = useState<"player" | string>("player");
  const [party, setParty] = useState<PartyMemberData[]>([]);
  const [ownedWeapons, setOwnedWeapons] = useState<OwnedShopItem[]>([]);
  const [ownedArmors, setOwnedArmors] = useState<OwnedShopItem[]>([]);
  const [equippedWeaponId, setEquippedWeaponId] = useState<string | null>(null);
  const [equippedArmorId, setEquippedArmorId] = useState<string | null>(null);
  const [playerJob, setPlayerJob] = useState("warrior");
  const [message, setMessage] = useState("");
  const [sellTarget, setSellTarget] = useState<OwnedShopItem | null>(null);

  const refresh = useCallback(() => {
    setOwnedWeapons(getOwnedWeapons());
    setOwnedArmors(getOwnedArmors());
    setEquippedWeaponId(getEquippedWeapon()?.id ?? null);
    setEquippedArmorId(getEquippedArmor()?.id ?? null);
    setParty(getParty());
  }, []);

  useEffect(() => {
    const crafted = getCraftedList();
    registerCraftedItems(crafted.map(id => recipeToShopItem(CRAFT_RECIPES.find(r => r.id === id)!)));
    setPlayerJob(localStorage.getItem(JOB_KEY) ?? "warrior");
    refresh();
  }, [refresh]);

  function showMsg(msg: string) {
    setMessage(msg); setTimeout(() => setMessage(""), 2500);
  }

  const targets: Target[] = [
    { id: "player", name: "あなた", jobClass: playerJob },
    ...party.map(m => ({ id: m.id, name: m.name, jobClass: m.jobClass })),
  ];
  const currentTarget = targets.find(t => t.id === targetId) ?? targets[0];
  const currentMember = party.find(m => m.id === targetId) ?? null;

  const currentlyEquippedId = targetId === "player"
    ? (tab === "weapon" ? equippedWeaponId : equippedArmorId)
    : (tab === "weapon" ? currentMember?.weaponId ?? null : currentMember?.armorId ?? null);

  const targetWeapon = targetId === "player" ? getEquippedWeapon() : findItemById(currentMember?.weaponId);
  const targetArmor  = targetId === "player" ? getEquippedArmor()  : findItemById(currentMember?.armorId);
  const setBonus = getSeriesSetBonus(targetWeapon, targetArmor);

  /** 自分・仲間の中で、対象を除いて現在その装備をそうびしている人数を数える（被り防止用） */
  function countEquippedElsewhere(itemId: string, excludeTargetId: string): number {
    let count = 0;
    if (excludeTargetId !== "player" && (tab === "weapon" ? equippedWeaponId : equippedArmorId) === itemId) count++;
    for (const m of party) {
      if (m.id === excludeTargetId) continue;
      if ((tab === "weapon" ? m.weaponId : m.armorId) === itemId) count++;
    }
    return count;
  }

  function handleEquip(item: OwnedShopItem) {
    if (item.id !== currentlyEquippedId) {
      // クラフト品は所持数が0表示（被り無し前提）でも実質1個持っているとして扱う
      const effectiveQty = item.qty > 0 ? item.qty : 1;
      const usedElsewhere = countEquippedElsewhere(item.id, targetId);
      if (usedElsewhere >= effectiveQty) {
        showMsg(`${item.name}は他で使用中です（所持数: ${effectiveQty}）。先に外すか追加で入手してください`);
        return;
      }
    }
    if (targetId === "player") {
      equip(item);
      showMsg(`${currentTarget.name}に${item.name}をそうびした！`);
    } else {
      if (tab === "weapon") setPartyMemberWeapon(targetId, item.id);
      else setPartyMemberArmor(targetId, item.id);
      showMsg(`${currentTarget.name}に${item.name}をそうびした！`);
    }
    refresh();
  }

  function executeSell(item: OwnedShopItem) {
    const ok = tab === "weapon" ? removeOwnedWeapon(item.id, 1) : removeOwnedArmor(item.id, 1);
    if (!ok) return;
    const price = sellPriceFor(item);
    addGold(price);
    showMsg(`${item.name}を${price}Gで売却した！`);
    setSellTarget(null);
    refresh();
  }

  function handleSellClick(item: OwnedShopItem) {
    if (item.rarity && HIGH_RARITIES.includes(item.rarity)) {
      setSellTarget(item);
    } else {
      executeSell(item);
    }
  }

  function handleExchange(item: OwnedShopItem) {
    const result = exchangeEquipment(item.id);
    if (!result.success) { showMsg(result.reason ?? "交換できません"); return; }
    showMsg(`${item.name}を${EQUIPMENT_EXCHANGE_COST}個使って[${RARITY_LABEL[result.gained!.rarity ?? "common"]}]${result.gained!.name}と交換した！`);
    refresh();
  }

  const list = tab === "weapon" ? ownedWeapons : ownedArmors;
  const exchangeableItems = list.filter(i => i.qty >= EQUIPMENT_EXCHANGE_COST && getEquipmentNextRarity(i.rarity ?? "common"));

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-4 font-mono">
      <div className="w-full max-w-lg space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-indigo-300">🎽 そうび変更</h1>
          <button onClick={() => router.push("/game")} className="text-xs text-gray-500 hover:text-gray-300">もどる</button>
        </div>

        {message && (
          <div className="rounded-lg border border-yellow-700 bg-yellow-950 px-4 py-2 text-sm text-yellow-300">
            {message}
          </div>
        )}

        {/* 対象選択 */}
        <div className="space-y-1">
          <div className="text-xs text-gray-400">そうびする対象</div>
          <div className="flex flex-wrap gap-2">
            {targets.map(t => (
              <button
                key={t.id}
                onClick={() => setTargetId(t.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  targetId === t.id ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                {t.name}（{JOB_LABEL[t.jobClass] ?? t.jobClass}）
              </button>
            ))}
          </div>
        </div>

        {setBonus && (
          <div className="rounded-lg border-2 border-yellow-500 bg-yellow-950/30 px-3 py-2 text-xs text-yellow-300 font-bold text-center">
            ✨ シリーズボーナス発動中！（{targetWeapon?.series}）
            ATK+{setBonus.attack} DEF+{setBonus.defense} MAG+{setBonus.magic}
          </div>
        )}

        {/* 武器/防具タブ */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setTab("weapon")}
            className={`rounded-lg py-2 text-xs font-bold transition-colors ${
              tab === "weapon" ? "bg-orange-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            ⚔️ 武器
          </button>
          <button
            onClick={() => setTab("armor")}
            className={`rounded-lg py-2 text-xs font-bold transition-colors ${
              tab === "armor" ? "bg-orange-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            🛡️ 防具
          </button>
        </div>

        {list.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            まだ{tab === "weapon" ? "武器" : "防具"}を持っていません。ショップ・ガチャ・クラフトで入手しよう！
          </div>
        )}

        {exchangeableItems.length > 0 && (
          <div className="rounded-xl border-2 border-cyan-700 bg-cyan-950/20 p-3 space-y-2">
            <div className="text-xs font-bold text-cyan-300">
              🔄 装備交換所（同じ{tab === "weapon" ? "武器" : "防具"}{EQUIPMENT_EXCHANGE_COST}個→上位レアの{tab === "weapon" ? "武器" : "防具"}1個とランダム交換）
            </div>
            {exchangeableItems.map(item => {
              const nextRarity = getEquipmentNextRarity(item.rarity ?? "common")!;
              return (
                <div key={item.id} className="flex items-center justify-between rounded-lg bg-gray-900/60 px-3 py-2">
                  <div>
                    <span className={`text-xs font-bold ${RARITY_COLOR[item.rarity ?? "common"]}`}>[{RARITY_LABEL[item.rarity ?? "common"]}]</span>
                    <span className="text-sm text-white ml-2">{item.name}</span>
                    <span className="text-xs text-gray-400 ml-2">×{item.qty}</span>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      {EQUIPMENT_EXCHANGE_COST}個 → <span className={RARITY_COLOR[nextRarity]}>[{RARITY_LABEL[nextRarity]}]</span>装備1個
                    </div>
                  </div>
                  <button
                    onClick={() => handleExchange(item)}
                    className="shrink-0 rounded px-3 py-1 text-xs font-bold bg-cyan-600 text-white hover:bg-cyan-500"
                  >
                    こうかん
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="space-y-2">
          {list.map(item => {
            const isEquipped = item.id === currentlyEquippedId;
            const fx = equipRarityFx(item.rarity, item.category);
            const sellable = item.qty > 0;
            return (
              <div
                key={item.id}
                className={`w-full text-left rounded-xl border-2 p-3 transition-all ${
                  isEquipped ? "border-green-500 bg-green-950/30" : `${RARITY_BORDER[item.rarity ?? "common"]} ${RARITY_BG[item.rarity ?? "common"]}`
                } ${fx}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button onClick={() => handleEquip(item)} className="flex-1 text-left hover:opacity-80">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold ${RARITY_COLOR[item.rarity ?? "common"]}`}>[{RARITY_LABEL[item.rarity ?? "common"]}]</span>
                      <span className="text-sm font-bold text-white">{item.name}</span>
                      {sellable && <span className="text-xs text-gray-400">×{item.qty}</span>}
                      {isEquipped && <span className="text-xs text-green-400 font-bold">✓ そうび中</span>}
                      {item.series && <span className="text-xs text-yellow-400">📦{item.series}シリーズ</span>}
                      {item.ultimate && <span className="text-xs text-fuchsia-400">⚔️必殺技あり</span>}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{item.description}</div>
                    <div className="text-xs text-gray-500 mt-1 space-x-3">
                      {item.attackBonus ? <span>ATK+{item.attackBonus}</span> : null}
                      {item.defenseBonus ? <span>DEF+{item.defenseBonus}</span> : null}
                      {item.magicBonus ? <span>MAG+{item.magicBonus}</span> : null}
                      {item.statusResist ? <span>耐性+{Math.round(item.statusResist * 100)}%</span> : null}
                    </div>
                  </button>
                  {sellable && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSellClick(item); }}
                      className="shrink-0 text-xs text-red-400 hover:text-red-300 border border-red-800 rounded px-2 py-1"
                    >
                      💰売却
                      <div className="text-[10px] text-gray-500">{sellPriceFor(item)}G</div>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 高レア度売却の警告モーダル */}
      {sellTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border-2 border-red-600 bg-gray-900 p-5 space-y-3">
            <div className="text-center">
              <div className="text-3xl">⚠️</div>
              <h2 className="mt-2 text-base font-bold text-red-400">高レア度装備の売却確認</h2>
            </div>
            <div className={`rounded-lg border p-3 text-center ${RARITY_BORDER[sellTarget.rarity ?? "common"]} ${RARITY_BG[sellTarget.rarity ?? "common"]}`}>
              <span className={`text-xs font-bold ${RARITY_COLOR[sellTarget.rarity ?? "common"]}`}>[{RARITY_LABEL[sellTarget.rarity ?? "common"]}]</span>
              <div className="text-sm font-bold text-white mt-1">{sellTarget.name}</div>
            </div>
            <p className="text-xs text-gray-300 text-center leading-relaxed">
              これは入手困難な高レア度の装備です。本当に{sellPriceFor(sellTarget)}Gで売却しますか？<br />
              この操作は取り消せません。
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => setSellTarget(null)}
                className="rounded-lg border border-gray-600 py-2 text-sm text-gray-300 hover:bg-gray-800"
              >
                キャンセル
              </button>
              <button
                onClick={() => executeSell(sellTarget)}
                className="rounded-lg border border-red-600 bg-red-950 py-2 text-sm font-bold text-red-300 hover:bg-red-900"
              >
                売却する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
