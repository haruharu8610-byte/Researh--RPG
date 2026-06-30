"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getOwnedWeapons, getOwnedArmors, getEquippedWeapon, getEquippedArmor, equip,
  registerCraftedItems, type ShopItem,
} from "@/lib/equipment";
import { CRAFT_RECIPES, type CraftRecipe } from "@/lib/materials";
import { getParty, setPartyMemberWeapon, setPartyMemberArmor, type PartyMemberData } from "@/lib/party";
import { RARITY_LABEL, RARITY_COLOR, RARITY_BORDER, RARITY_BG, equipRarityFx } from "@/lib/rarity";

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
  const [ownedWeapons, setOwnedWeapons] = useState<ShopItem[]>([]);
  const [ownedArmors, setOwnedArmors] = useState<ShopItem[]>([]);
  const [equippedWeaponId, setEquippedWeaponId] = useState<string | null>(null);
  const [equippedArmorId, setEquippedArmorId] = useState<string | null>(null);
  const [playerJob, setPlayerJob] = useState("warrior");
  const [message, setMessage] = useState("");

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

  function handleEquip(item: ShopItem) {
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

  const list = tab === "weapon" ? ownedWeapons : ownedArmors;

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

        <div className="space-y-2">
          {list.map(item => {
            const isEquipped = item.id === currentlyEquippedId;
            const fx = equipRarityFx(item.rarity, item.category);
            return (
              <button
                key={item.id}
                onClick={() => handleEquip(item)}
                className={`w-full text-left rounded-xl border-2 p-3 transition-all ${
                  isEquipped ? "border-green-500 bg-green-950/30" : `${RARITY_BORDER[item.rarity ?? "common"]} ${RARITY_BG[item.rarity ?? "common"]} hover:border-gray-400`
                } ${fx}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${RARITY_COLOR[item.rarity ?? "common"]}`}>[{RARITY_LABEL[item.rarity ?? "common"]}]</span>
                      <span className="text-sm font-bold text-white">{item.name}</span>
                      {isEquipped && <span className="text-xs text-green-400 font-bold">✓ そうび中</span>}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{item.description}</div>
                    <div className="text-xs text-gray-500 mt-1 space-x-3">
                      {item.attackBonus ? <span>ATK+{item.attackBonus}</span> : null}
                      {item.defenseBonus ? <span>DEF+{item.defenseBonus}</span> : null}
                      {item.magicBonus ? <span>MAG+{item.magicBonus}</span> : null}
                      {item.statusResist ? <span>耐性+{Math.round(item.statusResist * 100)}%</span> : null}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
