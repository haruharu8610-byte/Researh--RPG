import { DEFAULT_CRAFT_EFFECT, mergeCraftEffect, type CraftEffect, type SpecialEffect } from "@/lib/rarity";
import type { Rarity } from "@/lib/rarity";
import type { StatusEffect, Element } from "@/lib/battle";

export type ItemCategory = "weapon" | "armor" | "potion" | "ether" | "throwable";

/** レジェンド武器専用の必殺技。バトル中1回のみ使用可能 */
export type UltimateSkill = {
  name: string;
  description: string;
  kind: "nuke_single" | "nuke_all" | "revive_heal" | "support_buff";
  power?: number;
  buffType?: "atk_up" | "def_up" | "speed_up";
  buffFactor?: number;
};

export type ShopItem = {
  id: string; name: string; category: ItemCategory; cost: number; description: string;
  attackBonus?: number; defenseBonus?: number; magicBonus?: number;
  hpRestore?: number; mpRestore?: number;
  statusResist?: number;
  rarity?: Rarity;
  specialEffect?: SpecialEffect;
  /** 敵に投げて使うアイテム用：固定ダメージ・状態異常付与 */
  damage?: number;
  enemyStatus?: { status: StatusEffect; baseChance: number; turns: number };
  /** フェス限定：通常ショップには並ばず、フェス期間のガチャでのみ排出 */
  festivalOnly?: boolean;
  /** 武器の属性。一致する属性の「わざ」を使うとダメージが上がる */
  element?: Element;
  /** シリーズ名。武器と防具で同じシリーズを揃えるとセットボーナス */
  series?: string;
  /** レジェンド武器の専用必殺技（バトル中1回のみ） */
  ultimate?: UltimateSkill;
};

export const SHOP_ITEMS: ShopItem[] = [
  // ── 武器 ───────────────────────────────────────────────────
  { id: "wooden_sword",  name: "木の剣",           category: "weapon", cost: 100,  description: "粗末な木製の剣",           attackBonus: 5,  rarity: "common"   },
  { id: "bronze_knife",  name: "どうのナイフ",     category: "weapon", cost: 180,  description: "青銅製の素早い短剣",       attackBonus: 8,  rarity: "common"   },
  { id: "iron_sword",    name: "鉄の剣",           category: "weapon", cost: 300,  description: "しっかりした鉄の剣",       attackBonus: 12, rarity: "common"   },
  { id: "battle_axe",   name: "バトルアックス",    category: "weapon", cost: 500,  description: "重くて強力な戦斧",         attackBonus: 18, rarity: "uncommon", element: "earth" },
  { id: "steel_sword",   name: "鋼の剣",           category: "weapon", cost: 700,  description: "切れ味鋭い鋼の剣",         attackBonus: 22, rarity: "uncommon" },
  { id: "magic_staff",   name: "まほうの杖",       category: "weapon", cost: 500,  description: "魔力を高める杖",           attackBonus: 5,  magicBonus: 18, rarity: "uncommon" },
  { id: "wind_spear",    name: "かぜのやり",       category: "weapon", cost: 850,  description: "風を切る速さの槍",         attackBonus: 20, magicBonus: 8, rarity: "uncommon", element: "wind" },
  { id: "holy_staff",    name: "せいなる杖",       category: "weapon", cost: 1200, description: "神聖な力を宿す杖",         attackBonus: 8,  magicBonus: 35, rarity: "rare"    },
  { id: "thunder_blade", name: "らいじんのつるぎ", category: "weapon", cost: 1500, description: "雷を纏う剣",               attackBonus: 32, magicBonus: 12, rarity: "rare", element: "wind" },
  { id: "dark_blade",    name: "やみのつるぎ",     category: "weapon", cost: 1800, description: "闇の力を持つ呪いの剣",     attackBonus: 38, magicBonus: 10, rarity: "rare"    },
  { id: "dragon_sword",  name: "ドラゴンのつるぎ", category: "weapon", cost: 2000, description: "竜の力を宿す最強の剣",     attackBonus: 45, rarity: "epic", element: "fire", series: "dragon" },
  { id: "sage_staff",    name: "けんじゃのつえ",   category: "weapon", cost: 3000, description: "賢者が使う最高の魔法の杖", attackBonus: 15, magicBonus: 55, rarity: "epic", series: "sage"    },
  { id: "war_hammer",    name: "ウォーハンマー",   category: "weapon", cost: 1100, description: "両手で振るう巨大な槌",     attackBonus: 28, rarity: "rare", element: "earth" },
  { id: "twin_dagger",   name: "ツインダガー",     category: "weapon", cost: 950,  description: "二刀流の短剣。手数で攻める", attackBonus: 26, magicBonus: 4, rarity: "rare", element: "wind" },
  { id: "storm_bow",     name: "あらしの弓",       category: "weapon", cost: 1300, description: "風を呼ぶ強弓",             attackBonus: 30, magicBonus: 6, rarity: "rare", element: "wind" },
  { id: "void_scythe",   name: "ボイドサイズ",     category: "weapon", cost: 2400, description: "虚無を纏う大鎌",           attackBonus: 50, magicBonus: 15, rarity: "epic"    },
  { id: "excalibur",     name: "エクスカリバー",   category: "weapon", cost: 12000, description: "選ばれし者のみが扱える聖剣", attackBonus: 100, magicBonus: 25, rarity: "legendary", series: "holy",
    specialEffect: { type: "spell_power_up", value: 25, label: "魔法威力+25%" },
    ultimate: { name: "聖剣の裁き", description: "単体に超巨大ダメージを与え、味方全員のスクルト効果を付与する", kind: "nuke_single", power: 4.5, buffType: "def_up", buffFactor: 1.6 } },
  { id: "god_blade",     name: "しんのつるぎ",     category: "weapon", cost: 15000, description: "神話の中だけに存在したという剣", attackBonus: 120, rarity: "legendary", element: "fire", series: "god",
    specialEffect: { type: "fire_on_hit", value: 25, label: "物理攻撃に炎ダメージ+25" },
    ultimate: { name: "神々の裁き", description: "敵全体に超巨大な炎のダメージを与える", kind: "nuke_all", power: 2.8 } },
  { id: "phoenix_staff", name: "フェニックスの杖", category: "weapon", cost: 13000, description: "不死鳥の炎を宿す杖",       attackBonus: 20, magicBonus: 100, rarity: "legendary", element: "fire", series: "phoenix",
    specialEffect: { type: "mp_cost_reduce", value: 30, label: "MP消費-30%" },
    ultimate: { name: "不死鳥の奇跡", description: "味方全員のHPを全回復し、倒れた仲間を1人よみがえらせる", kind: "revive_heal" } },
  { id: "fes_blade",     name: "🎉フェスブレード",  category: "weapon", cost: 99999, description: "フェス限定の特別な剣。圧倒的な力を秘める", attackBonus: 130, magicBonus: 30, rarity: "legendary", festivalOnly: true, series: "fes",
    specialEffect: { type: "spell_power_up", value: 40, label: "魔法威力+40%" },
    ultimate: { name: "フェスティバルスペシャル", description: "敵全体に超巨大ダメージを与え、味方全員のバイキルト効果を付与する", kind: "nuke_all", power: 2.2, buffType: "atk_up", buffFactor: 1.5 } },
  { id: "aegis_blade",   name: "アイギスのつるぎ", category: "weapon", cost: 14500, description: "絶対防御の加護を宿す聖なる剣", attackBonus: 95, rarity: "legendary", series: "aegis",
    specialEffect: { type: "damage_reflect", value: 15, label: "ダメージ15%反射" },
    ultimate: { name: "アイギスの絶対防御", description: "味方全員のHPを回復し、スクルトと素早さアップを付与する", kind: "support_buff", power: 80, buffType: "def_up", buffFactor: 1.8 } },
  { id: "frost_blade",   name: "フロストブレード", category: "weapon", cost: 1700, description: "氷の力を宿す刀剣",         attackBonus: 34, magicBonus: 10, rarity: "rare", element: "water", series: "frost" },
  { id: "storm_lance",   name: "ストームランス",   category: "weapon", cost: 2300, description: "嵐を呼ぶ大槍",             attackBonus: 48, magicBonus: 12, rarity: "epic", element: "wind", series: "storm" },
  { id: "inferno_axe",   name: "インフェルノアックス", category: "weapon", cost: 2350, description: "業火を纏う巨大な斧",   attackBonus: 52, rarity: "epic", element: "fire", series: "inferno" },
  { id: "blessed_mace",  name: "ブレスメイス",     category: "weapon", cost: 1400, description: "祝福を受けたメイス",       attackBonus: 25, magicBonus: 20, rarity: "rare"    },
  { id: "ice_rapier",    name: "アイスレイピア",   category: "weapon", cost: 1450, description: "氷を纏う細剣",             attackBonus: 30, magicBonus: 8, rarity: "rare", element: "water" },
  { id: "thorn_whip",    name: "ソーンウィップ",   category: "weapon", cost: 1350, description: "棘を持つ大地の鞭",         attackBonus: 28, magicBonus: 6, rarity: "rare", element: "earth" },
  { id: "crescent_blade",name: "クレセントブレード", category: "weapon", cost: 1500, description: "三日月形の風斬り刀",     attackBonus: 32, rarity: "rare", element: "wind" },
  { id: "obsidian_mace", name: "オブシディアンメイス", category: "weapon", cost: 1550, description: "黒曜石の重い炎メイス", attackBonus: 33, rarity: "rare", element: "fire" },
  { id: "silver_bow",    name: "シルバーボウ",     category: "weapon", cost: 1400, description: "銀細工の精巧な弓",         attackBonus: 29, magicBonus: 5, rarity: "rare"    },
  { id: "tempest_blade", name: "テンペストブレード", category: "weapon", cost: 2450, description: "嵐を切り裂く魔剣",       attackBonus: 55, magicBonus: 10, rarity: "epic", element: "wind" },
  { id: "abyss_trident", name: "アビストライデント", category: "weapon", cost: 2500, description: "深淵より来たる三叉槍",   attackBonus: 50, magicBonus: 18, rarity: "epic", element: "water" },
  { id: "solar_glaive",  name: "ソーラーグレイブ", category: "weapon", cost: 2600, description: "太陽の炎を纏う大薙刀",     attackBonus: 58, rarity: "epic", element: "fire" },
  { id: "terra_hammer",  name: "テラハンマー",     category: "weapon", cost: 2650, description: "大地を砕く巨大な鎚",       attackBonus: 60, rarity: "epic", element: "earth" },
  { id: "shadow_rapier", name: "シャドウレイピア", category: "weapon", cost: 2400, description: "闇に溶け込む漆黒の細剣",   attackBonus: 52, magicBonus: 14, rarity: "epic"    },

  // ── 防具 ───────────────────────────────────────────────────
  { id: "cloth_robe",    name: "ぬののローブ",     category: "armor",  cost: 80,   description: "簡素な布のローブ",                 defenseBonus: 3,  statusResist: 0.05, rarity: "common"   },
  { id: "leather_armor", name: "かわのよろい",     category: "armor",  cost: 150,  description: "軽い革の鎧 耐性+10%",              defenseBonus: 5,  statusResist: 0.10, rarity: "common"   },
  { id: "bronze_shield", name: "どうのたて",       category: "armor",  cost: 250,  description: "青銅製の小さな盾",                 defenseBonus: 8,  statusResist: 0.10, rarity: "common"   },
  { id: "chain_mail",    name: "くさりかたびら",   category: "armor",  cost: 400,  description: "鎖帷子 耐性+15%",                  defenseBonus: 12, statusResist: 0.15, rarity: "common"   },
  { id: "magic_robe",    name: "まほうのローブ",   category: "armor",  cost: 600,  description: "魔法防御＆状態異常耐性+20%",       defenseBonus: 8,  magicBonus: 10, statusResist: 0.20, rarity: "rare"    },
  { id: "wind_cloak",    name: "かぜのマント",     category: "armor",  cost: 700,  description: "素早さが上がる軽いマント",          defenseBonus: 10, statusResist: 0.15, rarity: "uncommon" },
  { id: "iron_armor",    name: "てつのよろい",     category: "armor",  cost: 900,  description: "重い鉄の鎧 耐性+25%",              defenseBonus: 22, statusResist: 0.25, rarity: "uncommon" },
  { id: "mystic_robe",   name: "みすてりーローブ", category: "armor",  cost: 1300, description: "謎めいたローブ。魔法耐性が上がる", defenseBonus: 15, magicBonus: 18, statusResist: 0.25, rarity: "rare"    },
  { id: "silver_armor",  name: "シルバーアーマー", category: "armor",  cost: 1600, description: "銀の光る鎧 耐性+30%",              defenseBonus: 32, statusResist: 0.30, rarity: "rare"    },
  { id: "dragon_armor",  name: "ドラゴンのよろい", category: "armor",  cost: 2500, description: "最強の鎧 耐性+35%",                defenseBonus: 45, statusResist: 0.35, rarity: "epic", series: "dragon" },
  { id: "sage_robe",     name: "けんじゃのローブ", category: "armor",  cost: 3500, description: "賢者の鎧。魔法と防御を兼ね備える", defenseBonus: 30, magicBonus: 30, statusResist: 0.35, rarity: "epic", series: "sage"    },
  { id: "knight_plate",  name: "ナイトプレート",   category: "armor",  cost: 1100, description: "騎士団の正装。安定した防御力",     defenseBonus: 24, statusResist: 0.22, rarity: "rare"    },
  { id: "shadow_cloak",  name: "シャドウクローク", category: "armor",  cost: 1250, description: "気配を消す漆黒のマント",           defenseBonus: 18, magicBonus: 12, statusResist: 0.25, rarity: "rare"    },
  { id: "guardian_shell",name: "ガーディアンシェル",category: "armor",  cost: 2200, description: "あらゆる衝撃を吸収する甲殻",       defenseBonus: 50, statusResist: 0.30, rarity: "epic"    },
  { id: "aegis_armor",   name: "アイギスのよろい", category: "armor",  cost: 14000, description: "女神の加護を受けた絶対防御の鎧",   defenseBonus: 90, statusResist: 0.50, rarity: "legendary", series: "aegis",
    specialEffect: { type: "damage_reflect", value: 20, label: "ダメージ20%反射" } },
  { id: "holy_robe",     name: "せいなるローブ",   category: "armor",  cost: 13500, description: "天界の織物で編まれた聖衣",         defenseBonus: 55, magicBonus: 50, statusResist: 0.45, rarity: "legendary", series: "holy",
    specialEffect: { type: "status_resist_all", value: 60, label: "全状態異常耐性+60%" } },
  { id: "fes_armor",     name: "🎉フェスアーマー",  category: "armor",  cost: 99999, description: "フェス限定の特別な鎧。圧倒的な守りを誇る", defenseBonus: 100, magicBonus: 40, statusResist: 0.55, rarity: "legendary", festivalOnly: true, series: "fes",
    specialEffect: { type: "status_resist_all", value: 70, label: "全状態異常耐性+70%" } },
  { id: "god_armor",     name: "しんのよろい",     category: "armor",  cost: 14500, description: "神話の鎧。すべてを焼き尽くす炎を纏う", defenseBonus: 75, magicBonus: 20, statusResist: 0.40, rarity: "legendary", series: "god",
    specialEffect: { type: "fire_on_hit", value: 20, label: "物理攻撃に炎ダメージ+20" } },
  { id: "phoenix_robe",  name: "フェニックスローブ", category: "armor", cost: 13500, description: "不死鳥の加護を受けたローブ",       defenseBonus: 50, magicBonus: 60, statusResist: 0.40, rarity: "legendary", series: "phoenix",
    specialEffect: { type: "mp_cost_reduce", value: 25, label: "MP消費-25%" } },
  { id: "frost_mail",    name: "フロストメイル",   category: "armor",  cost: 1600, description: "氷で編まれた軽鎧",                 defenseBonus: 26, magicBonus: 8, statusResist: 0.20, rarity: "rare", series: "frost"   },
  { id: "storm_plate",   name: "ストームプレート", category: "armor",  cost: 2250, description: "嵐の加護を受けた鎧",               defenseBonus: 42, statusResist: 0.28, rarity: "epic", series: "storm"   },
  { id: "inferno_guard", name: "インフェルノガード", category: "armor", cost: 2300, description: "業火を防ぐ重装鎧",                 defenseBonus: 48, statusResist: 0.25, rarity: "epic", series: "inferno" },
  { id: "swift_vest",    name: "スウィフトベスト", category: "armor",  cost: 1350, description: "軽量で動きやすい胴衣",             defenseBonus: 16, statusResist: 0.18, rarity: "rare"    },
  { id: "ranger_cloak",  name: "レンジャークローク", category: "armor", cost: 1300, description: "森を駆ける狩人のマント",           defenseBonus: 20, statusResist: 0.18, rarity: "rare"    },
  { id: "crystal_vest",  name: "クリスタルベスト", category: "armor",  cost: 1450, description: "水晶片を編み込んだ胴衣",           defenseBonus: 22, magicBonus: 10, rarity: "rare"    },
  { id: "iron_bulwark",  name: "アイアンバルワーク", category: "armor", cost: 1500, description: "鉄壁の大盾鎧",                   defenseBonus: 28, rarity: "rare"    },
  { id: "mystic_sash",   name: "ミスティックサッシュ", category: "armor", cost: 1400, description: "魔力を秘めた帯状の防具",       defenseBonus: 16, magicBonus: 16, statusResist: 0.20, rarity: "rare"    },
  { id: "scout_leather", name: "スカウトレザー",   category: "armor",  cost: 1250, description: "斥候用の柔らかい革鎧",             defenseBonus: 18, statusResist: 0.15, rarity: "rare"    },
  { id: "titan_plate",   name: "タイタンプレート", category: "armor",  cost: 2550, description: "巨人の力を宿す重装鎧",             defenseBonus: 55, rarity: "epic"    },
  { id: "arcane_vestment", name: "アーケインヴェスト", category: "armor", cost: 2600, description: "古代魔術師の法衣",             defenseBonus: 35, magicBonus: 35, rarity: "epic"    },
  { id: "phantom_mantle", name: "ファントムマント", category: "armor", cost: 2500, description: "幻影をまとう不思議なマント",       defenseBonus: 38, statusResist: 0.35, rarity: "epic"    },
  { id: "dragoon_armor", name: "ドラグーンアーマー", category: "armor", cost: 2650, description: "竜騎兵の象徴たる鎧",             defenseBonus: 50, statusResist: 0.25, rarity: "epic"    },
  { id: "celestial_robe", name: "セレスティアルローブ", category: "armor", cost: 2700, description: "天空の加護を受けたローブ",     defenseBonus: 40, magicBonus: 30, statusResist: 0.30, rarity: "epic"    },

  // ── 消耗品（HP） ───────────────────────────────────────────
  { id: "potion",        name: "ポーション",       category: "potion", cost: 30,   description: "HPを40回復",    hpRestore: 40,  rarity: "common"   },
  { id: "hi_potion",     name: "ハイポーション",   category: "potion", cost: 80,   description: "HPを120回復",   hpRestore: 120, rarity: "uncommon" },
  { id: "mega_potion",   name: "メガポーション",   category: "potion", cost: 200,  description: "HPを300回復",   hpRestore: 300, rarity: "rare"     },
  { id: "elixir",        name: "エリクサー",       category: "potion", cost: 500,  description: "HPを全回復",    hpRestore: 9999, rarity: "epic"    },

  // ── 消耗品（MP） ───────────────────────────────────────────
  { id: "ether",         name: "エーテル",         category: "ether",  cost: 50,   description: "MPを20回復",    mpRestore: 20,  rarity: "common"   },
  { id: "hi_ether",      name: "ハイエーテル",     category: "ether",  cost: 120,  description: "MPを60回復",    mpRestore: 60,  rarity: "uncommon" },
  { id: "turbo_ether",   name: "ターボエーテル",   category: "ether",  cost: 300,  description: "MPを150回復",   mpRestore: 150, rarity: "rare"     },
  { id: "dry_ether",     name: "ドライエーテル",   category: "ether",  cost: 600,  description: "MPを全回復",    mpRestore: 9999, rarity: "epic"    },

  // ── 敵に使うどうぐ ───────────────────────────────────────────
  { id: "bomb",          name: "ばくだん",         category: "throwable", cost: 60,  description: "敵単体に固定ダメージ", damage: 50, rarity: "common" },
  { id: "mega_bomb",     name: "メガばくだん",     category: "throwable", cost: 250, description: "敵単体に大ダメージ",   damage: 180, rarity: "rare" },
  { id: "poison_powder", name: "どくのこな",       category: "throwable", cost: 80,  description: "敵単体を毒状態にする", enemyStatus: { status: "poison", baseChance: 0.8, turns: 4 }, rarity: "uncommon" },
  { id: "paralyze_powder", name: "しびれごな",     category: "throwable", cost: 100, description: "敵単体をしびれ状態にする", enemyStatus: { status: "paralysis", baseChance: 0.7, turns: 3 }, rarity: "uncommon" },
  { id: "sleep_powder",  name: "ねむりごな",       category: "throwable", cost: 90,  description: "敵単体を眠り状態にする", enemyStatus: { status: "sleep", baseChance: 0.75, turns: 3 }, rarity: "uncommon" },
];

// クラフトアイテムは materials.ts で定義されるが、装備用ルックアップのためここで登録
// equip/getEquipped は SHOP_ITEMS + CRAFTED_ID_MAP を参照する
const _craftedItems: ShopItem[] = [];

export function registerCraftedItems(items: ShopItem[]): void {
  _craftedItems.length = 0;
  _craftedItems.push(...items);
}

function allItems(): ShopItem[] {
  return [...SHOP_ITEMS, ..._craftedItems];
}

export function findItemById(id: string | null | undefined): ShopItem | null {
  if (!id) return null;
  return allItems().find(i => i.id === id) ?? null;
}

// ── 所持装備（コレクション、被り可） ─────────────────────────
const OWNED_WEAPONS_KEY = "rpg_owned_weapons";
const OWNED_ARMORS_KEY  = "rpg_owned_armors";

type OwnedEntry = { id: string; qty: number };

function getOwnedEntries(key: string): OwnedEntry[] {
  if (typeof localStorage === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(key) ?? "[]"); } catch { return []; }
}
function addOwnedEntry(key: string, id: string, qty = 1): void {
  const entries = getOwnedEntries(key);
  const e = entries.find(x => x.id === id);
  if (e) e.qty += qty; else entries.push({ id, qty });
  localStorage.setItem(key, JSON.stringify(entries));
}
function removeOwnedEntry(key: string, id: string, qty = 1): boolean {
  const entries = getOwnedEntries(key);
  const e = entries.find(x => x.id === id);
  if (!e || e.qty < qty) return false;
  e.qty -= qty;
  if (e.qty <= 0) entries.splice(entries.indexOf(e), 1);
  localStorage.setItem(key, JSON.stringify(entries));
  return true;
}

export function addOwnedWeapon(id: string, qty = 1): void { addOwnedEntry(OWNED_WEAPONS_KEY, id, qty); }
export function addOwnedArmor(id: string, qty = 1): void  { addOwnedEntry(OWNED_ARMORS_KEY, id, qty); }
export function removeOwnedWeapon(id: string, qty = 1): boolean { return removeOwnedEntry(OWNED_WEAPONS_KEY, id, qty); }
export function removeOwnedArmor(id: string, qty = 1): boolean  { return removeOwnedEntry(OWNED_ARMORS_KEY, id, qty); }

export type OwnedShopItem = ShopItem & { qty: number };

/** 所持している武器一覧（購入・ガチャしたもの。被りはqtyで表示。クラフト品はqty1固定で売却不可） */
export function getOwnedWeapons(): OwnedShopItem[] {
  const entries = getOwnedEntries(OWNED_WEAPONS_KEY);
  return allItems()
    .filter(i => i.category === "weapon" && (entries.some(e => e.id === i.id) || _craftedItems.some(c => c.id === i.id)))
    .map(i => ({ ...i, qty: entries.find(e => e.id === i.id)?.qty ?? 0 }));
}
/** 所持している防具一覧（購入・ガチャしたもの。被りはqtyで表示。クラフト品はqty0固定で売却不可） */
export function getOwnedArmors(): OwnedShopItem[] {
  const entries = getOwnedEntries(OWNED_ARMORS_KEY);
  return allItems()
    .filter(i => i.category === "armor" && (entries.some(e => e.id === i.id) || _craftedItems.some(c => c.id === i.id)))
    .map(i => ({ ...i, qty: entries.find(e => e.id === i.id)?.qty ?? 0 }));
}

/** 図鑑用：所持の有無に関わらず武器を全件返す（craftedOwnedIdsはクラフト済みレシピのid一覧） */
export function getCatalogWeapons(craftedOwnedIds: string[] = []): OwnedShopItem[] {
  const entries = getOwnedEntries(OWNED_WEAPONS_KEY);
  return allItems()
    .filter(i => i.category === "weapon")
    .map(i => ({ ...i, qty: entries.find(e => e.id === i.id)?.qty ?? (craftedOwnedIds.includes(i.id) ? 1 : 0) }));
}
/** 図鑑用：所持の有無に関わらず防具を全件返す */
export function getCatalogArmors(craftedOwnedIds: string[] = []): OwnedShopItem[] {
  const entries = getOwnedEntries(OWNED_ARMORS_KEY);
  return allItems()
    .filter(i => i.category === "armor")
    .map(i => ({ ...i, qty: entries.find(e => e.id === i.id)?.qty ?? (craftedOwnedIds.includes(i.id) ? 1 : 0) }));
}

/** 装備の売却額（購入価格の50%。フェス限定・クラフト品は売却不可） */
export function sellPriceFor(item: ShopItem): number {
  return Math.round(item.cost * 0.5);
}

// ── 装備交換所：同じレアリティの装備を複数集めて上位の装備と交換 ─
export const EQUIPMENT_EXCHANGE_COST = 3;

const EQUIPMENT_RARITY_TIER_UP: Record<Rarity, Rarity | null> = {
  common: "uncommon",
  uncommon: "rare",
  rare: "epic",
  epic: "legendary",
  legendary: null,
};

export function getEquipmentNextRarity(rarity: Rarity): Rarity | null {
  return EQUIPMENT_RARITY_TIER_UP[rarity];
}

export type EquipmentExchangeResult = { success: boolean; gained?: ShopItem; reason?: string };

/** 同じ武器/防具をEQUIPMENT_EXCHANGE_COST個消費し、同カテゴリ・1段階上のレアリティの装備とランダムに交換する */
export function exchangeEquipment(itemId: string): EquipmentExchangeResult {
  const item = findItemById(itemId);
  if (!item || (item.category !== "weapon" && item.category !== "armor")) {
    return { success: false, reason: "交換できない装備です" };
  }
  const nextRarity = getEquipmentNextRarity(item.rarity ?? "common");
  if (!nextRarity) return { success: false, reason: "これ以上交換できません" };

  const owned = item.category === "weapon" ? getOwnedWeapons() : getOwnedArmors();
  const ownedQty = owned.find(i => i.id === itemId)?.qty ?? 0;
  if (ownedQty < EQUIPMENT_EXCHANGE_COST) return { success: false, reason: "装備が足りません" };

  const candidates = SHOP_ITEMS.filter(i => i.category === item.category && i.rarity === nextRarity && !i.festivalOnly);
  if (!candidates.length) return { success: false, reason: "交換先の装備がありません" };

  const ok = item.category === "weapon"
    ? removeOwnedWeapon(itemId, EQUIPMENT_EXCHANGE_COST)
    : removeOwnedArmor(itemId, EQUIPMENT_EXCHANGE_COST);
  if (!ok) return { success: false, reason: "装備が足りません" };

  const gained = candidates[Math.floor(Math.random() * candidates.length)];
  if (item.category === "weapon") addOwnedWeapon(gained.id, 1);
  else addOwnedArmor(gained.id, 1);
  return { success: true, gained };
}

// ── 装備効果の集計 ──────────────────────────────────────────
export function getEquipmentEffect(weapon: ShopItem | null, armor: ShopItem | null): CraftEffect {
  let effect = { ...DEFAULT_CRAFT_EFFECT };
  effect = mergeCraftEffect(effect, weapon?.specialEffect);
  effect = mergeCraftEffect(effect, armor?.specialEffect);
  return effect;
}

// ── シリーズ統一ボーナス ────────────────────────────────────
// 武器と防具が同じシリーズの時に発動。レアリティが高いほど強力。
const SERIES_BONUS_BY_RARITY: Record<Rarity, { attack: number; defense: number; magic: number }> = {
  common:    { attack: 0,  defense: 0,  magic: 0  },
  uncommon:  { attack: 4,  defense: 4,  magic: 4  },
  rare:      { attack: 10, defense: 10, magic: 10 },
  epic:      { attack: 20, defense: 20, magic: 20 },
  legendary: { attack: 35, defense: 35, magic: 35 },
};

export type SeriesBonus = { attack: number; defense: number; magic: number };

export function getSeriesSetBonus(weapon: ShopItem | null, armor: ShopItem | null): SeriesBonus | null {
  if (!weapon?.series || !armor?.series || weapon.series !== armor.series) return null;
  const rarity = weapon.rarity ?? "common";
  return SERIES_BONUS_BY_RARITY[rarity];
}

// ── localStorage ─────────────────────────────────────────────
export type InventoryEntry = { id: string; qty: number };

const WEAPON_KEY    = "rpg_weapon";
const ARMOR_KEY     = "rpg_armor";
const INVENTORY_KEY = "rpg_inventory";

export function getEquippedWeapon(): ShopItem | null {
  if (typeof localStorage === "undefined") return null;
  const id = localStorage.getItem(WEAPON_KEY);
  return id ? (allItems().find(i => i.id === id) ?? null) : null;
}
export function getEquippedArmor(): ShopItem | null {
  if (typeof localStorage === "undefined") return null;
  const id = localStorage.getItem(ARMOR_KEY);
  return id ? (allItems().find(i => i.id === id) ?? null) : null;
}
export function equip(item: ShopItem): void {
  if (item.category === "weapon") localStorage.setItem(WEAPON_KEY, item.id);
  if (item.category === "armor")  localStorage.setItem(ARMOR_KEY, item.id);
}

export function unequip(category: "weapon" | "armor"): void {
  localStorage.removeItem(category === "weapon" ? WEAPON_KEY : ARMOR_KEY);
}

export function getInventory(): InventoryEntry[] {
  if (typeof localStorage === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(INVENTORY_KEY) ?? "[]"); }
  catch { return []; }
}
export function addInventory(id: string, qty = 1): void {
  const inv = getInventory();
  const e = inv.find(i => i.id === id);
  if (e) e.qty += qty; else inv.push({ id, qty });
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inv));
}
export function removeInventory(id: string, qty = 1): boolean {
  const inv = getInventory();
  const e = inv.find(i => i.id === id);
  if (!e || e.qty < qty) return false;
  e.qty -= qty;
  if (e.qty === 0) inv.splice(inv.indexOf(e), 1);
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inv));
  return true;
}
export function getInventoryItem(id: string): InventoryEntry | null {
  return getInventory().find(i => i.id === id) ?? null;
}
