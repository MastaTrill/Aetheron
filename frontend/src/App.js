import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Zap,
  ShieldAlert,
  Users,
  TrendingUp,
  Globe,
  Activity,
  Shuffle,
  Trophy,
  History,
  Pickaxe,
  Award,
  RefreshCcw,
  AlertTriangle
} from 'lucide-react';

// --- CONFIG ---
const WIN_TARGET = 1000000;
const INITIAL_TVL = 1000;
const INITIAL_APY = 22.0;
const UPDATE_INTERVAL = 1000;
const LIQUIDATION_CHANCE = 0.04;

const NETWORKS = [
  { id: 'mainnet', name: 'Aetheron Main', color: 'text-cyan-400', yieldMod: 1.0, riskMod: 1.0 },
  { id: 'abyss', name: 'The Abyss L2', color: 'text-purple-500', yieldMod: 3.0, riskMod: 2.5 },
  { id: 'neon', name: 'Neon Shard', color: 'text-pink-500', yieldMod: 1.8, riskMod: 1.4 },
];

const App = () => {
  const [tvl, setTvl] = useState(INITIAL_TVL);
  const [totalYield, setTotalYield] = useState(0);
  const [apy, setApy] = useState(INITIAL_APY);
  const [activeNetwork, setActiveNetwork] = useState(NETWORKS[0]);
  const [logs, setLogs] = useState([{ msg: "Ascension Protocols Engaged. Mining modules online.", time: new Date().toLocaleTimeString() }]);

  // Game States
  const [activeLiquidation, setActiveLiquidation] = useState(false);
  const [stabilizationProgress, setStabilizationProgress] = useState(0);
  const [isMining, setIsMining] = useState(false);
  const [miningCharge, setMiningCharge] = useState(0);
  const [hasWon, setHasWon] = useState(false);

  const addLog = useCallback((msg) => {
    setLogs(prev => [{ msg, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 15));
  }, []);

  // --- WIN CONDITION ---
  useEffect(() => {
    if (tvl >= WIN_TARGET && !hasWon) {
      setHasWon(true);
      addLog("🏆 ASCENSION REACHED: Node has reached Tier-1 status.");
    }
  }, [tvl, hasWon, addLog]);

  // --- LIQUIDITY MINING MINI-GAME ---
  const startMining = () => {
    if (activeLiquidation || isMining) return;
    setIsMining(true);
    setMiningCharge(0);
    addLog("⚒️ Initiating Liquidity Mining Burst...");
  };

  const handleMiningClick = () => {
    if (!isMining) return;
    setMiningCharge(prev => {
      const next = prev + 8;
      if (next >= 100) {
        const bonus = tvl * 0.15;
        setTvl(t => t + bonus);
        setIsMining(false);
        addLog(`💰 BURST SUCCESS: +$${bonus.toFixed(0)} TVL injected.`);
        // High reward comes with a risk spike
        if (Math.random() > 0.5) triggerLiquidation();
        return 0;
      }
      return next;
    });
  };

  // --- LIQUIDATION LOGIC ---
  const triggerLiquidation = useCallback(() => {
    if (!activeLiquidation) {
      setActiveLiquidation(true);
      setStabilizationProgress(0);
      addLog("⚠️ STABILITY WARNING: Cascading failure imminent!");
    }
  }, [activeLiquidation, addLog]);

  const handleStabilize = () => {
    setStabilizationProgress(prev => {
      const next = prev + 25;
      if (next >= 100) {
        setActiveLiquidation(false);
        addLog("✅ Manual override successful. Node stabilized.");
        return 0;
      }
      return next;
    });
  };

  // --- MAIN ENGINE ---
  useEffect(() => {
    const timer = setInterval(() => {
      if (hasWon) return;

      const baseEarn = (tvl * (apy / 100) * activeNetwork.yieldMod) / 3600;
      setTvl(prev => prev + baseEarn);
      setTotalYield(prev => prev + baseEarn);

      if (!activeLiquidation && Math.random() < (LIQUIDATION_CHANCE * activeNetwork.riskMod)) {
        triggerLiquidation();
      }
    }, UPDATE_INTERVAL);
    return () => clearInterval(timer);
  }, [tvl, apy, activeNetwork, activeLiquidation, triggerLiquidation, hasWon]);

  if (hasWon) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8 font-mono">
        <div className="max-w-md w-full text-center space-y-6 border-2 border-cyan-500 p-12 rounded-[3rem] shadow-[0_0_100px_rgba(6,182,212,0.2)]">
          <Award className="text-cyan-400 mx-auto w-24 h-24 animate-pulse" />
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic underline decoration-cyan-500">Node Ascended</h1>
          <p className="text-slate-400 text-sm leading-relaxed uppercase tracking-widest">
            Protocol Goal Met: <span className="text-white">$1,000,000 TVL</span> achieved. You have reached the apex of the Aetheron cluster.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-full transition-all"
          >
            Restart Protocol
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020203] text-slate-100 font-mono p-4 md:p-8 flex flex-col">
      {/* Header HUD */}
      <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white flex items-center gap-3">
            <Zap className="text-cyan-400 fill-current" size={32} /> AETHERON <span className="bg-red-600 text-[10px] px-2 py-1 align-top tracking-widest">PHASE_MAX</span>
          </h1>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/> Network: <span className={activeNetwork.color}>{activeNetwork.name}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase">
               <Trophy size={12} className="text-yellow-500"/> Goal: $1,000,000
            </div>
          </div>
        </div>

        <div className="flex gap-4 w-full lg:w-auto">
          <div className="flex-1 bg-white/5 border border-white/10 p-5 rounded-3xl text-right">
             <p className="text-[10px] text-slate-500 uppercase font-black mb-1 tracking-widest">Synthesized TVL</p>
             <p className="text-3xl font-black text-white tracking-tighter">${tvl.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-6 flex-grow">

        {/* Left: Navigation & Mining */}
        <div className="space-y-6">
          {/* Mining Card */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] relative overflow-hidden">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              <Pickaxe size={14} className="text-yellow-500"/> Liquidity Mining
            </h3>

            {isMining ? (
              <div className="space-y-4">
                <div className="h-2 w-full bg-black rounded-full overflow-hidden border border-white/10">
                   <div className="h-full bg-yellow-400 transition-all duration-75" style={{ width: `${miningCharge}%` }} />
                </div>
                <button
                  onClick={handleMiningClick}
                  className="w-full py-6 bg-yellow-500 text-black font-black text-sm uppercase rounded-2xl active:scale-95 transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)]"
                >
                  MINE LIQUIDITY
                </button>
                <p className="text-[9px] text-center text-slate-500 animate-pulse">TAP REPEATEDLY TO EXTRACT</p>
              </div>
            ) : (
              <button
                onClick={startMining}
                disabled={activeLiquidation}
                className="w-full py-4 border-2 border-dashed border-white/10 hover:border-yellow-500/50 rounded-2xl text-slate-500 hover:text-yellow-500 transition-all flex flex-col items-center gap-2 disabled:opacity-30"
              >
                <RefreshCcw size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">Start Mining Burst</span>
              </button>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem]">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              <Shuffle size={14} className="text-cyan-400"/> Network Bridge
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {NETWORKS.map(net => (
                <button
                  key={net.id}
                  onClick={() => setActiveNetwork(net)}
                  className={`p-3 rounded-xl border text-left transition-all ${activeNetwork.id === net.id ? 'bg-white/10 border-white/20' : 'bg-black/50 border-white/5'}`}
                >
                  <div className={`text-xs font-black uppercase tracking-tighter ${net.color}`}>{net.name}</div>
                  <div className="text-[8px] text-slate-600 font-bold uppercase mt-1">Boost: {net.yieldMod}x</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Main OS Display */}
        <div className="lg:col-span-2 space-y-6">
          <div className="h-full bg-gradient-to-t from-black to-[#0a0a0f] border border-white/10 rounded-[3rem] p-8 flex flex-col relative overflow-hidden">
             {/* Background Grid */}
             <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

             <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> Node Status: Optimal
                      </p>
                      <h2 className="text-5xl font-black text-white tracking-tighter italic uppercase">{activeNetwork.id}</h2>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Rank</p>
                      <p className="text-2xl font-black text-white tracking-tighter">#001</p>
                   </div>
                </div>

                <div className="mt-auto space-y-8">
                   <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                         <span>Ascension Progress</span>
                         <span>{((tvl / WIN_TARGET) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                         <div className="h-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all duration-500" style={{ width: `${(tvl / WIN_TARGET) * 100}%` }} />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Effective APY</p>
                        <p className="text-xl font-black text-white">{(apy * activeNetwork.yieldMod).toFixed(1)}%</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Risk Multiplier</p>
                        <p className="text-xl font-black text-orange-500">{activeNetwork.riskMod.toFixed(1)}x</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Security & Logs */}
        <div className="space-y-6">
          {/* Security Alert */}
          <div className={`p-6 rounded-[2rem] border-2 transition-all duration-300 h-1/3 flex flex-col justify-center ${activeLiquidation ? 'bg-red-500/10 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.2)]' : 'bg-black border-white/10'}`}>
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className={activeLiquidation ? "text-red-500 animate-pulse" : "text-slate-800"} size={24} />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Security</h3>
            </div>

            {activeLiquidation ? (
              <div className="space-y-4">
                <div className="h-4 w-full bg-black rounded-full overflow-hidden border border-red-500/30">
                  <div className="h-full bg-red-500 transition-all duration-100" style={{ width: `${stabilizationProgress}%` }} />
                </div>
                <button
                  onClick={handleStabilize}
                  className="w-full py-4 bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg active:scale-95"
                >
                  STABILIZE NODE
                </button>
              </div>
            ) : (
              <div className="text-center opacity-30">
                <Activity className="mx-auto mb-2 text-slate-500" size={24} />
                <p className="text-[9px] font-black uppercase text-slate-600">Passive Monitoring Active</p>
              </div>
            )}
          </div>

          <div className="bg-black border border-white/10 rounded-[2rem] p-6 h-2/3 flex flex-col overflow-hidden">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 mb-4 flex items-center gap-2">
              <History size={14} /> Log Feed
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 text-[9px] font-mono scrollbar-hide">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2 border-l border-white/5 pl-2 py-0.5">
                  <span className="text-slate-700">[{log.time}]</span>
                  <span className={log.msg.includes('💰') ? 'text-green-400 font-bold' : log.msg.includes('⚠️') ? 'text-red-400' : 'text-slate-400'}>{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;
