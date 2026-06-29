"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CRAFT_RECIPES, MATERIALS, getMaterialQty, canCraft, removeMaterial, getMaterials,
  type CraftRecipe,
} from "@/lib/materials";
import { equip, registerCraftedItems, getEquippedWeapon, getEquippedArmor, type ShopItem } from "@/lib/equipment";
import { getGold, spendGold } from "@/lib/gold";
import { RARITY_LABEL, RARITY_COLOR, RARITY_BORDER, RARITY_BG } from "@/lib/rarity";

const CRAFTED_KEY = "rpg_crafted_list";

function getCraftedList(): string[] {
  if (typeof localStorage === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(CRAFTED_KEY) ?? "[]"); }
  catch { return []; }
}

function recipeToShopItem(recipe: CraftRecipe): ShopItem {
  return {
    id: recipe.id,
    name: recipe.name,
    category: recipe.category,
    cost: 0,
    description: recipe.description,
    attackBonus:  recipe.attackBonus,
    defenseBonus: recipe.defenseBonus,
    magicBonus:   recipe.magicBonus,
    statusResist: recipe.statusResist,
    rarity:        recipe.rarity,
    specialEffect: recipe.specialEffect,
  };
}

type Tab = "weapon" | "armor" | "materials";

export default function CraftPage() {
  const router = useRouter();
  const [tab, setTab]               = useState<Tab>("weapon");
  const [gold, setGold]             = useState(0);
  const [craftedIds, setCraftedIds] = useState<string[]>([]);
  const [equippedW, setEquippedW]   = useState<ShopItem | null>(null);
  const [equippedA, setEquippedA]   = useState<ShopItem | null>(null);
  const [message, setMessage]       = useState("");
  const [_, setTick]                = useState(0); // force re-render for mat qty

  useEffect(() => {
    const crafted = getCraftedList();
    setCraftedIds(crafted);
    registerCraftedItems(crafted.map(id => {
      const r = CRAFT_RECIPES.find(r => r.id === id)!;
      return recipeToShopItem(r);
    }));
    setGold(getGold());
    setEquippedW(getEquippedWeapon());
    setEquippedA(getEquippedArmor());
  }, []);

  function showMsg(msg: string) {
    setMessage(msg); setTimeout(() => setMessage(""), 3000);
  }

  function handleCraft(recipe: CraftRecipe) {
    if (!canCraft(recipe)) { showMsg("素材がたりない！"); return; }
    if (!spendGold(recipe.goldCost)) { showMsg("ゴールドがたりない！"); return; }
    // 素材を消費
    for (const m of recipe.materials) removeMaterial(m.id, m.qty);
    // クラフト済みリストに追加
    const crafted = getCraftedList();
    if (!crafted.includes(recipe.id)) {
      crafted.push(recipe.id);
      localStorage.setItem(CRAFTED_KEY, JSON.stringify(crafted));
      setCraftedIds(crafted);
    }
    // 装備として登録
    const item = recipeToShopItem(recipe);
    registerCraftedItems(crafted.map(id => {
      const r = CRAFT_RECIPES.find(r => r.id === id)!;
      return recipeToShopItem(r);
    }));
    // 即座に装備
    equip(item);
    if (recipe.category === "weapon") setEquippedW(item);
    else setEquippedA(item);
    setGold(getGold());
    setTick(t => t + 1);
    showMsg(`${recipe.name}を作った！装備した！`);
  }

  const matQty = (id: string) => getMaterialQty(id);
  const recipes = CRAFT_RECIPES.filter(r => tab === "weapon" || tab === "armor" ? r.category === tab : false);
  const allMaterials = getMaterials();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-4 font-mono">
      <div className="w-full max-w-lg space-y-3">

        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-orange-300">🔨 クラフト工房</h1>
          <div className="flex items-center gap-3">
            <span className="text-yellow-400 font-bold">💰 {gold}G</span>
            <button onClick={() => router.push("/game")} className="text-xs text-gray-500 hover:text-gray-300">もどる</button>
          </div>
        </div>

        {/* メッセージ */}
        {message && (
          <div className="rounded-lg border border-orange-700 bg-orange-950 px-4 py-2 text-sm text-orange-300">
            {message}
          </div>
        )}

        {/* 装備中 */}
        <div className="rounded-xl border border-gray-700 bg-gray-900 p-3 text-xs text-gray-400 space-y-1">
          <div className="flex items-center gap-2">
            ⚔️ 装備中の武器：
            <span className={`font-bold ${equippedW ? RARITY_COLOR[equippedW.rarity ?? "common"] : "text-white"}`}>
              {equippedW?.name ?? "なし"}
            </span>
            {equippedW?.specialEffect && (
              <span className="text-purple-300 text-xs">✨{equippedW.specialEffect.label}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            🛡️ 装備中の防具：
            <span className={`font-bold ${equippedA ? RARITY_COLOR[equippedA.rarity ?? "common"] : "text-white"}`}>
              {equippedA?.name ?? "なし"}
            </span>
            {equippedA?.specialEffect && (
              <span className="text-purple-300 text-xs">✨{equippedA.specialEffect.label}</span>
            )}
          </div>
        </div>

        {/* タブ */}
        <div className="flex gap-2">
          {(["weapon","armor","materials"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${
                tab === t ? "bg-orange-400 text-gray-900" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {t === "weapon" ? "⚔️ 武器" : t === "armor" ? "🛡️ 防具" : "🪨 素材"}
            </button>
          ))}
        </div>

        {/* 素材一覧 */}
        {tab === "materials" && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <div className="text-xs text-gray-500 px-1">所持している素材 / ドロップで入手できる素材</div>
            {MATERIALS.map(mat => {
              const qty = matQty(mat.id);
              return (
                <div
                  key={mat.id}
                  className={`rounded-xl border p-3 ${RARITY_BORDER[mat.rarity]} ${RARITY_BG[mat.rarity]} ${qty === 0 ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${RARITY_COLOR[mat.rarity]}`}>[{RARITY_LABEL[mat.rarity]}]</span>
                        <span className="text-sm font-bold text-white">{mat.name}</span>
                        {mat.buyable && <span className="text-xs text-yellow-400">🏪{mat.cost}G</span>}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{mat.description}</div>
                    </div>
                    <span className={`text-lg font-bold tabular-nums ${qty > 0 ? "text-white" : "text-gray-600"}`}>
                      ×{qty}
                    </span>
                  </div>
                </div>
              );
            })}
            {allMaterials.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-4">素材がない。まずバトルで素材をドロップさせよう！</div>
            )}
          </div>
        )}

        {/* レシピ一覧 */}
        {(tab === "weapon" || tab === "armor") && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recipes.map(recipe => {
              const isCrafted = craftedIds.includes(recipe.id);
              const hasAll = canCraft(recipe);
              const hasGold = gold >= recipe.goldCost;
              const canDo = hasAll && hasGold;
              const isEquipped = (recipe.category === "weapon" && equippedW?.id === recipe.id)
                              || (recipe.category === "armor"  && equippedA?.id === recipe.id);
              return (
                <div
                  key={recipe.id}
                  className={`rounded-xl border-2 p-4 ${RARITY_BORDER[recipe.rarity]} ${RARITY_BG[recipe.rarity]}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold ${RARITY_COLOR[recipe.rarity]}`}>
                          [{RARITY_LABEL[recipe.rarity]}]
                        </span>
                        <span className="text-sm font-bold text-white">{recipe.name}</span>
                        {isEquipped && <span className="text-xs text-yellow-400 font-bold">装備中</span>}
                        {isCrafted && !isEquipped && <span className="text-xs text-green-400">作成済</span>}
                      </div>
                      <div className="text-xs text-gray-400 mb-2">{recipe.description}</div>
                      {/* 特殊効果 */}
                      <div className="mb-2 rounded bg-purple-950/40 border border-purple-800 px-2 py-1 text-xs text-purple-300">
                        ✨ 特殊効果: {recipe.specialEffect.label}
                      </div>
                      {/* ステータス */}
                      <div className="text-xs text-gray-400 space-x-2">
                        {recipe.attackBonus  && <span>ATK+{recipe.attackBonus}</span>}
                        {recipe.defenseBonus && <span>DEF+{recipe.defenseBonus}</span>}
                        {recipe.magicBonus   && <span>MAG+{recipe.magicBonus}</span>}
                        {recipe.statusResist && <span>耐性+{Math.round(recipe.statusResist*100)}%</span>}
                      </div>
                      {/* 必要素材 */}
                      <div className="mt-2 space-y-0.5">
                        {recipe.materials.map(m => {
                          const mat = MATERIALS.find(mat => mat.id === m.id)!;
                          const have = matQty(m.id);
                          const ok = have >= m.qty;
                          return (
                            <div key={m.id} className={`text-xs flex items-center gap-1 ${ok ? "text-green-400" : "text-red-400"}`}>
                              {ok ? "✓" : "✗"} {mat.name} ×{m.qty}
                              <span className="text-gray-500">（所持: {have}）</span>
                            </div>
                          );
                        })}
                        <div className={`text-xs flex items-center gap-1 ${hasGold ? "text-green-400" : "text-red-400"}`}>
                          {hasGold ? "✓" : "✗"} ゴールド {recipe.goldCost}G
                          <span className="text-gray-500">（所持: {gold}G）</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCraft(recipe)}
                    disabled={!canDo}
                    className={`mt-3 w-full rounded-lg py-2 text-sm font-bold transition-all ${
                      canDo
                        ? "bg-orange-500 text-white hover:bg-orange-400"
                        : "bg-gray-700 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {isCrafted ? "もう一度作る" : "作る"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
