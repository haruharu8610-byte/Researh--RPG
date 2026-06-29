export type EnemyShape = "slime" | "bat" | "scorpion" | "golem" | "dragon";

export type EnemyType = {
  id: string;
  name: string;
  maxHp: number;
  attack: number;
  defense: number;
  expReward: number;
  minLevel: number;
  color: number;
  shape: EnemyShape;
};

export const ENEMIES: EnemyType[] = [
  { id: "slime",    name: "スライム",   maxHp: 12,  attack: 4,  defense: 1,  expReward: 5,   minLevel: 1, color: 0x3b82f6, shape: "slime"    },
  { id: "bat",      name: "ドラキー",   maxHp: 22,  attack: 8,  defense: 2,  expReward: 12,  minLevel: 1, color: 0x7c3aed, shape: "bat"      },
  { id: "scorpion", name: "おおさそり", maxHp: 40,  attack: 14, defense: 6,  expReward: 28,  minLevel: 3, color: 0xd97706, shape: "scorpion" },
  { id: "golem",    name: "ゴーレム",   maxHp: 70,  attack: 22, defense: 14, expReward: 55,  minLevel: 5, color: 0x6b7280, shape: "golem"    },
  { id: "dragon",   name: "ドラゴン",   maxHp: 130, attack: 38, defense: 22, expReward: 110, minLevel: 8, color: 0xdc2626, shape: "dragon"   },
];

export type JobClass = "warrior" | "mage" | "cleric" | "rogue";

export type PlayerStats = {
  level: number;
  jobClass: JobClass;
  maxHp: number;
  maxMp: number;
  attack: number;
  defense: number;
  magic: number;
};

export function calcPlayerStats(level: number, jobClass: JobClass): PlayerStats {
  const stats: PlayerStats = {
    level,
    jobClass,
    maxHp:    30 + level * 10,
    maxMp:    10 + level * 3,
    attack:   5  + level * 3,
    defense:  3  + level * 2,
    magic:    3  + level * 2,
  };
  if (jobClass === "warrior") { stats.attack += 6; stats.defense += 4; stats.maxHp += 10; }
  if (jobClass === "mage")    { stats.magic  += 12 + level * 3; stats.maxMp += 15 + level * 3; }
  if (jobClass === "cleric")  { stats.maxHp  += 20; stats.magic += 6; }
  if (jobClass === "rogue")   { stats.attack += 4; stats.maxMp += 8; }
  return stats;
}

export function getRandomEnemy(level: number): EnemyType {
  const pool = ENEMIES.filter((e) => e.minLevel <= level);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function calcPhysicalDamage(atk: number, def: number): number {
  const base = Math.max(1, atk - def);
  const variance = Math.max(1, Math.floor(base * 0.2));
  return base + Math.floor(Math.random() * (variance * 2 + 1)) - variance;
}

export function calcMagicDamage(magic: number): number {
  const base = Math.floor(magic * 1.5);
  const variance = Math.floor(base * 0.15);
  return base + Math.floor(Math.random() * (variance * 2 + 1)) - variance;
}
