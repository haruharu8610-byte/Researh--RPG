import { MATERIALS, type Material } from "@/lib/materials";
import { SHOP_ITEMS, type ShopItem } from "@/lib/equipment";
import type { Rarity } from "@/lib/rarity";

export const GACHA_COST = 100;

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

const itemPool: ShopItem[] = SHOP_ITEMS.filter(i => ["potion", "ether", "throwable"].includes(i.category));

function pickRarity(): Rarity {
  const total = RARITY_WEIGHTS.reduce((s, w) => s + w.weight, 0);
  let roll = Math.random() * total;
  for (const w of RARITY_WEIGHTS) {
    if (roll < w.weight) return w.rarity;
    roll -= w.weight;
  }
  return "common";
}

function poolForRarity(rarity: Rarity): Array<{ kind: "material"; ref: Material } | { kind: "item"; ref: ShopItem }> {
  const mats  = MATERIALS.filter(m => m.rarity === rarity).map(ref => ({ kind: "material" as const, ref }));
  const items = itemPool.filter(i => i.rarity === rarity).map(ref => ({ kind: "item" as const, ref }));
  return [...mats, ...items];
}

/** 1回ガチャを引く。該当レアリティに対象がなければ1段階下にフォールバック。 */
export function pullGacha(): GachaResult {
  const order: Rarity[] = ["legendary", "epic", "rare", "uncommon", "common"];
  let rarity = pickRarity();
  let pool = poolForRarity(rarity);
  while (!pool.length) {
    const idx = order.indexOf(rarity);
    rarity = order[Math.min(order.length - 1, idx + 1)];
    pool = poolForRarity(rarity);
    if (rarity === "common" && !pool.length) break;
  }
  const picked = pool[Math.floor(Math.random() * pool.length)];
  const qty = picked.kind === "material" && (rarity === "common" || rarity === "uncommon") ? 2 : 1;
  return { ...picked, qty };
}
