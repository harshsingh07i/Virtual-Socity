'use client';
import React, { useEffect, useState } from 'react';
import { Event, Agent } from '@/lib/society';

interface CityEventOverlayProps {
  events: Event[];
  agents: Agent[];
}

interface FloatingCoin {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  label: string;
  kind: 'trade' | 'help' | 'work' | 'eat';
}

export default function CityEventOverlay({ events, agents }: CityEventOverlayProps) {
  const [floatingEffects, setFloatingEffects] = useState<FloatingCoin[]>([]);
  const lastProcessedId = React.useRef<number>(0);

  useEffect(() => {
    if (!events || events.length === 0) return;
    const latest = events[0];

    if (latest && latest.id !== lastProcessedId.current) {
      lastProcessedId.current = latest.id;

      // Check if event is trade, help, work, or eat
      if (latest.kind === 'trade' || latest.kind === 'help') {
        const actor = agents.find((a) => a.name === latest.agent);
        // Extract target from text e.g. "Milo transferred 5 credits to Zuri"
        const targetMatch = latest.text.match(/to\s+([A-Za-z]+)/i);
        const targetName = targetMatch ? targetMatch[1] : null;
        const target = agents.find((a) => a.name.toLowerCase() === targetName?.toLowerCase());

        if (actor && target) {
          const effectId = `trade-${latest.id}-${Date.now()}`;
          setFloatingEffects((prev) => [
            ...prev.slice(-4),
            {
              id: effectId,
              fromX: actor.x,
              fromY: actor.y,
              toX: target.x,
              toY: target.y,
              label: latest.kind === 'trade' ? '🪙 -5 Cr' : '🤝 +3 Aid',
              kind: latest.kind as 'trade' | 'help',
            },
          ]);

          setTimeout(() => {
            setFloatingEffects((prev) => prev.filter((e) => e.id !== effectId));
          }, 1800);
        }
      } else if (latest.kind === 'work') {
        const actor = agents.find((a) => a.name === latest.agent);
        if (actor) {
          const effectId = `work-${latest.id}-${Date.now()}`;
          setFloatingEffects((prev) => [
            ...prev.slice(-4),
            {
              id: effectId,
              fromX: actor.x,
              fromY: actor.y,
              toX: actor.x,
              toY: actor.y - 12,
              label: '⚡ +12 Cr',
              kind: 'work',
            },
          ]);
          setTimeout(() => {
            setFloatingEffects((prev) => prev.filter((e) => e.id !== effectId));
          }, 1600);
        }
      } else if (latest.kind === 'eat') {
        const actor = agents.find((a) => a.name === latest.agent);
        if (actor) {
          const effectId = `eat-${latest.id}-${Date.now()}`;
          setFloatingEffects((prev) => [
            ...prev.slice(-4),
            {
              id: effectId,
              fromX: actor.x,
              fromY: actor.y,
              toX: actor.x,
              toY: actor.y - 12,
              label: '🍲 -8 Cr (-35 Hunger)',
              kind: 'eat',
            },
          ]);
          setTimeout(() => {
            setFloatingEffects((prev) => prev.filter((e) => e.id !== effectId));
          }, 1600);
        }
      }
    }
  }, [events, agents]);

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {floatingEffects.map((effect) => {
        const isTransfer = effect.kind === 'trade' || effect.kind === 'help';
        return (
          <div
            key={effect.id}
            className={`absolute flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black shadow-lg ${
              effect.kind === 'trade'
                ? 'bg-purple-900/90 text-amber-300 border border-purple-500 animate-coin-float'
                : effect.kind === 'help'
                ? 'bg-emerald-900/90 text-emerald-300 border border-emerald-500 animate-coin-float'
                : effect.kind === 'work'
                ? 'bg-amber-900/90 text-amber-300 border border-amber-500 animate-float-up'
                : 'bg-rose-900/90 text-rose-300 border border-rose-500 animate-float-up'
            }`}
            style={{
              left: `${effect.fromX / 10}%`,
              top: `${effect.fromY / 10}%`,
              transform: 'translate(-50%, -50%)',
              ['--target-x' as string]: `${(effect.toX - effect.fromX) * 3}px`,
              ['--target-y' as string]: `${(effect.toY - effect.fromY) * 3}px`,
            }}
          >
            {effect.label}
          </div>
        );
      })}
    </div>
  );
}
