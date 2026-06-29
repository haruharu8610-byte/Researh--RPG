import { DEFAULT_CRAFT_EFFECT, type CraftEffect } from "@/lib/rarity";

export type Element = "fire" | "water" | "wind" | "earth" | "none";
export type EnemyShape = "slime" | "bat" | "scorpion" | "golem" | "dragon" | "skeleton" | "ghost" | "orc" | "mushroom" | "lizard" | "mage" | "wolf";
export type JobClass = "warrior" | "mage" | "cleric" | "rogue";
export type StatusEffect = "poison" | "paralysis" | "sleep" | "confuse";

export type ActiveStatus = {
  type: StatusEffect;
  turnsLeft: number; // 残りターン数
};

export const STATUS_LABEL: Record<StatusEffect, string> = {
  poison:    "☠️毒",
  paralysis: "⚡麻痺",
  sleep:     "💤眠り",
  confuse:   "😵混乱",
};

const EFFECTIVENESS: Partial<Record<Element, Partial<Record<Element, number>>>> = {
  fire:  { wind: 2.0,  water: 0.5 },
  water: { fire: 2.0,  earth: 0.5 },
  wind:  { earth: 2.0, fire: 0.5  },
  earth: { water: 2.0, wind: 0.5  },
};

export function getEffectiveness(atk: Element, def: Element): number {
  if (atk === "none" || def === "none") return 1.0;
  return EFFECTIVENESS[atk]?.[def] ?? 1.0;
}

export const ELEMENT_LABEL: Record<Element, string> = {
  fire: "🔥火", water: "💧水", wind: "🌪️風", earth: "🌍土", none: "⚡無",
};

// ── 呪文 ────────────────────────────────────────────────────
export type SpellEffectDef = {
  status: StatusEffect;
  baseChance: number;
  turns: number;
};

export type SpellAllyEffect = {
  type: "speed_up";
  factor: number; // e.g. 1.5 = +50%
  turns: number;
};

export type Spell = {
  id: string; name: string; element: Element;
  power: number; mpCost: number; minLevel: number;
  target: "single" | "all" | "single_ally" | "all_allies";
  lineId: string;
  effect?: SpellEffectDef;     // 状態異常（敵対象）
  allyEffect?: SpellAllyEffect; // バフ（味方対象）
};

export const SPELLS: Spell[] = [
  // 🔥 火ライン
  { id: "mera",      name: "メラ",       element: "fire",  power: 28,  mpCost: 4,  minLevel: 1,  target: "single", lineId: "fire"      },
  { id: "merami",    name: "メラミ",     element: "fire",  power: 65,  mpCost: 9,  minLevel: 5,  target: "single", lineId: "fire"      },
  { id: "merazoma",  name: "メラゾーマ", element: "fire",  power: 120, mpCost: 16, minLevel: 10, target: "single", lineId: "fire"      },
  // 💧 氷ライン
  { id: "hyado",     name: "ヒャド",     element: "water", power: 26,  mpCost: 4,  minLevel: 1,  target: "single", lineId: "water"     },
  { id: "hyadaruko", name: "ヒャダルコ", element: "water", power: 62,  mpCost: 9,  minLevel: 5,  target: "single", lineId: "water"     },
  { id: "mahyado",   name: "マヒャド",   element: "water", power: 115, mpCost: 15, minLevel: 10, target: "single", lineId: "water"     },
  // 🌪️ 風ライン
  { id: "bagi",      name: "バギ",       element: "wind",  power: 24,  mpCost: 3,  minLevel: 1,  target: "single", lineId: "wind"      },
  { id: "bagima",    name: "バギマ",     element: "wind",  power: 55,  mpCost: 8,  minLevel: 4,  target: "all",    lineId: "wind"      },
  { id: "baguross",  name: "バギクロス", element: "wind",  power: 100, mpCost: 14, minLevel: 9,  target: "all",    lineId: "wind"      },
  // 🌍 土ライン
  { id: "gira",      name: "ギラ",       element: "earth", power: 26,  mpCost: 4,  minLevel: 2,  target: "single", lineId: "earth"     },
  { id: "begirama",  name: "べギラマ",   element: "earth", power: 60,  mpCost: 9,  minLevel: 6,  target: "all",    lineId: "earth"     },
  { id: "begiragon", name: "べギラゴン", element: "earth", power: 110, mpCost: 14, minLevel: 11, target: "all",    lineId: "earth"     },
  // ⚡ 無属性
  { id: "raiden",    name: "ライデイン",  element: "none",  power: 80,  mpCost: 13, minLevel: 8,  target: "all",    lineId: "none"      },
  { id: "gigabreak", name: "ギガブレイク",element: "none",  power: 150, mpCost: 22, minLevel: 15, target: "all",    lineId: "none"      },

  // 😵 混乱ライン（ミス率上昇）
  { id: "manusa",    name: "マヌーサ",   element: "none",  power: 0,   mpCost: 5,  minLevel: 2,  target: "all",    lineId: "confuse",
    effect: { status: "confuse",   baseChance: 0.70, turns: 3 } },

  // 💤 眠りライン
  { id: "rariho",    name: "ラリホー",   element: "none",  power: 0,   mpCost: 5,  minLevel: 3,  target: "single", lineId: "sleep",
    effect: { status: "sleep",     baseChance: 0.72, turns: 5 } },
  { id: "rarihoma",  name: "ラリホーマ", element: "none",  power: 0,   mpCost: 10, minLevel: 7,  target: "all",    lineId: "sleep",
    effect: { status: "sleep",     baseChance: 0.55, turns: 5 } },

  // ☠️ 毒ライン
  { id: "dokudoku",  name: "もうどく",   element: "none",  power: 0,   mpCost: 6,  minLevel: 4,  target: "single", lineId: "poison",
    effect: { status: "poison",    baseChance: 0.68, turns: 5 } },

  // ⚡ 麻痺ライン
  { id: "mahi",      name: "まひこうげき",element: "none",  power: 0,   mpCost: 7,  minLevel: 5,  target: "single", lineId: "paralysis",
    effect: { status: "paralysis", baseChance: 0.62, turns: 5 } },

  // 💊 回復ライン（自分 or 単体味方）
  { id: "keal",      name: "ケアル",     element: "none",  power: 0,   mpCost: 4,  minLevel: 1,  target: "single_ally", lineId: "heal" },
  { id: "kealla",    name: "ケアルラ",   element: "none",  power: 0,   mpCost: 9,  minLevel: 6,  target: "single_ally", lineId: "heal" },
  { id: "behomi",    name: "ベホイミ",   element: "none",  power: 0,   mpCost: 14, minLevel: 11, target: "all_allies",  lineId: "heal" },

  // ⚡ 素早さ強化ライン
  { id: "piorimu",   name: "ピオリム",   element: "none",  power: 0,   mpCost: 7,  minLevel: 4,  target: "all_allies",  lineId: "speed",
    allyEffect: { type: "speed_up", factor: 1.6, turns: 3 } },
];

/** 各ラインの最高ティアのみ返す */
export function getAvailableSpells(level: number, jobClass: JobClass): Spell[] {
  const bonus = jobClass === "mage" ? 2 : 0;
  const effectiveLevel = level + bonus;
  const unlocked = SPELLS.filter((s) => s.minLevel <= effectiveLevel);
  const bestPerLine: Map<string, Spell> = new Map();
  for (const s of unlocked) {
    const cur = bestPerLine.get(s.lineId);
    if (!cur || s.minLevel > cur.minLevel) bestPerLine.set(s.lineId, s);
  }
  return Array.from(bestPerLine.values());
}

// ── 状態異常適用チェック ─────────────────────────────────────
/**
 * statusResist: 0=まったく効かない, 0.5=素の耐性, 1=絶対かかる
 * baseChance: 呪文の基本成功率
 * 成功判定: random() < baseChance * (1 - statusResist)
 * 素の耐性0.5 → 成功率は baseChance の 50%
 */
export function tryApplyStatus(baseChance: number, resist: number): boolean {
  return Math.random() < baseChance * (1 - resist);
}

// ── 敵定義 ────────────────────────────────────────────────────
export type DropEntry = { materialId: string; chance: number };

export type EnemyType = {
  id: string; name: string;
  maxHp: number; attack: number; defense: number; magic: number;
  expReward: number; goldReward: number; minLevel: number;
  color: number; shape: EnemyShape; element: Element;
  physResist: number;
  magicResist: number;
  speed: number;
  statusResist: Record<StatusEffect, number>;
  spellIds: string[];
  dropTable: DropEntry[];
  isRare?: boolean; // レアモンスターフラグ
};

export const ENEMIES: EnemyType[] = [
  // ── 通常モンスター（序盤 Lv1〜） ──────────────────────────────
  {
    id: "slime", name: "スライム", maxHp: 12, attack: 4, defense: 1, magic: 0,
    expReward: 5, goldReward: 8, minLevel: 1,
    color: 0x3b82f6, shape: "slime", element: "water",
    physResist: 1, magicResist: 1, speed: 7,
    statusResist: { poison: 0.3, paralysis: 0.3, sleep: 0.2, confuse: 0.2 },
    spellIds: [],
    dropTable: [{ materialId: "stone", chance: 0.15 }],
  },
  {
    id: "poison_slime", name: "どくスライム", maxHp: 15, attack: 5, defense: 1, magic: 0,
    expReward: 8, goldReward: 10, minLevel: 1,
    color: 0x16a34a, shape: "slime", element: "earth",
    physResist: 1, magicResist: 1, speed: 6,
    statusResist: { poison: 0.95, paralysis: 0.2, sleep: 0.2, confuse: 0.2 },
    spellIds: ["dokudoku"],
    dropTable: [{ materialId: "herb", chance: 0.30 }, { materialId: "stone", chance: 0.20 }],
  },
  {
    id: "wolf", name: "もりのおおかみ", maxHp: 28, attack: 10, defense: 3, magic: 0,
    expReward: 15, goldReward: 18, minLevel: 1,
    color: 0x9ca3af, shape: "wolf", element: "wind",
    physResist: 1, magicResist: 1, speed: 20,
    statusResist: { poison: 0.3, paralysis: 0.3, sleep: 0.3, confuse: 0.3 },
    spellIds: [],
    dropTable: [{ materialId: "wolf_fang", chance: 0.50 }, { materialId: "iron_ore", chance: 0.25 }],
  },
  {
    id: "bat", name: "ドラキー", maxHp: 22, attack: 8, defense: 2, magic: 10,
    expReward: 12, goldReward: 15, minLevel: 1,
    color: 0x7c3aed, shape: "bat", element: "wind",
    physResist: 1, magicResist: 1, speed: 18,
    statusResist: { poison: 0.4, paralysis: 0.4, sleep: 0.3, confuse: 0.3 },
    spellIds: ["bagi", "manusa"],
    dropTable: [{ materialId: "bat_wing", chance: 0.45 }],
  },
  // ── 中盤（Lv3〜） ───────────────────────────────────────────
  {
    id: "mushroom", name: "おばけキノコ", maxHp: 35, attack: 11, defense: 4, magic: 8,
    expReward: 22, goldReward: 28, minLevel: 3,
    color: 0xef4444, shape: "mushroom", element: "earth",
    physResist: 1, magicResist: 1, speed: 5,
    statusResist: { poison: 0.8, paralysis: 0.3, sleep: 0.4, confuse: 0.4 },
    spellIds: ["dokudoku", "rariho"],
    dropTable: [{ materialId: "mushroom_spore", chance: 0.55 }, { materialId: "herb", chance: 0.40 }],
  },
  {
    id: "skeleton", name: "がいこつ", maxHp: 38, attack: 13, defense: 5, magic: 0,
    expReward: 25, goldReward: 30, minLevel: 3,
    color: 0xe5e7eb, shape: "skeleton", element: "none",
    physResist: 1, magicResist: 1.2, speed: 9,
    statusResist: { poison: 1.0, paralysis: 0.5, sleep: 1.0, confuse: 0.4 },
    spellIds: [],
    dropTable: [{ materialId: "bone_shard", chance: 0.70 }, { materialId: "iron_ore", chance: 0.30 }],
  },
  {
    id: "scorpion", name: "おおさそり", maxHp: 40, attack: 14, defense: 6, magic: 0,
    expReward: 28, goldReward: 35, minLevel: 3,
    color: 0xd97706, shape: "scorpion", element: "earth",
    physResist: 1, magicResist: 1, speed: 12,
    statusResist: { poison: 0.9, paralysis: 0.5, sleep: 0.4, confuse: 0.5 },
    spellIds: ["dokudoku"],
    dropTable: [{ materialId: "hard_shell", chance: 0.40 }, { materialId: "iron_ore", chance: 0.60 }],
  },
  {
    id: "ghost", name: "ゴースト", maxHp: 30, attack: 12, defense: 3, magic: 18,
    expReward: 30, goldReward: 32, minLevel: 4,
    color: 0xa78bfa, shape: "ghost", element: "none",
    physResist: 0.50, magicResist: 1, speed: 14,
    statusResist: { poison: 1.0, paralysis: 0.7, sleep: 0.5, confuse: 0.5 },
    spellIds: ["manusa", "rariho"],
    dropTable: [{ materialId: "ghost_orb", chance: 0.45 }, { materialId: "magic_stone", chance: 0.20 }],
  },
  // ── 中盤〜終盤（Lv5〜） ──────────────────────────────────────
  {
    id: "lizard", name: "リザードマン", maxHp: 55, attack: 18, defense: 8, magic: 5,
    expReward: 40, goldReward: 50, minLevel: 5,
    color: 0x22c55e, shape: "lizard", element: "fire",
    physResist: 1, magicResist: 1, speed: 15,
    statusResist: { poison: 0.5, paralysis: 0.4, sleep: 0.4, confuse: 0.4 },
    spellIds: ["mera", "mahi"],
    dropTable: [{ materialId: "lizard_hide", chance: 0.50 }, { materialId: "iron_ore", chance: 0.50 }],
  },
  {
    id: "orc", name: "オークキング", maxHp: 65, attack: 20, defense: 10, magic: 0,
    expReward: 48, goldReward: 60, minLevel: 5,
    color: 0x16a34a, shape: "orc", element: "earth",
    physResist: 1, magicResist: 1, speed: 8,
    statusResist: { poison: 0.4, paralysis: 0.5, sleep: 0.4, confuse: 0.5 },
    spellIds: [],
    dropTable: [{ materialId: "orc_tusk", chance: 0.45 }, { materialId: "hard_shell", chance: 0.25 }],
  },
  {
    id: "golem", name: "ゴーレム", maxHp: 70, attack: 22, defense: 14, magic: 8,
    expReward: 55, goldReward: 70, minLevel: 5,
    color: 0x6b7280, shape: "golem", element: "earth",
    physResist: 0.25, magicResist: 1, speed: 4,
    statusResist: { poison: 1.0, paralysis: 0.9, sleep: 0.9, confuse: 0.6 },
    spellIds: ["gira"],
    dropTable: [{ materialId: "golem_core", chance: 0.30 }, { materialId: "iron_ore", chance: 0.80 }],
  },
  {
    id: "dark_mage", name: "まじゅつし", maxHp: 50, attack: 8, defense: 6, magic: 35,
    expReward: 60, goldReward: 75, minLevel: 6,
    color: 0x6d28d9, shape: "mage", element: "none",
    physResist: 1, magicResist: 0.60, speed: 11,
    statusResist: { poison: 0.5, paralysis: 0.5, sleep: 0.5, confuse: 0.6 },
    spellIds: ["merazoma", "rarihoma", "manusa"],
    dropTable: [{ materialId: "mage_robe_frag", chance: 0.40 }, { materialId: "magic_stone", chance: 0.50 }],
  },
  // ── 終盤（Lv8〜） ────────────────────────────────────────────
  {
    id: "ice_wolf", name: "こおりのおおかみ", maxHp: 80, attack: 25, defense: 10, magic: 15,
    expReward: 75, goldReward: 90, minLevel: 7,
    color: 0x7dd3fc, shape: "wolf", element: "water",
    physResist: 1, magicResist: 0.7, speed: 22,
    statusResist: { poison: 0.5, paralysis: 0.5, sleep: 0.4, confuse: 0.4 },
    spellIds: ["hyadaruko", "mahi"],
    dropTable: [{ materialId: "wolf_fang", chance: 0.60 }, { materialId: "rare_crystal", chance: 0.10 }],
  },
  {
    id: "dark_knight", name: "ダークナイト", maxHp: 100, attack: 32, defense: 18, magic: 10,
    expReward: 90, goldReward: 110, minLevel: 8,
    color: 0x374151, shape: "skeleton", element: "none",
    physResist: 1, magicResist: 1, speed: 10,
    statusResist: { poison: 0.6, paralysis: 0.6, sleep: 0.7, confuse: 0.6 },
    spellIds: ["gira", "mahi"],
    dropTable: [{ materialId: "bone_shard", chance: 0.80 }, { materialId: "dark_crystal", chance: 0.15 }],
  },
  {
    id: "dragon", name: "ドラゴン", maxHp: 130, attack: 38, defense: 22, magic: 30,
    expReward: 110, goldReward: 150, minLevel: 8,
    color: 0xdc2626, shape: "dragon", element: "fire",
    physResist: 1, magicResist: 0.45, speed: 13,
    statusResist: { poison: 0.8, paralysis: 0.8, sleep: 0.85, confuse: 0.7 },
    spellIds: ["merazoma", "rariho"],
    dropTable: [{ materialId: "dragon_scale", chance: 0.50 }, { materialId: "rare_crystal", chance: 0.12 }],
  },
  {
    id: "arch_mage", name: "だいまじゅつし", maxHp: 90, attack: 10, defense: 12, magic: 55,
    expReward: 130, goldReward: 180, minLevel: 10,
    color: 0x9333ea, shape: "mage", element: "none",
    physResist: 1, magicResist: 0.50, speed: 13,
    statusResist: { poison: 0.6, paralysis: 0.6, sleep: 0.6, confuse: 0.7 },
    spellIds: ["gigabreak", "rarihoma", "manusa", "dokudoku"],
    dropTable: [{ materialId: "mage_robe_frag", chance: 0.60 }, { materialId: "dark_crystal", chance: 0.20 }],
  },
  {
    id: "ice_dragon", name: "こおりのドラゴン", maxHp: 160, attack: 35, defense: 28, magic: 40,
    expReward: 150, goldReward: 200, minLevel: 12,
    color: 0x38bdf8, shape: "dragon", element: "water",
    physResist: 1, magicResist: 0.40, speed: 11,
    statusResist: { poison: 0.7, paralysis: 0.8, sleep: 0.8, confuse: 0.7 },
    spellIds: ["mahyado", "rariho", "mahi"],
    dropTable: [{ materialId: "dragon_scale", chance: 0.60 }, { materialId: "rare_crystal", chance: 0.18 }, { materialId: "angel_feather", chance: 0.05 }],
  },
  {
    id: "demon_lord", name: "まおう", maxHp: 220, attack: 55, defense: 35, magic: 60,
    expReward: 300, goldReward: 400, minLevel: 15,
    color: 0x7f1d1d, shape: "orc", element: "none",
    physResist: 0.8, magicResist: 0.6, speed: 12,
    statusResist: { poison: 0.9, paralysis: 0.9, sleep: 0.95, confuse: 0.9 },
    spellIds: ["gigabreak", "merazoma", "rarihoma", "manusa"],
    dropTable: [{ materialId: "dark_crystal", chance: 0.80 }, { materialId: "legend_ore", chance: 0.30 }, { materialId: "angel_feather", chance: 0.15 }],
  },

  // ── レアモンスター ──────────────────────────────────────────
  {
    id: "slime_rare", name: "はぐれメタル",
    maxHp: 6, attack: 3, defense: 255, magic: 0,
    expReward: 1000, goldReward: 500, minLevel: 1,
    color: 0xadd8e6, shape: "slime", element: "water",
    physResist: 0.03, magicResist: 0.05, speed: 55,
    statusResist: { poison: 0.99, paralysis: 0.99, sleep: 0.99, confuse: 0.99 },
    spellIds: [],
    dropTable: [{ materialId: "rare_crystal", chance: 0.95 }],
    isRare: true,
  },
  {
    id: "bat_rare", name: "ゴールデンバット",
    maxHp: 50, attack: 18, defense: 6, magic: 20,
    expReward: 150, goldReward: 300, minLevel: 1,
    color: 0xffd700, shape: "bat", element: "wind",
    physResist: 1, magicResist: 0.8, speed: 30,
    statusResist: { poison: 0.7, paralysis: 0.7, sleep: 0.6, confuse: 0.5 },
    spellIds: ["bagima", "manusa"],
    dropTable: [{ materialId: "bat_wing", chance: 1.0 }, { materialId: "legend_ore", chance: 0.25 }],
    isRare: true,
  },
  {
    id: "scorpion_rare", name: "デスサソリ",
    maxHp: 80, attack: 28, defense: 15, magic: 0,
    expReward: 200, goldReward: 250, minLevel: 3,
    color: 0xff4444, shape: "scorpion", element: "earth",
    physResist: 1, magicResist: 1, speed: 20,
    statusResist: { poison: 0.95, paralysis: 0.6, sleep: 0.5, confuse: 0.6 },
    spellIds: ["dokudoku", "mahi"],
    dropTable: [{ materialId: "hard_shell", chance: 1.0 }, { materialId: "rare_crystal", chance: 0.20 }],
    isRare: true,
  },
  {
    id: "ghost_rare", name: "キングゴースト",
    maxHp: 70, attack: 20, defense: 8, magic: 40,
    expReward: 300, goldReward: 350, minLevel: 4,
    color: 0xf0abfc, shape: "ghost", element: "none",
    physResist: 0.30, magicResist: 0.7, speed: 25,
    statusResist: { poison: 1.0, paralysis: 0.8, sleep: 0.7, confuse: 0.6 },
    spellIds: ["rarihoma", "manusa", "begirama"],
    dropTable: [{ materialId: "ghost_orb", chance: 1.0 }, { materialId: "dark_crystal", chance: 0.30 }],
    isRare: true,
  },
  {
    id: "metal_king", name: "メタルキング",
    maxHp: 10, attack: 5, defense: 255, magic: 0,
    expReward: 3000, goldReward: 1000, minLevel: 10,
    color: 0xfde68a, shape: "slime", element: "none",
    physResist: 0.01, magicResist: 0.02, speed: 60,
    statusResist: { poison: 0.99, paralysis: 0.99, sleep: 0.99, confuse: 0.99 },
    spellIds: [],
    dropTable: [{ materialId: "legend_ore", chance: 0.80 }, { materialId: "angel_feather", chance: 0.40 }],
    isRare: true,
  },
];

export type ActiveEnemy = EnemyType & { uid: string; hp: number; floorHp: number; floorAtk: number };

// ── フロアシステム ─────────────────────────────────────────────
const FLOOR_KEY = "rpg_floor";
export function getFloor(): number {
  if (typeof localStorage === "undefined") return 1;
  return parseInt(localStorage.getItem(FLOOR_KEY) ?? "1", 10);
}
export function advanceFloor(): number {
  const next = getFloor() + 1;
  localStorage.setItem(FLOOR_KEY, String(next));
  return next;
}

export function getFloorEnemyGroup(playerLevel: number, floor: number): ActiveEnemy[] {
  const isBoss = floor % 5 === 0;
  const normalEnemies = ENEMIES.filter(e => !e.isRare);
  const rareEnemies   = ENEMIES.filter(e => e.isRare);

  // 8%でレアモンスター単体（ボスフロアでは出現しない）
  if (!isBoss && rareEnemies.length > 0 && Math.random() < 0.08) {
    const base = rareEnemies[Math.floor(Math.random() * rareEnemies.length)];
    const hp = base.maxHp;
    return [{ ...base, uid: `${base.id}-0`, hp, floorHp: hp, floorAtk: base.attack }];
  }

  const pool = normalEnemies.filter(e => e.minLevel <= Math.max(1, playerLevel + Math.floor(floor / 4)));
  const base = isBoss ? pool[pool.length - 1] : pool[Math.floor(Math.random() * pool.length)];
  const count = isBoss ? 1 : Math.floor(Math.random() * 3) + 1;
  const hpMult  = 1 + (floor - 1) * 0.18 + (isBoss ? 1 : 0);
  const atkMult = 1 + (floor - 1) * 0.12;
  return Array.from({ length: count }, (_, i) => {
    const hp = Math.round(base.maxHp * hpMult);
    return { ...base, uid: `${base.id}-${i}`, hp, floorHp: hp, floorAtk: Math.round(base.attack * atkMult) };
  });
}

// ── プレイヤーステータス ──────────────────────────────────────
export type PlayerStats = {
  level: number; jobClass: JobClass;
  maxHp: number; maxMp: number;
  attack: number; defense: number; magic: number;
  speed: number;
  statusResist: number;
  craftEffect: CraftEffect;
};

export const JOB_BASE_SPEED: Record<JobClass, number> = {
  warrior: 9,
  mage:    11,
  cleric:  8,
  rogue:   16,
};

export function calcPlayerStats(
  level: number, jobClass: JobClass,
  weaponAtk = 0, weaponMag = 0, armorDef = 0, armorMag = 0, armorStatusResist = 0,
  craftEffect: CraftEffect = DEFAULT_CRAFT_EFFECT,
): PlayerStats {
  const s: PlayerStats = {
    level, jobClass,
    maxHp:   30 + level * 10,
    maxMp:   10 + level * 3,
    attack:   5 + level * 3 + weaponAtk,
    defense:  3 + level * 2 + armorDef,
    magic:    3 + level * 2 + weaponMag + armorMag,
    speed:    JOB_BASE_SPEED[jobClass] + Math.floor(level * 0.5) + craftEffect.speedBonus,
    statusResist: Math.min(0.95, 0.5 + armorStatusResist + craftEffect.extraStatusResist),
    craftEffect,
  };
  if (jobClass === "warrior") { s.attack += 6; s.defense += 4; s.maxHp += 10; }
  if (jobClass === "mage")    { s.magic  += 12 + level * 3; s.maxMp += 15 + level * 3; }
  if (jobClass === "cleric")  { s.maxHp  += 20; s.magic += 6; s.statusResist = Math.min(0.95, s.statusResist + 0.1); }
  if (jobClass === "rogue")   { s.attack += 4; s.maxMp += 8; }
  return s;
}

// ── 戦闘計算 ─────────────────────────────────────────────────
/** confuseなし: 5%ミス、confuseあり: 50%ミス */
export function tryHit(confused = false): boolean {
  return Math.random() >= (confused ? 0.50 : 0.05);
}

export function calcPhysicalDamage(atk: number, def: number, resistMult = 1): number {
  const base = Math.max(1, atk - def);
  const v = Math.max(1, Math.floor(base * 0.2));
  const raw = base + Math.floor(Math.random() * (v * 2 + 1)) - v;
  return Math.max(1, Math.round(raw * resistMult));
}

export function calcMagicDamage(magic: number, spell: Spell, enemyElement: Element, resistMult = 1): number {
  const base = Math.floor(magic * 0.7 + spell.power);
  const v = Math.max(1, Math.floor(base * 0.1));
  const raw = base + Math.floor(Math.random() * (v * 2 + 1)) - v;
  const eff = getEffectiveness(spell.element, enemyElement);
  return Math.max(1, Math.round(raw * eff * resistMult));
}

export function calcEnemySpellDamage(enemyMagic: number, spell: Spell): number {
  const base = Math.floor(enemyMagic * 0.6 + spell.power * 0.5);
  const v = Math.max(1, Math.floor(base * 0.15));
  return Math.max(1, base + Math.floor(Math.random() * (v * 2 + 1)) - v);
}

/** 毒のターンダメージ（最大HPの6%、最低1） */
export function calcPoisonDamage(maxHp: number): number {
  return Math.max(1, Math.round(maxHp * 0.06));
}
