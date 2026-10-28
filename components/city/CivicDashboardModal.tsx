'use client';
import React, { useState, useEffect } from 'react';
import { Agent, SocietyState } from '@/lib/society';
import {
  Coins,
  Vote,
  ShieldCheck,
  Building2,
  FlaskConical,
  Download,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Scale,
  Sparkles,
} from 'lucide-react';

interface CivicDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: SocietyState;
  onRefresh?: () => void;
}

export default function CivicDashboardModal({
  isOpen,
  onClose,
  state,
  onRefresh,
}: CivicDashboardModalProps) {
  const [activeTab, setActiveTab] = useState<
    'ledger' | 'government' | 'justice' | 'departments' | 'research'
  >('ledger');

  const [civicData, setCivicData] = useState<{
    treasury: number;
    mayorName: string;
    foodPrice: number;
    activeEmergency: string | null;
    transactions: any[];
    complaints: any[];
    elections: any[];
    legalCases: any[];
  }>({
    treasury: 1200,
    mayorName: 'Ezra',
    foodPrice: 8,
    activeEmergency: null,
    transactions: [],
    complaints: [],
    elections: [],
    legalCases: [],
  });

  const [loading, setLoading] = useState(false);
  const [scenarioMsg, setScenarioMsg] = useState<string | null>(null);

  const fetchCivicData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/civic');
      if (res.ok) {
        const data = await res.json();
        setCivicData(data);
      }
    } catch (err) {
      console.error('Error fetching civic data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      void fetchCivicData();
    }
  }, [isOpen]);

  const handleInjectScenario = async (scenario: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/civic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'inject_scenario', scenario }),
      });
      if (res.ok) {
        setScenarioMsg(`Scenario "${scenario}" successfully injected into city!`);
        setTimeout(() => setScenarioMsg(null), 4000);
        void fetchCivicData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveComplaint = async (complaintId: string) => {
    try {
      await fetch('/api/civic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve_complaint', complaintId }),
      });
      void fetchCivicData();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePardonDetainee = async (agentId: string) => {
    try {
      await fetch('/api/civic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pardon_detainee', agentId }),
      });
      void fetchCivicData();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const exportLedgerCSV = () => {
    if (!civicData.transactions || civicData.transactions.length === 0) return;
    const headers = ['Round', 'Hour', 'Buyer', 'Seller', 'Amount', 'Item', 'TaxCollected', 'Date'];
    const rows = civicData.transactions.map((t) => [
      t.round,
      t.hour,
      `"${t.buyerName}"`,
      `"${t.sellerName}"`,
      t.amount,
      `"${t.item}"`,
      t.taxCollected,
      `"${t.createdAt}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nexus_city_ledger_year${state.year}_day${state.day}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col h-[88vh] w-full max-w-4xl rounded-3xl border border-slate-700/80 bg-[#0b1320] shadow-2xl text-slate-100 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#0e1726] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#76f2c0]/20 to-[#38bdf8]/20 text-[#76f2c0] border border-[#76f2c0]/30 shadow-inner">
              <Building2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-wide">
                  NEXUS CITY COUNCIL & CIVIC SYSTEMS
                </h2>
                <span className="rounded-full bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/40">
                  Year {state.year} • Day {state.day}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Autonomous municipal ledger, democratic elections, law enforcement & infrastructure
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchCivicData}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              <span>Sync</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-[#080e18] px-6 gap-2 overflow-x-auto">
          {[
            { id: 'ledger', label: 'Financial Ledger', icon: Coins },
            { id: 'government', label: 'Democracy & Elections', icon: Vote },
            { id: 'justice', label: 'Police & Courts', icon: Scale },
            { id: 'departments', label: 'Departments & Grid', icon: Building2 },
            { id: 'research', label: 'Research & Scenarios', icon: FlaskConical },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                  active
                    ? 'border-[#76f2c0] text-[#76f2c0] bg-[#76f2c0]/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0b1320]">
          {/* TAB 1: FINANCIAL LEDGER */}
          {activeTab === 'ledger' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5">
                  <div className="text-[10px] font-bold uppercase text-slate-400">City Treasury</div>
                  <div className="mt-1 text-xl font-black text-amber-300">
                    {civicData.treasury} <span className="text-xs text-amber-500 font-sans">credits</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Municipal reserves</span>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Dynamic Food Price</div>
                  <div className="mt-1 text-xl font-black text-emerald-400">
                    {civicData.foodPrice} <span className="text-xs text-emerald-600 font-sans">cr / meal</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Supply / demand indexed</span>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Tax Rates</div>
                  <div className="mt-1 text-sm font-bold text-slate-200">
                    10% Income • 5% Sales
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Automatic withholding</span>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-400">Data Export</div>
                    <div className="text-xs font-bold text-slate-200 mt-0.5">Download CSV Ledger</div>
                  </div>
                  <button
                    onClick={exportLedgerCSV}
                    className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold py-1.5 text-white transition-colors border border-slate-700"
                  >
                    <Download size={13} />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Live Financial Ledger Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Coins size={14} className="text-amber-400" />
                    <span>Real-Time Transaction Ledger (Last 60 Transfers)</span>
                  </h3>
                  <span className="text-[10px] text-slate-500">Every credit accounted for</span>
                </div>

                {civicData.transactions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
                    No transactions recorded in ledger yet. Start simulation to observe economic activity.
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/40">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-800 bg-slate-900/90 text-[10px] font-bold uppercase text-slate-400">
                        <tr>
                          <th className="py-2.5 px-3">Time</th>
                          <th className="py-2.5 px-3">Buyer / Origin</th>
                          <th className="py-2.5 px-3">Recipient / Seller</th>
                          <th className="py-2.5 px-3">Service / Item</th>
                          <th className="py-2.5 px-3 text-right">Amount</th>
                          <th className="py-2.5 px-3 text-right">Tax Paid</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {civicData.transactions.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-2 px-3 font-mono text-[11px] text-slate-400">
                              {String(t.hour).padStart(2, '0')}:00 (R{t.round})
                            </td>
                            <td className="py-2 px-3 font-bold text-white">{t.buyerName}</td>
                            <td className="py-2 px-3 text-slate-300">{t.sellerName}</td>
                            <td className="py-2 px-3 text-slate-400">{t.item}</td>
                            <td className="py-2 px-3 font-mono font-bold text-amber-300 text-right">
                              +{t.amount} 🪙
                            </td>
                            <td className="py-2 px-3 font-mono text-emerald-400 text-right">
                              {t.taxCollected > 0 ? `+${t.taxCollected}` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DEMOCRACY & ELECTIONS */}
          {activeTab === 'government' && (
            <div className="space-y-6">
              {/* Mayor Card */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 to-slate-900/80 p-5 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-3xl border border-amber-500/40 shadow-inner">
                    🏛️
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      Current City Chairman / Mayor
                    </span>
                    <h3 className="text-xl font-black text-white">{civicData.mayorName}</h3>
                    <p className="text-xs text-slate-400">
                      Presiding over municipal administration, public budget allocations, and council policy.
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Next General Election</span>
                  <div className="text-base font-black text-[#76f2c0]">
                    {state.day >= 360 ? 'Certifying Results' : `Year ${state.year}, Day 360`}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {360 - state.day > 0 ? `${360 - state.day} days remaining` : 'Annual election concluded'}
                  </span>
                </div>
              </div>

              {/* Certified Election History */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Vote size={14} className="text-[#76f2c0]" />
                  <span>Democratic Election Certification Records</span>
                </h4>
                {civicData.elections.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500">
                    The first annual general election is scheduled for Day 360 of Year 1.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {civicData.elections.map((elec) => (
                      <div
                        key={elec.id}
                        className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">Year {elec.year} General Election</span>
                          <span className="rounded-full bg-emerald-950 px-2 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/40">
                            Certified
                          </span>
                        </div>
                        <div className="mt-2 text-sm font-black text-amber-300">
                          Winner: {elec.winnerName}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-400">
                          Voter Turnout: {elec.turnout} / 10 citizens
                        </div>
                        <div className="mt-2 text-[10px] font-mono text-slate-500 bg-black/40 p-2 rounded-lg">
                          Ballot Breakdown: {elec.votesJson}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Citizen Complaints & Petitions */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>📜</span>
                  <span>Citizen Petitions & Grievances ({civicData.complaints.length})</span>
                </h4>
                {civicData.complaints.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500">
                    No active petitions filed by citizens. Public satisfaction is stable.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {civicData.complaints.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{c.subject}</span>
                            <span
                              className={`rounded-full px-2 py-0.2 text-[9px] font-bold uppercase ${
                                c.status === 'addressed'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                                  : 'bg-amber-950 text-amber-400 border border-amber-500/40'
                              }`}
                            >
                              {c.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{c.details}</p>
                          <span className="text-[10px] text-slate-500">
                            Filed by {c.citizenName} to {c.department} Dept
                          </span>
                        </div>
                        {c.status !== 'addressed' && (
                          <button
                            onClick={() => handleResolveComplaint(c.id)}
                            className="rounded-lg bg-emerald-600/80 hover:bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white transition-colors"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: POLICE & LEGAL SYSTEM */}
          {activeTab === 'justice' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-blue-500/40 bg-blue-950/20 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                    <ShieldCheck size={16} />
                    <span>Chief of Police</span>
                  </div>
                  <div className="mt-2 text-lg font-black text-white">Officer Theo</div>
                  <p className="text-[11px] text-slate-400 mt-1">Patrolling sectors & curfew compliance</p>
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                    <Scale size={16} className="text-amber-300" />
                    <span>Municipal Judge</span>
                  </div>
                  <div className="mt-2 text-lg font-black text-white">Judge Sana</div>
                  <p className="text-[11px] text-slate-400 mt-1">Presiding over civic courtroom hearings</p>
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                    <span>🔒</span>
                    <span>Holding Facility</span>
                  </div>
                  <div className="mt-2 text-lg font-black text-rose-300">
                    {state.agents.filter((a) => a.detainedHours && a.detainedHours > 0).length} Detained
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Serving corrective sentences</p>
                </div>
              </div>

              {/* Active Detainees */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Currently Detained Citizens
                </h4>
                {state.agents.filter((a) => a.detainedHours && a.detainedHours > 0).length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-800 p-5 text-center text-xs text-slate-500">
                    Zero citizens currently in holding. Public peace is preserved.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {state.agents
                      .filter((a) => a.detainedHours && a.detainedHours > 0)
                      .map((agent) => (
                        <div
                          key={agent.id}
                          className="flex items-center justify-between rounded-xl border border-rose-500/40 bg-rose-950/20 p-3"
                        >
                          <div>
                            <span className="text-xs font-bold text-white">{agent.name}</span>
                            <span className="text-[11px] text-rose-300 ml-2">
                              Remaining sentence: {agent.detainedHours} hours
                            </span>
                          </div>
                          <button
                            onClick={() => handlePardonDetainee(agent.id)}
                            className="rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 px-3 py-1 text-xs font-bold text-slate-200 transition-colors"
                          >
                            Executive Pardon
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Incident History Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-blue-400" />
                  <span>Police Incident & Hearing Archive</span>
                </h4>
                {civicData.legalCases.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500">
                    No formal incidents or trials logged.
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/40">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-800 bg-slate-900/90 text-[10px] font-bold uppercase text-slate-400">
                        <tr>
                          <th className="py-2.5 px-3">Time</th>
                          <th className="py-2.5 px-3">Suspect</th>
                          <th className="py-2.5 px-3">Officer</th>
                          <th className="py-2.5 px-3">Crime Type</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Verdict / Fine</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {civicData.legalCases.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-2 px-3 font-mono text-[11px] text-slate-400">
                              {String(c.hour).padStart(2, '0')}:00 (R{c.round})
                            </td>
                            <td className="py-2 px-3 font-bold text-white">{c.suspectName}</td>
                            <td className="py-2 px-3 text-slate-300">{c.officerName}</td>
                            <td className="py-2 px-3 text-slate-400">{c.crimeType}</td>
                            <td className="py-2 px-3">
                              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[9px] font-bold text-slate-300 capitalize">
                                {c.status}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-mono text-amber-300">
                              {c.verdict || 'Pending'} {c.fine > 0 ? `(${c.fine} cr)` : ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DEPARTMENTS & INFRASTRUCTURE */}
          {activeTab === 'departments' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Public Works */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase">
                      Department of Public Works
                    </span>
                    <span className="text-xs">🛠️</span>
                  </div>
                  <div className="mt-2 text-sm font-black text-white">Lead: Asha & Kian</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Responsible for power substation, water purification, workshop repairs, and island roads.
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs font-mono text-slate-300 bg-black/30 p-2 rounded-xl">
                    <span>Grid Status: Active</span>
                    <span className="text-emerald-400">95% Health</span>
                  </div>
                </div>

                {/* Commerce & Agriculture */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase">
                      Department of Commerce
                    </span>
                    <span className="text-xs">🍏</span>
                  </div>
                  <div className="mt-2 text-sm font-black text-white">Lead: Milo & Remy</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Oversees central marketplace, grocery inventory, and credit exchange stability.
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs font-mono text-slate-300 bg-black/30 p-2 rounded-xl">
                    <span>Market Supply: Stable</span>
                    <span className="text-emerald-400">{civicData.foodPrice} Cr/meal</span>
                  </div>
                </div>

                {/* Health & Public Safety */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-400 uppercase">
                      Department of Health & Safety
                    </span>
                    <span className="text-xs">🏥</span>
                  </div>
                  <div className="mt-2 text-sm font-black text-white">Lead: Nova & Sana</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Civic Health Clinic monitoring, education lectures, and wellbeing diagnostics.
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs font-mono text-slate-300 bg-black/30 p-2 rounded-xl">
                    <span>Clinic Capacity: Open</span>
                    <span className="text-emerald-400">100% Operational</span>
                  </div>
                </div>

                {/* Administration & Culture */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-400 uppercase">
                      Administration & Culture
                    </span>
                    <span className="text-xs">🎨</span>
                  </div>
                  <div className="mt-2 text-sm font-black text-white">Lead: Ezra & Iris</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Democratic elections, public petitions, plaza monuments, and cultural happiness.
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs font-mono text-slate-300 bg-black/30 p-2 rounded-xl">
                    <span>Civic Harmony: High</span>
                    <span className="text-purple-400">Annual Election Day 360</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: RESEARCH MODE & SCENARIOS */}
          {activeTab === 'research' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FlaskConical size={14} className="text-[#38bdf8]" />
                  <span>Simulation Experiment & Scenario Injectors</span>
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Test the society's resilience and autonomous governance under emergent economic and environmental shocks.
                </p>

                {scenarioMsg && (
                  <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-950/80 border border-emerald-500/60 p-3 text-xs font-bold text-emerald-300">
                    <CheckCircle2 size={16} />
                    <span>{scenarioMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    disabled={loading}
                    onClick={() => handleInjectScenario('famine')}
                    className="flex flex-col items-start rounded-2xl border border-rose-500/40 bg-rose-950/20 p-4 text-left hover:bg-rose-950/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                      <span>🌾</span>
                      <span>Inject Food Shortage Shock</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Increases hunger, spikes food prices to 18 credits, and tests grocery replenishment.
                    </p>
                  </button>

                  <button
                    disabled={loading}
                    onClick={() => handleInjectScenario('blackout')}
                    className="flex flex-col items-start rounded-2xl border border-amber-500/40 bg-amber-950/20 p-4 text-left hover:bg-amber-950/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                      <span>⚡</span>
                      <span>Trigger Power Grid Outage</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Causes power substation trip; forces Public Works (Asha/Kian) to dispatch emergency repair.
                    </p>
                  </button>

                  <button
                    disabled={loading}
                    onClick={() => handleInjectScenario('boom')}
                    className="flex flex-col items-start rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-4 text-left hover:bg-emerald-950/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                      <span>💰</span>
                      <span>Inject Economic Boom (+500 Credits)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Injects surplus credits into the treasury and grants stipends to all living citizens.
                    </p>
                  </button>

                  <button
                    disabled={loading}
                    onClick={() => handleInjectScenario('curfew')}
                    className="flex flex-col items-start rounded-2xl border border-blue-500/40 bg-blue-950/20 p-4 text-left hover:bg-blue-950/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                      <span>🛡️</span>
                      <span>Enact Night Security Curfew</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Dispatches officer Theo on active security rounds and tests detention facility operations.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
