"use client";

import { memo, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Constellation, Line, Star } from "@/lib/constellation";

type Props = {
  constellation: Constellation;
  initial: string;
  selected: number | null;
  discovered: Set<number>;
  onSelect: (index: number) => void;
};

const SPARKLE = "M0 -1 Q0 0 1 0 Q0 0 0 1 Q0 0 -1 0 Q0 0 0 -1 Z";

const StarDot = memo(function StarDot({ star, instant }: { star: Star; instant: boolean }) {
  return (
    <g transform={`translate(${star.x} ${star.y})`}>
      <motion.g
        initial={instant ? false : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: star.delay, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <g className="star-twinkle" style={{ animationDelay: `${star.twinkle}s` }}>
          {star.bright && (
            <path d={SPARKLE} transform={`scale(${star.size * 3.2})`} fill="var(--star-core)" opacity={0.9} />
          )}
          <circle r={star.size} fill="var(--star-core)" />
        </g>
      </motion.g>
    </g>
  );
});

function ConstellationLine({ line, instant, strong }: { line: Line; instant: boolean; strong?: boolean }) {
  return (
    <motion.path
      d={line.d}
      fill="none"
      stroke="var(--star-line)"
      strokeWidth={strong ? 1.1 : 0.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={instant ? false : { pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: strong ? 0.85 : 0.55 }}
      transition={{ delay: line.delay, duration: line.duration, ease: "easeInOut" }}
    />
  );
}

export function StarBouquet({ constellation, initial, selected, discovered, onSelect }: Props) {
  const instant = !!useReducedMotion();
  const { main, side, stems, leaves, bow, duration } = constellation;

  const decorative = useMemo(
    () => [
      ...stems.map((s) => ({ ...s, strong: false })),
      ...leaves.map((s) => ({ ...s, strong: false })),
      { ...bow, strong: true },
    ],
    [stems, leaves, bow],
  );

  return (
    <svg
      viewBox="0 0 600 720"
      className="h-full w-full overflow-visible"
      role="group"
      aria-label="Constelación de flores amarillas. Cada pétalo de la flor principal guarda un motivo."
    >
      <defs>
        <filter id="star-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient
          id="petal-fill"
          gradientUnits="userSpaceOnUse"
          cx={main.center.x}
          cy={main.center.y}
          r={main.radius}
        >
          <stop offset="0%" stopColor="#FFB020" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#FFD34E" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#FFF1B8" stopOpacity="0.35" />
        </radialGradient>
        {side.map((flower, f) => (
          <radialGradient
            key={f}
            id={`side-fill-${f}`}
            gradientUnits="userSpaceOnUse"
            cx={flower.center.x}
            cy={flower.center.y}
            r={flower.radius}
          >
            <stop offset="0%" stopColor="#FFB020" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FFE59A" stopOpacity="0.4" />
          </radialGradient>
        ))}
        <radialGradient id="core-halo">
          <stop offset="0%" stopColor="#FFD34E" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFD34E" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Halo cálido detrás de la flor principal */}
      <motion.circle
        cx={main.center.x}
        cy={main.center.y}
        r={main.radius * 1.25}
        fill="url(#core-halo)"
        initial={instant ? false : { opacity: 0, scale: 0.6 }}
        animate={{ opacity: 0.35 + discovered.size * 0.04, scale: 1 }}
        transition={{ delay: 0.2, duration: 2.5 }}
      />

      {/* Rellenos suaves de las flores laterales */}
      {side.map((flower, f) => (
        <g key={f}>
          {flower.petals.map((petal) => (
            <motion.path
              key={petal.index}
              d={petal.shape}
              fill={`url(#side-fill-${f})`}
              initial={instant ? false : { opacity: 0 }}
              animate={{ opacity: 0.2 }}
              transition={{ delay: petal.line.delay + 0.4, duration: 1.2 }}
            />
          ))}
        </g>
      ))}

      {/* Rellenos de los pétalos (se iluminan al descubrir un motivo) */}
      <g>
        {main.petals.map((petal) => {
          const isSelected = selected === petal.index;
          const isDiscovered = discovered.has(petal.index);
          return (
            <motion.path
              key={petal.index}
              d={petal.shape}
              fill="url(#petal-fill)"
              initial={instant ? false : { opacity: 0 }}
              animate={{ opacity: isSelected ? 0.6 : isDiscovered ? 0.32 : 0.12 }}
              transition={{
                duration: 0.6,
                delay: isSelected || isDiscovered || instant ? 0 : petal.line.delay + 0.4,
              }}
              style={{ filter: isSelected ? "url(#star-glow)" : undefined }}
            />
          );
        })}
      </g>

      {/* Líneas y estrellas con resplandor */}
      <g filter="url(#star-glow)">
        {side.map((flower, f) => (
          <g key={f}>
            {flower.petals.map((p) => (
              <ConstellationLine key={p.index} line={p.line} instant={instant} />
            ))}
            <ConstellationLine line={flower.ringLine} instant={instant} />
          </g>
        ))}
        {decorative.map((s, i) => (
          <ConstellationLine key={i} line={s.line} instant={instant} strong={s.strong} />
        ))}
        {main.petals.map((p) => (
          <ConstellationLine key={p.index} line={p.line} instant={instant} strong />
        ))}
        <ConstellationLine line={main.ringLine} instant={instant} strong />

        {[main, ...side].flatMap((flower, f) => [
          ...flower.petals.flatMap((p) => p.stars.map((s, k) => <StarDot key={`f${f}p${p.index}s${k}`} star={s} instant={instant} />)),
          ...flower.ring.map((s, k) => <StarDot key={`f${f}r${k}`} star={s} instant={instant} />),
          ...flower.seeds.map((s, k) => <StarDot key={`f${f}d${k}`} star={s} instant={instant} />),
        ])}
        {decorative.flatMap((s, i) => s.stars.map((st, k) => <StarDot key={`d${i}s${k}`} star={st} instant={instant} />))}
      </g>

      {/* Inicial del nombre en el corazón de la flor */}
      <motion.text
        x={main.center.x}
        y={main.center.y + 2}
        textAnchor="middle"
        dominantBaseline="middle"
        className="font-script"
        fontSize={46}
        fill="#FFE59A"
        filter="url(#star-glow)"
        initial={instant ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: duration - 0.4, duration: 1.4 }}
        aria-hidden
      >
        {initial}
      </motion.text>

      {/* Zonas táctiles de cada pétalo (encima de todo) */}
      <g>
        {main.petals.map((petal) => (
          <path
            key={petal.index}
            d={petal.shape}
            fill="transparent"
            className="petal-hit"
            role="button"
            tabIndex={0}
            aria-label={`Pétalo ${petal.index + 1}: descubrir un motivo`}
            aria-pressed={selected === petal.index}
            onClick={() => onSelect(petal.index)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(petal.index);
              }
            }}
          />
        ))}
      </g>
    </svg>
  );
}
