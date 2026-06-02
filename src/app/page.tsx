"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ArrowRight, Search, Activity, Shield, Clock, Layers, Sparkles, TrendingUp, Users, Zap } from "lucide-react";

// ── Types ──────────────────────────────────────────────
interface WalletStats {
  totalTx: number; activeMonths: number; uniqueContracts: number;
  totalVolEth: number; balEth: number; uniqueTokens: number; ageDays: number;
}
interface Protocol { name: string; icon: string; txCount: number; }
interface WalletData {
  address: string; stats: WalletStats; protocols: Protocol[];
  twitterMetrics: { tweet_count: number; followers_count: number; following_count: number; listed_count: number } | null;
  recentTxs: { hash: string; from: string; to: string; value: string; timeStamp: string; isContract: boolean }[];
}

function calcScore(s: WalletStats) { let x = 0; if (s.totalTx >= 500) x += 25; else if (s.totalTx >= 100) x += 15; else if (s.totalTx >= 10) x += 8; if (s.activeMonths >= 12) x += 20; else if (s.activeMonths >= 6) x += 14; else if (s.activeMonths >= 3) x += 8; if (s.uniqueContracts >= 20) x += 20; else if (s.uniqueContracts >= 10) x += 14; else if (s.uniqueContracts >= 5) x += 8; if (s.totalVolEth >= 10) x += 15; else if (s.totalVolEth >= 1) x += 10; else if (s.totalVolEth >= 0.1) x += 5; if (s.ageDays >= 365) x += 12; else if (s.ageDays >= 180) x += 8; else if (s.ageDays >= 90) x += 4; if (s.balEth >= 0.1) x += 8; else if (s.balEth >= 0.01) x += 4; return Math.min(x, 100); }
function reputation(score: number) { if (score >= 80) return { label: "Elite", color: "#0052FF" }; if (score >= 60) return { label: "Experienced", color: "#0052FF" }; if (score >= 40) return { label: "Active", color: "#737373" }; if (score >= 20) return { label: "Beginner", color: "#999" }; return { label: "New", color: "#BBB" }; }

// ── Score Ring (compact) ───────────────────────────────
function ScoreRing({ score, animate }: { score: number; animate: boolean }) {
  const r = 58, circ = 2 * Math.PI * r;
  const rep = reputation(score);
  return (
    <div className="relative">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#F0F0F0" strokeWidth="4" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={rep.color} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={animate ? (circ - (score / 100) * circ) : circ}
          strokeLinecap="round" transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[38px] font-bold tracking-[-0.03em]" style={{ color: rep.color }}>{score}</span>
        <span className="text-[10px] text-[#999] font-medium">/ 100</span>
      </div>
    </div>
  );
}

// ── Metric pill ────────────────────────────────────────
function MetricPill({ icon: Icon, label, value, delay }: { icon: any; label: string; value: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm"
    >
      <div className="w-8 h-8 rounded-xl bg-[#F0F5FF] flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-[#0052FF]" />
      </div>
      <div>
        <div className="text-[10px] text-[#999] uppercase tracking-wider font-medium">{label}</div>
        <div className="text-sm font-semibold text-[#111]">{value}</div>
      </div>
    </motion.div>
  );
}

// ── Protocol bar ───────────────────────────────────────
function ProtoBar({ name, icon, txCount, max }: { name: string; icon: string; txCount: number; max: number }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-md bg-[#F0F5FF] flex items-center justify-center text-[10px] font-bold text-[#0052FF]">{icon}</div>
        <span className="text-[13px] font-medium text-[#111]">{name}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-20 h-1 bg-[#F0F0F0] rounded-full overflow-hidden hidden sm:block">
          <div className="h-full bg-[#0052FF] rounded-full" style={{ width: (txCount / max) * 100 + "%", transition: "width 0.8s ease" }} />
        </div>
        <span className="text-[12px] text-[#999] tabular-nums w-8 text-right">{txCount}</span>
      </div>
    </div>
  );
}

// ── Transaction row ────────────────────────────────────
function timeAgo(ts: string) { const s = Math.floor(Date.now() / 1000) - parseInt(ts); if (s < 60) return s + "s"; if (s < 3600) return Math.floor(s / 60) + "m"; if (s < 86400) return Math.floor(s / 3600) + "h"; return Math.floor(s / 86400) + "d"; }

function TxRow({ tx, addr }: { tx: WalletData["recentTxs"][0]; addr: string }) {
  const isOut = tx.from?.toLowerCase() === addr;
  const type = tx.isContract ? "Contract" : isOut ? "Sent" : "Received";
  const tc = isOut ? "#737373" : tx.isContract ? "#0052FF" : "#22C55E";
  return (
    <div className="grid grid-cols-12 gap-2 px-6 py-2 text-[12px] border-b border-[#F5F5F5] last:border-0 hover:bg-[#FAFAFA] transition-colors">
      <a href={`https://basescan.org/tx/${tx.hash}`} target="_blank" className="col-span-5 text-[#111] font-mono truncate hover:text-[#0052FF] transition-colors">
        {tx.hash.slice(0, 10)}...
      </a>
      <span className="col-span-3" style={{ color: tc }}>{type}</span>
      <span className="col-span-2 text-right text-[#999] font-mono">{tx.value} ETH</span>
      <span className="col-span-2 text-right text-[#BBB]">{timeAgo(tx.timeStamp)}</span>
    </div>
  );
}

// ── Dashboard mockup card ──────────────────────────────
function DashboardMockup() {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-[#F0F0F0] p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#F0F5FF] flex items-center justify-center">
          <Shield className="w-5 h-5 text-[#0052FF]" />
        </div>
        <div>
          <div className="text-[10px] text-[#999] uppercase tracking-wider font-medium">Wallet Score</div>
          <div className="text-xl font-bold text-[#111]">87/100</div>
        </div>
        <div className="ml-auto px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#F0F5FF] text-[#0052FF]">Elite</div>
      </div>

      {/* Metric pills */}
      <div className="grid grid-cols-2 gap-2">
        {[["Active", "14 mo"], ["Protocols", "24"], ["Volume", "12.4 ETH"], ["Age", "420d"]].map(([l, v], i) => (
          <div key={i} className="bg-[#FAFAFA] rounded-xl px-3 py-2.5">
            <div className="text-[9px] text-[#999] uppercase tracking-wider">{l}</div>
            <div className="text-sm font-semibold text-[#111]">{v}</div>
          </div>
        ))}
      </div>

      {/* Protocols */}
      <div>
        <div className="text-[9px] text-[#999] uppercase tracking-wider mb-2 font-medium">Top Protocols</div>
        <div className="space-y-1.5">
          {[{ name: "Aerodrome", icon: "A", count: 56 }, { name: "Uniswap V3", icon: "U", count: 34 }, { name: "Morpho", icon: "M", count: 21 }, { name: "Aave V3", icon: "A", count: 18 }].map((p, i) => (
            <div key={i} className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-[#F0F5FF] flex items-center justify-center text-[8px] font-bold text-[#0052FF]">{p.icon}</div>
                <span className="text-[#737373]">{p.name}</span>
              </div>
              <span className="text-[#999]">{p.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <div>
        <div className="text-[9px] text-[#999] uppercase tracking-wider mb-2 font-medium">Recent Activity</div>
        {["0xa1b2... → 0.035 ETH", "0xc3d4... → Contract", "0xe5f6... ← 0.002 ETH", "0xg7h8... → 0.014 ETH"].map((tx, i) => (
          <div key={i} className="text-[11px] text-[#737373] py-1 font-mono">{tx}</div>
        ))}
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
  const [animated, setAnimated] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => { if (data) { setShowResults(true); setTimeout(() => setAnimated(true), 200); } }, [data]);

  async function analyze() {
    const raw = input.trim();
    if (!raw) return setError("Enter a wallet address");
    const isAddr = raw.startsWith("0x") && raw.length === 42;
    if (!isAddr && !raw.includes(".")) return setError("Enter 0x... or name.base.eth");
    setLoading(true); setError(""); setData(null); setAnimated(false); setShowResults(false);
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
    // Scroll to results
    setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  const score = data ? calcScore(data.stats) : 0;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111111]">
      {/* ── Navigation ────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-[#FAFAFA]/85 backdrop-blur-xl border-b border-[#F0F0F0]">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#0052FF] rounded-lg flex items-center justify-center">
              <span className="text-white text-[11px] font-bold">B</span>
            </div>
            <span className="text-sm font-semibold tracking-tight">Basewallet</span>
          </div>
          <div className="flex items-center gap-8 text-[13px] font-medium">
            <span className="text-[#111]">Wallet</span>
            <span className="text-[#999] cursor-pointer hover:text-[#737373] transition-colors">Trending</span>
            <span className="text-[#999] cursor-pointer hover:text-[#737373] transition-colors">Leaderboard</span>
          </div>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────── */}
      <section className="relative px-6 pt-24 pb-16">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Left */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 text-[10px] font-semibold text-[#999] uppercase tracking-[0.2em] mb-8"
              >
                <div className="w-5 h-px bg-[#DDD]" />
                The Reputation Layer for Base
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="text-[44px] sm:text-[56px] lg:text-[64px] font-bold tracking-[-0.03em] leading-[1.05] mb-6"
              >
                Understand<br />
                <span className="text-[#0052FF]">any wallet</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-[16px] text-[#737373] leading-relaxed max-w-[480px] mb-10"
              >
                Analyze wallets, discover smart money, track on-chain reputation and uncover the stories behind every address on Base.
              </motion.p>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex flex-col sm:flex-row gap-3 mb-12"
              >
                <div className="flex-1 max-w-[440px] bg-white rounded-2xl shadow-sm flex items-center gap-0 p-1.5">
                  <Search className="w-4 h-4 text-[#BBB] ml-3 flex-shrink-0" />
                  <input
                    className="flex-1 bg-transparent px-2 py-2.5 text-[14px] outline-none placeholder:text-[#BBB] text-[#111]"
                    placeholder="0x... or name.base.eth"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && analyze()}
                  />
                  <button
                    className="bg-[#0052FF] text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl hover:bg-[#0045DD] transition-colors disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
                    onClick={analyze}
                    disabled={loading}
                  >
                    {loading ? "Loading…" : <><span>Analyze</span><ArrowRight className="w-3.5 h-3.5" /></>}
                  </button>
                </div>
                <button className="text-[13px] font-medium text-[#737373] hover:text-[#111] transition-colors flex items-center gap-1.5 px-2">
                  View Leaderboard <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
              {error && <div className="text-[13px] text-red-500 font-medium mb-4">{error}</div>}

              {/* Metric pills */}
              <div className="flex flex-wrap gap-3">
                <MetricPill icon={Shield} label="Wallet Score" value="0–100" delay={0.4} />
                <MetricPill icon={Activity} label="Active Days" value="Tracking" delay={0.5} />
                <MetricPill icon={Layers} label="Protocols" value="30+" delay={0.6} />
                <MetricPill icon={TrendingUp} label="Smart Money" value="Detection" delay={0.7} />
              </div>
            </div>

            {/* Right — Dashboard mockup */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
              className="hidden lg:block"
            >
              <div className="relative">
                {/* Shadow glow */}
                <div className="absolute -inset-4 bg-[#0052FF]/5 blur-3xl rounded-full" />
                <div className="relative">
                  <DashboardMockup />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-[28px] font-bold text-[#111] tracking-[-0.02em] mb-3">
              Everything you need to<br />understand Base wallets
            </h2>
            <p className="text-[15px] text-[#737373] max-w-[480px] mx-auto">
              From reputation scoring to protocol analysis — all in one clean interface.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Shield, title: "Reputation Score", desc: "Algorithmic scoring based on activity, longevity, diversity, and volume." },
              { icon: Layers, title: "Protocol Analytics", desc: "See every DeFi protocol a wallet has touched. Know the veterans from the tourists." },
              { icon: TrendingUp, title: "Smart Money Intel", desc: "Identify profitable wallets. Track winning trades and investment styles." },
              { icon: Users, title: "Wallet Compare", desc: "Compare any two wallets side-by-side. Metrics, protocols, and reputation." },
              { icon: Zap, title: "AI Analysis", desc: "Automated wallet summaries — understand style, risk, and behavior in seconds." },
              { icon: Activity, title: "Live Feed", desc: "Real-time activity from top wallets. See what smart money is doing on Base." },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-[#F0F5FF] flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-[#0052FF]" />
                </div>
                <h3 className="text-[14px] font-semibold text-[#111] mb-2">{f.title}</h3>
                <p className="text-[13px] text-[#999] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RESULTS ────────────────────────────────────── */}
      {showResults && data && (
        <section id="results" className="px-6 pb-24">
          <div className="max-w-[1200px] mx-auto space-y-6">
            {/* Wallet Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-3xl shadow-sm overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] divide-y lg:divide-y-0 lg:divide-x divide-[#F0F0F0]">
                <div className="p-8 lg:p-10 flex flex-col justify-center">
                  <div className="text-[10px] font-semibold text-[#999] uppercase tracking-[0.15em] mb-4">Wallet Profile</div>
                  <h2 className="text-[15px] font-semibold text-[#111] font-mono mb-1">{data.address.slice(0, 12)}...{data.address.slice(-8)}</h2>
                  <a href={`https://basescan.org/address/${data.address}`} target="_blank" className="text-[12px] text-[#BBB] hover:text-[#737373] transition-colors">View on Basescan ↗</a>
                  <div className="mt-5 space-y-2 text-[13px] text-[#737373]">
                    <div className="flex justify-between max-w-[260px]"><span>First tx</span><span className="text-[#111] font-medium">{data.stats.ageDays}d ago</span></div>
                    <div className="flex justify-between max-w-[260px]"><span>Active months</span><span className="text-[#111] font-medium">{data.stats.activeMonths}</span></div>
                    <div className="flex justify-between max-w-[260px]"><span>Balance</span><span className="text-[#111] font-medium">{data.stats.balEth.toFixed(4)} ETH</span></div>
                  </div>
                </div>
                <div className="p-8 lg:p-10 flex items-center justify-center">
                  <ScoreRing score={score} animate={animated} />
                </div>
                <div className="p-8 lg:p-10 flex flex-col justify-center">
                  <div className="text-[10px] font-semibold text-[#999] uppercase tracking-[0.15em] mb-4">Summary</div>
                  <div className="space-y-4">
                    <div><div className="text-[11px] text-[#999] uppercase tracking-wider mb-0.5">Transactions</div><div className="text-xl font-bold text-[#111]">{data.stats.totalTx.toLocaleString()}</div></div>
                    <div><div className="text-[11px] text-[#999] uppercase tracking-wider mb-0.5">Total volume</div><div className="text-xl font-bold text-[#111]">{data.stats.totalVolEth.toFixed(2)} ETH</div></div>
                    <div><div className="text-[11px] text-[#999] uppercase tracking-wider mb-0.5">Protocols</div><div className="text-xl font-bold text-[#111]">{data.stats.uniqueContracts}</div></div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Score Breakdown + Protocols */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl shadow-sm p-8">
                <div className="text-[10px] font-semibold text-[#999] uppercase tracking-[0.15em] mb-6">Score Breakdown</div>
                <div className="space-y-1">
                  {[
                    ["Activity", data.stats.totalTx, 500],
                    ["Longevity", data.stats.activeMonths, 12],
                    ["Protocol diversity", data.stats.uniqueContracts, 20],
                    ["Volume", parseFloat(data.stats.totalVolEth.toFixed(1)), 10],
                    ["Wallet age", data.stats.ageDays, 365],
                    ["Balance", parseFloat(data.stats.balEth.toFixed(2)), 0.1],
                  ].map(([label, value, max], i) => (
                    <div key={i} className="py-1.5">
                      <div className="flex justify-between items-baseline text-[12px] mb-1">
                        <span className="text-[#737373]">{label}</span>
                        <span className="text-[#111] font-semibold tabular-nums">{typeof value === "number" ? value.toLocaleString() : value}</span>
                      </div>
                      <div className="h-[3px] bg-[#F0F0F0] rounded-full overflow-hidden">
                        <div className="h-full bg-[#0052FF] rounded-full" style={{ width: Math.min((Number(value) / Number(max)) * 100, 100) + "%", transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {data.protocols.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-3xl shadow-sm p-8">
                  <div className="text-[10px] font-semibold text-[#999] uppercase tracking-[0.15em] mb-5">Top Protocols</div>
                  <div className="divide-y divide-[#F5F5F5]">
                    {data.protocols.slice(0, 8).map((p, i) => (
                      <ProtoBar key={i} name={p.name} icon={p.icon} txCount={p.txCount} max={data.protocols[0]?.txCount || 1} />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Transactions */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-3xl shadow-sm overflow-hidden">
              <div className="px-8 py-4 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-[#999] uppercase tracking-[0.15em]">Recent Transactions</span>
                <span className="text-[12px] text-[#BBB]">{data.stats.totalTx.toLocaleString()} total</span>
              </div>
              <div className="px-6 py-2 grid grid-cols-12 gap-2 text-[10px] font-semibold text-[#BBB] uppercase tracking-[0.1em] border-y border-[#F0F0F0]">
                <span className="col-span-5">Transaction</span>
                <span className="col-span-3">Type</span>
                <span className="col-span-2 text-right">Value</span>
                <span className="col-span-2 text-right">Age</span>
              </div>
              {data.recentTxs.slice(0, 10).map((t, i) => (
                <TxRow key={i} tx={t} addr={data.address} />
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ── FOOTER ────────────────────────────────────── */}
      <footer className="border-t border-[#F0F0F0] py-8 px-6">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#BBB]">
            <div className="w-5 h-5 bg-[#DDD] rounded flex items-center justify-center">
              <span className="text-[9px] font-bold text-white">B</span>
            </div>
            Basewallet
          </div>
          <div className="flex gap-6 text-[12px] text-[#BBB]">
            <span>Data from Base Blockscout</span>
            <span>·</span>
            <span>Not financial advice</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
