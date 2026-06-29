export type Element = "fire" | "water" | "wind" | "earth" | "none";
export type EnemyShape = "slime" | "bat" | "scorpion" | "golem" | "dragon";
export type JobClass = "warrior" | "mage" | "cleric" | "rogue";

// fire > wind > earth > water > fire (循環)
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

export type Spell = {
  id: string; name: string; element: Element;
  power: number; mpCost: number; minLevel: number;
  target: "single" | "all";
};

export const SPELLS: Spell[] = [
  { id: "mera",      name: "メラ",       element: "fire",  power: 28, mpCost: 4,  minLevel: 1, target: "single" },
  { id: "hyado",     name: "ヒャド",     element: "water", power: 26, mpCost: 4,  minLevel: 1, target: "single" },
  { id: "bagi",      name: "バギ",       element: "wind",  power: 24, mpCost: 3,  minLevel: 1, target: "single" },
  { id: "gigira",    name: "ギガジラ",   element: "earth", power: 26, mpCost: 4,  minLevel: 2, target: "single" },
  { id: "merado",    name: "メラゾーマ", element: "fire",  power: 65, mpCost: 10, minLevel: 5, target: "single" },
  { id: "mahyado",   name: "マヒャド",   element: "water", power: 70, mpCost: 12, minLevel: 6, target: "single" },
  { id: "baguross",  name: "バギクロス", element: "wind",  power: 48, mpCost: 8,  minLevel: 4, target: "all"    },
  { id: "gigicross", name: "ギガクロス", element: "earth", power: 52, mpCost: 9,  minLevel: 5, target: "all"    },
  { id: "raiden",    name: "ライデイン", element: "none",  power: 80, mpCost: 15, minLevel: 8, target: "all"    },
];

export function getAvailableSpells(level: number, jobClass: JobClass): Spell[] {
  const bonus = jobClass === "mage" ? 2 : 0;
  return SPELLS.filter((s) => s.minLevel <= level + bonus);
}

export type EnemyType = {
  id: string; name: string;
  maxHp: number; attack: number; defense: number;
  expReward: number; goldReward: number; minLevel: number;
  color: number; shape: EnemyShape; element: Element;
};

export const ENEMIES: EnemyType[] = [
  { id: "slime",    name: "スライム",   maxHp: 12,  attack: 4,  defense: 1,  expReward: 5,   goldReward: 8,   minLevel: 1, color: 0x3b82f6, shape: "slime",    element: "water" },
  { id: "bat",      name: "ドラキー",   maxHp: 22,  attack: 8,  defense: 2,  expReward: 12,  goldReward: 15,  minLevel: 1, color: 0x7c3aed, shape: "bat",      element: "wind"  },
  { id: "scorpion", name: "おおさそり", maxHp: 40,  attack: 14, defense: 6,  expReward: 28,  goldReward: 35,  minLevel: 3, color: 0xd97706, shape: "scorpion", element: "earth" },
  { id: "golem",    name: "ゴーレム",   maxHp: 70,  attack: 22, defense: 14, expReward: 55,  goldReward: 70,  minLevel: 5, color: 0x6b7280, shape: "golem",    element: "earth" },
  { id: "dragon",   name: "ドラゴン",   maxHp: 130, attack: 38, defense: 22, expReward: 110, goldReward: 150, minLevel: 8, color: 0xdc2626, shape: "dragon",   element: "fire"  },
];

export type ActiveEnemy = EnemyType & { uid: string; hp: number };

export function getRandomEnemyGroup(level: number): ActiveEnemy[] {
  const pool = ENEMIES.filter((e) => e.minLevel <= level);
  const base = pool[Math.floor(Math.random() * pool.length)];
  const count = Math.floor(Math.random() * 3) + 1;
  return Array.from({ length: count }, (_, i) => ({
    ...base,
    uid: `${base.id}-${i}`,
    hp: base.maxHp,
  }));
}

export type PlayerStats = {
  level: number; jobClass: JobClass;
  maxHp: number; maxMp: number;
  attack: number; defense: number; magic: number;
};

export function calcPlayerStats(
  level: number, jobClass: JobClass,
  weaponAtk: number = 0, weaponMag: number = 0, armorDef: number = 0, armorMag: number = 0
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

export function calcPhysicalDamage(atk: number, def: number): number {
  const base = Math.max(1, atk - def);
  const v = Math.max(1, Math.floor(base * 0.2));
  return base + Math.floor(Math.random() * (v * 2 + 1)) - v;
}

export function calcMagicDamage(magic: number, spell: Spell, enemyElement: Element): number {
  const base = Math.floor(magic * 0.8 + spell.power);
  const v = Math.max(1, Math.floor(base * 0.1));
  const raw = base + Math.floor(Math.random() * (v * 2 + 1)) - v;
  return Math.floor(raw * getEffectiveness(spell.element, enemyElement));
}
