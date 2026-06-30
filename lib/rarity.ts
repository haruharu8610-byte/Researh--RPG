export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export const RARITY_LABEL: Record<Rarity, string> = {
  common:    "コモン",
  uncommon:  "アンコモン",
  rare:      "レア",
  epic:      "エピック",
  legendary: "レジェンド",
};

export const RARITY_COLOR: Record<Rarity, string> = {
  common:    "text-gray-400",
  uncommon:  "text-green-400",
  rare:      "text-blue-400",
  epic:      "text-purple-400",
  legendary: "text-yellow-300",
};

export const RARITY_BORDER: Record<Rarity, string> = {
  common:    "border-gray-600",
  uncommon:  "border-green-700",
  rare:      "border-blue-700",
  epic:      "border-purple-700",
  legendary: "border-yellow-600",
};

export const RARITY_BG: Record<Rarity, string> = {
  common:    "bg-gray-900",
  uncommon:  "bg-green-950/30",
  rare:      "bg-blue-950/30",
  epic:      "bg-purple-950/30",
  legendary: "bg-yellow-950/30",
};

/** 武器・防具のレアリティ演出クラス（エピック=雷、レジェンド=炎） */
export function equipRarityFx(rarity: Rarity | undefined, category: string | undefined): string {
  if (category !== "weapon" && category !== "armor") return "";
  if (rarity === "legendary") return "fx-fire";
  if (rarity === "epic") return "fx-lightning";
  return "";
}

// ── 特殊効果 ────────────────────────────────────────────────
export type SpecialEffectType =
  | "mp_cost_reduce"    // MP消費削減（value: %）
  | "poison_immune"     // 毒無効
  | "damage_reflect"    // ダメージ反射（value: %）
  | "spell_power_up"    // 魔法威力強化（value: %）
  | "fire_on_hit"       // 物理攻撃に炎付加（value: ダメージ）
  | "status_resist_all" // 全状態異常耐性強化（value: %）
  | "speed_boost"       // 素早さ強化（value: 加算）
  | "exp_boost";        // 経験値ボーナス（現在未使用、将来用）

export type SpecialEffect = {
  type: SpecialEffectType;
  value: number;
  label: string; // 表示テキスト
};

// バトル中に適用されるクラフト効果の集計
export type CraftEffect = {
  mpCostMultiplier: number;    // デフォルト1.0
  poisonImmune: boolean;
  reflectDamage: number;       // 0〜1
  spellMultiplier: number;     // デフォルト1.0
  fireOnHit: number;           // 0 = なし
  extraStatusResist: number;   // 0〜0.5
  speedBonus: number;
};

export const DEFAULT_CRAFT_EFFECT: CraftEffect = {
  mpCostMultiplier: 1.0,
  poisonImmune: false,
  reflectDamage: 0,
  spellMultiplier: 1.0,
  fireOnHit: 0,
  extraStatusResist: 0,
  speedBonus: 0,
};

export function mergeCraftEffect(base: CraftEffect, item: SpecialEffect | undefined): CraftEffect {
  if (!item) return base;
  const r = { ...base };
  switch (item.type) {
    case "mp_cost_reduce":    r.mpCostMultiplier    = Math.max(0.4, r.mpCostMultiplier - item.value / 100); break;
    case "poison_immune":     r.poisonImmune        = true; break;
    case "damage_reflect":    r.reflectDamage       += item.value / 100; break;
    case "spell_power_up":    r.spellMultiplier     += item.value / 100; break;
    case "fire_on_hit":       r.fireOnHit           += item.value; break;
    case "status_resist_all": r.extraStatusResist   += item.value / 100; break;
    case "speed_boost":       r.speedBonus          += item.value; break;
  }
  return r;
}
