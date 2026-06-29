export type ItemCategory = "weapon" | "armor" | "potion" | "ether";

export type ShopItem = {
  id: string; name: string; category: ItemCategory; cost: number; description: string;
  attackBonus?: number; defenseBonus?: number; magicBonus?: number;
  hpRestore?: number; mpRestore?: number;
  statusResist?: number; // 防具のみ：状態異常耐性ボーナス（0〜0.5）
};

export const SHOP_ITEMS: ShopItem[] = [
  // 武器
  { id: "wooden_sword",  name: "木の剣",          category: "weapon", cost: 100,  description: "粗末な木製の剣",       attackBonus: 5  },
  { id: "iron_sword",    name: "鉄の剣",          category: "weapon", cost: 300,  description: "しっかりした鉄の剣",   attackBonus: 12 },
  { id: "steel_sword",   name: "鋼の剣",          category: "weapon", cost: 700,  description: "切れ味鋭い鋼の剣",     attackBonus: 22 },
  { id: "magic_staff",   name: "まほうの杖",      category: "weapon", cost: 500,  description: "魔力を高める杖",       attackBonus: 5, magicBonus: 18 },
  { id: "holy_staff",    name: "せいなる杖",      category: "weapon", cost: 1200, description: "神聖な力を宿す杖",     attackBonus: 8, magicBonus: 35 },
  { id: "dragon_sword",  name: "ドラゴンのつるぎ", category: "weapon", cost: 2000, description: "最強の剣",             attackBonus: 45 },
  // 防具（statusResist: 素の50%に加算）
  { id: "leather_armor", name: "かわのよろい",    category: "armor",  cost: 150,  description: "軽い革の鎧 耐性+10%",        defenseBonus: 5,  statusResist: 0.10 },
  { id: "chain_mail",    name: "くさりかたびら",  category: "armor",  cost: 400,  description: "鎖帷子 耐性+15%",            defenseBonus: 12, statusResist: 0.15 },
  { id: "iron_armor",    name: "てつのよろい",    category: "armor",  cost: 900,  description: "重い鉄の鎧 耐性+25%",        defenseBonus: 22, statusResist: 0.25 },
  { id: "magic_robe",    name: "まほうのローブ",  category: "armor",  cost: 600,  description: "魔法防御＆状態異常耐性+20%", defenseBonus: 8,  magicBonus: 10, statusResist: 0.20 },
  { id: "dragon_armor",  name: "ドラゴンのよろい", category: "armor",  cost: 2500, description: "最強の鎧 耐性+35%",          defenseBonus: 45, statusResist: 0.35 },
  // 消耗品
  { id: "potion",     name: "ポーション",     category: "potion", cost: 30,  description: "HPを40回復",   hpRestore: 40  },
  { id: "hi_potion",  name: "ハイポーション", category: "potion", cost: 80,  description: "HPを120回復",  hpRestore: 120 },
  { id: "ether",      name: "エーテル",       category: "ether",  cost: 50,  description: "MPを20回復",   mpRestore: 20  },
  { id: "hi_ether",   name: "ハイエーテル",   category: "ether",  cost: 60,  description: "MPを60回復",   mpRestore: 60  },
];

export type InventoryEntry = { id: string; qty: number };

const WEAPON_KEY    = "rpg_weapon";
const ARMOR_KEY     = "rpg_armor";
const INVENTORY_KEY = "rpg_inventory";

export function getEquippedWeapon(): ShopItem | null {
  const id = localStorage.getItem(WEAPON_KEY);
  return id ? (SHOP_ITEMS.find((i) => i.id === id) ?? null) : null;
}
export function getEquippedArmor(): ShopItem | null {
  const id = localStorage.getItem(ARMOR_KEY);
  return id ? (SHOP_ITEMS.find((i) => i.id === id) ?? null) : null;
}
export function equip(item: ShopItem): void {
  if (item.category === "weapon") localStorage.setItem(WEAPON_KEY, item.id);
  if (item.category === "armor")  localStorage.setItem(ARMOR_KEY, item.id);
}

export function getInventory(): InventoryEntry[] {
  try { return JSON.parse(localStorage.getItem(INVENTORY_KEY) ?? "[]"); }
  catch { return []; }
}
export function addInventory(id: string, qty = 1): void {
  const inv = getInventory();
  const e = inv.find((i) => i.id === id);
  if (e) e.qty += qty; else inv.push({ id, qty });
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inv));
}
export function removeInventory(id: string, qty = 1): boolean {
  const inv = getInventory();
  const e = inv.find((i) => i.id === id);
  if (!e || e.qty < qty) return false;
  e.qty -= qty;
  if (e.qty === 0) inv.splice(inv.indexOf(e), 1);
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inv));
  return true;
}
export function getInventoryItem(id: string): InventoryEntry | null {
  return getInventory().find((i) => i.id === id) ?? null;
}
