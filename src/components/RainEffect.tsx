"use client";

import { useEffect, useRef } from "react";

export default function RainEffect() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationId: number;
        let drops: Drop[] = [];

        // ── Lightning state ──────────────────────────────────────
        interface LightningBolt {
            x: number;
            segments: { x: number; y: number }[];
            branches: { segments: { x: number; y: number }[]; opacity: number }[];
            flashOpacity: number;   // full-screen flash
            boltOpacity: number;    // bolt visibility
            phase: "flash" | "fade";
            phaseTimer: number;
        }

        let lightning: LightningBolt | null = null;
        let lightningTimeout: ReturnType<typeof setTimeout>;

        interface Drop {
            x: number;
            y: number;
            length: number;
            speed: number;
            opacity: number;
            width: number;
        }

        // Build a zigzag bolt from top → bottom of canvas
        const buildBolt = (startX: number) => {
            const segs: { x: number; y: number }[] = [{ x: startX, y: 0 }];
            let x = startX;
            const segCount = 12 + Math.floor(Math.random() * 8);
            const segH = canvas.height / segCount;
            for (let i = 1; i <= segCount; i++) {
                x += (Math.random() - 0.5) * 80;
                x = Math.max(20, Math.min(canvas.width - 20, x));
                segs.push({ x, y: i * segH });
            }
            return segs;
        };

        // Build a shorter branch off a random segment
        const buildBranch = (
            segs: { x: number; y: number }[],
            segIdx: number
        ) => {
            const origin = segs[segIdx];
            const branchSegs: { x: number; y: number }[] = [{ ...origin }];
            let bx = origin.x;
            const count = 3 + Math.floor(Math.random() * 4);
            for (let i = 1; i <= count; i++) {
                bx += (Math.random() - 0.5) * 50;
                branchSegs.push({
                    x: bx,
                    y: origin.y + i * 30,
                });
            }
            return branchSegs;
        };

        // Fires the bolt visually (no scheduling)
        const fireLightning = () => {
            const startX = canvas.width * (0.2 + Math.random() * 0.6);
            const mainSegs = buildBolt(startX);

            const branchCount = 1 + Math.floor(Math.random() * 3);
            const branches = Array.from({ length: branchCount }, () => {
                const idx = 2 + Math.floor(Math.random() * (mainSegs.length - 3));
                return {
                    segments: buildBranch(mainSegs, idx),
                    opacity: 0.4 + Math.random() * 0.4,
                };
            });

            lightning = {
                x: startX,
                segments: mainSegs,
                branches,
                flashOpacity: 0.18 + Math.random() * 0.12,
                boltOpacity: 1,
                phase: "flash",
                phaseTimer: 0,
            };
        };

        // Scheduling loop — always triggers next from here
        const scheduleLightning = () => {
            const delay = 5000 + Math.random() * 5000; // 5–10 detik
            lightningTimeout = setTimeout(() => {
                fireLightning();
                // 30% chance of double-strike after 80–150ms
                if (Math.random() < 0.3) {
                    setTimeout(fireLightning, 80 + Math.random() * 70);
                }
                scheduleLightning(); // queue next
            }, delay);
        };

        // Draw a bolt (main or branch)
        const drawBoltPath = (
            segs: { x: number; y: number }[],
            opacity: number,
            lineWidth: number
        ) => {
            if (segs.length < 2) return;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(segs[0].x, segs[0].y);
            for (let i = 1; i < segs.length; i++) {
                ctx.lineTo(segs[i].x, segs[i].y);
            }
            // Outer glow
            ctx.shadowBlur = 20;
            ctx.shadowColor = `rgba(200, 220, 255, ${opacity})`;
            ctx.strokeStyle = `rgba(220, 240, 255, ${opacity})`;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.stroke();
            // Inner bright core
            ctx.shadowBlur = 6;
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.9})`;
            ctx.lineWidth = lineWidth * 0.4;
            ctx.stroke();
            ctx.restore();
        };

        const drawLightning = () => {
            if (!lightning) return;

            // Full-screen flash overlay
            if (lightning.flashOpacity > 0) {
                ctx.save();
                ctx.fillStyle = `rgba(190, 210, 255, ${lightning.flashOpacity})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.restore();
            }

            // Main bolt
            drawBoltPath(lightning.segments, lightning.boltOpacity, 2.5);

            // Branches
            for (const branch of lightning.branches) {
                drawBoltPath(
                    branch.segments,
                    lightning.boltOpacity * branch.opacity,
                    1.2
                );
            }

            // Fade logic
            if (lightning.phase === "flash") {
                lightning.phaseTimer++;
                if (lightning.phaseTimer > 2) {
                    lightning.phase = "fade";
                    lightning.phaseTimer = 0;
                }
            } else {
                lightning.boltOpacity -= 0.08;
                lightning.flashOpacity -= 0.03;
                if (lightning.boltOpacity <= 0) {
                    lightning = null;
                }
            }
        };

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const createDrops = () => {
            drops = [];
            const count = Math.floor((canvas.width * canvas.height) / 12000);
            for (let i = 0; i < count; i++) {
                drops.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    length: Math.random() * 18 + 8,
                    speed: Math.random() * 3 + 2,
                    opacity: Math.random() * 0.12 + 0.03,
                    width: Math.random() * 0.8 + 0.3,
                });
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Rain drops
            for (const drop of drops) {
                ctx.beginPath();
                ctx.moveTo(drop.x, drop.y);
                ctx.lineTo(drop.x + 0.5, drop.y + drop.length);
                ctx.strokeStyle = `rgba(174, 194, 224, ${drop.opacity})`;
                ctx.lineWidth = drop.width;
                ctx.lineCap = "round";
                ctx.stroke();

                drop.y += drop.speed;

                if (drop.y > canvas.height) {
                    drop.y = -drop.length;
                    drop.x = Math.random() * canvas.width;
                }
            }

            // Lightning bolt (drawn on top of rain)
            drawLightning();

            animationId = requestAnimationFrame(draw);
        };

        resize();
        createDrops();
        draw();

        // First lightning after 3–6 seconds
        lightningTimeout = setTimeout(
            scheduleLightning,
            3000 + Math.random() * 3000
        );

        const handleResize = () => {
            resize();
            createDrops();
        };
        window.addEventListener("resize", handleResize);

        return () => {
            cancelAnimationFrame(animationId);
            clearTimeout(lightningTimeout);
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 1,
            }}
            aria-hidden="true"
        />
    );
}
