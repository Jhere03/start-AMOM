/**
 * Geometría del ramo de flores amarillas dibujado como constelación.
 * Todo se calcula de forma determinista para que servidor y cliente coincidan.
 */

export type Point = { x: number; y: number };

export type Star = Point & {
  size: number;
  bright: boolean;
  delay: number;
  twinkle: number; // segundos de desfase del parpadeo
};

export type Line = { d: string; delay: number; duration: number };

export type Petal = {
  index: number;
  stars: Star[];
  line: Line;
  shape: string; // contorno suave del pétalo (relleno + zona táctil)
  tip: Point;
};

export type Flower = {
  center: Point;
  radius: number;
  petals: Petal[];
  ring: Star[];
  ringLine: Line;
  seeds: Star[];
};

export type Constellation = {
  main: Flower;
  side: Flower[];
  stems: { stars: Star[]; line: Line }[];
  leaves: { stars: Star[]; line: Line }[];
  bow: { stars: Star[]; line: Line };
  duration: number;
};

// Contornos del pétalo en coordenadas locales: [distancia al centro, desplazamiento lateral]
const PETAL_DETAILED: [number, number][] = [
  [0.3, -0.07],
  [0.55, -0.155],
  [0.85, -0.1],
  [1, 0],
  [0.85, 0.1],
  [0.55, 0.155],
  [0.3, 0.07],
];

const PETAL_SIMPLE: [number, number][] = [
  [0.3, -0.09],
  [0.6, -0.22],
  [1, 0],
  [0.6, 0.22],
  [0.3, 0.09],
];

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

// Pseudoaleatorio estable (misma salida en SSR y en el navegador)
function seeded(n: number) {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

const round = (n: number) => Math.round(n * 100) / 100;

function toPath(points: Point[], closed = false) {
  const d = points.map((p, i) => `${i ? "L" : "M"}${round(p.x)} ${round(p.y)}`).join(" ");
  return closed ? `${d} Z` : d;
}

// Catmull-Rom → Bézier para un contorno cerrado y suave
function smoothClosedPath(points: Point[]) {
  const n = points.length;
  let d = `M${round(points[0].x)} ${round(points[0].y)}`;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C${round(c1.x)} ${round(c1.y)} ${round(c2.x)} ${round(c2.y)} ${round(p2.x)} ${round(p2.y)}`;
  }
  return `${d} Z`;
}

let starCounter = 0;
function star(p: Point, delay: number, size = 1.6, bright = false): Star {
  starCounter++;
  return {
    x: round(p.x),
    y: round(p.y),
    size: round(size + seeded(starCounter) * 0.8),
    bright,
    delay: round(delay),
    twinkle: round(seeded(starCounter + 999) * 4),
  };
}

function buildFlower(
  center: Point,
  radius: number,
  petalCount: number,
  rotation: number,
  template: [number, number][],
  start: number,
  petalStep: number,
): Flower {
  const petals: Petal[] = [];

  for (let i = 0; i < petalCount; i++) {
    const angle = rotation + (i * 2 * Math.PI) / petalCount;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const pts = template.map(([d, l]) => ({
      x: center.x + d * radius * cos - l * radius * sin,
      y: center.y + d * radius * sin + l * radius * cos,
    }));
    const petalStart = start + i * petalStep;
    const tipIndex = Math.floor(pts.length / 2);

    petals.push({
      index: i,
      stars: pts.map((p, k) => star(p, petalStart + k * 0.05, k === tipIndex ? 2.4 : 1.4, k === tipIndex)),
      line: { d: toPath(pts), delay: petalStart + 0.1, duration: 0.7 },
      shape: smoothClosedPath(pts),
      tip: pts[tipIndex],
    });
  }

  const ringStart = start + petalCount * petalStep;
  const ringCount = Math.max(8, Math.round(petalCount * 1.2));
  const ringPts = Array.from({ length: ringCount }, (_, i) => {
    const a = rotation + (i * 2 * Math.PI) / ringCount;
    return {
      x: center.x + Math.cos(a) * radius * 0.24,
      y: center.y + Math.sin(a) * radius * 0.24,
    };
  });

  // Semillas en espiral de Fermat (como el centro de un girasol)
  const seedCount = Math.round(radius / 10);
  const seeds = Array.from({ length: seedCount }, (_, i) => {
    const r = radius * 0.19 * Math.sqrt((i + 0.5) / seedCount);
    const a = i * GOLDEN_ANGLE;
    return star(
      { x: center.x + Math.cos(a) * r, y: center.y + Math.sin(a) * r },
      ringStart + 0.3 + i * 0.03,
      0.7,
    );
  });

  return {
    center,
    radius,
    petals,
    ring: ringPts.map((p, i) => star(p, ringStart + i * 0.03, 1.1)),
    ringLine: { d: toPath(ringPts, true), delay: ringStart, duration: 0.9 },
    seeds,
  };
}

function strand(points: Point[], start: number, step: number, size = 1.3) {
  return {
    stars: points.map((p, i) => star(p, start + i * step, size, i === points.length - 1 && size > 1.5)),
    line: { d: toPath(points), delay: start, duration: step * points.length + 0.3 },
  };
}

export function buildConstellation(petalCount: number): Constellation {
  starCounter = 0;

  const main = buildFlower({ x: 300, y: 230 }, 150, petalCount, -Math.PI / 2, PETAL_DETAILED, 0.4, 0.22);
  const t = 0.4 + petalCount * 0.22 + 0.9;

  const stems = [
    strand(
      [
        { x: 300, y: 266 },
        { x: 297, y: 390 },
        { x: 302, y: 480 },
        { x: 299, y: 570 },
        { x: 300, y: 640 },
      ],
      t,
      0.12,
    ),
    strand(
      [
        { x: 138, y: 468 },
        { x: 175, y: 530 },
        { x: 228, y: 588 },
        { x: 284, y: 638 },
      ],
      t + 0.4,
      0.12,
    ),
    strand(
      [
        { x: 466, y: 448 },
        { x: 430, y: 515 },
        { x: 375, y: 580 },
        { x: 316, y: 638 },
      ],
      t + 0.4,
      0.12,
    ),
    strand(
      [
        { x: 300, y: 640 },
        { x: 290, y: 700 },
      ],
      t + 1.4,
      0.12,
    ),
    strand(
      [
        { x: 300, y: 640 },
        { x: 312, y: 702 },
      ],
      t + 1.4,
      0.12,
    ),
  ];

  const side = [
    buildFlower({ x: 130, y: 430 }, 82, 8, -Math.PI / 2 + 0.3, PETAL_SIMPLE, t + 0.8, 0.12),
    buildFlower({ x: 475, y: 410 }, 90, 8, -Math.PI / 2 - 0.2, PETAL_SIMPLE, t + 1.0, 0.12),
  ];

  const leafStart = t + 1.6;
  const leaves = [
    strand(
      [
        { x: 299, y: 500 },
        { x: 262, y: 478 },
        { x: 228, y: 486 },
        { x: 258, y: 508 },
        { x: 299, y: 500 },
      ],
      leafStart,
      0.08,
      1.1,
    ),
    strand(
      [
        { x: 300, y: 560 },
        { x: 338, y: 536 },
        { x: 374, y: 540 },
        { x: 344, y: 566 },
        { x: 300, y: 560 },
      ],
      leafStart + 0.2,
      0.08,
      1.1,
    ),
  ];

  // Lazo que une el ramo
  const bow = strand(
    [
      { x: 300, y: 640 },
      { x: 268, y: 622 },
      { x: 262, y: 648 },
      { x: 300, y: 640 },
      { x: 338, y: 622 },
      { x: 344, y: 648 },
      { x: 300, y: 640 },
    ],
    leafStart + 0.5,
    0.08,
    1.5,
  );

  return { main, side, stems, leaves, bow, duration: leafStart + 1.4 };
}
