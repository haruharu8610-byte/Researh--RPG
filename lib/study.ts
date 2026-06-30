import { addGold } from "@/lib/gold";

// ── ① 自習の継続ボーナス（連続日数） ──────────────────────────
const STUDY_STREAK_KEY = "rpg_study_streak";
const LAST_STUDY_DATE_KEY = "rpg_last_study_date";
export const MAX_STUDY_STREAK = 7;
const STUDY_STREAK_GOLD_PER_DAY = 50;

export function getStudyStreak(): number {
  if (typeof localStorage === "undefined") return 0;
  return parseInt(localStorage.getItem(STUDY_STREAK_KEY) ?? "0", 10);
}

export type StudyStreakResult = { streak: number; bonus: number };

/** その日初めて自習時間が増えた時に呼ぶ。連続日数を更新してGを付与する */
export function checkStudyStreak(): StudyStreakResult {
  const today = new Date().toDateString();
  const lastDate = localStorage.getItem(LAST_STUDY_DATE_KEY);
  if (lastDate === today) return { streak: getStudyStreak(), bonus: 0 };
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const prev = getStudyStreak();
  const streak = lastDate === yesterday ? Math.min(MAX_STUDY_STREAK, prev + 1) : 1;
  localStorage.setItem(LAST_STUDY_DATE_KEY, today);
  localStorage.setItem(STUDY_STREAK_KEY, String(streak));
  const bonus = STUDY_STREAK_GOLD_PER_DAY * streak;
  addGold(bonus);
  return { streak, bonus };
}

// ── ② 学習マイルストーン（称号＋恒久ステータスボーナス） ────────
export type StudyMilestone = { minutes: number; title: string; bonus: { attack: number; defense: number; magic: number } };

export const STUDY_MILESTONES: StudyMilestone[] = [
  { minutes: 60,   title: "見習い研究者", bonus: { attack: 2,  defense: 2,  magic: 2  } },
  { minutes: 300,  title: "熱心な研究者", bonus: { attack: 5,  defense: 5,  magic: 5  } },
  { minutes: 600,  title: "努力の研究者", bonus: { attack: 8,  defense: 8,  magic: 8  } },
  { minutes: 1500, title: "歴戦の研究者", bonus: { attack: 12, defense: 12, magic: 12 } },
  { minutes: 3000, title: "伝説の研究者", bonus: { attack: 20, defense: 20, magic: 20 } },
];

export function getCurrentMilestone(totalMinutes: number): StudyMilestone | null {
  let cur: StudyMilestone | null = null;
  for (const m of STUDY_MILESTONES) if (totalMinutes >= m.minutes) cur = m;
  return cur;
}

export function getMilestoneBonus(totalMinutes: number): { attack: number; defense: number; magic: number } {
  return getCurrentMilestone(totalMinutes)?.bonus ?? { attack: 0, defense: 0, magic: 0 };
}

const CLAIMED_MILESTONES_KEY = "rpg_claimed_study_milestones";
function getClaimedMilestones(): number[] {
  if (typeof localStorage === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(CLAIMED_MILESTONES_KEY) ?? "[]"); } catch { return []; }
}

export type MilestoneReward = { title: string; bonusGold: number };

/** 新たに到達したマイルストーンを検出し、未受け取り分のGをまとめて付与する */
export function checkStudyMilestones(totalMinutes: number): MilestoneReward[] {
  const claimed = getClaimedMilestones();
  const rewards: MilestoneReward[] = [];
  for (const m of STUDY_MILESTONES) {
    if (totalMinutes >= m.minutes && !claimed.includes(m.minutes)) {
      claimed.push(m.minutes);
      const bonusGold = m.minutes * 5;
      addGold(bonusGold);
      rewards.push({ title: m.title, bonusGold });
    }
  }
  if (rewards.length) localStorage.setItem(CLAIMED_MILESTONES_KEY, JSON.stringify(claimed));
  return rewards;
}

// ── ③ 学習ダンジョン用チケット ───────────────────────────────
const STUDY_TICKETS_KEY = "rpg_study_tickets";
const STUDY_TICKET_PROGRESS_KEY = "rpg_study_ticket_progress";
export const MINUTES_PER_TICKET = 30;

export function getStudyTickets(): number {
  if (typeof localStorage === "undefined") return 0;
  return parseInt(localStorage.getItem(STUDY_TICKETS_KEY) ?? "0", 10);
}

/** 新たに増えた自習分数からチケットを付与する（30分で1枚、端数は繰り越し） */
export function grantStudyTickets(newMinutes: number): number {
  if (newMinutes <= 0) return 0;
  const progress = parseInt(localStorage.getItem(STUDY_TICKET_PROGRESS_KEY) ?? "0", 10) + newMinutes;
  const earned = Math.floor(progress / MINUTES_PER_TICKET);
  localStorage.setItem(STUDY_TICKET_PROGRESS_KEY, String(progress % MINUTES_PER_TICKET));
  if (earned > 0) localStorage.setItem(STUDY_TICKETS_KEY, String(getStudyTickets() + earned));
  return earned;
}

export function consumeStudyTicket(): boolean {
  const cur = getStudyTickets();
  if (cur <= 0) return false;
  localStorage.setItem(STUDY_TICKETS_KEY, String(cur - 1));
  return true;
}
