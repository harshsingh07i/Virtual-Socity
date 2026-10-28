'use client';
import React, { useEffect, useState } from 'react';
import { Agent, DecisionRecord, SocietyState } from '@/lib/society';
import {
  Brain,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  User,
  Zap,
} from 'lucide-react';

interface AIObservatoryModalProps {
  state: SocietyState;
  onClose: () => void;
  onSelectAgent?: (agentId: string) => void;
}

export default function AIObservatoryModal({ state, onClose, onSelectAgent }: AIObservatoryModalProps) {
  const [logs, setLogs] = useState<DecisionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  async function fetchObservatoryLogs() {
    setLoading(true);
    try {
      const url =
        selectedAgentFilter !== 'all'
          ? `/api/observatory?agentId=${encodeURIComponent(selectedAgentFilter)}&limit=50`
          : `/api/observatory?limit=60`;
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('[AIObservatory] Error loading decision logs:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchObservatoryLogs();
  }, [selectedAgentFilter]);

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.agentName.toLowerCase().includes(q) ||
      log.problemDetected.toLowerCase().includes(q) ||
      log.chosenAction.toLowerCase().includes(q) ||
      log.decisionReason.toLowerCase().includes(q)
    );
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl rounded-2xl border border-sky-500/50 bg-[#0a111c] p-6 shadow-2xl text-slate-100 overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Glow backdrop */}
        <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full blur-3xl opacity-20 bg-sky-500 pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/40 text-2xl shadow-inner">
              <Brain size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">AI BRAIN OBSERVATORY</h3>
                <span className="rounded-full bg-sky-500/20 px-2.5 py-0.5 text-[10px] font-extrabold text-sky-300 border border-sky-500/40 uppercase">
                  Gemini Cognition Telemetry
                </span>
                <span className="rounded-full bg-[#76f2c0]/15 px-2 py-0.5 text-[10px] font-bold text-[#76f2c0] border border-[#76f2c0]/30">
                  Verified Decisions
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect how each Gemini-powered citizen detects problems, evaluates options, forms rationales, and experiences verified simulation outcomes.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 my-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Citizen Filter */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 rounded-xl border border-slate-800 px-3 py-1.5 text-xs">
              <User size={13} className="text-sky-400" />
              <select
                value={selectedAgentFilter}
                onChange={(e) => setSelectedAgentFilter(e.target.value)}
                className="bg-transparent text-slate-200 outline-none cursor-pointer text-xs"
              >
                <option value="all" className="bg-slate-900 text-white">
                  All 20 Citizens
                </option>
                {state.agents.map((a) => (
                  <option key={a.id} value={a.id} className="bg-slate-900 text-white">
                    {a.name} ({a.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 rounded-xl border border-slate-800 px-3 py-1.5 text-xs">
              <Search size={13} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search problem, action, rationale..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-slate-200 placeholder:text-slate-500 outline-none text-xs w-48 sm:w-60"
              />
            </div>
          </div>

          <button
            onClick={fetchObservatoryLogs}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Decision Records Feed */}
        <div className="overflow-y-auto pr-1 space-y-3.5 my-1 flex-1">
          {loading && logs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              <RefreshCw size={24} className="mx-auto animate-spin text-sky-400 mb-2" />
              <span>Loading cognitive observatory records...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-xs text-slate-500 bg-slate-900/30">
              <Brain size={32} className="mx-auto mb-2 text-slate-600" />
              <p className="font-bold text-slate-400 mb-1">No decision logs match current filter</p>
              <p className="text-[11px] text-slate-500">
                Advance the simulation clock or trigger a crisis from God Mode to observe citizen problem solving.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const agent = state.agents.find((a) => a.id === log.agentId || a.name === log.agentName);
              const color = agent?.color || '#38bdf8';

              let options: { option: string; description: string }[] = [];
              if (Array.isArray(log.optionsConsidered)) {
                options = log.optionsConsidered.map((item, idx) => {
                  if (typeof item === 'string') {
                    const match = item.match(/^([A-Z]):\s*(.*)$/);
                    if (match) return { option: match[1], description: match[2] };
                    return { option: String.fromCharCode(65 + idx), description: item };
                  }
                  return item;
                });
              }

              return (
                <div
                  key={log.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-md hover:border-slate-700 transition-all space-y-3"
                >
                  {/* Row 1: Agent Badge, Time, and Chosen Action */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center font-black text-black text-xs shadow-md border border-white/20"
                        style={{ backgroundColor: color }}
                      >
                        {log.agentName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{log.agentName}</span>
                          <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] font-semibold text-[#76f2c0]">
                            {agent?.role || 'Citizen'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Home: {agent?.homeLocation || 'Residential Pod'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                        <Clock size={11} className="text-amber-400" />
                        <span>Round {log.round} • {String(log.hour).padStart(2, '0')}:00</span>
                      </span>

                      <span className="rounded-lg bg-sky-500/20 border border-sky-500/40 px-2.5 py-0.5 text-[11px] font-extrabold text-sky-300 uppercase tracking-wide">
                        {log.chosenAction}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Problem Detected & Relevant Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                    {/* Problem Detected */}
                    <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-2.5">
                      <div className="text-[10px] font-extrabold text-rose-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <span>⚠️</span>
                        <span>Problem Detected</span>
                      </div>
                      <p className="text-slate-200 text-xs leading-relaxed font-medium">
                        {log.problemDetected}
                      </p>
                    </div>

                    {/* Relevant Info Evaluated */}
                    <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-2.5">
                      <div className="text-[10px] font-extrabold text-sky-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <span>ℹ️</span>
                        <span>Relevant Information Evaluated</span>
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed font-mono text-[11px]">
                        {log.relevantInfo}
                      </p>
                    </div>
                  </div>

                  {/* Row 3: Options Considered (Highlighting Chosen vs Alternative) */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-2.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Target size={11} className="text-amber-400" />
                      <span>Options Considered by Gemini Reasoning</span>
                    </div>

                    <div className="space-y-1.5">
                      {options.map((opt, idx) => {
                        const isChosen =
                          log.chosenAction.toLowerCase().includes(opt.option.toLowerCase()) ||
                          opt.description.toLowerCase().includes(log.chosenAction.toLowerCase());

                        return (
                          <div
                            key={idx}
                            className={`flex items-start gap-2 rounded-lg p-1.5 text-xs transition-all ${
                              isChosen
                                ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-200'
                                : 'bg-slate-900/60 border border-slate-800/80 text-slate-400'
                            }`}
                          >
                            <span
                              className={`rounded px-1.5 py-0.2 text-[10px] font-black shrink-0 ${
                                isChosen ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              Option {opt.option}
                            </span>
                            <span className="flex-1">{opt.description}</span>
                            {isChosen && (
                              <span className="text-[10px] font-bold text-emerald-400 shrink-0">
                                ✓ CHOSEN
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Row 4: Rationale & Expected Outcome */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-2.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                        Decision Explanation
                      </span>
                      <p className="text-slate-300 text-xs">{log.decisionReason}</p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-2.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                        Expected Outcome
                      </span>
                      <p className="text-slate-300 text-xs">{log.expectedOutcome}</p>
                    </div>
                  </div>

                  {/* Row 5: Actual Verified Result in Simulation */}
                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-2.5 flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider block">
                        Actual Verified Consequence in Simulation
                      </span>
                      <p className="text-xs text-emerald-100 mt-0.5">
                        {log.actualResult || 'Action executed and verified in simulation state.'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            Observing {filteredLogs.length} verified decision cycles
          </span>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            Close AI Observatory
          </button>
        </div>
      </div>
    </div>
  );
}
