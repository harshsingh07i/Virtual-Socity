'use client';
import React, { useState } from 'react';
import { SocietyState } from '@/lib/society';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Coins,
  Droplet,
  Factory,
  FastForward,
  Pause,
  Play,
  RotateCcw,
  Shield,
  ShieldAlert,
  Sparkles,
  Utensils,
  Wind,
  Zap,
} from 'lucide-react';

interface GodModeModalProps {
  state: SocietyState;
  onClose: () => void;
  onRefresh: () => void;
}

export default function GodModeModal({ state, onClose, onRefresh }: GodModeModalProps) {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Local state initialized from simulation state
  const [foodActive, setFoodActive] = useState(state.foodSupplyActive ?? true);
  const [waterActive, setWaterActive] = useState(state.waterSupplyActive ?? true);
  const [powerActive, setPowerActive] = useState(state.powerGridActive ?? true);
  const [factoryActive, setFactoryActive] = useState(state.factorySupplyActive ?? true);
  const [patrolBudget, setPatrolBudget] = useState(state.policePatrolBudget ?? 100);
  const [foodPrice, setFoodPrice] = useState(state.foodPrice ?? 8);
  const [incomeTax, setIncomeTax] = useState(state.incomeTaxRate ?? 10);
  const [salesTax, setSalesTax] = useState(state.salesTaxRate ?? 5);

  const activeCrises = state.activeCrises || [];

  async function callGodMode(payload: any) {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/godmode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'God Mode command failed');
      }
      setFeedback(data.message || 'Command executed successfully.');
      onRefresh();
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleSupply(supplyType: 'food' | 'water' | 'power' | 'factory', active: boolean) {
    if (supplyType === 'food') setFoodActive(active);
    if (supplyType === 'water') setWaterActive(active);
    if (supplyType === 'power') setPowerActive(active);
    if (supplyType === 'factory') setFactoryActive(active);

    await callGodMode({
      action: 'toggle_supply',
      supplyType,
      active,
    });
  }

  async function handlePatrolChange(budget: number) {
    setPatrolBudget(budget);
    await callGodMode({
      action: 'set_patrol_budget',
      budget,
    });
  }

  async function handleEconomicUpdate() {
    await callGodMode({
      action: 'set_taxes_prices',
      incomeTaxRate: incomeTax,
      salesTaxRate: salesTax,
      foodPrice,
    });
  }

  async function handleTriggerCrisis(crisisType: string) {
    await callGodMode({
      action: 'trigger_crisis',
      crisisType,
    });
  }

  async function handleRestoreNormal() {
    setFoodActive(true);
    setWaterActive(true);
    setPowerActive(true);
    setFactoryActive(true);
    setPatrolBudget(100);
    setFoodPrice(8);
    setIncomeTax(10);
    setSalesTax(5);

    await callGodMode({
      action: 'restore_normal',
    });
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl rounded-2xl border border-amber-500/50 bg-[#0b121e] p-6 shadow-2xl text-slate-100 overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Glow backdrop */}
        <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full blur-3xl opacity-20 bg-amber-500 pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 text-2xl shadow-inner">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">CITY GOD MODE OVERSEER</h3>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-300 border border-amber-500/40 uppercase">
                  Root Simulation Controls
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Directly manipulate municipal utilities, police patrols, economics, and emergency crises with verified server-side consequences.
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

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`my-2 rounded-xl p-2.5 text-xs font-semibold flex items-center justify-between border ${
              feedback.startsWith('Error')
                ? 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
            }`}
          >
            <span>{feedback}</span>
            <button onClick={() => setFeedback(null)} className="text-xs opacity-70 hover:opacity-100">
              ✕
            </button>
          </div>
        )}

        {/* Scrollable controls */}
        <div className="overflow-y-auto pr-1 space-y-4 my-2">
          {/* 1. Master Simulation Time & Speed */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Clock size={14} className="text-[#76f2c0]" />
                <span>Simulation Time & Velocity Control</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Current: <strong className="text-white">{state.status.toUpperCase()}</strong> @ {state.speed}x
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                disabled={busy}
                onClick={() => callGodMode({ action: state.status === 'running' ? 'pause' : 'resume' })}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shadow-sm ${
                  state.status === 'running'
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {state.status === 'running' ? <Pause size={13} /> : <Play size={13} />}
                <span>{state.status === 'running' ? 'Pause Simulation' : 'Resume Simulation'}</span>
              </button>

              <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 px-1 font-semibold">Speed:</span>
                {[1, 5, 20, 100].map((s) => (
                  <button
                    key={s}
                    disabled={busy}
                    onClick={() => callGodMode({ action: 'set_speed', speed: s })}
                    className={`rounded-lg px-2.5 py-1 text-xs font-mono font-bold transition-all ${
                      state.speed === s
                        ? 'bg-[#76f2c0] text-black shadow-sm'
                        : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. City Utilities & Supply Switches */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Zap size={14} className="text-amber-400" />
                <span>Municipal Supplies & Utilities (Real Consequences)</span>
              </span>
              <span className="text-[10px] text-slate-500">Toggling immediately alters citizen actions</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Food Supply Toggle */}
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-950/80 text-emerald-400">
                    <Utensils size={14} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Food Supply</div>
                    <div className="text-[10px] text-slate-400">
                      {foodActive ? 'Stocking groceries & cafes' : '⚠️ Shortage: prices surge, hunger rises'}
                    </div>
                  </div>
                </div>
                <button
                  disabled={busy}
                  onClick={() => handleToggleSupply('food', !foodActive)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                    foodActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                  }`}
                >
                  {foodActive ? 'Active' : 'Cut Off'}
                </button>
              </div>

              {/* Water Supply Toggle */}
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-950/80 text-cyan-400">
                    <Droplet size={14} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Water Grid</div>
                    <div className="text-[10px] text-slate-400">
                      {waterActive ? 'Clean water flowing' : '⚠️ Offline: specialist dispatched'}
                    </div>
                  </div>
                </div>
                <button
                  disabled={busy}
                  onClick={() => handleToggleSupply('water', !waterActive)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                    waterActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                  }`}
                >
                  {waterActive ? 'Flowing' : 'Disrupted'}
                </button>
              </div>

              {/* Electricity Grid Toggle */}
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-950/80 text-amber-400">
                    <Zap size={14} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Electricity Grid</div>
                    <div className="text-[10px] text-slate-400">
                      {powerActive ? 'Turbines humming' : '⚠️ Blackout: 50% industrial wage penalty'}
                    </div>
                  </div>
                </div>
                <button
                  disabled={busy}
                  onClick={() => handleToggleSupply('power', !powerActive)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                    powerActive
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                  }`}
                >
                  {powerActive ? 'Online' : 'Blackout'}
                </button>
              </div>

              {/* Factory Raw Materials */}
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-orange-950/80 text-orange-400">
                    <Factory size={14} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Factory Supplies</div>
                    <div className="text-[10px] text-slate-400">
                      {factoryActive ? 'Components delivered' : '⚠️ Stalled: production idled'}
                    </div>
                  </div>
                </div>
                <button
                  disabled={busy}
                  onClick={() => handleToggleSupply('factory', !factoryActive)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                    factoryActive
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 hover:bg-orange-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                  }`}
                >
                  {factoryActive ? 'Active' : 'Stalled'}
                </button>
              </div>
            </div>
          </div>

          {/* 3. Police Patrol Budget & Crime Risk */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Shield size={14} className="text-[#38bdf8]" />
                <span>Police Patrol Budget & Crime Enforcement</span>
              </span>
              <span className="text-xs font-mono font-bold text-slate-300">
                Patrol: <span className="text-[#38bdf8]">{patrolBudget}%</span> | Risk:{' '}
                <span className={(state.crimeRisk ?? 12) > 40 ? 'text-rose-400' : 'text-emerald-400'}>
                  {state.crimeRisk ?? 12}%
                </span>
              </span>
            </div>

            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={patrolBudget}
                disabled={busy}
                onChange={(e) => void handlePatrolChange(Number(e.target.value))}
                className="w-full accent-[#38bdf8] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span className="text-rose-400 font-semibold">0% (Crime Wave, Slow Response)</span>
                <span>50% (Baseline)</span>
                <span className="text-emerald-400 font-semibold">100% (High Patrol, Safe City)</span>
              </div>
            </div>
          </div>

          {/* 4. Economic Taxes & Food Prices */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Coins size={14} className="text-amber-400" />
                <span>Municipal Taxes & Market Pricing</span>
              </span>
              <button
                disabled={busy}
                onClick={handleEconomicUpdate}
                className="rounded-lg bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[11px] font-bold text-amber-300 hover:bg-amber-500/30"
              >
                Apply Economy
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Food Price (credits)</label>
                <input
                  type="number"
                  min="2"
                  max="50"
                  value={foodPrice}
                  onChange={(e) => setFoodPrice(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Income Tax Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="35"
                  value={incomeTax}
                  onChange={(e) => setIncomeTax(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Sales Tax Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={salesTax}
                  onChange={(e) => setSalesTax(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* 5. Crisis Trigger Matrix */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-rose-400" />
                <span>Emergency Crisis Matrix</span>
              </span>
              <span className="text-[10px] text-slate-400">
                Active Crises: <strong className="text-amber-300">{activeCrises.join(', ') || 'None'}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { type: 'food_shortage', label: 'Food Shortage', icon: '🍞', desc: 'Rations freeze, City Hall petitions' },
                { type: 'power_failure', label: 'Power Blackout', icon: '⚡', desc: 'Grid fail, 50% wages, engineer repair' },
                { type: 'water_crisis', label: 'Water Crisis', icon: '💧', desc: 'Pumps offline, specialist flush' },
                { type: 'factory_shutdown', label: 'Factory Stoppage', icon: '🏭', desc: 'Parts stall, supplier negotiations' },
                { type: 'crime_wave', label: 'Crime Wave', icon: '🚨', desc: 'Surge in theft, detective patrol' },
                { type: 'pollution', label: 'Heavy Pollution', icon: '🌫️', desc: 'Air smog alert, lab testing' },
              ].map((c) => (
                <button
                  key={c.type}
                  disabled={busy}
                  onClick={() => handleTriggerCrisis(c.type)}
                  className={`rounded-xl border p-2 text-left transition-all ${
                    activeCrises.includes(c.type)
                      ? 'border-rose-500 bg-rose-950/60 text-rose-200 shadow-md'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <span>{c.icon}</span>
                    <span>{c.label}</span>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">{c.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer with Restore Normal button */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            disabled={busy}
            onClick={handleRestoreNormal}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-3.5 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-900/60 transition-colors shadow-sm"
          >
            <RotateCcw size={13} />
            <span>Restore All Normal Conditions</span>
          </button>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            Close God Mode
          </button>
        </div>
      </div>
    </div>
  );
}
