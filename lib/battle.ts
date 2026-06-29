export type Element = "fire" | "water" | "wind" | "earth" | "none";
export type EnemyShape = "slime" | "bat" | "scorpion" | "golem" | "dragon";
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
  baseChance: number; // 基本成功率（耐性差し引き前）
  turns: number;
};

export type Spell = {
  id: string; name: string; element: Element;
  power: number; mpCost: number; minLevel: number;
  target: "single" | "all";
  lineId: string;
  effect?: SpellEffectDef; // 状態異常付与
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
export type EnemyType = {
  id: string; name: string;
  maxHp: number; attack: number; defense: number; magic: number;
  expReward: number; goldReward: number; minLevel: number;
  color: number; shape: EnemyShape; element: Element;
  physResist: number;
  magicResist: number;
  statusResist: Record<StatusEffect, number>; // 0〜1（0=無効, 1=確実にかかる）
  spellIds: string[];
};

export const ENEMIES: EnemyType[] = [
  {
    id: "slime", name: "スライム", maxHp: 12, attack: 4, defense: 1, magic: 0,
    expReward: 5, goldReward: 8, minLevel: 1,
    color: 0x3b82f6, shape: "slime", element: "water",
    physResist: 1, magicResist: 1,
    statusResist: { poison: 0.3, paralysis: 0.3, sleep: 0.2, confuse: 0.2 },
    spellIds: [],
  },
  {
    id: "bat", name: "ドラキー", maxHp: 22, attack: 8, defense: 2, magic: 10,
    expReward: 12, goldReward: 15, minLevel: 1,
    color: 0x7c3aed, shape: "bat", element: "wind",
    physResist: 1, magicResist: 1,
    statusResist: { poison: 0.4, paralysis: 0.4, sleep: 0.3, confuse: 0.3 },
    spellIds: ["bagi", "manusa"], // プレイヤーに混乱をかけてくる
  },
  {
    id: "scorpion", name: "おおさそり", maxHp: 40, attack: 14, defense: 6, magic: 0,
    expReward: 28, goldReward: 35, minLevel: 3,
    color: 0xd97706, shape: "scorpion", element: "earth",
    physResist: 1, magicResist: 1,
    statusResist: { poison: 0.9, paralysis: 0.5, sleep: 0.4, confuse: 0.5 }, // 毒ほぼ無効（自分が毒持ち）
    spellIds: ["dokudoku"], // 毒をかけてくる
  },
  {
    id: "golem", name: "ゴーレム", maxHp: 70, attack: 22, defense: 14, magic: 8,
    expReward: 55, goldReward: 70, minLevel: 5,
    color: 0x6b7280, shape: "golem", element: "earth",
    physResist: 0.25, magicResist: 1,
    statusResist: { poison: 1.0, paralysis: 0.9, sleep: 0.9, confuse: 0.6 }, // 石→毒・麻痺ほぼ無効
    spellIds: ["gira"],
  },
  {
    id: "dragon", name: "ドラゴン", maxHp: 130, attack: 38, defense: 22, magic: 30,
    expReward: 110, goldReward: 150, minLevel: 8,
    color: 0xdc2626, shape: "dragon", element: "fire",
    physResist: 1, magicResist: 0.45,
    statusResist: { poison: 0.8, paralysis: 0.8, sleep: 0.85, confuse: 0.7 }, // 竜→全体的に高耐性
    spellIds: ["merazoma", "rariho"], // 眠りをかけてくる
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
  const pool = ENEMIES.filter((e) => e.minLevel <= Math.max(1, playerLevel + Math.floor(floor / 4)));
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
  statusResist: number; // 0〜1（防具込みの状態異常耐性）
};

export function calcPlayerStats(
  level: number, jobClass: JobClass,
  weaponAtk = 0, weaponMag = 0, armorDef = 0, armorMag = 0, armorStatusResist = 0
): PlayerStats {
  const s: PlayerStats = {
    level, jobClass,
    maxHp:   30 + level * 10,
    maxMp:   10 + level * 3,
    attack:   5 + level * 3 + weaponAtk,
    defense:  3 + level * 2 + armorDef,
    magic:    3 + level * 2 + weaponMag + armorMag,
    statusResist: Math.min(0.95, 0.5 + armorStatusResist), // 素50%、最大95%
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
