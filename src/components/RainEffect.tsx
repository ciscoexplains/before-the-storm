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

        interface Drop {
            x: number;
            y: number;
            length: number;
            speed: number;
            opacity: number;
            width: number;
        }

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

            animationId = requestAnimationFrame(draw);
        };

        resize();
        createDrops();
        draw();

        window.addEventListener("resize", () => {
            resize();
            createDrops();
        });

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener("resize", resize);
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
