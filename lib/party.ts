import type { JobClass } from "@/lib/battle";

export type PartyMemberData = {
  id: string;
  name: string;
  jobClass: JobClass;
};

export type AvailableCompanion = PartyMemberData & {
  cost: number;
  description: string;
  emoji: string;
};

export const COMPANIONS: AvailableCompanion[] = [
  { id: "gordon", name: "ゴードン", jobClass: "warrior", cost: 500,  description: "剣と盾の戦士。高い防御力で前線を支える。", emoji: "⚔️" },
  { id: "sara",   name: "サラ",    jobClass: "mage",    cost: 800,  description: "魔法使いの少女。多彩な呪文で敵を攻撃する。", emoji: "🔮" },
  { id: "agnes",  name: "アニエス", jobClass: "cleric",  cost: 650,  description: "回復の僧侶。仲間のHPを自動で回復する。", emoji: "✨" },
  { id: "lyle",   name: "ライル",  jobClass: "rogue",   cost: 700,  description: "俊足の盗賊。素早さが高くいつも先手を取る。", emoji: "🗡️" },
];

const PARTY_KEY = "rpg_party";

export function getParty(): PartyMemberData[] {
  if (typeof localStorage === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(PARTY_KEY) ?? "[]"); }
  catch { return []; }
}

export function isInParty(id: string): boolean {
  return getParty().some(m => m.id === id);
}

export function addPartyMember(member: PartyMemberData): void {
  const party = getParty();
  if (party.length >= 2) return;
  if (party.some(m => m.id === member.id)) return;
  party.push(member);
  localStorage.setItem(PARTY_KEY, JSON.stringify(party));
}

export function removePartyMember(id: string): void {
  const party = getParty().filter(m => m.id !== id);
  localStorage.setItem(PARTY_KEY, JSON.stringify(party));
}
