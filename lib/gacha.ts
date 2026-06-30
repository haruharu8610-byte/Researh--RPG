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
  | { kind: "material"; ref: Material; qty: number; forced?: boolean }
  | { kind: "item"; ref: ShopItem; qty: number; forced?: boolean };

export type GachaSession = {
  results: GachaResult[];
  /** 確定演出が発生したか（最高レアリティを1つ保証） */
  guaranteed: boolean;
};

const RARITY_ORDER: Rarity[] = ["legendary", "epic", "rare", "uncommon", "common"];

const RARITY_WEIGHTS: Array<{ rarity: Rarity; weight: number }> = [
  { rarity: "common",    weight: 55 },
  { rarity: "uncommon",  weight: 28 },
  { rarity: "rare",      weight: 12 },
  { rarity: "epic",      weight: 4  },
  { rarity: "legendary", weight: 1  },
];

/** 確定演出（最高レアリティ保証）が出る確率 */
const GUARANTEED_EVENT_CHANCE = 0.03;

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

/** そのガチャ種別に実在する最高レアリティを返す（武器/防具は基本epicまでしか無いため） */
function highestAvailableRarity(kind: GachaKind, minRarity?: Rarity): Rarity {
  const startIdx = minRarity ? RARITY_ORDER.indexOf(minRarity) : 0;
  for (let i = startIdx; i < RARITY_ORDER.length; i++) {
    if (poolForRarity(kind, RARITY_ORDER[i]).length) return RARITY_ORDER[i];
  }
  return "common";
}

function drawAtRarity(kind: GachaKind, rarity: Rarity, forced = false): GachaResult {
  const pool = poolForRarity(kind, rarity);
  const picked = pool[Math.floor(Math.random() * pool.length)];
  const qty = picked.kind === "material" && (rarity === "common" || rarity === "uncommon") ? 2 : 1;
  return { ...picked, qty, forced };
}

function drawOne(kind: GachaKind): GachaResult {
  const order = RARITY_ORDER;
  let rarity = pickRarity();
  let pool = poolForRarity(kind, rarity);
  while (!pool.length) {
    const idx = order.indexOf(rarity);
    if (idx >= order.length - 1) break;
    rarity = order[idx + 1];
    pool = poolForRarity(kind, rarity);
  }
  return drawAtRarity(kind, rarity);
}

/** 単発ガチャ（演出なしの単純抽選。互換用） */
export function pullGacha(kind: GachaKind): GachaResult {
  return drawOne(kind);
}

/**
 * 複数回ガチャを引くセッション。
 * - 低確率で「確定演出」が発生し、そのガチャ種別の最高レアリティを1つ保証
 * - 10連以上の場合、エピック以上が1つも無ければ1枠を強制的にエピック以上に差し替え
 */
export function pullGachaSession(kind: GachaKind, times: number): GachaSession {
  const results: GachaResult[] = Array.from({ length: times }, () => drawOne(kind));

  const guaranteed = Math.random() < GUARANTEED_EVENT_CHANCE;
  if (guaranteed) {
    const idx = Math.floor(Math.random() * times);
    results[idx] = drawAtRarity(kind, highestAvailableRarity(kind), true);
  }

  if (times >= 10) {
    const hasEpicPlus = results.some(r => r.ref.rarity === "epic" || r.ref.rarity === "legendary");
    if (!hasEpicPlus) {
      const idx = Math.floor(Math.random() * times);
      results[idx] = drawAtRarity(kind, highestAvailableRarity(kind, "epic"), results[idx]?.forced);
    }
  }

  return { results, guaranteed };
}
