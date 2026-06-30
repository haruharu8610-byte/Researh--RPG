import { MATERIALS, type Material } from "@/lib/materials";
import { SHOP_ITEMS, type ShopItem } from "@/lib/equipment";
import type { Rarity } from "@/lib/rarity";

export type GachaKind = "item" | "weapon" | "armor";

export const GACHA_KIND_LABEL: Record<GachaKind, string> = {
  item:   "🧪 どうぐガチャ",
  weapon: "⚔️ 武器ガチャ",
  armor:  "🛡️ 防具ガチャ",
};

export const GACHA_COST: Record<GachaKind, number> = {
  item:   100,
  weapon: 300,
  armor:  300,
};

export type GachaResult =
  | { kind: "material"; ref: Material; qty: number }
  | { kind: "item"; ref: ShopItem; qty: number };

const RARITY_WEIGHTS: Array<{ rarity: Rarity; weight: number }> = [
  { rarity: "common",    weight: 55 },
  { rarity: "uncommon",  weight: 28 },
  { rarity: "rare",      weight: 12 },
  { rarity: "epic",      weight: 4  },
  { rarity: "legendary", weight: 1  },
];

const consumablePool = SHOP_ITEMS.filter(i => ["potion", "ether", "throwable"].includes(i.category));
const weaponPool     = SHOP_ITEMS.filter(i => i.category === "weapon");
const armorPool      = SHOP_ITEMS.filter(i => i.category === "armor");

function pickRarity(): Rarity {
  const total = RARITY_WEIGHTS.reduce((s, w) => s + w.weight, 0);
  let roll = Math.random() * total;
  for (const w of RARITY_WEIGHTS) {
    if (roll < w.weight) return w.rarity;
    roll -= w.weight;
  }
  return "common";
}

function poolForRarity(kind: GachaKind, rarity: Rarity) {
  if (kind === "item") {
    const mats  = MATERIALS.filter(m => m.rarity === rarity).map(ref => ({ kind: "material" as const, ref }));
    const items = consumablePool.filter(i => i.rarity === rarity).map(ref => ({ kind: "item" as const, ref }));
    return [...mats, ...items];
  }
  const base = kind === "weapon" ? weaponPool : armorPool;
  return base.filter(i => i.rarity === rarity).map(ref => ({ kind: "item" as const, ref }));
}

/** 1回ガチャを引く。該当レアリティに対象がなければ1段階下にフォールバック。 */
export function pullGacha(kind: GachaKind): GachaResult {
  const order: Rarity[] = ["legendary", "epic", "rare", "uncommon", "common"];
  let rarity = pickRarity();
  let pool = poolForRarity(kind, rarity);
  while (!pool.length) {
    const idx = order.indexOf(rarity);
    if (idx >= order.length - 1) break;
    rarity = order[idx + 1];
    pool = poolForRarity(kind, rarity);
  }
  const picked = pool[Math.floor(Math.random() * pool.length)];
  const qty = picked.kind === "material" && (rarity === "common" || rarity === "uncommon") ? 2 : 1;
  return { ...picked, qty };
}
