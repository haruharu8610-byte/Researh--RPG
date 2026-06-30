import type { Rarity, SpecialEffect } from "@/lib/rarity";
import type { ItemCategory } from "@/lib/equipment";

export type Material = {
  id: string;
  name: string;
  rarity: Rarity;
  description: string;
  buyable: boolean;
  cost?: number;
  /** 換金専用アイテム：ショップで高額売却できる（使い道は売却のみ） */
  sellValue?: number;
};

export const MATERIALS: Material[] = [
  // 購入可能素材
  { id: "stone",         name: "石材",            rarity: "common",    description: "どこにでもある石材",              buyable: true,  cost: 50  },
  { id: "iron_ore",      name: "てつこうせき",     rarity: "common",    description: "鉄の原料となる鉱石",              buyable: true,  cost: 80  },
  { id: "magic_stone",   name: "まほうの石",       rarity: "uncommon",  description: "魔力を帯びた青い石",              buyable: true,  cost: 200 },
  { id: "herb",          name: "やくそう",         rarity: "common",    description: "回復効果のある薬草",              buyable: true,  cost: 30  },
  // ドロップ素材（コモン）
  { id: "bat_wing",      name: "こうもりの翼",     rarity: "common",    description: "ドラキーから入手できる翼",         buyable: false  },
  { id: "bone_shard",    name: "ほねのかけら",     rarity: "common",    description: "がいこつが落とす骨片",            buyable: false  },
  { id: "wolf_fang",     name: "オオカミのキバ",   rarity: "common",    description: "もりのおおかみのキバ",            buyable: false  },
  { id: "mushroom_spore",name: "キノコのほうし",   rarity: "uncommon",  description: "おばけキノコの胞子。毒性あり",     buyable: false  },
  // ドロップ素材（アンコモン〜レア）
  { id: "hard_shell",    name: "かたいこうら",     rarity: "uncommon",  description: "おおさそりの堅い甲殻",            buyable: false  },
  { id: "ghost_orb",     name: "ゴーストのたま",   rarity: "uncommon",  description: "ゴーストから入手できる球体",       buyable: false  },
  { id: "lizard_hide",   name: "リザードのうろこ", rarity: "uncommon",  description: "リザードマンの鱗皮",              buyable: false  },
  { id: "mage_robe_frag",name: "まじゅつしのローブ断片", rarity: "rare", description: "まじゅつしが落とす魔法の布",     buyable: false  },
  { id: "orc_tusk",      name: "オークのツノ",     rarity: "uncommon",  description: "オークキングの巨大な牙",          buyable: false  },
  { id: "golem_core",    name: "ゴーレムのコア",   rarity: "rare",      description: "ゴーレムの中核。強力な魔力を宿す", buyable: false  },
  { id: "dragon_scale",  name: "ドラゴンのウロコ", rarity: "rare",      description: "ドラゴンの鱗。高い防御力を持つ",  buyable: false  },
  // エピック〜レジェンダリー
  { id: "rare_crystal",  name: "レアクリスタル",   rarity: "epic",      description: "非常に希少な水晶。強力な装備に",  buyable: false  },
  { id: "legend_ore",    name: "でんせつの鉱石",   rarity: "legendary", description: "伝説の武具の素材。入手困難",       buyable: false  },
  { id: "dark_crystal",  name: "やみのクリスタル", rarity: "epic",      description: "闇の力を秘めた漆黒の結晶",         buyable: false  },
  { id: "angel_feather", name: "てんしのはね",     rarity: "legendary", description: "天界から落ちた羽根。神聖な力",     buyable: false  },
  { id: "toad_skin",     name: "トードのかわ",     rarity: "common",    description: "ジャイアントトードの丈夫な皮",     buyable: false  },
  { id: "crystal_shard", name: "クリスタルのかけら", rarity: "rare",    description: "クリスタルゴーレムが落とす輝く欠片", buyable: false  },
  // 換金専用アイテム（ゴールドダンジョン限定モンスタードロップ）
  { id: "gold_idol",     name: "おうごんのぞう",   rarity: "epic",      description: "ゴールドゴーレムが落とす黄金の像。換金専用", buyable: false, sellValue: 800  },
  { id: "king_treasure", name: "おうのほうもつ",   rarity: "legendary", description: "王の財宝。とんでもない高値で売れる換金専用品", buyable: false, sellValue: 2500 },
];

// ── クラフトレシピ ───────────────────────────────────────────
export type CraftRecipe = {
  id: string;
  name: string;
  category: Extract<ItemCategory, "weapon" | "armor">;
  rarity: Rarity;
  materials: Array<{ id: string; qty: number }>;
  goldCost: number;
  description: string;
  attackBonus?: number; defenseBonus?: number; magicBonus?: number; statusResist?: number;
  specialEffect: SpecialEffect;
};

export const CRAFT_RECIPES: CraftRecipe[] = [
  // ── 武器 ──
  {
    id: "craft_wind_staff",
    name: "かぜのつえ",
    category: "weapon", rarity: "uncommon",
    materials: [{ id: "bat_wing", qty: 2 }, { id: "magic_stone", qty: 1 }],
    goldCost: 300,
    description: "こうもりの翼で作った風の杖",
    magicBonus: 66,
    specialEffect: { type: "mp_cost_reduce", value: 20, label: "MP消費-20%" },
  },
  {
    id: "craft_dragon_fang",
    name: "ドラゴンのキバ",
    category: "weapon", rarity: "rare",
    materials: [{ id: "dragon_scale", qty: 2 }, { id: "stone", qty: 3 }],
    goldCost: 1500,
    description: "ドラゴンの鱗と牙で作った剣",
    attackBonus: 156,
    specialEffect: { type: "fire_on_hit", value: 18, label: "物理攻撃に炎ダメージ+18" },
  },
  {
    id: "craft_chaos_blade",
    name: "カオスブレード",
    category: "weapon", rarity: "epic",
    materials: [{ id: "rare_crystal", qty: 1 }, { id: "dragon_scale", qty: 2 }, { id: "magic_stone", qty: 2 }],
    goldCost: 3000,
    description: "レアクリスタルに宿る混沌の剣",
    attackBonus: 120, magicBonus: 75,
    specialEffect: { type: "spell_power_up", value: 35, label: "魔法威力+35%" },
  },
  {
    id: "craft_legend_sword",
    name: "でんせつのつるぎ",
    category: "weapon", rarity: "legendary",
    materials: [{ id: "legend_ore", qty: 1 }, { id: "dragon_scale", qty: 3 }, { id: "rare_crystal", qty: 1 }],
    goldCost: 5000,
    description: "伝説に語られる最強の剣",
    attackBonus: 240, magicBonus: 60,
    specialEffect: { type: "spell_power_up", value: 50, label: "魔法威力+50%" },
  },

  // ── 追加武器レシピ ──
  {
    id: "craft_bone_blade",
    name: "ボーンブレード",
    category: "weapon", rarity: "uncommon",
    materials: [{ id: "bone_shard", qty: 3 }, { id: "iron_ore", qty: 2 }],
    goldCost: 400,
    description: "がいこつの骨で作った不気味な剣",
    attackBonus: 84,
    specialEffect: { type: "poison_immune", value: 1, label: "毒無効" },
  },
  {
    id: "craft_wolf_claw",
    name: "オオカミのツメ",
    category: "weapon", rarity: "uncommon",
    materials: [{ id: "wolf_fang", qty: 2 }, { id: "stone", qty: 2 }],
    goldCost: 350,
    description: "オオカミの牙で作った爪状の武器",
    attackBonus: 75,
    specialEffect: { type: "speed_boost", value: 8, label: "素早さ+8" },
  },
  {
    id: "craft_dark_staff",
    name: "やみのつえ",
    category: "weapon", rarity: "rare",
    materials: [{ id: "dark_crystal", qty: 1 }, { id: "mage_robe_frag", qty: 2 }],
    goldCost: 2000,
    description: "闇の魔法使いが持つ邪悪な杖",
    attackBonus: 30, magicBonus: 150,
    specialEffect: { type: "spell_power_up", value: 40, label: "魔法威力+40%" },
  },
  {
    id: "craft_angel_sword",
    name: "てんしのつるぎ",
    category: "weapon", rarity: "legendary",
    materials: [{ id: "angel_feather", qty: 1 }, { id: "legend_ore", qty: 1 }, { id: "rare_crystal", qty: 2 }],
    goldCost: 8000,
    description: "天界の素材で作られた神聖な剣",
    attackBonus: 210, magicBonus: 90,
    specialEffect: { type: "fire_on_hit", value: 30, label: "物理攻撃に炎ダメージ+30" },
  },

  // ── 防具 ──
  {
    id: "craft_shell_armor",
    name: "シェルメイル",
    category: "armor", rarity: "uncommon",
    materials: [{ id: "hard_shell", qty: 2 }, { id: "iron_ore", qty: 2 }],
    goldCost: 500,
    description: "おおさそりの甲殻で作った鎧",
    defenseBonus: 60, statusResist: 0.10,
    specialEffect: { type: "poison_immune", value: 1, label: "毒無効" },
  },
  {
    id: "craft_golem_shield",
    name: "ゴーレムシールド",
    category: "armor", rarity: "rare",
    materials: [{ id: "golem_core", qty: 1 }, { id: "iron_ore", qty: 3 }],
    goldCost: 1200,
    description: "ゴーレムのコアで作った盾",
    defenseBonus: 114,
    specialEffect: { type: "damage_reflect", value: 15, label: "ダメージ15%反射" },
  },
  {
    id: "craft_resist_robe",
    name: "オールレジストローブ",
    category: "armor", rarity: "epic",
    materials: [{ id: "rare_crystal", qty: 1 }, { id: "magic_stone", qty: 3 }],
    goldCost: 2500,
    description: "全ての状態異常を跳ね返す",
    defenseBonus: 84, magicBonus: 45, statusResist: 0.15,
    specialEffect: { type: "status_resist_all", value: 30, label: "全状態異常耐性+30%" },
  },
  {
    id: "craft_legend_armor",
    name: "でんせつのよろい",
    category: "armor", rarity: "legendary",
    materials: [{ id: "legend_ore", qty: 1 }, { id: "rare_crystal", qty: 1 }, { id: "dragon_scale", qty: 2 }],
    goldCost: 5000,
    description: "伝説の鎧。あらゆる攻撃を防ぐ",
    defenseBonus: 180, statusResist: 0.30,
    specialEffect: { type: "speed_boost", value: 10, label: "素早さ+10" },
  },
  {
    id: "craft_ghost_cloak",
    name: "ゴーストのマント",
    category: "armor", rarity: "rare",
    materials: [{ id: "ghost_orb", qty: 2 }, { id: "bat_wing", qty: 2 }],
    goldCost: 1000,
    description: "ゴーストの力を宿すマント。魔法を弾く",
    defenseBonus: 66, magicBonus: 36, statusResist: 0.20,
    specialEffect: { type: "damage_reflect", value: 20, label: "ダメージ20%反射" },
  },
  {
    id: "craft_angel_robe",
    name: "てんしのローブ",
    category: "armor", rarity: "legendary",
    materials: [{ id: "angel_feather", qty: 1 }, { id: "mage_robe_frag", qty: 2 }, { id: "rare_crystal", qty: 1 }],
    goldCost: 8000,
    description: "天使の羽根で作られた聖なるローブ",
    defenseBonus: 135, magicBonus: 105, statusResist: 0.40,
    specialEffect: { type: "status_resist_all", value: 50, label: "全状態異常耐性+50%" },
  },

  // ── 追加レシピ（すべての素材に使い道を用意） ───────────────
  {
    id: "craft_herb_staff",
    name: "やくそうのつえ",
    category: "weapon", rarity: "uncommon",
    materials: [{ id: "herb", qty: 3 }, { id: "magic_stone", qty: 1 }],
    goldCost: 280,
    description: "薬草の力を宿した治癒の杖",
    magicBonus: 54,
    specialEffect: { type: "mp_cost_reduce", value: 15, label: "MP消費-15%" },
  },
  {
    id: "craft_spore_dagger",
    name: "ほうしのナイフ",
    category: "weapon", rarity: "uncommon",
    materials: [{ id: "mushroom_spore", qty: 3 }, { id: "bone_shard", qty: 2 }],
    goldCost: 320,
    description: "胞子の毒を纏った短剣",
    attackBonus: 72,
    specialEffect: { type: "poison_immune", value: 1, label: "毒無効" },
  },
  {
    id: "craft_lizard_mail",
    name: "リザードンメイル",
    category: "armor", rarity: "rare",
    materials: [{ id: "lizard_hide", qty: 3 }, { id: "iron_ore", qty: 2 }],
    goldCost: 600,
    description: "リザードマンの鱗で編んだ軽鎧",
    defenseBonus: 78, statusResist: 0.15,
    specialEffect: { type: "speed_boost", value: 6, label: "素早さ+6" },
  },
  {
    id: "craft_orc_plate",
    name: "オークプレート",
    category: "armor", rarity: "rare",
    materials: [{ id: "orc_tusk", qty: 3 }, { id: "stone", qty: 3 }, { id: "iron_ore", qty: 2 }],
    goldCost: 700,
    description: "オークの牙を鋲に使った重装鎧",
    defenseBonus: 102,
    specialEffect: { type: "damage_reflect", value: 10, label: "ダメージ10%反射" },
  },
  {
    id: "craft_toad_cloak",
    name: "トードクローク",
    category: "armor", rarity: "uncommon",
    materials: [{ id: "toad_skin", qty: 3 }, { id: "herb", qty: 2 }],
    goldCost: 350,
    description: "トードの皮で作った湿地仕様のマント",
    defenseBonus: 42, statusResist: 0.20,
    specialEffect: { type: "status_resist_all", value: 15, label: "全状態異常耐性+15%" },
  },

  // ── クラフト限定：レア武器 ───────────────────────────────────
  {
    id: "craft_fang_blade",
    name: "オオカミのキバ剣",
    category: "weapon", rarity: "rare",
    materials: [{ id: "wolf_fang", qty: 3 }, { id: "bone_shard", qty: 2 }],
    goldCost: 550,
    description: "オオカミの牙を連ねた俊敏な剣",
    attackBonus: 81,
    specialEffect: { type: "speed_boost", value: 7, label: "素早さ+7" },
  },
  {
    id: "craft_shell_spear",
    name: "シェルスピア",
    category: "weapon", rarity: "rare",
    materials: [{ id: "hard_shell", qty: 2 }, { id: "iron_ore", qty: 3 }],
    goldCost: 580,
    description: "硬い甲殻を穂先に使った槍",
    attackBonus: 78,
    specialEffect: { type: "poison_immune", value: 1, label: "毒無効" },
  },
  {
    id: "craft_spirit_wand",
    name: "スピリットワンド",
    category: "weapon", rarity: "rare",
    materials: [{ id: "ghost_orb", qty: 2 }, { id: "magic_stone", qty: 2 }],
    goldCost: 600,
    description: "霊魂のたまを核にした杖",
    attackBonus: 24, magicBonus: 90,
    specialEffect: { type: "mp_cost_reduce", value: 12, label: "MP消費-12%" },
  },
  {
    id: "craft_scale_dagger",
    name: "スケイルダガー",
    category: "weapon", rarity: "rare",
    materials: [{ id: "lizard_hide", qty: 2 }, { id: "dragon_scale", qty: 1 }],
    goldCost: 650,
    description: "竜鱗を仕込んだ短剣",
    attackBonus: 90,
    specialEffect: { type: "fire_on_hit", value: 8, label: "物理攻撃に炎ダメージ+8" },
  },
  {
    id: "craft_tusk_club",
    name: "タスククラブ",
    category: "weapon", rarity: "rare",
    materials: [{ id: "orc_tusk", qty: 3 }, { id: "stone", qty: 2 }],
    goldCost: 560,
    description: "オークの牙を打ち込んだ棍棒",
    attackBonus: 87,
    specialEffect: { type: "damage_reflect", value: 8, label: "ダメージ8%反射" },
  },

  // ── クラフト限定：エピック武器 ──────────────────────────────
  {
    id: "craft_core_hammer",
    name: "コアハンマー",
    category: "weapon", rarity: "epic",
    materials: [{ id: "golem_core", qty: 2 }, { id: "iron_ore", qty: 3 }],
    goldCost: 2300,
    description: "ゴーレムのコアを打ち込んだ大鎚",
    attackBonus: 144,
    specialEffect: { type: "damage_reflect", value: 18, label: "ダメージ18%反射" },
  },
  {
    id: "craft_crystal_staff",
    name: "クリスタルスタッフ",
    category: "weapon", rarity: "epic",
    materials: [{ id: "rare_crystal", qty: 1 }, { id: "magic_stone", qty: 3 }],
    goldCost: 2500,
    description: "レアクリスタルを宿した魔導の杖",
    attackBonus: 30, magicBonus: 150,
    specialEffect: { type: "spell_power_up", value: 30, label: "魔法威力+30%" },
  },
  {
    id: "craft_shadow_blade",
    name: "シャドウブレード",
    category: "weapon", rarity: "epic",
    materials: [{ id: "dark_crystal", qty: 1 }, { id: "mage_robe_frag", qty: 2 }],
    goldCost: 2400,
    description: "闇のクリスタルを宿した魔剣",
    attackBonus: 135, magicBonus: 45,
    specialEffect: { type: "spell_power_up", value: 20, label: "魔法威力+20%" },
  },
  {
    id: "craft_scale_greatsword",
    name: "スケイルグレートソード",
    category: "weapon", rarity: "epic",
    materials: [{ id: "dragon_scale", qty: 3 }, { id: "stone", qty: 2 }],
    goldCost: 2600,
    description: "竜鱗で鍛えた大剣",
    attackBonus: 165,
    specialEffect: { type: "fire_on_hit", value: 15, label: "物理攻撃に炎ダメージ+15" },
  },
  {
    id: "craft_crystal_fang",
    name: "クリスタルファング",
    category: "weapon", rarity: "epic",
    materials: [{ id: "crystal_shard", qty: 3 }, { id: "rare_crystal", qty: 1 }],
    goldCost: 2550,
    description: "輝くクリスタルの牙を持つ武器",
    attackBonus: 156, magicBonus: 30,
    specialEffect: { type: "mp_cost_reduce", value: 18, label: "MP消費-18%" },
  },
  {
    id: "craft_archmage_staff",
    name: "だいけんじゃのつえ",
    category: "weapon", rarity: "legendary",
    materials: [{ id: "legend_ore", qty: 1 }, { id: "rare_crystal", qty: 2 }, { id: "angel_feather", qty: 1 }],
    goldCost: 9000,
    description: "歴代の大賢者が極めた、魔力を極限まで高める杖",
    attackBonus: 54, magicBonus: 330,
    specialEffect: { type: "spell_power_up", value: 55, label: "魔法威力+55%" },
  },

  // ── クラフト限定：レア防具 ───────────────────────────────────
  {
    id: "craft_fang_guard",
    name: "オオカミのキバよろい",
    category: "armor", rarity: "rare",
    materials: [{ id: "wolf_fang", qty: 2 }, { id: "iron_ore", qty: 2 }],
    goldCost: 580,
    description: "牙を鋲に使った軽量な鎧",
    defenseBonus: 60,
    specialEffect: { type: "speed_boost", value: 5, label: "素早さ+5" },
  },
  {
    id: "craft_shell_plate",
    name: "シェルプレート",
    category: "armor", rarity: "rare",
    materials: [{ id: "hard_shell", qty: 3 }],
    goldCost: 600,
    description: "堅牢な甲殻でできた重装鎧",
    defenseBonus: 72,
    specialEffect: { type: "poison_immune", value: 1, label: "毒無効" },
  },
  {
    id: "craft_spirit_veil",
    name: "スピリットヴェール",
    category: "armor", rarity: "rare",
    materials: [{ id: "ghost_orb", qty: 2 }, { id: "bat_wing", qty: 2 }],
    goldCost: 620,
    description: "霊魂の力をまとうヴェール",
    defenseBonus: 48, magicBonus: 36,
    specialEffect: { type: "status_resist_all", value: 20, label: "全状態異常耐性+20%" },
  },
  {
    id: "craft_scale_mail",
    name: "スケイルメイル",
    category: "armor", rarity: "rare",
    materials: [{ id: "lizard_hide", qty: 2 }, { id: "iron_ore", qty: 2 }],
    goldCost: 650,
    description: "竜鱗を編み込んだ鎖鎧",
    defenseBonus: 78,
    specialEffect: { type: "fire_on_hit", value: 6, label: "物理攻撃に炎ダメージ+6" },
  },
  {
    id: "craft_tusk_armor",
    name: "タスクアーマー",
    category: "armor", rarity: "rare",
    materials: [{ id: "orc_tusk", qty: 2 }, { id: "stone", qty: 3 }],
    goldCost: 600,
    description: "オークの牙で補強された鎧",
    defenseBonus: 75,
    specialEffect: { type: "damage_reflect", value: 10, label: "ダメージ10%反射" },
  },

  // ── クラフト限定：エピック防具 ──────────────────────────────
  {
    id: "craft_core_aegis",
    name: "コアイージス",
    category: "armor", rarity: "epic",
    materials: [{ id: "golem_core", qty: 2 }, { id: "rare_crystal", qty: 1 }],
    goldCost: 2500,
    description: "ゴーレムのコアを核にした絶対防御の盾鎧",
    defenseBonus: 150,
    specialEffect: { type: "damage_reflect", value: 20, label: "ダメージ20%反射" },
  },
  {
    id: "craft_crystal_robe",
    name: "クリスタルローブ",
    category: "armor", rarity: "epic",
    materials: [{ id: "rare_crystal", qty: 1 }, { id: "magic_stone", qty: 3 }],
    goldCost: 2450,
    description: "レアクリスタルを織り込んだ法衣",
    defenseBonus: 75, magicBonus: 90,
    specialEffect: { type: "spell_power_up", value: 25, label: "魔法威力+25%" },
  },
  {
    id: "craft_shadow_veil",
    name: "シャドウヴェール",
    category: "armor", rarity: "epic",
    materials: [{ id: "dark_crystal", qty: 1 }, { id: "mage_robe_frag", qty: 2 }],
    goldCost: 2500,
    description: "闇のクリスタルをまとう不気味な外套",
    defenseBonus: 96, statusResist: 0.30,
    specialEffect: { type: "status_resist_all", value: 35, label: "全状態異常耐性+35%" },
  },
  {
    id: "craft_dragon_plate",
    name: "ドラゴンプレート",
    category: "armor", rarity: "epic",
    materials: [{ id: "dragon_scale", qty: 3 }, { id: "iron_ore", qty: 2 }],
    goldCost: 2700,
    description: "竜鱗を全身に纏った重装鎧",
    defenseBonus: 165,
    specialEffect: { type: "fire_on_hit", value: 12, label: "物理攻撃に炎ダメージ+12" },
  },
  {
    id: "craft_crystal_aegis",
    name: "クリスタルイージス",
    category: "armor", rarity: "epic",
    materials: [{ id: "crystal_shard", qty: 3 }, { id: "rare_crystal", qty: 1 }],
    goldCost: 2650,
    description: "輝くクリスタルで編まれた守りの盾鎧",
    defenseBonus: 144, statusResist: 0.25,
    specialEffect: { type: "mp_cost_reduce", value: 15, label: "MP消費-15%" },
  },
];

// ── 素材在庫管理 ────────────────────────────────────────────
const MATERIALS_KEY = "rpg_materials";

type MaterialEntry = { id: string; qty: number };

export function getMaterials(): MaterialEntry[] {
  if (typeof localStorage === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(MATERIALS_KEY) ?? "[]"); }
  catch { return []; }
}

export function getMaterialQty(id: string): number {
  return getMaterials().find(m => m.id === id)?.qty ?? 0;
}

export function addMaterial(id: string, qty = 1): void {
  const inv = getMaterials();
  const e = inv.find(m => m.id === id);
  if (e) e.qty += qty; else inv.push({ id, qty });
  localStorage.setItem(MATERIALS_KEY, JSON.stringify(inv));
}

export function removeMaterial(id: string, qty = 1): boolean {
  const inv = getMaterials();
  const e = inv.find(m => m.id === id);
  if (!e || e.qty < qty) return false;
  e.qty -= qty;
  if (e.qty === 0) inv.splice(inv.indexOf(e), 1);
  localStorage.setItem(MATERIALS_KEY, JSON.stringify(inv));
  return true;
}

export function canCraft(recipe: CraftRecipe): boolean {
  return recipe.materials.every(m => getMaterialQty(m.id) >= m.qty);
}

// ── 素材交換所：低レア素材を集めて上位レアの素材と交換 ────────
export const EXCHANGE_COST = 5;

const RARITY_TIER_UP: Record<Rarity, Rarity | null> = {
  common: "uncommon",
  uncommon: "rare",
  rare: "epic",
  epic: "legendary",
  legendary: null,
};

export function getNextRarity(rarity: Rarity): Rarity | null {
  return RARITY_TIER_UP[rarity];
}

/** 交換対象になりうる素材（換金専用アイテムは除く） */
export function getExchangeableMaterials(rarity: Rarity): Material[] {
  return MATERIALS.filter(m => m.rarity === rarity && !m.sellValue);
}

export type ExchangeResult = { success: boolean; gained?: Material; reason?: string };

/** 同じ素材をEXCHANGE_COST個消費し、1段階上のレアリティの素材とランダムに交換する */
export function exchangeMaterial(materialId: string): ExchangeResult {
  const material = MATERIALS.find(m => m.id === materialId);
  if (!material) return { success: false, reason: "素材が見つかりません" };
  if (material.sellValue) return { success: false, reason: "この素材は交換できません" };
  const nextRarity = getNextRarity(material.rarity);
  if (!nextRarity) return { success: false, reason: "これ以上交換できません" };
  if (getMaterialQty(materialId) < EXCHANGE_COST) return { success: false, reason: "素材が足りません" };

  const candidates = getExchangeableMaterials(nextRarity);
  if (!candidates.length) return { success: false, reason: "交換先の素材がありません" };

  removeMaterial(materialId, EXCHANGE_COST);
  const gained = candidates[Math.floor(Math.random() * candidates.length)];
  addMaterial(gained.id, 1);
  return { success: true, gained };
}
