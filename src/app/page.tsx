"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { ArrowRight, Search, Activity, Shield, Clock, Layers, Sparkles, TrendingUp, Zap } from "lucide-react";

// ── Animated particle background ──────────────────────
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];
    const count = 80;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
      });
    }

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas!.width;
        if (p.x > canvas!.width) p.x = 0;
        if (p.y < 0) p.y = canvas!.height;
        if (p.y > canvas!.height) p.y = 0;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(0, 82, 255, ${p.opacity})`;
        ctx!.fill();

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[j].x - p.x;
          const dy = particles[j].y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx!.beginPath();
            ctx!.moveTo(p.x, p.y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.strokeStyle = `rgba(0, 82, 255, ${0.06 * (1 - dist / 120)})`;
            ctx!.stroke();
          }
        }
      });
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" />;
}

// ── Types ──────────────────────────────────────────────
interface WalletStats { totalTx: number; activeMonths: number; uniqueContracts: number; totalVolEth: number; balEth: number; uniqueTokens: number; ageDays: number; }
interface Protocol { name: string; icon: string; txCount: number; }
interface WalletData {
  address: string; stats: WalletStats; protocols: Protocol[];
  twitterMetrics: { tweet_count: number; followers_count: number; following_count: number; listed_count: number } | null;
  recentTxs: { hash: string; from: string; to: string; value: string; timeStamp: string; isContract: boolean }[];
}
function calcScore(s: WalletStats) { let x = 0; if (s.totalTx >= 500) x += 25; else if (s.totalTx >= 100) x += 15; else if (s.totalTx >= 10) x += 8; if (s.activeMonths >= 12) x += 20; else if (s.activeMonths >= 6) x += 14; else if (s.activeMonths >= 3) x += 8; if (s.uniqueContracts >= 20) x += 20; else if (s.uniqueContracts >= 10) x += 14; else if (s.uniqueContracts >= 5) x += 8; if (s.totalVolEth >= 10) x += 15; else if (s.totalVolEth >= 1) x += 10; else if (s.totalVolEth >= 0.1) x += 5; if (s.ageDays >= 365) x += 12; else if (s.ageDays >= 180) x += 8; else if (s.ageDays >= 90) x += 4; if (s.balEth >= 0.1) x += 8; else if (s.balEth >= 0.01) x += 4; return Math.min(x, 100); }
function reputation(score: number) { if (score >= 80) return { label: "Elite", color: "#0052FF" }; if (score >= 60) return { label: "Experienced", color: "#0052FF" }; if (score >= 40) return { label: "Active", color: "rgba(255,255,255,0.5)" }; if (score >= 20) return { label: "Beginner", color: "rgba(255,255,255,0.3)" }; return { label: "New", color: "rgba(255,255,255,0.2)" }; }
function timeAgo(ts: string) { const s = Math.floor(Date.now() / 1000) - parseInt(ts); if (s < 60) return s + "s"; if (s < 3600) return Math.floor(s / 60) + "m"; if (s < 86400) return Math.floor(s / 3600) + "h"; return Math.floor(s / 86400) + "d"; }

// ── Dashboard Mockup ──────────────────────────────────
function DashboardMockup({ data, score }: { data?: WalletData; score?: number }) {
  const showData = !!data;
  return (
    <div className="bg-[#0A0A0A] border border-white/[0.06] rounded-3xl p-6 backdrop-blur-sm w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-medium mb-1">Wallet Score</div>
          <div className="text-3xl font-bold tracking-[-0.03em] text-white">
            {showData ? score : <span className="text-white/20">87</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#0052FF]/15 text-[#0052FF] border border-[#0052FF]/20">
            {showData ? reputation(score!).label : "Elite"}
          </span>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/[0.03] text-white/30 border border-white/[0.04]">
            Smart Money: <span className="text-[#0052FF]">{showData ? score : 92}</span>
          </span>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[["Activity", showData ? data!.stats.activeMonths + " mo" : "14 mo"], ["Protocols", showData ? String(data!.stats.uniqueContracts) : "24"], ["Volume", showData ? data!.stats.totalVolEth.toFixed(1) + " ETH" : "12.4 ETH"]].map(([l, v], i) => (
          <div key={i} className="bg-white/[0.02] border border-white/[0.03] rounded-2xl px-3 py-3">
            <div className="text-[9px] uppercase tracking-wider text-white/30 mb-1">{l}</div>
            <div className="text-sm font-semibold text-white">{v}</div>
          </div>
        ))}
      </div>

      {/* Sparkline + Summary */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white/[0.02] border border-white/[0.03] rounded-2xl p-3">
          <div className="text-[9px] uppercase tracking-wider text-white/30 mb-2">Activity</div>
          <svg viewBox="0 0 100 30" className="w-full" preserveAspectRatio="none">
            <polyline fill="none" stroke="#0052FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              points="0,28 8,25 16,18 24,22 32,14 40,16 48,8 56,12 64,4 72,6 80,10 88,2 96,5 100,0"
              opacity={showData ? 1 : 0.3} />
            <polyline fill="url(#grad)" stroke="none"
              points="0,28 8,25 16,18 24,22 32,14 40,16 48,8 56,12 64,4 72,6 80,10 88,2 96,5 100,0 100,30 0,30"
              opacity={showData ? 0.15 : 0.05} />
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0052FF" />
                <stop offset="100%" stopColor="#0052FF" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.03] rounded-2xl p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3 h-3 text-[#0052FF]" />
            <span className="text-[9px] uppercase tracking-wider text-white/30">AI Summary</span>
          </div>
          <p className="text-[10px] text-white/40 leading-relaxed">
            {showData
              ? `${reputation(score!).label}-level wallet. ${data!.stats.totalTx} txs across ${data!.stats.uniqueContracts} protocols. ${data!.stats.totalVolEth.toFixed(1)} ETH volume.`
              : "Elite-level wallet. 337 txs across 24 protocols. 12.4 ETH volume. Strong DeFi experience."}
          </p>
        </div>
      </div>

      {/* Protocols */}
      <div className="mb-5">
        <div className="text-[9px] uppercase tracking-wider text-white/30 mb-2">Top Protocols</div>
        <div className="space-y-1.5">
          {(showData
            ? data!.protocols.slice(0, 4).map(p => [p.name, p.txCount] as [string, number])
            : [["Aerodrome", 56], ["Uniswap V3", 34], ["Morpho", 21], ["Aave V3", 18]] as [string, number][]
          ).map(([name, count], i) => (
            <div key={i} className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#0052FF]/15 flex items-center justify-center text-[7px] font-bold text-[#0052FF]">{name[0]}</div>
                <span className="text-white/60">{name}</span>
              </div>
              <span className="text-white/30 tabular-nums">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Txs */}
      <div>
        <div className="text-[9px] uppercase tracking-wider text-white/30 mb-2">Recent Activity</div>
        <div className="space-y-1">
          {(showData
            ? data!.recentTxs.slice(0, 3).map(tx => ({ hash: tx.hash.slice(0, 10) + "...", isOut: tx.from?.toLowerCase() === data!.address, isContract: tx.isContract, value: tx.value }))
            : [{ hash: "0xa1b2c3...", isOut: true, isContract: false, value: "0.035" }, { hash: "0xd4e5f6...", isOut: true, isContract: true, value: "0.000" }, { hash: "0xg7h8i9...", isOut: false, isContract: false, value: "0.002" }]
          ).map((tx, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px]">
              <span className="font-mono text-white/40">{tx.hash}</span>
              <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold"
                style={{ background: tx.isContract ? "rgba(0,82,255,0.1)" : tx.isOut ? "rgba(255,255,255,0.05)" : "rgba(34,197,94,0.1)", color: tx.isContract ? "#0052FF" : tx.isOut ? "#ffffff80" : "#22C55E" }}>
                {tx.isContract ? "Contract" : tx.isOut ? "Sent" : "Received"}
              </span>
              <span className="text-white/30 ml-auto">{tx.value} ETH</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────
export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<WalletData | null>(null);

  async function analyze() {
    const raw = input.trim();
    if (!raw) return setError("Enter a wallet address");
    const isAddr = raw.startsWith("0x") && raw.length === 42;
    if (!isAddr && !raw.includes(".")) return setError("Enter 0x... or name.base.eth");
    setLoading(true); setError("");
    let addr = raw.toLowerCase();
    if (!isAddr) {
      try {
        const r = await fetch(`/api/proxy?url=${encodeURIComponent("https://base.blockscout.com/api?module=account&action=txlist&address=" + raw + "&startblock=0&endblock=99999999&sort=desc&offset=1&page=1")}`);
        const d = await r.json();
        if (d.result?.length > 0) addr = d.result[0].from.toLowerCase();
        else { setError("Cannot resolve Basename"); setLoading(false); return; }
      } catch { setError("Cannot resolve"); setLoading(false); return; }
    }
    try {
      const r = await fetch(`/api/wallet?addr=${addr}`);
      const d = await r.json();
      if (d.error) { setError(d.error); setLoading(false); return; }
      setData(d);
    } catch (e: any) { setError(e.message || "Failed"); }
    setLoading(false);
  }

  const score = data ? calcScore(data.stats) : 0;

  return (
    <div className="min-h-screen bg-black text-white">
      <ParticleField />

      {/* ── Nav ──────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-[1400px] mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0052FF] rounded-lg flex items-center justify-center">
              <span className="text-white text-[12px] font-bold">B</span>
            </div>
            <span className="text-sm font-semibold tracking-tight">Basewallet</span>
          </div>
          <div className="flex items-center gap-10 text-[13px] font-medium">
            <span className="text-white">Wallet</span>
            <span className="text-white/50 hover:text-white/80 transition-colors cursor-pointer">Trending</span>
            <span className="text-white/50 hover:text-white/80 transition-colors cursor-pointer">Leaderboard</span>
          </div>
          <button className="bg-white text-black text-xs font-semibold px-4 py-2 rounded-full hover:bg-gray-200 transition-colors">
            Connect Wallet
          </button>
        </div>
      </nav>

      {/* ── Hero + Dashboard ──────────────────────────── */}
      <section className="relative px-8 pt-20 pb-12">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left — Typography + CTA */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 text-[10px] font-semibold text-white/40 uppercase tracking-[0.25em] mb-8"
              >
                <div className="w-6 h-px bg-[#0052FF]/50" />
                The Reputation Layer for Base
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.7, ease: "easeOut" }}
                className="text-[72px] sm:text-[100px] lg:text-[128px] font-extrabold tracking-[-0.04em] leading-[0.9] mb-6"
              >
                Understand<br />
                <span className="text-[#0052FF]">any wallet</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="text-[16px] text-white/50 leading-relaxed max-w-[460px] mb-10"
              >
                Analyze wallets, discover smart money, track on-chain reputation and uncover the stories behind every address on Base.
              </motion.p>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="flex flex-col sm:flex-row gap-3 mb-12"
              >
                <div className="flex-1 max-w-[480px] bg-white/[0.03] border border-white/[0.08] rounded-2xl flex items-center gap-0 p-1.5 hover:border-white/[0.15] transition-colors">
                  <Search className="w-4 h-4 text-white/20 ml-3 flex-shrink-0" />
                  <input
                    className="flex-1 bg-transparent px-2 py-3 text-[14px] outline-none placeholder:text-white/20 text-white"
                    placeholder="0x... or name.base.eth"
                    value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && analyze()}
                  />
                  <button
                    className="bg-[#0052FF] text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl hover:bg-[#0045DD] transition-colors disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
                    onClick={analyze} disabled={loading}
                  >
                    {loading ? "…" : <><span>Analyze</span><ArrowRight className="w-3.5 h-3.5" /></>}
                  </button>
                </div>
                <button className="text-[13px] font-medium text-white/40 hover:text-white/70 transition-colors flex items-center gap-1.5 px-2">
                  View Leaderboard <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
              {error && <div className="text-[13px] text-red-400 font-medium -mt-8 mb-4">{error}</div>}

              {/* Already analyzed? Show mini result line */}
              {data && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex items-center gap-3 text-[13px] text-white/30">
                  <span className="text-white/50 font-mono">{data.address.slice(0, 10)}...{data.address.slice(-6)}</span>
                  <span className="text-white/20">·</span>
                  <span>Score <span className="text-[#0052FF] font-semibold">{score}</span></span>
                  <span className="text-white/20">·</span>
                  <span>{data.stats.totalTx.toLocaleString()} txs</span>
                </motion.div>
              )}
            </div>

            {/* Right — Floating Dashboard */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
              className="relative"
            >
              {/* Glow behind dashboard */}
              <div className="absolute -inset-10 bg-[#0052FF]/10 blur-[80px] rounded-full" />
              <div className="relative">
                <DashboardMockup data={data || undefined} score={data ? score : 87} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────── */}
      <footer className="border-t border-white/[0.04] py-6 px-8">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between text-[12px] text-white/20">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-white/[0.05] rounded flex items-center justify-center">
              <span className="text-[8px] font-bold text-white/30">B</span>
            </div>
            Basewallet
          </div>
          <span>Data from Base Blockscout · Not financial advice</span>
        </div>
      </footer>
    </div>
  );
}
