'use client';
import React from 'react';
import { BuildingDefinition } from './types';

interface BuildingNodeProps {
  building: BuildingDefinition;
  occupantCount: number;
  isSelected?: boolean;
  onClick?: () => void;
  hour: number;
  isElectionActive?: boolean;
  isEmergencyActive?: boolean;
}

export default function BuildingNode({
  building,
  occupantCount,
  isSelected,
  onClick,
  hour,
  isElectionActive = false,
  isEmergencyActive = false,
}: BuildingNodeProps) {
  const isNight = hour >= 21 || hour < 6;
  const isDusk = (hour >= 18 && hour < 21) || (hour >= 6 && hour < 8);
  const windowGlow = isNight ? '#fde047' : isDusk ? '#fef08a' : '#bfdbfe';

  const condition = building.condition ?? 100;
  const isDamaged = condition < 50;
  const hasPowerOutage = building.powerStatus === false;
  const hasWaterOutage = building.waterStatus === false;

  return (
    <div
      onClick={onClick}
      className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 hover:scale-110 ${
        isSelected ? 'scale-115 drop-shadow-[0_0_20px_rgba(118,242,192,0.9)] ring-2 ring-[#76f2c0] rounded-xl' : ''
      }`}
      style={{
        left: `${building.x / 10}%`,
        top: `${building.y / 10}%`,
      }}
      title={`${building.name} (${building.label}) [${building.category}] - ${occupantCount} present | Condition: ${condition}%`}
    >
      {/* Visual Indicator: Sparks & Repair Needed if condition < 50% */}
      {isDamaged && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-0.5 rounded-full bg-rose-950/90 border border-rose-500/80 px-1.5 py-0.2 text-[8px] font-black text-rose-300 shadow-lg animate-pulse whitespace-nowrap">
          <span>⚠️</span>
          <span>{condition}% Repair</span>
        </div>
      )}

      {/* Visual Indicator: Outage Badges */}
      {(hasPowerOutage || hasWaterOutage) && (
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 rounded bg-black/85 px-1 py-0.2 text-[7px] font-bold text-amber-300 border border-amber-500/60 shadow">
          {hasPowerOutage && <span title="Power Outage">⚡ No Pwr</span>}
          {hasWaterOutage && <span title="Water Outage">💧 No H2O</span>}
        </div>
      )}

      {/* Visual Indicator: VOTE HERE banner on City Hall during Election */}
      {isElectionActive && building.type === 'government' && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 rounded-full bg-emerald-600 border border-emerald-300 px-2 py-0.5 text-[8px] font-black text-white shadow-xl animate-bounce tracking-wider">
          <span>🗳️</span>
          <span>VOTE HERE</span>
        </div>
      )}

      {/* 1. RESIDENTIAL PODS / HOUSES */}
      {building.type === 'house' && (
        <div className="relative flex flex-col items-center">
          <div className="absolute -bottom-1 h-6 w-14 rounded-full bg-black/25 blur-[3px]" />
          <div className="relative z-10 flex flex-col items-center">
            {/* Chimney & Smoke */}
            <div className="absolute -top-3 right-2 h-4 w-2.5 rounded-t-sm bg-[#78350f] border-t border-amber-900">
              {occupantCount > 0 && (
                <span className="absolute -top-2 left-0 h-2 w-2 animate-ping rounded-full bg-white/40" />
              )}
            </div>
            {/* Roof */}
            <div
              className="relative h-7 w-13 rounded-t-xl border-b-2 shadow-md flex items-center justify-center transition-colors"
              style={{ backgroundColor: building.roofColor, borderColor: building.accentColor }}
            >
              <div className="absolute inset-x-2 top-1 h-0.5 bg-white/30 rounded-full" />
              <div className="absolute inset-x-3 top-3 h-0.5 bg-black/15 rounded-full" />
            </div>
            {/* House Body */}
            <div className="relative h-8 w-11 rounded-b-md bg-[#fef3c7] border border-amber-200/80 shadow-sm flex items-end justify-between px-1.5 pb-0.5">
              <div
                className="mb-1 h-3 w-3 rounded-sm border border-amber-800/40 shadow-inner"
                style={{
                  backgroundColor: occupantCount > 0 ? '#fde047' : windowGlow,
                  boxShadow: occupantCount > 0 ? '0 0 8px #fde047' : 'none',
                }}
              />
              <div className="h-5 w-3 rounded-t-sm bg-[#92400e] border-t border-[#78350f] flex items-center justify-end pr-0.5">
                <div className="h-1 w-1 rounded-full bg-amber-200" />
              </div>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1 rounded-md bg-[#0a0f18dd] px-1.5 py-0.5 text-[9px] font-bold text-slate-200 border border-white/10 shadow-md">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: building.color }} />
            <span>{building.ownerName || building.label}</span>
          </div>
          {occupantCount > 0 && (
            <div className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#76f2c0] text-[9px] font-black text-black shadow-md animate-bounce">
              {occupantCount}
            </div>
          )}
        </div>
      )}

      {/* 2. GOVERNMENT: CITY HALL */}
      {building.type === 'government' && (
        <div className="relative flex flex-col items-center">
          <div className="absolute -bottom-1 h-8 w-24 rounded-full bg-black/35 blur-[4px]" />
          <div className="relative z-10 flex flex-col items-center">
            {/* Dome */}
            <div className="relative h-10 w-22 rounded-t-2xl bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 border-b-2 border-amber-900 shadow-lg flex flex-col items-center justify-center">
              <div className="absolute -top-3 h-4 w-8 rounded-t-full bg-gradient-to-t from-amber-500 to-amber-300 border border-amber-600 flex items-center justify-center">
                <div className="h-2 w-0.5 bg-amber-900" />
              </div>
              <div className="flex items-center gap-1 text-[11px] font-black text-amber-950">
                <span>🏛</span>
                <span className="text-[8px] uppercase tracking-wider font-extrabold text-amber-950">CITY HALL</span>
              </div>
            </div>
            {/* Portico */}
            <div className="h-11 w-20 rounded-b-lg bg-[#f8fafc] border border-slate-300 shadow-md flex items-end justify-between px-1.5 pb-1">
              <span className="h-8 w-2 bg-gradient-to-b from-slate-200 to-slate-400 rounded-t-sm shadow-sm" />
              <div className="h-7 w-5 rounded-t-md bg-[#1e293b] flex items-center justify-center text-[8px] text-amber-300 font-bold border-t border-amber-500">
                ⚖
              </div>
              <span className="h-8 w-2 bg-gradient-to-b from-slate-200 to-slate-400 rounded-t-sm shadow-sm" />
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1 rounded-md bg-[#0a0f18dd] px-2 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-500/40 shadow-md">
            <span>🏛 {building.label}</span>
            {occupantCount > 0 && <span className="text-white">({occupantCount})</span>}
          </div>
          {occupantCount > 0 && (
            <div className="absolute -top-3 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#76f2c0] text-[10px] font-black text-black shadow-lg animate-bounce">
              {occupantCount}
            </div>
          )}
        </div>
      )}

      {/* 3. POLICE STATION */}
      {building.type === 'police' && (
        <div className="relative flex flex-col items-center">
          <div className="absolute -bottom-1 h-7 w-20 rounded-full bg-black/30 blur-[3px]" />
          <div className="relative z-10 flex flex-col items-center">
            {/* Siren Beacon */}
            <div className="absolute -top-3 left-4 flex items-center gap-1">
              <span className="h-3 w-1 bg-slate-500 rounded-t-sm" />
              <span className={`h-2.5 w-2.5 rounded-full ${isEmergencyActive ? 'bg-red-500 animate-ping shadow-[0_0_12px_#ef4444]' : 'bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]'}`} />
            </div>
            <div className="relative h-8 w-19 rounded-t-xl bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 border-b-2 border-blue-950 shadow-md flex items-center justify-center gap-1">
              <span className="text-[10px]">👮</span>
              <span className="text-[8px] font-black text-white tracking-wider">POLICE</span>
            </div>
            <div className="h-10 w-17 rounded-b-lg bg-[#1e293b] border border-blue-500/40 shadow-inner flex items-end justify-between px-2 pb-1">
              <div className="h-4 w-4 rounded-sm border border-blue-400/40 bg-blue-900/80 flex items-center justify-center text-[7px] text-blue-200">
                🛡
              </div>
              <div className="h-6 w-4 rounded-t-sm bg-slate-900 border border-slate-700 flex items-center justify-center text-[8px] text-blue-400">
                🚔
              </div>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1 rounded-md bg-[#0a0f18dd] px-2 py-0.5 text-[9px] font-bold text-blue-400 border border-blue-500/40 shadow-md">
            <span>🛡 {building.label}</span>
            {occupantCount > 0 && <span className="text-white">({occupantCount})</span>}
          </div>
          {occupantCount > 0 && (
            <div className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-400 text-[9px] font-black text-black shadow-md animate-bounce">
              {occupantCount}
            </div>
          )}
        </div>
      )}

      {/* 4. MUNICIPAL COURT */}
      {building.type === 'court' && (
        <div className="relative flex flex-col items-center">
          <div className="absolute -bottom-1 h-7 w-20 rounded-full bg-black/30 blur-[3px]" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative h-8 w-19 rounded-t-xl bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 border-b-2 border-slate-900 shadow-md flex items-center justify-center gap-1">
              <span className="text-[11px] text-amber-300">⚖</span>
              <span className="text-[8px] font-bold text-slate-200 tracking-wider">COURT</span>
            </div>
            <div className="h-10 w-17 rounded-b-lg bg-[#f1f5f9] border border-slate-400 shadow-sm flex items-end justify-between px-2 pb-1">
              <div className="h-8 w-1.5 bg-slate-400 rounded-t-sm" />
              <div className="h-6 w-4 rounded-t-md bg-[#334155] flex items-center justify-center text-[8px] text-amber-300">
                🏛
              </div>
              <div className="h-8 w-1.5 bg-slate-400 rounded-t-sm" />
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1 rounded-md bg-[#0a0f18dd] px-2 py-0.5 text-[9px] font-bold text-slate-300 border border-white/20 shadow-md">
            <span>⚖ {building.label}</span>
            {occupantCount > 0 && <span className="text-white">({occupantCount})</span>}
          </div>
        </div>
      )}

      {/* 5. DETENTION FACILITY */}
      {building.type === 'detention' && (
        <div className="relative flex flex-col items-center">
          <div className="absolute -bottom-1 h-7 w-20 rounded-full bg-black/30 blur-[3px]" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative h-8 w-18 rounded-t-xl bg-gradient-to-r from-zinc-800 to-zinc-900 border-b-2 border-zinc-950 shadow-md flex items-center justify-center gap-1">
              <span className="text-[10px]">🔒</span>
              <span className="text-[8px] font-bold text-zinc-300 tracking-wider">HOLDING</span>
            </div>
            <div className="h-9 w-16 rounded-b-lg bg-[#27272a] border border-zinc-600 flex items-center justify-center gap-1 px-1">
              <div className="h-6 w-1 bg-zinc-400" />
              <div className="h-6 w-1 bg-zinc-400" />
              <div className="h-6 w-1 bg-zinc-400" />
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1 rounded-md bg-[#0a0f18dd] px-2 py-0.5 text-[9px] font-bold text-zinc-400 border border-zinc-600/40 shadow-md">
            <span>🔒 {building.label}</span>
            {occupantCount > 0 && <span className="text-rose-400">({occupantCount})</span>}
          </div>
        </div>
      )}

      {/* 6. BANK & CREDIT EXCHANGE */}
      {building.type === 'bank' && (
        <div className="relative flex flex-col items-center">
          <div className="absolute -bottom-1 h-7 w-20 rounded-full bg-black/30 blur-[3px]" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative h-8 w-19 rounded-t-xl bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-700 border-b-2 border-emerald-950 shadow-md flex items-center justify-center gap-1">
              <span className="text-[11px]">🏦</span>
              <span className="text-[8px] font-black text-amber-200 tracking-wider">BANK</span>
            </div>
            <div className="h-10 w-17 rounded-b-lg bg-[#ecfdf5] border border-emerald-300 shadow-sm flex items-end justify-between px-2 pb-1">
              <div className="mb-1 h-4 w-4 rounded-sm bg-emerald-100 border border-emerald-400 flex items-center justify-center text-[8px] text-emerald-800">
                🪙
              </div>
              <div className="h-6 w-4 rounded-t-md bg-emerald-950 flex items-center justify-center text-[8px] text-amber-300 font-bold border-t border-amber-400">
                🔒
              </div>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1 rounded-md bg-[#0a0f18dd] px-2 py-0.5 text-[9px] font-bold text-emerald-300 border border-emerald-500/40 shadow-md">
            <span>🏦 {building.label}</span>
            {occupantCount > 0 && <span className="text-white">({occupantCount})</span>}
          </div>
        </div>
      )}

      {/* 7. FACTORY (with Steam / Smoke indicator) */}
      {building.type === 'factory' && (
        <div className="relative flex flex-col items-center">
          <div className="absolute -bottom-1 h-7 w-22 rounded-full bg-black/30 blur-[3px]" />
          <div className="relative z-10 flex flex-col items-center">
            {/* Twin Factory Smokestacks with Animated Smoke */}
            <div className="absolute -top-5 left-2 flex items-center gap-2">
              <div className="relative h-6 w-2 rounded-t-sm bg-amber-900 border-t border-amber-700">
                <span className="absolute -top-3 left-0 h-3 w-3 animate-ping rounded-full bg-white/50" />
              </div>
              <div className="relative h-5 w-2 rounded-t-sm bg-amber-900 border-t border-amber-700">
                <span className="absolute -top-2 left-0 h-2 w-2 animate-pulse rounded-full bg-white/40" />
              </div>
            </div>
            <div className="relative h-8 w-20 rounded-t-md bg-gradient-to-r from-amber-800 to-amber-700 border-b-2 border-amber-950 shadow-md flex items-center justify-center gap-1">
              <span className="text-[11px]">🏭</span>
              <span className="text-[8px] font-black text-amber-200 tracking-wider">FACTORY</span>
            </div>
            <div className="h-10 w-19 rounded-b-md bg-[#78350f] border border-amber-800 shadow-inner flex items-end justify-between px-2 pb-1">
              <div className="h-4 w-4 bg-amber-950 rounded-sm border border-amber-600 flex items-center justify-center text-[7px] text-amber-300">
                ⚙️
              </div>
              <div className="h-6 w-5 bg-amber-950 rounded-t-sm flex items-center justify-center text-[7px] text-amber-400">
                📦
              </div>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1 rounded-md bg-[#0a0f18dd] px-2 py-0.5 text-[9px] font-bold text-amber-400 border border-amber-500/40 shadow-md">
            <span>⚙️ {building.label}</span>
            {occupantCount > 0 && <span className="text-white">({occupantCount})</span>}
          </div>
        </div>
      )}

      {/* 8. HOSPITAL / CLINIC */}
      {building.type === 'hospital' && (
        <div className="relative flex flex-col items-center">
          <div className="absolute -bottom-1 h-7 w-20 rounded-full bg-black/30 blur-[3px]" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative h-8 w-19 rounded-t-xl bg-gradient-to-r from-rose-500 to-red-600 border-b-2 border-red-800 shadow-md flex items-center justify-center gap-1">
              <span className="text-[12px] text-white">🏥</span>
              <span className="text-[8px] font-black text-white tracking-wider">HOSPITAL</span>
            </div>
            <div className="h-10 w-17 rounded-b-lg bg-[#fff1f2] border border-rose-300 shadow-sm flex items-end justify-between px-2 pb-1">
              <div className="h-4 w-4 rounded-sm bg-rose-100 border border-rose-400 flex items-center justify-center text-[8px] text-rose-600 font-bold">
                ➕
              </div>
              <div className="h-6 w-4 rounded-t-md bg-rose-900 flex items-center justify-center text-[8px] text-white">
                🚑
              </div>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1 rounded-md bg-[#0a0f18dd] px-2 py-0.5 text-[9px] font-bold text-rose-300 border border-rose-500/40 shadow-md">
            <span>🏥 {building.label}</span>
            {occupantCount > 0 && <span className="text-white">({occupantCount})</span>}
          </div>
        </div>
      )}

      {/* 9. FIRE STATION */}
      {building.type === 'fire' && (
        <div className="relative flex flex-col items-center">
          <div className="absolute -bottom-1 h-7 w-20 rounded-full bg-black/30 blur-[3px]" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative h-8 w-19 rounded-t-xl bg-gradient-to-r from-red-600 to-red-800 border-b-2 border-red-950 shadow-md flex items-center justify-center gap-1">
              <span className="text-[11px]">🚒</span>
              <span className="text-[8px] font-black text-white tracking-wider">FIRE DEPT</span>
            </div>
            <div className="h-10 w-17 rounded-b-lg bg-[#450a0a] border border-red-600 shadow-sm flex items-end justify-between px-2 pb-1">
              <div className="h-6 w-6 rounded-t-md bg-red-950 border border-red-500 flex items-center justify-center text-[8px] text-amber-300">
                🚨
              </div>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1 rounded-md bg-[#0a0f18dd] px-2 py-0.5 text-[9px] font-bold text-red-400 border border-red-500/40 shadow-md">
            <span>🚒 {building.label}</span>
            {occupantCount > 0 && <span className="text-white">({occupantCount})</span>}
          </div>
        </div>
      )}

      {/* 10. SCHOOL / ACADEMY */}
      {building.type === 'school' && (
        <div className="relative flex flex-col items-center">
          <div className="absolute -bottom-1 h-7 w-20 rounded-full bg-black/30 blur-[3px]" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative h-8 w-19 rounded-t-xl bg-gradient-to-r from-indigo-600 to-violet-700 border-b-2 border-indigo-900 shadow-md flex items-center justify-center gap-1">
              <span className="text-[11px]">🎓</span>
              <span className="text-[8px] font-black text-white tracking-wider">ACADEMY</span>
            </div>
            <div className="h-10 w-17 rounded-b-lg bg-[#eef2ff] border border-indigo-300 shadow-sm flex items-end justify-between px-2 pb-1">
              <div className="h-4 w-4 bg-indigo-100 border border-indigo-300 rounded flex items-center justify-center text-[8px]">
                📖
              </div>
              <div className="h-6 w-4 bg-indigo-900 rounded-t-md flex items-center justify-center text-[8px] text-amber-300">
                🔔
              </div>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1 rounded-md bg-[#0a0f18dd] px-2 py-0.5 text-[9px] font-bold text-indigo-300 border border-indigo-500/40 shadow-md">
            <span>🎓 {building.label}</span>
            {occupantCount > 0 && <span className="text-white">({occupantCount})</span>}
          </div>
        </div>
      )}

      {/* 11. POWER SUBSTATION */}
      {building.type === 'power' && (
        <div className="relative flex flex-col items-center">
          <div className="absolute -bottom-1 h-7 w-20 rounded-full bg-black/30 blur-[3px]" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative h-8 w-19 rounded-t-xl bg-gradient-to-r from-amber-500 to-yellow-600 border-b-2 border-yellow-800 shadow-md flex items-center justify-center gap-1">
              <span className="text-[11px] animate-bounce">⚡</span>
              <span className="text-[8px] font-black text-black tracking-wider">POWER GRID</span>
            </div>
            <div className="h-9 w-17 rounded-b-lg bg-[#451a03] border border-yellow-500/50 shadow-inner flex items-center justify-center gap-1">
              <div className="h-5 w-2 bg-yellow-400 rounded-sm animate-pulse" />
              <div className="h-5 w-2 bg-yellow-400 rounded-sm animate-pulse delay-100" />
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1 rounded-md bg-[#0a0f18dd] px-2 py-0.5 text-[9px] font-bold text-yellow-400 border border-yellow-500/40 shadow-md">
            <span>⚡ {building.label}</span>
            {occupantCount > 0 && <span className="text-white">({occupantCount})</span>}
          </div>
        </div>
      )}

      {/* 12. WATER TREATMENT PLANT */}
      {building.type === 'water' && (
        <div className="relative flex flex-col items-center">
          <div className="absolute -bottom-1 h-7 w-20 rounded-full bg-black/30 blur-[3px]" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative h-8 w-19 rounded-t-xl bg-gradient-to-r from-cyan-600 to-blue-600 border-b-2 border-blue-900 shadow-md flex items-center justify-center gap-1">
              <span className="text-[11px]">💧</span>
              <span className="text-[8px] font-black text-white tracking-wider">WATER PLANT</span>
            </div>
            <div className="h-9 w-17 rounded-b-lg bg-[#082f49] border border-cyan-400/50 shadow-inner flex items-center justify-center">
              <div className="h-5 w-8 rounded-full border border-cyan-400 bg-cyan-900/60 flex items-center justify-center text-[7px] text-cyan-200">
                PUMP
              </div>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1 rounded-md bg-[#0a0f18dd] px-2 py-0.5 text-[9px] font-bold text-cyan-300 border border-cyan-500/40 shadow-md">
            <span>💧 {building.label}</span>
            {occupantCount > 0 && <span className="text-white">({occupantCount})</span>}
          </div>
        </div>
      )}

      {/* 13. WASTE PROCESSING UNIT */}
      {building.type === 'waste' && (
        <div className="relative flex flex-col items-center">
          <div className="absolute -bottom-1 h-7 w-18 rounded-full bg-black/30 blur-[3px]" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative h-8 w-17 rounded-t-xl bg-gradient-to-r from-lime-700 to-green-800 border-b-2 border-green-950 shadow-md flex items-center justify-center gap-1">
              <span className="text-[11px]">♻️</span>
              <span className="text-[8px] font-black text-white tracking-wider">RECYCLE</span>
            </div>
            <div className="h-8 w-15 rounded-b-lg bg-[#14532d] border border-green-600 flex items-center justify-center">
              <span className="text-[7px] text-green-200 font-bold">ECO-UNIT</span>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1 rounded-md bg-[#0a0f18dd] px-2 py-0.5 text-[9px] font-bold text-lime-400 border border-lime-500/40 shadow-md">
            <span>♻️ {building.label}</span>
          </div>
        </div>
      )}

      {/* 14. APARTMENT COMPLEXES */}
      {building.type === 'apartments' && (
        <div className="relative flex flex-col items-center">
          <div className="absolute -bottom-1 h-8 w-22 rounded-full bg-black/35 blur-[4px]" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative h-8 w-19 rounded-t-lg bg-gradient-to-r from-sky-700 to-indigo-800 border-b-2 border-sky-950 shadow-md flex items-center justify-center gap-1">
              <span className="text-[10px]">🏢</span>
              <span className="text-[8px] font-black text-white tracking-wider">RESIDENCES</span>
            </div>
            <div className="h-12 w-18 rounded-b-lg bg-[#1e293b] border border-sky-500/40 shadow-inner grid grid-cols-2 gap-1 p-1">
              <div className="h-3 w-6 rounded-sm bg-sky-300/60 shadow-[0_0_6px_#38bdf8]" />
              <div className="h-3 w-6 rounded-sm bg-amber-300/70 shadow-[0_0_6px_#fde047]" />
              <div className="h-3 w-6 rounded-sm bg-sky-300/60 shadow-[0_0_6px_#38bdf8]" />
              <div className="h-3 w-6 rounded-sm bg-amber-300/70 shadow-[0_0_6px_#fde047]" />
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1 rounded-md bg-[#0a0f18dd] px-2 py-0.5 text-[9px] font-bold text-sky-300 border border-sky-500/40 shadow-md">
            <span>🏢 {building.label}</span>
            {occupantCount > 0 && <span className="text-white">({occupantCount})</span>}
          </div>
        </div>
      )}

      {/* 15. TRANSIT HUB */}
      {building.type === 'transit' && (
        <div className="relative flex flex-col items-center">
          <div className="absolute -bottom-1 h-7 w-20 rounded-full bg-black/30 blur-[3px]" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative h-8 w-19 rounded-t-xl bg-gradient-to-r from-teal-600 via-teal-500 to-teal-700 border-b-2 border-teal-900 shadow-md flex items-center justify-center gap-1">
              <span className="text-[11px]">🚏</span>
              <span className="text-[8px] font-black text-white tracking-wider">TRANSIT</span>
            </div>
            <div className="h-9 w-17 rounded-b-lg bg-[#ccfbf1] border border-teal-300 shadow-sm flex items-end justify-center pb-1">
              <span className="text-[8px] font-bold text-teal-900">BUS HUB</span>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1 rounded-md bg-[#0a0f18dd] px-2 py-0.5 text-[9px] font-bold text-teal-300 border border-teal-500/40 shadow-md">
            <span>🚏 {building.label}</span>
            {occupantCount > 0 && <span className="text-white">({occupantCount})</span>}
          </div>
        </div>
      )}

      {/* 16. CENTRAL MARKETPLACE */}
      {building.type === 'market' && (
        <div className="relative flex flex-col items-center">
          <div className="absolute -bottom-1 h-7 w-22 rounded-full bg-black/30 blur-[3px]" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative h-8 w-20 rounded-t-xl bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 border-b-2 border-purple-900 shadow-md flex items-center justify-center gap-1">
              <span className="text-[11px]">🛍️</span>
              <span className="text-[8px] font-black text-white tracking-wider">MARKET</span>
            </div>
            <div className="h-10 w-18 rounded-b-lg bg-[#fae8ff] border border-purple-300 shadow-sm flex items-end justify-between px-2 pb-1">
              <div className="h-4 w-4 bg-purple-200 rounded border border-purple-400 flex items-center justify-center text-[7px]">
                🍇
              </div>
              <div className="h-6 w-4 bg-purple-950 rounded-t-sm flex items-center justify-center text-[7px] text-pink-300">
                🏷️
              </div>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1 rounded-md bg-[#0a0f18dd] px-2 py-0.5 text-[9px] font-bold text-purple-300 border border-purple-500/40 shadow-md">
            <span>🛍️ {building.label}</span>
            {occupantCount > 0 && <span className="text-white">({occupantCount})</span>}
          </div>
        </div>
      )}

      {/* 17. GROCERY STORE */}
      {building.type === 'grocery' && (
        <div className="relative flex flex-col items-center">
          <div className="absolute -bottom-1 h-7 w-20 rounded-full bg-black/30 blur-[3px]" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative h-8 w-18 rounded-t-xl bg-gradient-to-r from-emerald-500 to-green-600 border-b-2 border-green-800 shadow-md flex items-center justify-center gap-1">
              <span className="text-[11px]">🍏</span>
              <span className="text-[8px] font-black text-white tracking-wider">GROCERY</span>
            </div>
            <div className="h-9 w-16 rounded-b-lg bg-[#dcfce7] border border-emerald-300 shadow-sm flex items-end justify-between px-1.5 pb-1">
              <span className="text-[8px]">🥦</span>
              <div className="h-5 w-4 bg-emerald-900 rounded-t-sm flex items-center justify-center text-[7px] text-white">
                🛒
              </div>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1 rounded-md bg-[#0a0f18dd] px-2 py-0.5 text-[9px] font-bold text-emerald-300 border border-emerald-500/40 shadow-md">
            <span>🍏 {building.label}</span>
            {occupantCount > 0 && <span className="text-white">({occupantCount})</span>}
          </div>
        </div>
      )}

      {/* 18. TECH WORKSHOP */}
      {building.type === 'workshop' && (
        <div className="relative flex flex-col items-center">
          <div className="absolute -bottom-1 h-7 w-20 rounded-full bg-black/30 blur-[3px]" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative h-8 w-19 rounded-t-xl bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 border-b-2 border-amber-900 shadow-md flex items-center justify-center gap-1">
              <span className="text-[11px]">🔧</span>
              <span className="text-[8px] font-black text-white tracking-wider">WORKSHOP</span>
            </div>
            <div className="h-10 w-17 rounded-b-lg bg-[#fef3c7] border border-amber-300 shadow-sm flex items-end justify-between px-2 pb-1">
              <div className="h-4 w-4 bg-amber-200 border border-amber-400 rounded flex items-center justify-center text-[7px]">
                🔨
              </div>
              <div className="h-6 w-4 bg-amber-950 rounded-t-sm flex items-center justify-center text-[7px] text-amber-300">
                🧰
              </div>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1 rounded-md bg-[#0a0f18dd] px-2 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-500/40 shadow-md">
            <span>🔧 {building.label}</span>
            {occupantCount > 0 && <span className="text-white">({occupantCount})</span>}
          </div>
        </div>
      )}

      {/* 19. FOOD SHOP / NEON OASIS CAFE */}
      {building.type === 'food' && (
        <div className="relative flex flex-col items-center">
          <div className="absolute -bottom-1 h-7 w-20 rounded-full bg-black/30 blur-[3px]" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative h-8 w-19 rounded-t-xl bg-gradient-to-r from-pink-600 via-rose-500 to-pink-700 border-b-2 border-rose-900 shadow-md flex items-center justify-center gap-1">
              <span className="text-[11px]">☕</span>
              <span className="text-[8px] font-black text-white tracking-wider">CAFE</span>
            </div>
            <div className="h-10 w-17 rounded-b-lg bg-[#ffe4e6] border border-rose-300 shadow-sm flex items-end justify-between px-2 pb-1">
              <div className="h-4 w-4 bg-rose-200 border border-rose-400 rounded flex items-center justify-center text-[7px]">
                🥐
              </div>
              <div className="h-6 w-4 bg-rose-950 rounded-t-sm flex items-center justify-center text-[7px] text-rose-300">
                🍜
              </div>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1 rounded-md bg-[#0a0f18dd] px-2 py-0.5 text-[9px] font-bold text-pink-300 border border-pink-500/40 shadow-md">
            <span>☕ {building.label}</span>
            {occupantCount > 0 && <span className="text-white">({occupantCount})</span>}
          </div>
        </div>
      )}

      {/* 20. QUANTUM RESEARCH LAB */}
      {building.type === 'lab' && (
        <div className="relative flex flex-col items-center">
          <div className="absolute -bottom-1 h-7 w-20 rounded-full bg-black/30 blur-[3px]" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative h-8 w-19 rounded-t-xl bg-gradient-to-r from-sky-600 via-cyan-500 to-sky-700 border-b-2 border-sky-900 shadow-md flex items-center justify-center gap-1">
              <span className="text-[11px] animate-spin">⚛️</span>
              <span className="text-[8px] font-black text-white tracking-wider">LAB</span>
            </div>
            <div className="h-10 w-17 rounded-b-lg bg-[#e0f2fe] border border-sky-300 shadow-sm flex items-end justify-between px-2 pb-1">
              <div className="h-4 w-4 bg-sky-200 border border-sky-400 rounded flex items-center justify-center text-[7px]">
                🔬
              </div>
              <div className="h-6 w-4 bg-sky-950 rounded-t-sm flex items-center justify-center text-[7px] text-cyan-300">
                🧪
              </div>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1 rounded-md bg-[#0a0f18dd] px-2 py-0.5 text-[9px] font-bold text-sky-300 border border-sky-500/40 shadow-md">
            <span>🔬 {building.label}</span>
            {occupantCount > 0 && <span className="text-white">({occupantCount})</span>}
          </div>
        </div>
      )}

      {/* 21. COMMERCIAL OFFICES */}
      {building.type === 'office' && (
        <div className="relative flex flex-col items-center">
          <div className="absolute -bottom-1 h-7 w-20 rounded-full bg-black/30 blur-[3px]" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative h-8 w-18 rounded-t-xl bg-gradient-to-r from-slate-600 to-slate-800 border-b-2 border-slate-900 shadow-md flex items-center justify-center gap-1">
              <span className="text-[10px]">💼</span>
              <span className="text-[8px] font-black text-white tracking-wider">OFFICES</span>
            </div>
            <div className="h-10 w-16 rounded-b-lg bg-[#e2e8f0] border border-slate-300 shadow-inner flex items-end justify-center pb-1">
              <span className="text-[8px] font-bold text-slate-700">COMMERCE</span>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1 rounded-md bg-[#0a0f18dd] px-2 py-0.5 text-[9px] font-bold text-slate-300 border border-white/20 shadow-md">
            <span>💼 {building.label}</span>
            {occupantCount > 0 && <span className="text-white">({occupantCount})</span>}
          </div>
        </div>
      )}

      {/* 22. STORAGE WAREHOUSE */}
      {building.type === 'warehouse' && (
        <div className="relative flex flex-col items-center">
          <div className="absolute -bottom-1 h-7 w-20 rounded-full bg-black/30 blur-[3px]" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative h-8 w-18 rounded-t-md bg-gradient-to-r from-stone-600 to-stone-700 border-b-2 border-stone-900 shadow-md flex items-center justify-center gap-1">
              <span className="text-[10px]">📦</span>
              <span className="text-[8px] font-black text-stone-200 tracking-wider">STORAGE</span>
            </div>
            <div className="h-9 w-16 rounded-b-md bg-[#d6d3d1] border border-stone-400 flex items-center justify-center">
              <span className="text-[8px] font-bold text-stone-800">DEPOT</span>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1 rounded-md bg-[#0a0f18dd] px-2 py-0.5 text-[9px] font-bold text-stone-300 border border-white/20 shadow-md">
            <span>📦 {building.label}</span>
          </div>
        </div>
      )}

      {/* 23. FALLBACK FOR OTHER CIVIC PLACES */}
      {building.type !== 'house' &&
        building.type !== 'government' &&
        building.type !== 'police' &&
        building.type !== 'court' &&
        building.type !== 'detention' &&
        building.type !== 'bank' &&
        building.type !== 'factory' &&
        building.type !== 'hospital' &&
        building.type !== 'fire' &&
        building.type !== 'school' &&
        building.type !== 'power' &&
        building.type !== 'water' &&
        building.type !== 'waste' &&
        building.type !== 'apartments' &&
        building.type !== 'transit' &&
        building.type !== 'market' &&
        building.type !== 'grocery' &&
        building.type !== 'workshop' &&
        building.type !== 'food' &&
        building.type !== 'lab' &&
        building.type !== 'office' &&
        building.type !== 'warehouse' && (
          <div className="relative flex flex-col items-center">
            <div className="absolute -bottom-1 h-7 w-20 rounded-full bg-black/30 blur-[3px]" />
            <div className="relative z-10 flex flex-col items-center">
              <div
                className="relative h-8 w-18 rounded-t-xl shadow-md flex items-center justify-center gap-1"
                style={{ backgroundColor: building.roofColor || '#475569' }}
              >
                <span className="text-[11px]">{building.icon || '🏛️'}</span>
                <span className="text-[8px] font-black text-white tracking-wider">
                  {building.type.toUpperCase()}
                </span>
              </div>
              <div
                className="h-9 w-16 rounded-b-lg border shadow-inner flex items-end justify-center pb-1"
                style={{ backgroundColor: building.color || '#cbd5e1' }}
              >
                <span className="text-[8px] font-bold text-slate-800">{building.label}</span>
              </div>
            </div>
            <div className="mt-1 flex items-center gap-1 rounded-md bg-[#0a0f18dd] px-2 py-0.5 text-[9px] font-bold text-slate-300 border border-white/20 shadow-md">
              <span>{building.icon || '🏛️'} {building.label}</span>
              {occupantCount > 0 && <span className="text-white">({occupantCount})</span>}
            </div>
          </div>
        )}
    </div>
  );
}
