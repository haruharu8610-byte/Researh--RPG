import type { Rarity, SpecialEffect } from "@/lib/rarity";
import type { ItemCategory } from "@/lib/equipment";

export type Material = {
  id: string;
  name: string;
  rarity: Rarity;
  description: string;
  buyable: boolean;
  cost?: number;
  /** 換金専用アイテム：ショップで高額売却できる（使い道は売却のみ） */
  sellValue?: number;
};

export const MATERIALS: Material[] = [
  // 購入可能素材
  { id: "stone",         name: "石材",            rarity: "common",    description: "どこにでもある石材",              buyable: true,  cost: 50  },
  { id: "iron_ore",      name: "てつこうせき",     rarity: "common",    description: "鉄の原料となる鉱石",              buyable: true,  cost: 80  },
  { id: "magic_stone",   name: "まほうの石",       rarity: "uncommon",  description: "魔力を帯びた青い石",              buyable: true,  cost: 200 },
  { id: "herb",          name: "やくそう",         rarity: "common",    description: "回復効果のある薬草",              buyable: true,  cost: 30  },
  // ドロップ素材（コモン）
  { id: "bat_wing",      name: "こうもりの翼",     rarity: "common",    description: "ドラキーから入手できる翼",         buyable: false  },
  { id: "bone_shard",    name: "ほねのかけら",     rarity: "common",    description: "がいこつが落とす骨片",            buyable: false  },
  { id: "wolf_fang",     name: "オオカミのキバ",   rarity: "common",    description: "もりのおおかみのキバ",            buyable: false  },
  { id: "mushroom_spore",name: "キノコのほうし",   rarity: "uncommon",  description: "おばけキノコの胞子。毒性あり",     buyable: false  },
  // ドロップ素材（アンコモン〜レア）
  { id: "hard_shell",    name: "かたいこうら",     rarity: "uncommon",  description: "おおさそりの堅い甲殻",            buyable: false  },
  { id: "ghost_orb",     name: "ゴーストのたま",   rarity: "uncommon",  description: "ゴーストから入手できる球体",       buyable: false  },
  { id: "lizard_hide",   name: "リザードのうろこ", rarity: "uncommon",  description: "リザードマンの鱗皮",              buyable: false  },
  { id: "mage_robe_frag",name: "まじゅつしのローブ断片", rarity: "rare", description: "まじゅつしが落とす魔法の布",     buyable: false  },
  { id: "orc_tusk",      name: "オークのツノ",     rarity: "uncommon",  description: "オークキングの巨大な牙",          buyable: false  },
  { id: "golem_core",    name: "ゴーレムのコア",   rarity: "rare",      description: "ゴーレムの中核。強力な魔力を宿す", buyable: false  },
  { id: "dragon_scale",  name: "ドラゴンのウロコ", rarity: "rare",      description: "ドラゴンの鱗。高い防御力を持つ",  buyable: false  },
  // エピック〜レジェンダリー
  { id: "rare_crystal",  name: "レアクリスタル",   rarity: "epic",      description: "非常に希少な水晶。強力な装備に",  buyable: false  },
  { id: "legend_ore",    name: "でんせつの鉱石",   rarity: "legendary", description: "伝説の武具の素材。入手困難",       buyable: false  },
  { id: "dark_crystal",  name: "やみのクリスタル", rarity: "epic",      description: "闇の力を秘めた漆黒の結晶",         buyable: false  },
  { id: "angel_feather", name: "てんしのはね",     rarity: "legendary", description: "天界から落ちた羽根。神聖な力",     buyable: false  },
  // 換金専用アイテム（ゴールドダンジョン限定モンスタードロップ）
  { id: "gold_idol",     name: "おうごんのぞう",   rarity: "epic",      description: "ゴールドゴーレムが落とす黄金の像。換金専用", buyable: false, sellValue: 800  },
  { id: "king_treasure", name: "おうのほうもつ",   rarity: "legendary", description: "王の財宝。とんでもない高値で売れる換金専用品", buyable: false, sellValue: 2500 },
];

// ── クラフトレシピ ───────────────────────────────────────────
export type CraftRecipe = {
  id: string;
  name: string;
  category: Extract<ItemCategory, "weapon" | "armor">;
  rarity: Rarity;
  materials: Array<{ id: string; qty: number }>;
  goldCost: number;
  description: string;
  attackBonus?: number; defenseBonus?: number; magicBonus?: number; statusResist?: number;
  specialEffect: SpecialEffect;
};

export const CRAFT_RECIPES: CraftRecipe[] = [
  // ── 武器 ──
  {
    id: "craft_wind_staff",
    name: "かぜのつえ",
    category: "weapon", rarity: "uncommon",
    materials: [{ id: "bat_wing", qty: 2 }, { id: "magic_stone", qty: 1 }],
    goldCost: 300,
    description: "こうもりの翼で作った風の杖",
    magicBonus: 22,
    specialEffect: { type: "mp_cost_reduce", value: 20, label: "MP消費-20%" },
  },
  {
    id: "craft_dragon_fang",
    name: "ドラゴンのキバ",
    category: "weapon", rarity: "rare",
    materials: [{ id: "dragon_scale", qty: 2 }, { id: "stone", qty: 3 }],
    goldCost: 1500,
    description: "ドラゴンの鱗と牙で作った剣",
    attackBonus: 52,
    specialEffect: { type: "fire_on_hit", value: 18, label: "物理攻撃に炎ダメージ+18" },
  },
  {
    id: "craft_chaos_blade",
    name: "カオスブレード",
    category: "weapon", rarity: "epic",
    materials: [{ id: "rare_crystal", qty: 1 }, { id: "dragon_scale", qty: 2 }, { id: "magic_stone", qty: 2 }],
    goldCost: 3000,
    description: "レアクリスタルに宿る混沌の剣",
    attackBonus: 40, magicBonus: 25,
    specialEffect: { type: "spell_power_up", value: 35, label: "魔法威力+35%" },
  },
  {
    id: "craft_legend_sword",
    name: "でんせつのつるぎ",
    category: "weapon", rarity: "legendary",
    materials: [{ id: "legend_ore", qty: 1 }, { id: "dragon_scale", qty: 3 }, { id: "rare_crystal", qty: 1 }],
    goldCost: 5000,
    description: "伝説に語られる最強の剣",
    attackBonus: 80, magicBonus: 20,
    specialEffect: { type: "spell_power_up", value: 50, label: "魔法威力+50%" },
  },

  // ── 追加武器レシピ ──
  {
    id: "craft_bone_blade",
    name: "ボーンブレード",
    category: "weapon", rarity: "uncommon",
    materials: [{ id: "bone_shard", qty: 3 }, { id: "iron_ore", qty: 2 }],
    goldCost: 400,
    description: "がいこつの骨で作った不気味な剣",
    attackBonus: 28,
    specialEffect: { type: "poison_immune", value: 1, label: "毒無効" },
  },
  {
    id: "craft_wolf_claw",
    name: "オオカミのツメ",
    category: "weapon", rarity: "uncommon",
    materials: [{ id: "wolf_fang", qty: 2 }, { id: "stone", qty: 2 }],
    goldCost: 350,
    description: "オオカミの牙で作った爪状の武器",
    attackBonus: 25,
    specialEffect: { type: "speed_boost", value: 8, label: "素早さ+8" },
  },
  {
    id: "craft_dark_staff",
    name: "やみのつえ",
    category: "weapon", rarity: "rare",
    materials: [{ id: "dark_crystal", qty: 1 }, { id: "mage_robe_frag", qty: 2 }],
    goldCost: 2000,
    description: "闇の魔法使いが持つ邪悪な杖",
    attackBonus: 10, magicBonus: 50,
    specialEffect: { type: "spell_power_up", value: 40, label: "魔法威力+40%" },
  },
  {
    id: "craft_angel_sword",
    name: "てんしのつるぎ",
    category: "weapon", rarity: "legendary",
    materials: [{ id: "angel_feather", qty: 1 }, { id: "legend_ore", qty: 1 }, { id: "rare_crystal", qty: 2 }],
    goldCost: 8000,
    description: "天界の素材で作られた神聖な剣",
    attackBonus: 70, magicBonus: 30,
    specialEffect: { type: "fire_on_hit", value: 30, label: "物理攻撃に炎ダメージ+30" },
  },

  // ── 防具 ──
  {
    id: "craft_shell_armor",
    name: "シェルメイル",
    category: "armor", rarity: "uncommon",
    materials: [{ id: "hard_shell", qty: 2 }, { id: "iron_ore", qty: 2 }],
    goldCost: 500,
    description: "おおさそりの甲殻で作った鎧",
    defenseBonus: 20, statusResist: 0.10,
    specialEffect: { type: "poison_immune", value: 1, label: "毒無効" },
  },
  {
    id: "craft_golem_shield",
    name: "ゴーレムシールド",
    category: "armor", rarity: "rare",
    materials: [{ id: "golem_core", qty: 1 }, { id: "iron_ore", qty: 3 }],
    goldCost: 1200,
    description: "ゴーレムのコアで作った盾",
    defenseBonus: 38,
    specialEffect: { type: "damage_reflect", value: 15, label: "ダメージ15%反射" },
  },
  {
    id: "craft_resist_robe",
    name: "オールレジストローブ",
    category: "armor", rarity: "epic",
    materials: [{ id: "rare_crystal", qty: 1 }, { id: "magic_stone", qty: 3 }],
    goldCost: 2500,
    description: "全ての状態異常を跳ね返す",
    defenseBonus: 28, magicBonus: 15, statusResist: 0.15,
    specialEffect: { type: "status_resist_all", value: 30, label: "全状態異常耐性+30%" },
  },
  {
    id: "craft_legend_armor",
    name: "でんせつのよろい",
    category: "armor", rarity: "legendary",
    materials: [{ id: "legend_ore", qty: 1 }, { id: "rare_crystal", qty: 1 }, { id: "dragon_scale", qty: 2 }],
    goldCost: 5000,
    description: "伝説の鎧。あらゆる攻撃を防ぐ",
    defenseBonus: 60, statusResist: 0.30,
    specialEffect: { type: "speed_boost", value: 10, label: "素早さ+10" },
  },
  {
    id: "craft_ghost_cloak",
    name: "ゴーストのマント",
    category: "armor", rarity: "rare",
    materials: [{ id: "ghost_orb", qty: 2 }, { id: "bat_wing", qty: 2 }],
    goldCost: 1000,
    description: "ゴーストの力を宿すマント。魔法を弾く",
    defenseBonus: 22, magicBonus: 12, statusResist: 0.20,
    specialEffect: { type: "damage_reflect", value: 20, label: "ダメージ20%反射" },
  },
  {
    id: "craft_angel_robe",
    name: "てんしのローブ",
    category: "armor", rarity: "legendary",
    materials: [{ id: "angel_feather", qty: 1 }, { id: "mage_robe_frag", qty: 2 }, { id: "rare_crystal", qty: 1 }],
    goldCost: 8000,
    description: "天使の羽根で作られた聖なるローブ",
    defenseBonus: 45, magicBonus: 35, statusResist: 0.40,
    specialEffect: { type: "status_resist_all", value: 50, label: "全状態異常耐性+50%" },
  },
];

// ── 素材在庫管理 ────────────────────────────────────────────
const MATERIALS_KEY = "rpg_materials";

type MaterialEntry = { id: string; qty: number };

export function getMaterials(): MaterialEntry[] {
  if (typeof localStorage === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(MATERIALS_KEY) ?? "[]"); }
  catch { return []; }
}

export function getMaterialQty(id: string): number {
  return getMaterials().find(m => m.id === id)?.qty ?? 0;
}

export function addMaterial(id: string, qty = 1): void {
  const inv = getMaterials();
  const e = inv.find(m => m.id === id);
  if (e) e.qty += qty; else inv.push({ id, qty });
  localStorage.setItem(MATERIALS_KEY, JSON.stringify(inv));
}

export function removeMaterial(id: string, qty = 1): boolean {
  const inv = getMaterials();
  const e = inv.find(m => m.id === id);
  if (!e || e.qty < qty) return false;
  e.qty -= qty;
  if (e.qty === 0) inv.splice(inv.indexOf(e), 1);
  localStorage.setItem(MATERIALS_KEY, JSON.stringify(inv));
  return true;
}

export function canCraft(recipe: CraftRecipe): boolean {
  return recipe.materials.every(m => getMaterialQty(m.id) >= m.qty);
}
