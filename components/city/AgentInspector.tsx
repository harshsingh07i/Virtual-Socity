'use client';
import React, { useMemo } from 'react';
import { Agent, Event } from '@/lib/society';
import {
  Activity,
  Bot,
  CircleHelp,
  Coins,
  Heart,
  Sparkles,
  Users,
  Utensils,
  X,
  Zap,
} from 'lucide-react';

interface AgentInspectorProps {
  agent: Agent | null;
  allAgents: Agent[];
  events: Event[];
  onClose: () => void;
}

export default function AgentInspector({
  agent,
  allAgents,
  events,
  onClose,
}: AgentInspectorProps) {
  if (!agent) return null;

  // Compute relationships based on recorded interactions in memories & events
  const relationships = useMemo(() => {
    const list: { name: string; type: string; color: string; count: number }[] = [];
    const memoryText = agent.memory.join(' ').toLowerCase();

    allAgents.forEach((other) => {
      if (other.id === agent.id) return;
      const otherName = other.name.toLowerCase();
      let count = 0;
      let interactionType = 'Acquaintance';

      if (memoryText.includes(otherName)) {
        count += 1;
        if (memoryText.includes(`${otherName} chatted`) || memoryText.includes(`talking with ${otherName}`)) {
          interactionType = 'Chat Companion';
        } else if (memoryText.includes(`traded with ${otherName}`) || memoryText.includes(`transferred`)) {
          interactionType = 'Trade Partner';
        } else if (memoryText.includes(`helped ${otherName}`)) {
          interactionType = 'Allied Friend';
        }
      }

      // Check events involving both
      const relevantEvents = events.filter(
        (e) =>
          e.text.toLowerCase().includes(agent.name.toLowerCase()) &&
          e.text.toLowerCase().includes(other.name.toLowerCase())
      );
      count += relevantEvents.length;

      if (count > 0) {
        list.push({
          name: other.name,
          type: interactionType,
          color: other.color,
          count,
        });
      }
    });

    return list;
  }, [agent, allAgents, events]);

  return (
    <aside
      onClick={(e) => e.stopPropagation()}
      className="panel flex flex-col border-[#23354d] bg-[#0c1322]/95 p-5 shadow-2xl backdrop-blur-xl animate-in slide-in-from-right duration-200"
    >
      {/* 1. Header with Avatar & Close Button */}
      <div className="flex items-start justify-between border-b border-[#1f2f45] pb-4">
        <div className="flex items-center gap-3">
          {/* Avatar Portrait */}
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 text-base font-black shadow-lg"
            style={{
              backgroundColor: agent.color,
              borderColor: '#ffffff',
              color: '#070a12',
            }}
          >
            {agent.name.slice(0, 1)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">{agent.name}</h3>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ backgroundColor: `${agent.color}25`, color: agent.color }}
              >
                {agent.role}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 capitalize">{agent.personality}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-[#1f2b3e] hover:text-white transition-colors"
          title="Close Inspector"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content Scrollable Body */}
      <div className="scrollbar mt-4 flex-1 space-y-4 overflow-y-auto pr-1">
        {/* Active AI Model & Status Badge */}
        <div className="flex items-center justify-between rounded-xl border border-[#23354d] bg-[#080d16] p-2.5 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Sparkles size={13} className="text-[#76f2c0]" />
            <span>AI Brain: <strong className="text-white">Gemini 2.5 Flash</strong></span>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              agent.alive ? 'bg-[#76f2c0]/15 text-[#76f2c0]' : 'bg-red-950 text-red-300'
            }`}
          >
            {agent.alive ? 'ALIVE' : 'INACTIVE'}
          </span>
        </div>

        {/* Vital Needs Meters */}
        <div>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Vital Resources
          </div>
          <div className="grid grid-cols-2 gap-2">
            {/* Credits */}
            <div className="rounded-xl border border-[#1f2e44] bg-[#0c1424] p-2.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><Coins size={12} className="text-amber-400" /> Balance</span>
                <span className="font-mono font-bold text-amber-300">{agent.credits} Cr</span>
              </div>
            </div>

            {/* Energy */}
            <div className="rounded-xl border border-[#1f2e44] bg-[#0c1424] p-2.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><Zap size={12} className="text-sky-400" /> Energy</span>
                <span className="font-mono font-bold text-slate-200">{agent.energy}%</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#1b2738] overflow-hidden">
                <div className="h-full bg-sky-400" style={{ width: `${agent.energy}%` }} />
              </div>
            </div>

            {/* Hunger */}
            <div className="rounded-xl border border-[#1f2e44] bg-[#0c1424] p-2.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><Utensils size={12} className="text-rose-400" /> Hunger</span>
                <span className="font-mono font-bold text-slate-200">{agent.hunger}%</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#1b2738] overflow-hidden">
                <div
                  className={`h-full ${agent.hunger > 75 ? 'bg-red-500' : 'bg-rose-400'}`}
                  style={{ width: `${agent.hunger}%` }}
                />
              </div>
            </div>

            {/* Happiness */}
            <div className="rounded-xl border border-[#1f2e44] bg-[#0c1424] p-2.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><Heart size={12} className="text-pink-400" /> Wellbeing</span>
                <span className="font-mono font-bold text-[#76f2c0]">{agent.happiness}%</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#1b2738] overflow-hidden">
                <div className="h-full bg-[#76f2c0]" style={{ width: `${agent.happiness}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Current Location, Home, Department, & Activity */}
        <div className="rounded-xl border border-[#1f2e44] bg-[#0c1424] p-3 text-xs space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
            <span>District Presence</span>
            <span className="text-[#76f2c0] font-semibold">{agent.location}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-300">
            <span className="text-slate-500 font-semibold">Home Residence:</span>
            <span className="text-sky-300 font-medium">{agent.homeLocation || 'Residential Pod'}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-300">
            <span className="text-slate-500 font-semibold">Department:</span>
            <span className="text-slate-200">{agent.department || 'Commerce'}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-300">
            <span className="text-slate-500 font-semibold">Salary:</span>
            <span className="font-mono text-amber-300 font-bold">{agent.salary || 15} credits/shift</span>
          </div>
          <div className="pt-1 border-t border-slate-800/80 text-slate-200">
            <span className="text-slate-500 font-semibold">Latest Action:</span> {agent.lastAction}
          </div>
        </div>

        {/* Carried Inventory Items */}
        {(() => {
          let inv: string[] = [];
          if (Array.isArray(agent.inventory)) inv = agent.inventory;
          else if (typeof agent.inventory === 'string') {
            try { inv = JSON.parse(agent.inventory); } catch { inv = [agent.inventory]; }
          }
          return (
            <div className="rounded-xl border border-[#1f2e44] bg-[#0c1424] p-3 text-xs">
              <div className="text-[10px] font-bold uppercase text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Personal Inventory</span>
                <span className="text-[9px] text-[#76f2c0]">{inv.length} items</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {inv.length > 0 ? (
                  inv.map((item, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg bg-slate-800/90 border border-slate-700/60 px-2 py-0.5 text-[10px] font-medium text-slate-300"
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 italic text-[11px]">Civic Datapad, Standard Comm Pass</span>
                )}
              </div>
            </div>
          );
        })()}

        {/* Life Directive / Goal */}
        <div className="rounded-xl border border-[#1f2e44] bg-[#0c1424] p-3 text-xs">
          <div className="text-[10px] font-bold uppercase text-slate-400">Autonomous Goal</div>
          <p className="mt-1 italic text-slate-300 leading-relaxed">
            “{agent.goal}”
          </p>
        </div>

        {/* Relationships with Other Agents */}
        <div>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Social Circle</span>
            <span className="text-[10px] text-slate-500">{relationships.length} recorded</span>
          </div>
          {relationships.length === 0 ? (
            <div className="rounded-xl border border-[#1f2e44] bg-[#080d16] p-3 text-center text-xs text-slate-500">
              No direct recorded interactions yet.
            </div>
          ) : (
            <div className="space-y-1.5">
              {relationships.map((rel) => (
                <div
                  key={rel.name}
                  className="flex items-center justify-between rounded-lg border border-[#1a273b] bg-[#090f1b] p-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: rel.color }}
                    />
                    <span className="font-semibold text-slate-200">{rel.name}</span>
                  </div>
                  <span className="text-[10px] text-[#76f2c0]">{rel.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Memories Stream (SQLite Persisted) */}
        <div>
          <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>Persisted Memories</span>
            <span className="font-mono text-[#8aa8ff]">{agent.memory.length} in SQLite</span>
          </div>
          <div className="space-y-1.5">
            {agent.memory
              .slice()
              .reverse()
              .slice(0, 6)
              .map((mem, i) => (
                <div
                  key={i}
                  className="flex gap-2 rounded-lg border border-[#19273c] bg-[#090e1a] p-2 text-xs leading-relaxed text-slate-300"
                >
                  <span className="text-[#76f2c0] font-bold">•</span>
                  <span>{mem}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
