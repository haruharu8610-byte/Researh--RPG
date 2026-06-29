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
  // 武器
  { id: "wooden_sword",  name: "木の剣",           category: "weapon", cost: 100,  description: "粗末な木製の剣",       attackBonus: 5,  rarity: "common"   },
  { id: "iron_sword",    name: "鉄の剣",           category: "weapon", cost: 300,  description: "しっかりした鉄の剣",   attackBonus: 12, rarity: "common"   },
  { id: "steel_sword",   name: "鋼の剣",           category: "weapon", cost: 700,  description: "切れ味鋭い鋼の剣",     attackBonus: 22, rarity: "uncommon" },
  { id: "magic_staff",   name: "まほうの杖",       category: "weapon", cost: 500,  description: "魔力を高める杖",       attackBonus: 5,  magicBonus: 18, rarity: "uncommon" },
  { id: "holy_staff",    name: "せいなる杖",       category: "weapon", cost: 1200, description: "神聖な力を宿す杖",     attackBonus: 8,  magicBonus: 35, rarity: "rare"    },
  { id: "dragon_sword",  name: "ドラゴンのつるぎ", category: "weapon", cost: 2000, description: "竜の力を宿す最強の剣", attackBonus: 45, rarity: "epic"    },
  // 防具
  { id: "leather_armor", name: "かわのよろい",     category: "armor",  cost: 150,  description: "軽い革の鎧 耐性+10%",         defenseBonus: 5,  statusResist: 0.10, rarity: "common"   },
  { id: "chain_mail",    name: "くさりかたびら",   category: "armor",  cost: 400,  description: "鎖帷子 耐性+15%",             defenseBonus: 12, statusResist: 0.15, rarity: "common"   },
  { id: "iron_armor",    name: "てつのよろい",     category: "armor",  cost: 900,  description: "重い鉄の鎧 耐性+25%",         defenseBonus: 22, statusResist: 0.25, rarity: "uncommon" },
  { id: "magic_robe",    name: "まほうのローブ",   category: "armor",  cost: 600,  description: "魔法防御＆状態異常耐性+20%",  defenseBonus: 8,  magicBonus: 10, statusResist: 0.20, rarity: "rare"    },
  { id: "dragon_armor",  name: "ドラゴンのよろい", category: "armor",  cost: 2500, description: "最強の鎧 耐性+35%",           defenseBonus: 45, statusResist: 0.35, rarity: "epic"    },
  // 消耗品
  { id: "potion",     name: "ポーション",     category: "potion", cost: 30,  description: "HPを40回復",   hpRestore: 40,  rarity: "common"   },
  { id: "hi_potion",  name: "ハイポーション", category: "potion", cost: 80,  description: "HPを120回復",  hpRestore: 120, rarity: "uncommon" },
  { id: "ether",      name: "エーテル",       category: "ether",  cost: 50,  description: "MPを20回復",   mpRestore: 20,  rarity: "common"   },
  { id: "hi_ether",   name: "ハイエーテル",   category: "ether",  cost: 60,  description: "MPを60回復",   mpRestore: 60,  rarity: "uncommon" },
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
