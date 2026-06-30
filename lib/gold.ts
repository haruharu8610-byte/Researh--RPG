const GOLD_KEY         = "rpg_gold";
const LAST_LOGIN_KEY   = "rpg_last_login";
const LAST_COMPLETED_KEY = "rpg_last_completed";

export function getGold(): number {
  return parseInt(localStorage.getItem(GOLD_KEY) ?? "0", 10);
}

export function addGold(amount: number): number {
  const next = getGold() + amount;
  localStorage.setItem(GOLD_KEY, String(next));
  return next;
}

export function spendGold(amount: number): boolean {
  const cur = getGold();
  if (cur < amount) return false;
  localStorage.setItem(GOLD_KEY, String(cur - amount));
  return true;
}

const LOGIN_STREAK_KEY = "rpg_login_streak";
const MAX_LOGIN_STREAK = 7;
const LOGIN_BONUS_PER_DAY = 50;

export function getLoginStreak(): number {
  return parseInt(localStorage.getItem(LOGIN_STREAK_KEY) ?? "0", 10);
}

/**
 * ログインボーナス。当日初回のみ付与。連続ログインするほどGが増え、最大7日で頭打ち。
 * 連続が途切れたら1日目からやり直し。0なら本日分は受け取り済み。
 */
export function checkLoginBonus(): number {
  const today = new Date().toDateString();
  const lastLogin = localStorage.getItem(LAST_LOGIN_KEY);
  if (lastLogin === today) return 0;

  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const prevStreak = getLoginStreak();
  const streak = lastLogin === yesterday ? Math.min(MAX_LOGIN_STREAK, prevStreak + 1) : 1;

  localStorage.setItem(LAST_LOGIN_KEY, today);
  localStorage.setItem(LOGIN_STREAK_KEY, String(streak));

  const bonus = LOGIN_BONUS_PER_DAY * streak;
  addGold(bonus);
  return bonus;
}

/** タスク完了ボーナス。新たに完了したタスク1件につき40G。 */
export function checkTaskBonus(completedCount: number): number {
  const last = parseInt(localStorage.getItem(LAST_COMPLETED_KEY) ?? "0", 10);
  if (completedCount <= last) return 0;
  const diff = completedCount - last;
  localStorage.setItem(LAST_COMPLETED_KEY, String(completedCount));
  const gold = diff * 40;
  addGold(gold);
  return gold;
}

// ── ゴールドダンジョン：1日の挑戦回数制限 ──────────────────────
const GOLD_DUNGEON_DATE_KEY  = "rpg_gold_dungeon_date";
const GOLD_DUNGEON_USES_KEY  = "rpg_gold_dungeon_uses";
export const GOLD_DUNGEON_DAILY_LIMIT = 3;

function resetGoldDungeonIfNewDay(): void {
  const today = new Date().toDateString();
  if (localStorage.getItem(GOLD_DUNGEON_DATE_KEY) !== today) {
    localStorage.setItem(GOLD_DUNGEON_DATE_KEY, today);
    localStorage.setItem(GOLD_DUNGEON_USES_KEY, "0");
  }
}

export function getGoldDungeonUsesLeft(): number {
  resetGoldDungeonIfNewDay();
  const used = parseInt(localStorage.getItem(GOLD_DUNGEON_USES_KEY) ?? "0", 10);
  return Math.max(0, GOLD_DUNGEON_DAILY_LIMIT - used);
}

/** ゴールドダンジョンの挑戦回数を1消費する。残り0なら false を返す。 */
export function consumeGoldDungeonUse(): boolean {
  resetGoldDungeonIfNewDay();
  const used = parseInt(localStorage.getItem(GOLD_DUNGEON_USES_KEY) ?? "0", 10);
  if (used >= GOLD_DUNGEON_DAILY_LIMIT) return false;
  localStorage.setItem(GOLD_DUNGEON_USES_KEY, String(used + 1));
  return true;
}

const LAST_STUDY_MINUTES_KEY = "rpg_last_study_minutes";

/** 自習ボーナス。新たに増えた自習時間1分につき1G。 */
export function checkStudyBonus(totalMinutes: number): number {
  const last = parseInt(localStorage.getItem(LAST_STUDY_MINUTES_KEY) ?? "0", 10);
  if (totalMinutes <= last) return 0;
  const diff = totalMinutes - last;
  localStorage.setItem(LAST_STUDY_MINUTES_KEY, String(totalMinutes));
  addGold(diff);
  return diff;
}
