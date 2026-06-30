import { supabase } from "@/lib/supabase";
import type { JobClass } from "@/components/GameCanvas";

export type PlayerState = {
  user_id: string;
  display_name: string;
  level: number;
  job_class: JobClass;
  weapon_id: string | null;
  armor_id: string | null;
  floor: number;
  updated_at: string;
};

/** 自分の現在の状態をサーバーへ反映する（ランキング用）。 */
export async function syncPlayerState(state: {
  level: number;
  jobClass: JobClass;
  weaponId: string | null;
  armorId: string | null;
  floor: number;
}): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const displayName = session.user.email?.split("@")[0] ?? "プレイヤー";

  await supabase.from("player_state").upsert({
    user_id: session.user.id,
    display_name: displayName,
    level: state.level,
    job_class: state.jobClass,
    weapon_id: state.weaponId,
    armor_id: state.armorId,
    floor: state.floor,
    updated_at: new Date().toISOString(),
  });
}

export async function fetchRanking(): Promise<PlayerState[]> {
  const { data } = await supabase
    .from("player_state")
    .select("*")
    .order("level", { ascending: false })
    .order("floor", { ascending: false });
  return (data as PlayerState[]) ?? [];
}

/** ランキングのリアルタイム更新を購読する。クリーンアップ関数を返す。 */
export function subscribeRanking(onChange: () => void): () => void {
  const channel = supabase
    .channel("player-state-ranking")
    .on("postgres_changes", { event: "*", schema: "public", table: "player_state" }, onChange)
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
