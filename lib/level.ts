// レベルが上がるごとに必要EXPも増えていく成長カーブ
// Lv.1→2: 100EXP、以降1レベルごとに+15EXPずつ必要量が増加
const BASE_EXP = 100;
const EXP_GROWTH_PER_LEVEL = 15;

export function expRequiredForLevel(level: number): number {
  return BASE_EXP + (level - 1) * EXP_GROWTH_PER_LEVEL;
}

export function calcLevel(totalPoints: number): number {
  let level = 1;
  let remaining = totalPoints;
  while (remaining >= expRequiredForLevel(level)) {
    remaining -= expRequiredForLevel(level);
    level++;
  }
  return level;
}

export function calcExp(totalPoints: number): number {
  let level = 1;
  let remaining = totalPoints;
  while (remaining >= expRequiredForLevel(level)) {
    remaining -= expRequiredForLevel(level);
    level++;
  }
  return remaining;
}

export function calcExpNeeded(level: number): number {
  return expRequiredForLevel(level);
}

const LAST_LEVEL_KEY = "rpg_last_seen_level";

// 節目レベル（5の倍数）に到達するたびに見た目の変わる演出を出す
export const MILESTONE_LEVEL_INTERVAL = 5;

export type LevelUpResult = { leveledUp: boolean; newLevel: number; isMilestone: boolean };

export function checkLevelUp(newLevel: number): LevelUpResult {
  if (typeof window === "undefined") return { leveledUp: false, newLevel, isMilestone: false };
  const last = parseInt(localStorage.getItem(LAST_LEVEL_KEY) ?? String(newLevel), 10);
  localStorage.setItem(LAST_LEVEL_KEY, String(newLevel));
  if (newLevel > last) {
    const isMilestone = newLevel % MILESTONE_LEVEL_INTERVAL === 0;
    return { leveledUp: true, newLevel, isMilestone };
  }
  return { leveledUp: false, newLevel, isMilestone: false };
}
