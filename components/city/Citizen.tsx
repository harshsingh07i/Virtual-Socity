'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Agent } from '@/lib/society';

interface CitizenProps {
  agent: Agent;
  targetX: number; // 0 to 1000
  targetY: number; // 0 to 1000
  isSelected: boolean;
  onClick: () => void;
  speed: number;
}

export default function Citizen({
  agent,
  targetX,
  targetY,
  isSelected,
  onClick,
  speed,
}: CitizenProps) {
  const [currentPos, setCurrentPos] = useState({ x: targetX, y: targetY });
  const [facingLeft, setFacingLeft] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const prevPosRef = useRef({ x: targetX, y: targetY });

  // Update movement state and direction facing when destination changes
  useEffect(() => {
    const prev = prevPosRef.current;
    const dx = targetX - prev.x;
    const dy = targetY - prev.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 3) {
      if (Math.abs(dx) > 1) {
        setFacingLeft(dx < 0);
      }
      setIsMoving(true);
      setCurrentPos({ x: targetX, y: targetY });
      prevPosRef.current = { x: targetX, y: targetY };

      // Duration scales smoothly with simulation speed
      const moveDuration = Math.max(20, Math.round(850 / (speed || 1)));
      const timer = setTimeout(() => {
        setIsMoving(false);
      }, moveDuration);
      return () => clearTimeout(timer);
    } else {
      setCurrentPos({ x: targetX, y: targetY });
      prevPosRef.current = { x: targetX, y: targetY };
    }
  }, [targetX, targetY, speed]);

  // Action categorization
  const actionText = (agent.lastAction || '').toLowerCase();
  let actionType: 'work' | 'rest' | 'eat' | 'trade' | 'socialize' | 'help' | 'idle' = 'idle';
  let actionIcon = '📍';
  let actionLabel = 'Settled';
  let badgeColor = 'bg-slate-900/90 text-slate-200 border-slate-700/60';

  if (actionText.includes('worked') || actionText.includes('earn')) {
    actionType = 'work';
    actionIcon = '⚡';
    actionLabel = 'Working (+12)';
    badgeColor = 'bg-amber-950/90 text-amber-300 border-amber-500/60';
  } else if (actionText.includes('rested') || actionText.includes('energy')) {
    actionType = 'rest';
    actionIcon = '💤';
    actionLabel = 'Resting (+22)';
    badgeColor = 'bg-blue-950/90 text-blue-300 border-blue-500/60';
  } else if (actionText.includes('meal') || actionText.includes('eat') || actionText.includes('bought')) {
    actionType = 'eat';
    actionIcon = '🍲';
    actionLabel = 'Eating (-8)';
    badgeColor = 'bg-rose-950/90 text-rose-300 border-rose-500/60';
  } else if (actionText.includes('transferred') || actionText.includes('trade')) {
    actionType = 'trade';
    actionIcon = '🪙';
    actionLabel = 'Trading (-5)';
    badgeColor = 'bg-purple-950/90 text-purple-300 border-purple-500/60';
  } else if (actionText.includes('gave') || actionText.includes('help')) {
    actionType = 'help';
    actionIcon = '🤝';
    actionLabel = 'Helping (+3)';
    badgeColor = 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60';
  } else if (actionText.includes('patrol') || actionText.includes('safety') || actionText.includes('police')) {
    actionType = 'work';
    actionIcon = '🛡️';
    actionLabel = 'Patrolling';
    badgeColor = 'bg-blue-950/90 text-blue-300 border-blue-400/60';
  } else if (actionText.includes('petition') || actionText.includes('council')) {
    actionType = 'help';
    actionIcon = '📜';
    actionLabel = 'Petitioning';
    badgeColor = 'bg-amber-950/90 text-amber-300 border-amber-400/60';
  } else if (actionText.includes('inspect') || actionText.includes('audit')) {
    actionType = 'work';
    actionIcon = '🔍';
    actionLabel = 'Inspecting';
    badgeColor = 'bg-indigo-950/90 text-indigo-300 border-indigo-400/60';
  } else if (actionText.includes('vote') || actionText.includes('ballot')) {
    actionType = 'socialize';
    actionIcon = '🗳️';
    actionLabel = 'Voting';
    badgeColor = 'bg-emerald-950/90 text-emerald-300 border-emerald-400/60';
  }

  // Calculate transition duration and walk animation rate based on speed
  const transitionSec = Math.max(0.02, 0.85 / (speed || 1)).toFixed(3);
  const walkDuration = Math.max(0.035, 0.32 / Math.sqrt(speed || 1)).toFixed(3);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="citizen-token select-none"
      style={{
        left: `${currentPos.x / 10}%`,
        top: `${currentPos.y / 10}%`,
        transition: `left ${transitionSec}s cubic-bezier(0.2, 0.9, 0.3, 1), top ${transitionSec}s cubic-bezier(0.2, 0.9, 0.3, 1)`,
        ['--walk-duration' as any]: `${walkDuration}s`,
      }}
    >
      {/* Selection Beacon Ripple */}
      {isSelected && (
        <div className="absolute -inset-2.5 rounded-full border-2 border-[#76f2c0] animate-ping opacity-60 pointer-events-none" />
      )}

      {/* Floating Action Emote / Speech Bubble */}
      <div className="citizen-bubble">
        <div
          className={`bubble-tail flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-bold shadow-md transition-all ${badgeColor}`}
        >
          <span>{actionIcon}</span>
          <span className="max-w-[100px] truncate">{agent.name}: {actionLabel}</span>
        </div>
      </div>

      {/* Tiny Cartoon Humanoid AI Character (Chibi SVG) */}
      <div
        className={`relative flex flex-col items-center cursor-pointer transition-transform duration-150 hover:scale-120 ${
          isMoving ? 'walking-citizen' : 'agent-idle-bob'
        } ${isSelected ? 'scale-115' : ''}`}
        style={{
          transform: facingLeft ? 'scaleX(-1)' : 'scaleX(1)',
        }}
      >
        {/* Soft Ground Shadow */}
        <div className="absolute -bottom-1 h-3 w-8 rounded-full bg-black/35 blur-[1.5px]" />

        <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* 1. Left & Right Animated Legs */}
          <g id="legs">
            {/* Left Leg */}
            <rect
              x="11"
              y="28"
              width="4"
              height="8"
              rx="2"
              fill="#1e293b"
              className={isMoving ? 'animate-leg-left' : ''}
            />
            {/* Left Shoe */}
            <ellipse cx="12" cy="36" rx="3.5" ry="2" fill="#0f172a" />

            {/* Right Leg */}
            <rect
              x="19"
              y="28"
              width="4"
              height="8"
              rx="2"
              fill="#1e293b"
              className={isMoving ? 'animate-leg-right' : ''}
            />
            {/* Right Shoe */}
            <ellipse cx="20" cy="36" rx="3.5" ry="2" fill="#0f172a" />
          </g>

          {/* 2. Compact Torso / Clothing with Agent Color */}
          <rect
            x="9"
            y="17"
            width="16"
            height="13"
            rx="4"
            fill={agent.color}
            stroke="#0f172a"
            strokeWidth="1.2"
          />

          {/* Small collar / button detail */}
          <circle cx="17" cy="20" r="1.5" fill="#ffffff" />
          <circle cx="17" cy="24" r="1.5" fill="#ffffff" />

          {/* 3. Left & Right Animated Arms */}
          <g id="arms">
            {/* Left Arm */}
            <rect
              x="5"
              y="18"
              width="4"
              height="9"
              rx="2"
              fill={agent.color}
              stroke="#0f172a"
              strokeWidth="0.8"
              className={isMoving ? 'animate-arm-left' : ''}
            />
            {/* Left Hand */}
            <circle cx="7" cy="27" r="2" fill="#fde68a" />

            {/* Right Arm */}
            <rect
              x="25"
              y="18"
              width="4"
              height="9"
              rx="2"
              fill={agent.color}
              stroke="#0f172a"
              strokeWidth="0.8"
              className={isMoving ? 'animate-arm-right' : ''}
            />
            {/* Right Hand */}
            <circle cx="27" cy="27" r="2" fill="#fde68a" />
          </g>

          {/* 4. Rounded Head with Expressive Chibi Face */}
          <circle cx="17" cy="11" r="9" fill="#fde68a" stroke="#0f172a" strokeWidth="1.2" />

          {/* Hair or Hat based on occupation */}
          <path
            d="M 9 10 Q 17 2 25 10 Q 22 5 17 6 Q 12 5 9 10 Z"
            fill={agent.color}
            stroke="#0f172a"
            strokeWidth="0.8"
          />

          {/* Cute Eyes (With periodic blinking animation) */}
          <circle cx="14" cy="11" r="1.5" fill="#0f172a" className="animate-blink" />
          <circle cx="20" cy="11" r="1.5" fill="#0f172a" className="animate-blink" />

          {/* Smile Mouth */}
          <path d="M 15 15 Q 17 17 19 15" stroke="#0f172a" strokeWidth="1" strokeLinecap="round" fill="none" />

          {/* Role specific small accessory badge */}
          {agent.role === 'Chef' && (
            <path d="M 12 4 Q 17 -1 22 4 L 21 6 L 13 6 Z" fill="#ffffff" stroke="#0f172a" strokeWidth="0.8" />
          )}
          {agent.role === 'Builder' && (
            <path d="M 11 5 Q 17 1 23 5 L 24 7 L 10 7 Z" fill="#f59e0b" stroke="#0f172a" strokeWidth="0.8" />
          )}
          {agent.role === 'Researcher' && (
            <circle cx="17" cy="11" r="4.5" fill="none" stroke="#38bdf8" strokeWidth="0.8" />
          )}
        </svg>

        {/* Small Name & Credit Badge */}
        <div
          className={`-mt-1 flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[8px] font-black border shadow-md ${
            isSelected
              ? 'bg-[#76f2c0] text-black border-white'
              : 'bg-[#0b121e]/90 text-slate-200 border-white/10'
          }`}
          style={{ transform: facingLeft ? 'scaleX(-1)' : 'none' }}
        >
          <span>{agent.name}</span>
          <span className="font-mono text-[#fbbf24] font-normal">·{agent.credits}</span>
        </div>
      </div>
    </div>
  );
}
