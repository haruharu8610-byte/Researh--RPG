/** 毎月1日〜7日をガチャ・ドロップ等のフェス期間とする */
export function isFestivalActive(date: Date = new Date()): boolean {
  return date.getDate() <= 7;
}
