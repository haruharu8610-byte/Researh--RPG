"use client";

import { useEffect, useRef } from "react";

type Props = { level: number };

// キャラクターカラーをレベルに応じて変える
function getCharacterColor(level: number) {
  if (level >= 10) return 0xffd700; // ゴールド
  if (level >= 5) return 0x9b59b6;  // 紫
  if (level >= 3) return 0x3498db;  // 青
  return 0x2ecc71;                  // 緑（初期）
}

export default function GameCanvas({ level }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<import("phaser").Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let game: import("phaser").Game;

    import("phaser").then((Phaser) => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
      }

      const charColor = getCharacterColor(level);

      const config: import("phaser").Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 400,
        height: 220,
        backgroundColor: "#111827",
        parent: containerRef.current!,
        scene: {
          create(this: Phaser.Scene) {
            // 地面
            this.add.rectangle(200, 200, 400, 8, 0x374151);

            // キャラクター（ドット絵風シルエット）
            const x = 200;
            const y = 160;
            const g = this.add.graphics();

            // 影
            g.fillStyle(0x000000, 0.3);
            g.fillEllipse(x, y + 36, 40, 12);

            // 体
            g.fillStyle(charColor, 1);
            g.fillRect(x - 12, y, 24, 28);

            // 頭
            g.fillStyle(charColor, 1);
            g.fillRect(x - 10, y - 22, 20, 20);

            // 目
            g.fillStyle(0x000000, 1);
            g.fillRect(x - 5, y - 16, 4, 4);
            g.fillRect(x + 2, y - 16, 4, 4);

            // 剣（level 3以上）
            if (level >= 3) {
              g.fillStyle(0xd1d5db, 1);
              g.fillRect(x + 14, y - 10, 4, 30);
              g.fillRect(x + 10, y + 2, 12, 4);
            }

            // 王冠（level 10以上）
            if (level >= 10) {
              g.fillStyle(0xffd700, 1);
              g.fillRect(x - 10, y - 28, 20, 6);
              g.fillRect(x - 10, y - 34, 4, 8);
              g.fillRect(x - 2, y - 36, 4, 10);
              g.fillRect(x + 6, y - 34, 4, 8);
            }

            // レベルテキスト
            this.add.text(200, 14, `Lv. ${level}`, {
              fontSize: "14px",
              color: "#e5e7eb",
              fontFamily: "monospace",
            }).setOrigin(0.5, 0);

            // アニメーション（浮遊）
            this.tweens.add({
              targets: g,
              y: "-=6",
              duration: 1200,
              yoyo: true,
              repeat: -1,
              ease: "Sine.easeInOut",
            });
          },
        },
      };

      game = new Phaser.Game(config);
      gameRef.current = game;
    });

    return () => {
      game?.destroy(true);
    };
  }, [level]);

  return <div ref={containerRef} className="flex justify-center rounded-xl overflow-hidden" />;
}
