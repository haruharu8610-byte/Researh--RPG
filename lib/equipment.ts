import { DEFAULT_CRAFT_EFFECT, mergeCraftEffect, type CraftEffect, type SpecialEffect } from "@/lib/rarity";
import type { Rarity } from "@/lib/rarity";

export type ItemCategory = "weapon" | "armor" | "potion" | "ether";

export type ShopItem = {
  id: string; name: string; category: ItemCategory; cost: number; description: string;
  attackBonus?: number; defenseBonus?: number; magicBonus?: number;
  hpRestore?: number; mpRestore?: number;
  statusResist?: number;
  rarity?: Rarity;
  specialEffect?: SpecialEffect;
};

export const SHOP_ITEMS: ShopItem[] = [
  // ── 武器 ───────────────────────────────────────────────────
  { id: "wooden_sword",  name: "木の剣",           category: "weapon", cost: 100,  description: "粗末な木製の剣",           attackBonus: 5,  rarity: "common"   },
  { id: "bronze_knife",  name: "どうのナイフ",     category: "weapon", cost: 180,  description: "青銅製の素早い短剣",       attackBonus: 8,  rarity: "common"   },
  { id: "iron_sword",    name: "鉄の剣",           category: "weapon", cost: 300,  description: "しっかりした鉄の剣",       attackBonus: 12, rarity: "common"   },
  { id: "battle_axe",   name: "バトルアックス",    category: "weapon", cost: 500,  description: "重くて強力な戦斧",         attackBonus: 18, rarity: "uncommon" },
  { id: "steel_sword",   name: "鋼の剣",           category: "weapon", cost: 700,  description: "切れ味鋭い鋼の剣",         attackBonus: 22, rarity: "uncommon" },
  { id: "magic_staff",   name: "まほうの杖",       category: "weapon", cost: 500,  description: "魔力を高める杖",           attackBonus: 5,  magicBonus: 18, rarity: "uncommon" },
  { id: "wind_spear",    name: "かぜのやり",       category: "weapon", cost: 850,  description: "風を切る速さの槍",         attackBonus: 20, magicBonus: 8, rarity: "uncommon" },
  { id: "holy_staff",    name: "せいなる杖",       category: "weapon", cost: 1200, description: "神聖な力を宿す杖",         attackBonus: 8,  magicBonus: 35, rarity: "rare"    },
  { id: "thunder_blade", name: "らいじんのつるぎ", category: "weapon", cost: 1500, description: "雷を纏う剣",               attackBonus: 32, magicBonus: 12, rarity: "rare"    },
  { id: "dark_blade",    name: "やみのつるぎ",     category: "weapon", cost: 1800, description: "闇の力を持つ呪いの剣",     attackBonus: 38, magicBonus: 10, rarity: "rare"    },
  { id: "dragon_sword",  name: "ドラゴンのつるぎ", category: "weapon", cost: 2000, description: "竜の力を宿す最強の剣",     attackBonus: 45, rarity: "epic"    },
  { id: "sage_staff",    name: "けんじゃのつえ",   category: "weapon", cost: 3000, description: "賢者が使う最高の魔法の杖", attackBonus: 15, magicBonus: 55, rarity: "epic"    },

  // ── 防具 ───────────────────────────────────────────────────
  { id: "cloth_robe",    name: "ぬののローブ",     category: "armor",  cost: 80,   description: "簡素な布のローブ",                 defenseBonus: 3,  statusResist: 0.05, rarity: "common"   },
  { id: "leather_armor", name: "かわのよろい",     category: "armor",  cost: 150,  description: "軽い革の鎧 耐性+10%",              defenseBonus: 5,  statusResist: 0.10, rarity: "common"   },
  { id: "bronze_shield", name: "どうのたて",       category: "armor",  cost: 250,  description: "青銅製の小さな盾",                 defenseBonus: 8,  statusResist: 0.10, rarity: "common"   },
  { id: "chain_mail",    name: "くさりかたびら",   category: "armor",  cost: 400,  description: "鎖帷子 耐性+15%",                  defenseBonus: 12, statusResist: 0.15, rarity: "common"   },
  { id: "magic_robe",    name: "まほうのローブ",   category: "armor",  cost: 600,  description: "魔法防御＆状態異常耐性+20%",       defenseBonus: 8,  magicBonus: 10, statusResist: 0.20, rarity: "rare"    },
  { id: "wind_cloak",    name: "かぜのマント",     category: "armor",  cost: 700,  description: "素早さが上がる軽いマント",          defenseBonus: 10, statusResist: 0.15, rarity: "uncommon" },
  { id: "iron_armor",    name: "てつのよろい",     category: "armor",  cost: 900,  description: "重い鉄の鎧 耐性+25%",              defenseBonus: 22, statusResist: 0.25, rarity: "uncommon" },
  { id: "mystic_robe",   name: "みすてりーローブ", category: "armor",  cost: 1300, description: "謎めいたローブ。魔法耐性が上がる", defenseBonus: 15, magicBonus: 18, statusResist: 0.25, rarity: "rare"    },
  { id: "silver_armor",  name: "シルバーアーマー", category: "armor",  cost: 1600, description: "銀の光る鎧 耐性+30%",              defenseBonus: 32, statusResist: 0.30, rarity: "rare"    },
  { id: "dragon_armor",  name: "ドラゴンのよろい", category: "armor",  cost: 2500, description: "最強の鎧 耐性+35%",                defenseBonus: 45, statusResist: 0.35, rarity: "epic"    },
  { id: "sage_robe",     name: "けんじゃのローブ", category: "armor",  cost: 3500, description: "賢者の鎧。魔法と防御を兼ね備える", defenseBonus: 30, magicBonus: 30, statusResist: 0.35, rarity: "epic"    },

  // ── 消耗品（HP） ───────────────────────────────────────────
  { id: "potion",        name: "ポーション",       category: "potion", cost: 30,   description: "HPを40回復",    hpRestore: 40,  rarity: "common"   },
  { id: "hi_potion",     name: "ハイポーション",   category: "potion", cost: 80,   description: "HPを120回復",   hpRestore: 120, rarity: "uncommon" },
  { id: "mega_potion",   name: "メガポーション",   category: "potion", cost: 200,  description: "HPを300回復",   hpRestore: 300, rarity: "rare"     },
  { id: "elixir",        name: "エリクサー",       category: "potion", cost: 500,  description: "HPを全回復",    hpRestore: 9999, rarity: "epic"    },

  // ── 消耗品（MP） ───────────────────────────────────────────
  { id: "ether",         name: "エーテル",         category: "ether",  cost: 50,   description: "MPを20回復",    mpRestore: 20,  rarity: "common"   },
  { id: "hi_ether",      name: "ハイエーテル",     category: "ether",  cost: 120,  description: "MPを60回復",    mpRestore: 60,  rarity: "uncommon" },
  { id: "turbo_ether",   name: "ターボエーテル",   category: "ether",  cost: 300,  description: "MPを150回復",   mpRestore: 150, rarity: "rare"     },
  { id: "dry_ether",     name: "ドライエーテル",   category: "ether",  cost: 600,  description: "MPを全回復",    mpRestore: 9999, rarity: "epic"    },
];

// クラフトアイテムは materials.ts で定義されるが、装備用ルックアップのためここで登録
// equip/getEquipped は SHOP_ITEMS + CRAFTED_ID_MAP を参照する
const _craftedItems: ShopItem[] = [];

export function registerCraftedItems(items: ShopItem[]): void {
  _craftedItems.length = 0;
  _craftedItems.push(...items);
}

function allItems(): ShopItem[] {
  return [...SHOP_ITEMS, ..._craftedItems];
}

// ── 装備効果の集計 ──────────────────────────────────────────
export function getEquipmentEffect(weapon: ShopItem | null, armor: ShopItem | null): CraftEffect {
  let effect = { ...DEFAULT_CRAFT_EFFECT };
  effect = mergeCraftEffect(effect, weapon?.specialEffect);
  effect = mergeCraftEffect(effect, armor?.specialEffect);
  return effect;
}

// ── localStorage ─────────────────────────────────────────────
export type InventoryEntry = { id: string; qty: number };

const WEAPON_KEY    = "rpg_weapon";
const ARMOR_KEY     = "rpg_armor";
const INVENTORY_KEY = "rpg_inventory";

export function getEquippedWeapon(): ShopItem | null {
  if (typeof localStorage === "undefined") return null;
  const id = localStorage.getItem(WEAPON_KEY);
  return id ? (allItems().find(i => i.id === id) ?? null) : null;
}
export function getEquippedArmor(): ShopItem | null {
  if (typeof localStorage === "undefined") return null;
  const id = localStorage.getItem(ARMOR_KEY);
  return id ? (allItems().find(i => i.id === id) ?? null) : null;
}
export function equip(item: ShopItem): void {
  if (item.category === "weapon") localStorage.setItem(WEAPON_KEY, item.id);
  if (item.category === "armor")  localStorage.setItem(ARMOR_KEY, item.id);
}

export function getInventory(): InventoryEntry[] {
  if (typeof localStorage === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(INVENTORY_KEY) ?? "[]"); }
  catch { return []; }
}
export function addInventory(id: string, qty = 1): void {
  const inv = getInventory();
  const e = inv.find(i => i.id === id);
  if (e) e.qty += qty; else inv.push({ id, qty });
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inv));
}
export function removeInventory(id: string, qty = 1): boolean {
  const inv = getInventory();
  const e = inv.find(i => i.id === id);
  if (!e || e.qty < qty) return false;
  e.qty -= qty;
  if (e.qty === 0) inv.splice(inv.indexOf(e), 1);
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inv));
  return true;
}
export function getInventoryItem(id: string): InventoryEntry | null {
  return getInventory().find(i => i.id === id) ?? null;
}
