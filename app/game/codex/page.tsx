"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCatalogWeapons, getCatalogArmors, registerCraftedItems,
  type ShopItem, type OwnedShopItem,
} from "@/lib/equipment";
import { CRAFT_RECIPES, MATERIALS, type CraftRecipe } from "@/lib/materials";
import { ENEMIES, ELEMENT_LABEL, type EnemyType } from "@/lib/battle";
import { getDefeatedEnemyIds } from "@/lib/bestiary";
import { RARITY_LABEL, RARITY_COLOR, RARITY_BORDER, RARITY_BG, equipRarityFx } from "@/lib/rarity";

function recipeToShopItem(recipe: CraftRecipe): ShopItem {
  return {
    id: recipe.id, name: recipe.name, category: recipe.category, cost: 0, description: recipe.description,
    attackBonus: recipe.attackBonus, defenseBonus: recipe.defenseBonus, magicBonus: recipe.magicBonus,
    statusResist: recipe.statusResist, rarity: recipe.rarity, specialEffect: recipe.specialEffect,
  };
}

const CRAFTED_KEY = "rpg_crafted_list";
function getCraftedList(): string[] {
  if (typeof localStorage === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(CRAFTED_KEY) ?? "[]"); } catch { return []; }
}

type Tab = "weapon" | "armor" | "monster";

const RARITY_ORDER = ["legendary", "epic", "rare", "uncommon", "common"] as const;

export default function CodexPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("weapon");
  const [weapons, setWeapons] = useState<OwnedShopItem[]>([]);
  const [armors, setArmors] = useState<OwnedShopItem[]>([]);
  const [defeatedIds, setDefeatedIds] = useState<string[]>([]);

  useEffect(() => {
    registerCraftedItems(CRAFT_RECIPES.map(recipeToShopItem));
    const craftedOwned = getCraftedList();
    setWeapons(getCatalogWeapons(craftedOwned));
    setArmors(getCatalogArmors(craftedOwned));
    setDefeatedIds(getDefeatedEnemyIds());
  }, []);

  const items = tab === "weapon" ? weapons : tab === "armor" ? armors : [];
  const sortedItems = [...items].sort((a, b) =>
    RARITY_ORDER.indexOf(a.rarity ?? "common") - RARITY_ORDER.indexOf(b.rarity ?? "common"));
  const normalMonsters = ENEMIES.filter(e => !e.isRare);
  const rareMonsters = ENEMIES.filter(e => e.isRare);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-4 font-mono">
      <div className="w-full max-w-lg space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-cyan-300">📖 図鑑</h1>
          <button onClick={() => router.push("/game")} className="text-xs text-gray-500 hover:text-gray-300">もどる</button>
        </div>

        <p className="text-xs text-gray-500">
          所持の有無に関わらず、すべての武器・防具・モンスターの情報を確認できます。
        </p>

        <div className="grid grid-cols-3 gap-2">
          {(["weapon", "armor", "monster"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg py-2 text-xs font-bold transition-colors ${
                tab === t ? "bg-cyan-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {t === "weapon" ? "⚔️ 武器" : t === "armor" ? "🛡️ 防具" : "👾 モンスター"}
            </button>
          ))}
        </div>

        {tab !== "monster" && (
          <div className="space-y-2 max-h-[28rem] overflow-y-auto">
            {sortedItems.map(item => {
              const owned = item.qty > 0;
              const fx = equipRarityFx(item.rarity, item.category);
              return (
                <div
                  key={item.id}
                  className={`rounded-xl border-2 p-3 ${RARITY_BORDER[item.rarity ?? "common"]} ${owned ? RARITY_BG[item.rarity ?? "common"] : "bg-gray-900/60 opacity-70"} ${owned ? fx : ""}`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold ${RARITY_COLOR[item.rarity ?? "common"]}`}>[{RARITY_LABEL[item.rarity ?? "common"]}]</span>
                      <span className="text-sm font-bold text-white">{item.name}</span>
                      {!owned && <span className="text-[10px] text-gray-500 border border-gray-700 rounded px-1">未所持</span>}
                      {item.series && <span className="text-[10px] text-yellow-400">📦{item.series}</span>}
                      {item.ultimate && <span className="text-[10px] text-fuchsia-400">⚔️必殺技</span>}
                    </div>
                    <span className="text-xs text-cyan-300 font-bold">所持: {item.qty}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{item.description}</div>
                  <div className="text-xs text-gray-500 mt-1 space-x-3">
                    {item.attackBonus ? <span>ATK+{item.attackBonus}</span> : null}
                    {item.defenseBonus ? <span>DEF+{item.defenseBonus}</span> : null}
                    {item.magicBonus ? <span>MAG+{item.magicBonus}</span> : null}
                    {item.statusResist ? <span>耐性+{Math.round(item.statusResist * 100)}%</span> : null}
                    {item.element ? <span>属性:{ELEMENT_LABEL[item.element]}</span> : null}
                  </div>
                  {item.specialEffect && (
                    <div className="text-[11px] text-purple-300 mt-1">✨ {item.specialEffect.label}</div>
                  )}
                  {item.ultimate && (
                    <div className="text-[11px] text-fuchsia-300 mt-1">
                      ⚔️ {item.ultimate.name}：{item.ultimate.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "monster" && (
          <div className="space-y-4 max-h-[28rem] overflow-y-auto">
            {[{ label: "通常モンスター", list: normalMonsters }, { label: "レアモンスター", list: rareMonsters }].map(group => (
              <div key={group.label} className="space-y-2">
                <div className="text-xs font-bold text-gray-300">{group.label}</div>
                {group.list.map((e: EnemyType) => {
                  const defeated = defeatedIds.includes(e.id);
                  return (
                    <div
                      key={e.id}
                      className={`rounded-xl border p-3 ${e.isRare ? "border-yellow-600" : "border-gray-700"} ${defeated ? "bg-gray-900" : "bg-gray-900/60 opacity-60"}`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="text-sm font-bold text-white">
                          {defeated ? e.name : "？？？"}
                          {e.isRare && <span className="ml-1 text-yellow-400 text-[10px]">★レア</span>}
                        </span>
                        <span className={`text-[10px] ${defeated ? "text-green-400" : "text-gray-500"}`}>
                          {defeated ? "倒したことがある" : "未討伐"}
                        </span>
                      </div>
                      {defeated && (
                        <>
                          <div className="text-xs text-gray-500 mt-1 space-x-3">
                            <span>HP{e.maxHp}</span><span>攻撃{e.attack}</span><span>防御{e.defense}</span>
                            <span>属性:{ELEMENT_LABEL[e.element]}</span>
                            <span>EXP{e.expReward}</span><span>G{e.goldReward}</span>
                          </div>
                          {e.dropTable.length > 0 && (
                            <div className="text-[11px] text-amber-300 mt-1">
                              ドロップ: {e.dropTable.map(d => MATERIALS.find(m => m.id === d.materialId)?.name ?? d.materialId).join("、")}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
