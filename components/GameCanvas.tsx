"use client";

import { useEffect, useRef } from "react";

type Props = { level: number; jobClass: JobClass };

export type JobClass = "warrior" | "mage" | "cleric" | "rogue";

const JOB_CONFIG: Record<JobClass, { color: number; label: string; emoji: string }> = {
  warrior: { color: 0xe74c3c, label: "戦士",   emoji: "⚔️" },
  mage:    { color: 0x9b59b6, label: "魔法使い", emoji: "🔮" },
  cleric:  { color: 0xf1c40f, label: "僧侶",   emoji: "✨" },
  rogue:   { color: 0x2ecc71, label: "盗賊",   emoji: "🗡️" },
};

export function themeToJobClass(theme: string | null): JobClass {
  if (!theme) return "warrior";
  const t = theme.toLowerCase();
  if (t.includes("生物") || t.includes("医") || t.includes("health") || t.includes("bio")) return "cleric";
  if (t.includes("数") || t.includes("物理") || t.includes("math") || t.includes("phys")) return "mage";
  if (t.includes("情報") || t.includes("プログラム") || t.includes("comp") || t.includes("cs")) return "rogue";
  return "warrior";
}

export default function GameCanvas({ level, jobClass }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<import("phaser").Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let game: import("phaser").Game;
    const { color, label } = JOB_CONFIG[jobClass];

    import("phaser").then((Phaser) => {
      if (gameRef.current) { gameRef.current.destroy(true); }

      const config: import("phaser").Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 400,
        height: 220,
        backgroundColor: "#111827",
        parent: containerRef.current!,
        scene: {
          create(this: Phaser.Scene) {
            this.add.rectangle(200, 200, 400, 8, 0x374151);

            const x = 200, y = 160;
            const g = this.add.graphics();

            g.fillStyle(0x000000, 0.3);
            g.fillEllipse(x, y + 36, 40, 12);

            g.fillStyle(color, 1);
            g.fillRect(x - 12, y, 24, 28);
            g.fillRect(x - 10, y - 22, 20, 20);

            g.fillStyle(0x000000, 1);
            g.fillRect(x - 5, y - 16, 4, 4);
            g.fillRect(x + 2, y - 16, 4, 4);

            // 職業ごとの装備
            if (jobClass === "warrior") {
              g.fillStyle(0xd1d5db, 1);
              g.fillRect(x + 14, y - 10, 4, 30);
              g.fillRect(x + 10, y + 2, 12, 4);
            } else if (jobClass === "mage") {
              g.fillStyle(0x8b5cf6, 1);
              g.fillRect(x - 18, y - 30, 4, 50);
              g.fillCircle(x - 16, y - 34, 7);
            } else if (jobClass === "cleric") {
              g.fillStyle(0xfef3c7, 1);
              g.fillRect(x + 14, y - 12, 4, 24);
              g.fillRect(x + 8, y - 8, 16, 4);
            } else if (jobClass === "rogue") {
              g.fillStyle(0x6b7280, 1);
              g.fillRect(x + 14, y - 4, 3, 20);
              g.fillRect(x + 14, y - 10, 3, 8);
            }

            if (level >= 10) {
              g.fillStyle(0xffd700, 1);
              g.fillRect(x - 10, y - 28, 20, 6);
              g.fillRect(x - 10, y - 34, 4, 8);
              g.fillRect(x - 2, y - 36, 4, 10);
              g.fillRect(x + 6, y - 34, 4, 8);
            }

            this.add.text(200, 10, `Lv.${level} ${label}`, {
              fontSize: "14px", color: "#e5e7eb", fontFamily: "monospace",
            }).setOrigin(0.5, 0);

            this.tweens.add({
              targets: g, y: "-=6", duration: 1200,
              yoyo: true, repeat: -1, ease: "Sine.easeInOut",
            });
          },
        },
      };

      game = new Phaser.Game(config);
      gameRef.current = game;
    });

    return () => { game?.destroy(true); };
  }, [level, jobClass]);

  return <div ref={containerRef} className="flex justify-center rounded-xl overflow-hidden" />;
}
