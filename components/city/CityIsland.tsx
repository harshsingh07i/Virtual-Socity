'use client';
import React, { useMemo } from 'react';
import { TreeDefinition, StoneDefinition, FlowerPatch } from './types';

interface CityIslandProps {
  hour: number;
}

export default function CityIsland({ hour }: CityIslandProps) {
  // Static decorative trees scattered naturally around the perimeter and park
  const trees: TreeDefinition[] = useMemo(
    () => [
      // Top-left natural grove
      { x: 110, y: 120, size: 28, type: 'oak' },
      { x: 140, y: 90, size: 24, type: 'pine' },
      { x: 90, y: 155, size: 22, type: 'oak' },
      { x: 235, y: 110, size: 26, type: 'blossom' },

      // Top-right grove
      { x: 870, y: 110, size: 26, type: 'pine' },
      { x: 910, y: 140, size: 22, type: 'oak' },
      { x: 740, y: 105, size: 25, type: 'blossom' },

      // Bottom-left grove
      { x: 100, y: 880, size: 27, type: 'oak' },
      { x: 135, y: 915, size: 23, type: 'pine' },
      { x: 250, y: 895, size: 26, type: 'oak' },

      // Bottom-right grove
      { x: 890, y: 880, size: 28, type: 'oak' },
      { x: 915, y: 840, size: 24, type: 'pine' },
      { x: 735, y: 895, size: 25, type: 'blossom' },

      // Mid-West Bio-Park trees
      { x: 115, y: 440, size: 26, type: 'blossom' },
      { x: 105, y: 550, size: 28, type: 'oak' },
      { x: 135, y: 495, size: 24, type: 'blossom' },

      // Mid-East perimeter
      { x: 890, y: 490, size: 26, type: 'oak' },
      { x: 905, y: 560, size: 24, type: 'pine' },

      // Inner plaza decorative trees
      { x: 420, y: 430, size: 18, type: 'blossom' },
      { x: 580, y: 430, size: 18, type: 'blossom' },
      { x: 420, y: 570, size: 18, type: 'oak' },
      { x: 580, y: 570, size: 18, type: 'oak' },
    ],
    []
  );

  // Decorative stones
  const stones: StoneDefinition[] = useMemo(
    () => [
      { x: 155, y: 270, size: 12 },
      { x: 180, y: 290, size: 8 },
      { x: 835, y: 290, size: 11 },
      { x: 810, y: 710, size: 10 },
      { x: 175, y: 720, size: 12 },
      { x: 490, y: 360, size: 9 },
      { x: 515, y: 640, size: 9 },
      { x: 890, y: 350, size: 14 },
    ],
    []
  );

  // Flower patches
  const flowers: FlowerPatch[] = useMemo(
    () => [
      { x: 130, y: 465, color: '#f472b6' },
      { x: 145, y: 535, color: '#fbbf24' },
      { x: 450, y: 415, color: '#f87171' },
      { x: 550, y: 415, color: '#60a5fa' },
      { x: 450, y: 585, color: '#a78bfa' },
      { x: 550, y: 585, color: '#fbbf24' },
      { x: 220, y: 750, color: '#34d399' },
      { x: 775, y: 750, color: '#f472b6' },
    ],
    []
  );

  // Dynamic sky/time tint for ambient realism
  const isNight = hour >= 21 || hour < 6;
  const isDusk = (hour >= 18 && hour < 21) || (hour >= 6 && hour < 8);

  return (
    <svg
      viewBox="0 0 1000 1000"
      className="absolute inset-0 h-full w-full select-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Island Grass Gradient */}
        <linearGradient id="islandGrass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#48a860" />
          <stop offset="50%" stopColor="#3d9b54" />
          <stop offset="100%" stopColor="#328a47" />
        </linearGradient>

        {/* Soft island soil drop shadow */}
        <filter id="islandShadow" x="-10%" y="-10%" width="120%" height="125%">
          <feDropShadow dx="0" dy="18" stdDeviation="22" floodColor="#000000" floodOpacity="0.75" />
        </filter>

        {/* Building & Tree Drop Shadow */}
        <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#000000" floodOpacity="0.32" />
        </filter>

        {/* Road & Cobblestone Texture */}
        <pattern id="cobblePattern" width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill="#e8dfc8" />
          <circle cx="4" cy="4" r="2.5" fill="#dfd5bc" opacity="0.7" />
          <circle cx="12" cy="12" r="2.5" fill="#dfd5bc" opacity="0.7" />
          <circle cx="12" cy="4" r="2" fill="#d4c9ad" opacity="0.5" />
          <circle cx="4" cy="12" r="2" fill="#d4c9ad" opacity="0.5" />
        </pattern>

        {/* Grass Noise Pattern */}
        <pattern id="grassTufts" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M 8 18 Q 10 12 12 18 M 18 10 Q 20 6 22 10" stroke="#2d7c3f" strokeWidth="1.5" fill="none" opacity="0.45" />
        </pattern>

        {/* Pond Water Gradient */}
        <linearGradient id="pondWater" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>

      {/* 1. Main Square Island Base with Rounded Corners */}
      <rect
        x="60"
        y="60"
        width="880"
        height="880"
        rx="56"
        ry="56"
        fill="#265a32"
        filter="url(#islandShadow)"
      />

      {/* 2. Top Grass Surface with subtle inset rim */}
      <rect
        x="64"
        y="64"
        width="872"
        height="864"
        rx="52"
        ry="52"
        fill="url(#islandGrass)"
      />

      {/* Decorative grass texture overlay */}
      <rect
        x="64"
        y="64"
        width="872"
        height="864"
        rx="52"
        ry="52"
        fill="url(#grassTufts)"
      />

      {/* 3. Small Natural Pond in Mid-West Bio-Park */}
      <g>
        <ellipse cx="140" cy="510" rx="38" ry="26" fill="#1b4d3e" opacity="0.6" />
        <ellipse cx="140" cy="508" rx="35" ry="23" fill="url(#pondWater)" />
        {/* Lily pad */}
        <ellipse cx="132" cy="504" rx="6" ry="4" fill="#22c55e" />
        <ellipse cx="152" cy="512" rx="7" ry="5" fill="#16a34a" />
        <circle cx="155" cy="510" r="2" fill="#f472b6" />
      </g>

      {/* 4. Radial Roads & Cobblestone Network */}
      <g id="roadNetwork">
        {/* Outer Circular Arterial Avenue connecting all residential areas */}
        <circle
          cx="500"
          cy="500"
          r="265"
          fill="none"
          stroke="#e8dfc8"
          strokeWidth="18"
          opacity="0.95"
        />
        <circle
          cx="500"
          cy="500"
          r="265"
          fill="none"
          stroke="url(#cobblePattern)"
          strokeWidth="16"
        />

        {/* 10 Radial Roads connecting Central Plaza to the 10 Houses */}
        {Array.from({ length: 10 }).map((_, i) => {
          const angle = ((-90 + i * 36) * Math.PI) / 180;
          const x2 = 500 + 265 * Math.cos(angle);
          const y2 = 500 + 265 * Math.sin(angle);
          return (
            <line
              key={`radial-road-${i}`}
              x1="500"
              y1="500"
              x2={x2}
              y2={y2}
              stroke="#e8dfc8"
              strokeWidth="16"
              strokeLinecap="round"
            />
          );
        })}

        {/* Roads to the 4 Outer Quadrant Districts */}
        {/* NW Government & Justice District (City Hall, Police, Court, Holding) */}
        <path
          d="M 345 285 Q 260 210 220 140"
          fill="none"
          stroke="#e8dfc8"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d="M 220 140 L 310 140 M 220 140 L 140 220 M 140 220 L 220 230"
          fill="none"
          stroke="#e8dfc8"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* NE Economy & Commerce District (Market, Grocery, Bank, Offices) */}
        <path
          d="M 655 285 Q 700 210 720 140"
          fill="none"
          stroke="#e8dfc8"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d="M 720 140 L 810 140 M 810 140 L 890 220 M 800 220 L 890 220"
          fill="none"
          stroke="#e8dfc8"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* SW Heavy Industry & Utilities (Power, Water, Waste, Workshop, Factory) */}
        <path
          d="M 345 715 Q 280 750 230 870"
          fill="none"
          stroke="#e8dfc8"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d="M 140 780 L 220 780 M 220 780 L 230 870 M 140 860 L 230 870 M 230 870 L 320 870"
          fill="none"
          stroke="#e8dfc8"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* SE Public Services, Health & Food (Hospital, Fire, Cafe, Academy, Warehouse) */}
        <path
          d="M 655 715 Q 720 760 780 860"
          fill="none"
          stroke="#e8dfc8"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d="M 770 780 L 860 780 M 860 780 L 870 870 M 780 860 L 870 870 M 680 860 L 780 860"
          fill="none"
          stroke="#e8dfc8"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* East Avenue into Transit Hub & Apartments */}
        <path
          d="M 765 500 L 890 500 M 890 500 L 880 360 M 890 500 L 880 640"
          fill="none"
          stroke="#e8dfc8"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* West Avenue into Quantum Lab & Bio-Park */}
        <path
          d="M 235 500 L 140 510 M 235 418 L 120 360"
          fill="none"
          stroke="#e8dfc8"
          strokeWidth="14"
          strokeLinecap="round"
        />
      </g>

      {/* 5. Central Circular Town Plaza */}
      <g id="townPlaza">
        {/* Plaza Cobblestone Base */}
        <circle cx="500" cy="500" r="108" fill="#d8ceb4" filter="url(#softShadow)" />
        <circle cx="500" cy="500" r="104" fill="url(#cobblePattern)" />
        <circle cx="500" cy="500" r="104" fill="none" stroke="#baae93" strokeWidth="3" />

        {/* Inner concentric ring with decorative brick inlay */}
        <circle cx="500" cy="500" r="68" fill="none" stroke="#b4a78c" strokeWidth="2" strokeDasharray="6,4" />
        <circle cx="500" cy="500" r="46" fill="#ded5be" />

        {/* Central Fountain / Monument Base */}
        <ellipse cx="500" cy="504" rx="34" ry="24" fill="#a89a7f" />
        <ellipse cx="500" cy="500" rx="32" ry="22" fill="#7ba3b8" />
        <ellipse cx="500" cy="499" rx="28" ry="18" fill="#588da6" />

        {/* Fountain Water Center */}
        <ellipse cx="500" cy="497" rx="16" ry="11" fill="#7dd3fc" />
        <circle cx="500" cy="496" r="5" fill="#bae6fd" />

        {/* Central Stone Archway / Town Monument */}
        <g id="monumentArch">
          {/* Left Stone Pillar */}
          <rect x="478" y="468" width="6" height="24" rx="2" fill="#cbd5e1" />
          <rect x="477" y="466" width="8" height="4" rx="1" fill="#94a3b8" />
          {/* Right Stone Pillar */}
          <rect x="516" y="468" width="6" height="24" rx="2" fill="#cbd5e1" />
          <rect x="515" y="466" width="8" height="4" rx="1" fill="#94a3b8" />
          {/* Arch Beam */}
          <path d="M 476 468 Q 500 452 524 468 L 524 462 Q 500 446 476 462 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.8" />
          {/* Small Bell or Star in Arch */}
          <circle cx="500" cy="460" r="3.5" fill="#f59e0b" />

          {/* Model Provider Flag Placed on Town Monument */}
          <rect x="498" y="438" width="2" height="18" fill="#475569" />
          <path d="M 500 438 L 520 444 L 500 450 Z" fill="#76f2c0" />
        </g>
      </g>

      {/* 6. Decorative Stones on Grass */}
      {stones.map((s, idx) => (
        <g key={`stone-${idx}`}>
          <ellipse cx={s.x} cy={s.y + 1} rx={s.size * 0.9} ry={s.size * 0.55} fill="#000000" opacity="0.2" />
          <ellipse cx={s.x} cy={s.y} rx={s.size * 0.85} ry={s.size * 0.5} fill="#94a3b8" />
          <ellipse cx={s.x - 1} cy={s.y - 1} rx={s.size * 0.6} ry={s.size * 0.35} fill="#cbd5e1" />
        </g>
      ))}

      {/* 7. Flower Patches on Grass */}
      {flowers.map((f, idx) => (
        <g key={`flower-${idx}`}>
          <circle cx={f.x} cy={f.y} r="3.5" fill={f.color} opacity="0.9" />
          <circle cx={f.x + 5} cy={f.y - 3} r="3" fill="#ffffff" opacity="0.8" />
          <circle cx={f.x - 4} cy={f.y + 3} r="3.2" fill={f.color} opacity="0.85" />
          <circle cx={f.x + 3} cy={f.y + 4} r="2.8" fill="#fef08a" opacity="0.9" />
        </g>
      ))}

      {/* 8. Trees with Top-Down Soft Shading */}
      {trees.map((t, idx) => (
        <g key={`tree-${idx}`} filter="url(#softShadow)">
          {/* Tree Shadow */}
          <ellipse cx={t.x} cy={t.y + 7} rx={t.size * 1.1} ry={t.size * 0.65} fill="#000000" opacity="0.25" />

          {/* Tree Trunk Base */}
          <rect x={t.x - 3} y={t.y + 1} width="6" height="8" rx="2" fill="#78350f" />

          {/* Tree Foliage Canopy */}
          {t.type === 'blossom' ? (
            <>
              <circle cx={t.x} cy={t.y} r={t.size} fill="#f472b6" />
              <circle cx={t.x - 4} cy={t.y - 4} r={t.size * 0.75} fill="#fbcfe8" />
              <circle cx={t.x + 3} cy={t.y + 3} r={t.size * 0.6} fill="#db2777" opacity="0.4" />
            </>
          ) : t.type === 'pine' ? (
            <>
              <polygon
                points={`${t.x},${t.y - t.size * 1.3} ${t.x - t.size * 0.9},${t.y + t.size * 0.6} ${t.x + t.size * 0.9},${t.y + t.size * 0.6}`}
                fill="#166534"
              />
              <polygon
                points={`${t.x},${t.y - t.size * 1.1} ${t.x - t.size * 0.75},${t.y + t.size * 0.2} ${t.x + t.size * 0.75},${t.y + t.size * 0.2}`}
                fill="#15803d"
              />
              <polygon
                points={`${t.x},${t.y - t.size * 0.9} ${t.x - t.size * 0.6},${t.y - t.size * 0.1} ${t.x + t.size * 0.6},${t.y - t.size * 0.1}`}
                fill="#22c55e"
              />
            </>
          ) : (
            <>
              {/* Lush Oak Tree */}
              <circle cx={t.x} cy={t.y} r={t.size} fill="#15803d" />
              <circle cx={t.x - 5} cy={t.y - 5} r={t.size * 0.72} fill="#22c55e" />
              <circle cx={t.x + 4} cy={t.y + 3} r={t.size * 0.65} fill="#166534" opacity="0.35" />
            </>
          )}
        </g>
      ))}

      {/* 9. Ambient Lighting Tint (Night / Dusk / Day Overlay) */}
      {isNight && (
        <rect
          x="60"
          y="60"
          width="880"
          height="880"
          rx="56"
          ry="56"
          fill="#0c1829"
          opacity="0.38"
          pointerEvents="none"
        />
      )}
      {isDusk && (
        <rect
          x="60"
          y="60"
          width="880"
          height="880"
          rx="56"
          ry="56"
          fill="#4a154b"
          opacity="0.16"
          pointerEvents="none"
        />
      )}
    </svg>
  );
}
