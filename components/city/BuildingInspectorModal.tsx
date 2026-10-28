'use client';
import React from 'react';
import { Agent } from '@/lib/society';
import { BuildingDefinition } from './types';
import { UserCheck, Eye, Zap, Droplet, Shield, Box, Sparkles } from 'lucide-react';

interface BuildingInspectorModalProps {
  building: BuildingDefinition | null;
  occupants: Agent[];
  onClose: () => void;
  onSelectAgent?: (agentId: string) => void;
}

export default function BuildingInspectorModal({
  building,
  occupants,
  onClose,
  onSelectAgent,
}: BuildingInspectorModalProps) {
  if (!building) return null;

  const condition = building.condition ?? 100;
  const isDamaged = condition < 50;
  const powerOn = building.powerStatus ?? true;
  const waterOn = building.waterStatus ?? true;

  // Category badge colors
  const categoryStyles: Record<string, { bg: string; text: string; border: string }> = {
    government: { bg: 'bg-amber-950/80', text: 'text-amber-300', border: 'border-amber-500/50' },
    justice: { bg: 'bg-blue-950/80', text: 'text-blue-300', border: 'border-blue-500/50' },
    economy: { bg: 'bg-emerald-950/80', text: 'text-emerald-300', border: 'border-emerald-500/50' },
    services: { bg: 'bg-purple-950/80', text: 'text-purple-300', border: 'border-purple-500/50' },
    housing: { bg: 'bg-teal-950/80', text: 'text-teal-300', border: 'border-teal-500/50' },
  };
  const catStyle = categoryStyles[building.category] || categoryStyles.services;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl rounded-2xl border border-slate-700/80 bg-[#0c1422] p-6 shadow-2xl text-slate-100 overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Glow accent */}
        <div
          className="absolute -top-24 -right-24 h-52 w-52 rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{ backgroundColor: building.color || '#76f2c0' }}
        />

        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl shadow-inner border"
              style={{
                backgroundColor: building.color || '#1e293b',
                borderColor: building.accentColor || '#38bdf8',
              }}
            >
              {building.icon || '🏢'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">{building.name}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                >
                  {building.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{building.description || `${building.label} District Node`}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto pr-1 space-y-4 my-3">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Condition */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5">
              <div className="text-[10px] font-semibold text-slate-400">Condition</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className={`text-base font-black ${condition > 75 ? 'text-emerald-400' : isDamaged ? 'text-rose-400' : 'text-amber-400'}`}>
                  {condition}%
                </span>
                <span className="text-[10px] text-slate-500">integrity</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    condition > 75 ? 'bg-emerald-500' : isDamaged ? 'bg-rose-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${condition}%` }}
                />
              </div>
            </div>

            {/* Operating Budget */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5">
              <div className="text-[10px] font-semibold text-slate-400">Operating Budget</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-base font-black text-amber-300">
                  {building.budget ?? 500}
                </span>
                <span className="text-[10px] text-amber-500/80">credits</span>
              </div>
              <span className="text-[9px] text-slate-500 mt-1 block">Municipal allocation</span>
            </div>

            {/* Utilities Status */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5">
              <div className="text-[10px] font-semibold text-slate-400">Utilities Status</div>
              <div className="mt-1.5 flex flex-col gap-0.5 text-[10px] font-bold">
                <span className={`flex items-center gap-1 ${powerOn ? 'text-amber-400' : 'text-rose-400'}`}>
                  <span>{powerOn ? '⚡' : '⚠️'}</span>
                  <span>{powerOn ? 'Power Active' : 'Blackout'}</span>
                </span>
                <span className={`flex items-center gap-1 ${waterOn ? 'text-cyan-400' : 'text-rose-400'}`}>
                  <span>{waterOn ? '💧' : '⚠️'}</span>
                  <span>{waterOn ? 'Water Flowing' : 'No Water'}</span>
                </span>
              </div>
            </div>

            {/* Occupancy / Supply */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5">
              <div className="text-[10px] font-semibold text-slate-400">
                {typeof building.inventory === 'number' ? 'Supply Inventory' : 'Occupancy'}
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                {typeof building.inventory === 'number' ? (
                  <>
                    <span className="text-base font-black text-emerald-400">{building.inventory}</span>
                    <span className="text-[10px] text-slate-500">units in stock</span>
                  </>
                ) : (
                  <>
                    <span className="text-base font-black text-sky-400">{occupants.length}</span>
                    <span className="text-[10px] text-slate-500">/ {building.capacity || 6} max</span>
                  </>
                )}
              </div>
              <span className="text-[9px] text-slate-500 mt-1 block">Live facility telemetry</span>
            </div>
          </div>

          {/* Civic Services & Activities */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
            <div className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
              <Sparkles size={13} className="text-[#76f2c0]" />
              <span>Facility Operations & Civic Services</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(building.actionTypes || ['inspect', 'visit', 'trade']).map((act) => (
                <span
                  key={act}
                  className="rounded-lg bg-slate-800/80 border border-slate-700/60 px-2.5 py-1 text-[11px] font-semibold text-slate-300 capitalize"
                >
                  {act.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>

          {/* Current Occupants List with Full Details & Inspect Buttons */}
          <div>
            <div className="text-xs font-bold text-slate-300 mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <UserCheck size={14} className="text-[#38bdf8]" />
                <span>Citizens Currently Inside ({occupants.length})</span>
              </span>
              <span className="text-[10px] text-slate-400">Click &ldquo;Inspect&rdquo; to focus citizen</span>
            </div>

            {occupants.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500 bg-slate-900/20">
                No citizens currently inside this building. Citizens are active across other districts.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {occupants.map((agent) => {
                  let invItems: string[] = [];
                  if (Array.isArray(agent.inventory)) {
                    invItems = agent.inventory;
                  } else if (typeof agent.inventory === 'string') {
                    try {
                      invItems = JSON.parse(agent.inventory);
                    } catch {
                      invItems = [agent.inventory];
                    }
                  }

                  return (
                    <div
                      key={agent.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 hover:border-slate-700 transition-all flex flex-col gap-2"
                    >
                      {/* Top row: Name, Role, Credits, Inspect Button */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="h-8 w-8 rounded-full flex items-center justify-center font-black text-black text-xs shadow-md border border-white/20"
                            style={{ backgroundColor: agent.color }}
                          >
                            {agent.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{agent.name}</span>
                              <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] font-semibold text-[#76f2c0]">
                                {agent.role}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Home: <span className="text-slate-300">{agent.homeLocation || 'Residential Pod'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-amber-300 font-mono">
                            {agent.credits} 🪙
                          </span>
                          {onSelectAgent && (
                            <button
                              onClick={() => {
                                onSelectAgent(agent.id);
                                onClose();
                              }}
                              className="flex items-center gap-1 rounded-lg border border-[#38bdf8]/40 bg-[#38bdf8]/15 px-2.5 py-1 text-[11px] font-bold text-[#38bdf8] hover:bg-[#38bdf8]/30 transition-colors shadow-sm"
                            >
                              <Eye size={12} />
                              <span>Inspect</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Current Task & Activity */}
                      <div className="text-[11px] text-slate-300 bg-slate-950/40 rounded-lg p-2 border border-slate-800/80">
                        <span className="text-slate-500 font-semibold">Active Task: </span>
                        <span>{agent.lastAction || 'Conducting scheduled duties'}</span>
                      </div>

                      {/* Inventory & Needs Status */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] pt-1 border-t border-slate-800/60">
                        {/* Inventory */}
                        <div className="flex items-center gap-1 flex-wrap">
                          <Box size={11} className="text-slate-400 shrink-0" />
                          <span className="text-slate-500 font-semibold">Held:</span>
                          {invItems.length > 0 ? (
                            invItems.map((item, idx) => (
                              <span
                                key={idx}
                                className="rounded bg-slate-800/90 border border-slate-700/60 px-1.5 py-0.2 text-[9px] text-slate-300 font-medium"
                              >
                                {item}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-500 italic text-[9px]">Civic Datapad</span>
                          )}
                        </div>

                        {/* Needs Vitals */}
                        <div className="flex items-center gap-2 text-slate-400 font-mono font-medium">
                          <span>⚡ {agent.energy}%</span>
                          <span>🍗 {agent.hunger}%</span>
                          <span>❤️ {agent.happiness}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            Close Facility Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
