"use client";

import { useEffect, useRef } from "react";

type SkyStar = { x: number; y: number; r: number; a: number; speed: number; phase: number; hue: string };
type Meteor = { x: number; y: number; vx: number; vy: number; life: number; max: number };

const HUES = ["255,255,255", "255,244,214", "214,226,255", "255,226,160"];

export function NightSky() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let stars: SkyStar[] = [];
    let meteors: Meteor[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let nextMeteor = performance.now() + 2500;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(420, Math.round((width * height) / 3800));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() < 0.08 ? Math.random() * 1.1 + 0.9 : Math.random() * 0.8 + 0.2,
        a: Math.random() * 0.6 + 0.3,
        speed: Math.random() * 1.2 + 0.4,
        phase: Math.random() * Math.PI * 2,
        hue: HUES[Math.floor(Math.random() * HUES.length)],
      }));
    };

    const spawnMeteor = () => {
      const angle = Math.PI / 5 + Math.random() * 0.25;
      const speed = 9 + Math.random() * 5;
      meteors.push({
        x: Math.random() * width * 0.8 + width * 0.1,
        y: Math.random() * height * 0.35,
        vx: -Math.cos(angle) * speed * (Math.random() < 0.5 ? -1 : 1),
        vy: Math.sin(angle) * speed,
        life: 0,
        max: 55 + Math.random() * 30,
      });
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      const t = time / 1000;

      for (const s of stars) {
        const flicker = reduced ? 1 : 0.65 + 0.35 * Math.sin(t * s.speed + s.phase);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.hue},${s.a * flicker})`;
        ctx.fill();
        if (s.r > 1) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 3.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${s.hue},${0.06 * flicker})`;
          ctx.fill();
        }
      }

      if (reduced) return;

      if (time > nextMeteor) {
        spawnMeteor();
        nextMeteor = time + 3500 + Math.random() * 5000;
      }

      meteors = meteors.filter((m) => m.life < m.max);
      for (const m of meteors) {
        m.life++;
        m.x += m.vx;
        m.y += m.vy;
        const fade = Math.sin((m.life / m.max) * Math.PI);
        const tail = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 10, m.y - m.vy * 10);
        tail.addColorStop(0, `rgba(255,240,200,${0.9 * fade})`);
        tail.addColorStop(1, "rgba(255,240,200,0)");
        ctx.strokeStyle = tail;
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - m.vx * 10, m.y - m.vy * 10);
        ctx.stroke();
      }

      frame = requestAnimationFrame(draw);
    };

    resize();
    frame = requestAnimationFrame(draw);
    const onResize = () => {
      resize();
      if (reduced) draw(0);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="sky-gradient absolute inset-0" />
      <div className="nebula absolute inset-0" />
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
