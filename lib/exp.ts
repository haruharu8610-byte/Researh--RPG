/** 自習1分あたりに加算されるEXP倍率 */
export const STUDY_EXP_PER_MINUTE = 10;

const BATTLE_EXP_KEY = "rpg_battle_exp";

/** バトルで稼いだ累計EXP（タスク・自習とは別枠でローカル保存） */
export function getBattleExp(): number {
  if (typeof localStorage === "undefined") return 0;
  return parseInt(localStorage.getItem(BATTLE_EXP_KEY) ?? "0", 10);
}

export function addBattleExp(amount: number): number {
  const next = getBattleExp() + amount;
  localStorage.setItem(BATTLE_EXP_KEY, String(next));
  return next;
}

/** タスク達成ポイント・自習時間・学習ダンジョンEXPを合算した総ポイント（レベル算出に使用） */
export function calcTotalPoints(stats: { totalPoints?: number; studyTotalMinutes?: number }): number {
  return (stats.totalPoints ?? 0) + (stats.studyTotalMinutes ?? 0) * STUDY_EXP_PER_MINUTE + getBattleExp();
}
