export type Element = "fire" | "water" | "wind" | "earth" | "none";
export type EnemyShape = "slime" | "bat" | "scorpion" | "golem" | "dragon";
export type JobClass = "warrior" | "mage" | "cleric" | "rogue";

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

// ── 呪文（進化ライン別に定義） ──────────────────────────────
export type Spell = {
  id: string; name: string; element: Element;
  power: number; mpCost: number; minLevel: number;
  target: "single" | "all";
  lineId: string; // 同じラインの呪文をグループ化
};

export const SPELLS: Spell[] = [
  // 🔥 火ライン
  { id: "mera",      name: "メラ",       element: "fire",  power: 28,  mpCost: 4,  minLevel: 1,  target: "single", lineId: "fire"  },
  { id: "merami",    name: "メラミ",     element: "fire",  power: 65,  mpCost: 9,  minLevel: 5,  target: "single", lineId: "fire"  },
  { id: "merazoma",  name: "メラゾーマ", element: "fire",  power: 120, mpCost: 16, minLevel: 10, target: "single", lineId: "fire"  },
  // 💧 氷ライン
  { id: "hyado",     name: "ヒャド",     element: "water", power: 26,  mpCost: 4,  minLevel: 1,  target: "single", lineId: "water" },
  { id: "hyadaruko", name: "ヒャダルコ", element: "water", power: 62,  mpCost: 9,  minLevel: 5,  target: "single", lineId: "water" },
  { id: "mahyado",   name: "マヒャド",   element: "water", power: 115, mpCost: 15, minLevel: 10, target: "single", lineId: "water" },
  // 🌪️ 風ライン
  { id: "bagi",      name: "バギ",       element: "wind",  power: 24,  mpCost: 3,  minLevel: 1,  target: "single", lineId: "wind"  },
  { id: "bagima",    name: "バギマ",     element: "wind",  power: 55,  mpCost: 8,  minLevel: 4,  target: "all",    lineId: "wind"  },
  { id: "baguross",  name: "バギクロス", element: "wind",  power: 100, mpCost: 14, minLevel: 9,  target: "all",    lineId: "wind"  },
  // 🌍 土ライン
  { id: "gira",      name: "ギラ",       element: "earth", power: 26,  mpCost: 4,  minLevel: 2,  target: "single", lineId: "earth" },
  { id: "begirama",  name: "べギラマ",   element: "earth", power: 60,  mpCost: 9,  minLevel: 6,  target: "all",    lineId: "earth" },
  { id: "begiragon", name: "べギラゴン", element: "earth", power: 110, mpCost: 14, minLevel: 11, target: "all",    lineId: "earth" },
  // ⚡ 無属性
  { id: "raiden",    name: "ライデイン",  element: "none",  power: 80,  mpCost: 13, minLevel: 8,  target: "all",    lineId: "none"  },
  { id: "gigabreak", name: "ギガブレイク",element: "none",  power: 150, mpCost: 22, minLevel: 15, target: "all",    lineId: "none"  },
];

/** 各ラインで最高ティアの呪文のみ返す（進化済み）+ 全解放済み */
export function getAvailableSpells(level: number, jobClass: JobClass): Spell[] {
  const bonus = jobClass === "mage" ? 2 : 0;
  const effectiveLevel = level + bonus;
  const unlocked = SPELLS.filter((s) => s.minLevel <= effectiveLevel);

  // 同ラインで最高ティアだけ残す（低ティアは進化で消える）
  const bestPerLine: Map<string, Spell> = new Map();
  for (const s of unlocked) {
    const cur = bestPerLine.get(s.lineId);
    if (!cur || s.minLevel > cur.minLevel) bestPerLine.set(s.lineId, s);
  }
  return Array.from(bestPerLine.values());
}

// ── 敵定義 ────────────────────────────────────────────────────
export type EnemyType = {
  id: string; name: string;
  maxHp: number; attack: number; defense: number; magic: number;
  expReward: number; goldReward: number; minLevel: number;
  color: number; shape: EnemyShape; element: Element;
  physResist: number;  // 物理ダメージ倍率 (1=通常, 0.3=70%カット)
  magicResist: number; // 魔法ダメージ倍率 (1=通常, 0.3=70%軽減)
  spellIds: string[];  // 使える呪文ID
};

export const ENEMIES: EnemyType[] = [
  {
    id: "slime", name: "スライム", maxHp: 12, attack: 4, defense: 1, magic: 0,
    expReward: 5, goldReward: 8, minLevel: 1,
    color: 0x3b82f6, shape: "slime", element: "water",
    physResist: 1, magicResist: 1, spellIds: [],
  },
  {
    id: "bat", name: "ドラキー", maxHp: 22, attack: 8, defense: 2, magic: 10,
    expReward: 12, goldReward: 15, minLevel: 1,
    color: 0x7c3aed, shape: "bat", element: "wind",
    physResist: 1, magicResist: 1, spellIds: ["bagi"],
  },
  {
    id: "scorpion", name: "おおさそり", maxHp: 40, attack: 14, defense: 6, magic: 0,
    expReward: 28, goldReward: 35, minLevel: 3,
    color: 0xd97706, shape: "scorpion", element: "earth",
    physResist: 1, magicResist: 1, spellIds: [],
  },
  {
    id: "golem", name: "ゴーレム", maxHp: 70, attack: 22, defense: 14, magic: 8,
    expReward: 55, goldReward: 70, minLevel: 5,
    color: 0x6b7280, shape: "golem", element: "earth",
    // 石の体→物理ほぼカット、魔法には普通
    physResist: 0.25, magicResist: 1, spellIds: ["gira"],
  },
  {
    id: "dragon", name: "ドラゴン", maxHp: 130, attack: 38, defense: 22, magic: 30,
    expReward: 110, goldReward: 150, minLevel: 8,
    color: 0xdc2626, shape: "dragon", element: "fire",
    // 竜鱗→魔法を半減、物理は通常
    physResist: 1, magicResist: 0.45, spellIds: ["merazoma"],
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

function floorScale(base: number, floor: number, rate: number): number {
  return Math.round(base * (1 + (floor - 1) * rate));
}

export function getFloorEnemyGroup(playerLevel: number, floor: number): ActiveEnemy[] {
  const isBoss = floor % 5 === 0;
  const pool = ENEMIES.filter((e) => e.minLevel <= Math.max(1, playerLevel + Math.floor(floor / 4)));

  let base: EnemyType;
  let count: number;

  if (isBoss) {
    base = pool[pool.length - 1];
    count = 1;
  } else {
    base = pool[Math.floor(Math.random() * pool.length)];
    count = Math.floor(Math.random() * 3) + 1;
  }

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
};

export function calcPlayerStats(
  level: number, jobClass: JobClass,
  weaponAtk = 0, weaponMag = 0, armorDef = 0, armorMag = 0
): PlayerStats {
  const s: PlayerStats = {
    level, jobClass,
    maxHp:   30 + level * 10,
    maxMp:   10 + level * 3,
    attack:   5 + level * 3 + weaponAtk,
    defense:  3 + level * 2 + armorDef,
    magic:    3 + level * 2 + weaponMag + armorMag,
  };
  if (jobClass === "warrior") { s.attack += 6; s.defense += 4; s.maxHp += 10; }
  if (jobClass === "mage")    { s.magic  += 12 + level * 3; s.maxMp += 15 + level * 3; }
  if (jobClass === "cleric")  { s.maxHp  += 20; s.magic += 6; }
  if (jobClass === "rogue")   { s.attack += 4; s.maxMp += 8; }
  return s;
}

// ── 戦闘計算 ─────────────────────────────────────────────────
/** 5%の確率でミス */
export function tryHit(): boolean {
  return Math.random() >= 0.05;
}

export function calcPhysicalDamage(atk: number, def: number, resistMult = 1): number {
  const base = Math.max(1, atk - def);
  const v    = Math.max(1, Math.floor(base * 0.2));
  const raw  = base + Math.floor(Math.random() * (v * 2 + 1)) - v;
  return Math.max(1, Math.round(raw * resistMult));
}

export function calcMagicDamage(magic: number, spell: Spell, enemyElement: Element, resistMult = 1): number {
  const base = Math.floor(magic * 0.7 + spell.power);
  const v    = Math.max(1, Math.floor(base * 0.1));
  const raw  = base + Math.floor(Math.random() * (v * 2 + 1)) - v;
  const eff  = getEffectiveness(spell.element, enemyElement);
  return Math.max(1, Math.round(raw * eff * resistMult));
}

export function calcEnemySpellDamage(enemyMagic: number, spell: Spell): number {
  const base = Math.floor(enemyMagic * 0.6 + spell.power * 0.5);
  const v    = Math.max(1, Math.floor(base * 0.15));
  return Math.max(1, base + Math.floor(Math.random() * (v * 2 + 1)) - v);
}
