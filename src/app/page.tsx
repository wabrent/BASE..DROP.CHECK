"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ArrowRight, Search, Activity, Shield, Clock, Layers, Sparkles, TrendingUp } from "lucide-react";

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
function reputation(score: number) { if (score >= 80) return { label: "Elite", color: "#0052FF" }; if (score >= 60) return { label: "Experienced", color: "#0052FF" }; if (score >= 40) return { label: "Active", color: "#666" }; if (score >= 20) return { label: "Beginner", color: "#999" }; return { label: "New", color: "#BBB" }; }

function timeAgo(ts: string) { const s = Math.floor(Date.now() / 1000) - parseInt(ts); if (s < 60) return s + "s"; if (s < 3600) return Math.floor(s / 60) + "m"; if (s < 86400) return Math.floor(s / 3600) + "h"; return Math.floor(s / 86400) + "d"; }

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<WalletData | null>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => { if (data) setTimeout(() => setAnimated(true), 300); }, [data]);

  async function analyze() {
    const raw = input.trim();
    if (!raw) return setError("Enter a wallet address");
    const isAddr = raw.startsWith("0x") && raw.length === 42;
    if (!isAddr && !raw.includes(".")) return setError("Enter 0x... or name.base.eth");
    setLoading(true); setError(""); setData(null); setAnimated(false);
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

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* ── Nav ──────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-[#FAFAFA]/85 backdrop-blur-xl border-b border-[#F0F0F0]">
        <div className="max-w-[1240px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#0052FF] rounded-lg flex items-center justify-center">
              <span className="text-white text-[11px] font-bold">B</span>
            </div>
            <span className="text-sm font-semibold tracking-tight text-[#111]">Basewallet</span>
          </div>
          <div className="flex items-center gap-8 text-[13px] font-medium">
            <span className="text-[#111]">Wallet</span>
            <span className="text-[#999]">Trending</span>
            <span className="text-[#999]">Leaderboard</span>
          </div>
        </div>
      </nav>

      {/* ── Product Dashboard ────────────────────────── */}
      <div className="relative">
        {/* Subtle gradient aura */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#0052FF]/3 blur-[150px] rounded-full" />
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[400px] bg-[#0052FF]/2 blur-[120px] rounded-full" />
        </div>

        <div className="relative max-w-[1240px] mx-auto px-6 pt-16 pb-24">
          {/* ── Header ────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h1 className="text-[32px] font-bold tracking-[-0.03em] text-[#111] mb-2">
              Understand <span className="text-[#0052FF]">any wallet</span>
            </h1>
            <p className="text-[14px] text-[#999]">The reputation layer for Base</p>
          </motion.div>

          {/* ── Dashboard Layout ──────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4 auto-rows-min"
          >
            {/* ═══ WALLET SCORE CARD (span 2 rows) ═══ */}
            <div className="lg:row-span-2 bg-white rounded-3xl shadow-sm p-8 flex flex-col">
              {/* Search */}
              <div className="bg-[#FAFAFA] rounded-2xl flex items-center gap-0 p-1.5 mb-8">
                <Search className="w-4 h-4 text-[#BBB] ml-2 flex-shrink-0" />
                <input
                  className="flex-1 bg-transparent px-2 py-2.5 text-[13px] outline-none placeholder:text-[#CCC] text-[#111]"
                  placeholder="0x... or name.base.eth"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && analyze()}
                />
                <button
                  className="bg-[#0052FF] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#0045DD] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  onClick={analyze} disabled={loading}
                >
                  {loading ? "…" : <><span>Analyze</span><ArrowRight className="w-3 h-3" /></>}
                </button>
              </div>
              {error && <div className="text-[12px] text-red-500 mb-4 -mt-4">{error}</div>}

              {/* Score ring — big */}
              {data ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="relative mb-6">
                    <svg width="170" height="170" viewBox="0 0 170 170">
                      <circle cx="85" cy="85" r="72" fill="none" stroke="#F0F0F0" strokeWidth="5" />
                      <circle cx="85" cy="85" r="72" fill="none" stroke={reputation(calcScore(data.stats)).color} strokeWidth="5"
                        strokeDasharray={2 * Math.PI * 72}
                        strokeDashoffset={animated ? (2 * Math.PI * 72 * (1 - calcScore(data.stats) / 100)) : 2 * Math.PI * 72}
                        strokeLinecap="round" transform="rotate(-90 85 85)"
                        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)" }} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[46px] font-bold tracking-[-0.04em]" style={{ color: reputation(calcScore(data.stats)).color }}>
                        {calcScore(data.stats)}
                      </span>
                      <span className="text-[11px] text-[#999] font-medium">/ 100</span>
                    </div>
                  </div>
                  <div className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#F0F5FF] text-[#0052FF] mb-1">
                    {reputation(calcScore(data.stats)).label}
                  </div>
                  <p className="text-[12px] text-[#999]">Reputation Score</p>
                  <p className="text-[13px] text-[#111] font-mono mt-3">{data.address.slice(0, 12)}...{data.address.slice(-8)}</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="relative mb-6 opacity-30">
                    <svg width="170" height="170" viewBox="0 0 170 170">
                      <circle cx="85" cy="85" r="72" fill="none" stroke="#F0F0F0" strokeWidth="5" />
                      <circle cx="85" cy="85" r="72" fill="none" stroke="#DDD" strokeWidth="5"
                        strokeDasharray={2 * Math.PI * 72} strokeDashoffset={2 * Math.PI * 72}
                        strokeLinecap="round" transform="rotate(-90 85 85)" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[46px] font-bold tracking-[-0.04em] text-[#DDD]">—</span>
                    </div>
                  </div>
                  <p className="text-[13px] text-[#BBB] max-w-[200px]">Enter a wallet to see its reputation score</p>
                </div>
              )}
            </div>

            {/* ═══ ACTIVITY OVERVIEW ═══ */}
            <div className="bg-white rounded-3xl shadow-sm p-6">
              <div className="text-[10px] font-semibold text-[#999] uppercase tracking-[0.15em] mb-4">Activity</div>
              {data ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-[24px] font-bold text-[#111] tracking-[-0.02em]">{data.stats.totalTx.toLocaleString()}</div>
                    <div className="text-[11px] text-[#999]">transactions</div>
                  </div>
                  <div>
                    <div className="text-[24px] font-bold text-[#111] tracking-[-0.02em]">{data.stats.activeMonths}</div>
                    <div className="text-[11px] text-[#999]">active months</div>
                  </div>
                  <div>
                    <div className="text-[24px] font-bold text-[#111] tracking-[-0.02em]">{data.stats.ageDays}d</div>
                    <div className="text-[11px] text-[#999]">wallet age</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {[["Transactions", "—"], ["Active months", "—"], ["Wallet age", "—"]].map(([l, v], i) => (
                    <div key={i}>
                      <div className="text-[24px] font-bold text-[#DDD] tracking-[-0.02em]">{v}</div>
                      <div className="text-[11px] text-[#CCC]">{l}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ═══ VOLUME + BALANCE ═══ */}
            <div className="bg-white rounded-3xl shadow-sm p-6">
              <div className="text-[10px] font-semibold text-[#999] uppercase tracking-[0.15em] mb-4">Financials</div>
              {data ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-[24px] font-bold text-[#111] tracking-[-0.02em]">{data.stats.totalVolEth.toFixed(2)} ETH</div>
                    <div className="text-[11px] text-[#999]">total volume</div>
                  </div>
                  <div>
                    <div className="text-[24px] font-bold text-[#111] tracking-[-0.02em]">{data.stats.balEth.toFixed(4)} ETH</div>
                    <div className="text-[11px] text-[#999]">current balance</div>
                  </div>
                  <div>
                    <div className="text-[24px] font-bold text-[#111] tracking-[-0.02em]">{data.stats.uniqueContracts}</div>
                    <div className="text-[11px] text-[#999]">unique protocols</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {[["Volume", "—"], ["Balance", "—"], ["Protocols", "—"]].map(([l, v], i) => (
                    <div key={i}>
                      <div className="text-[24px] font-bold text-[#DDD] tracking-[-0.02em]">{v}</div>
                      <div className="text-[11px] text-[#CCC]">{l}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ═══ TOP PROTOCOLS ═══ */}
            <div className="bg-white rounded-3xl shadow-sm p-6">
              <div className="text-[10px] font-semibold text-[#999] uppercase tracking-[0.15em] mb-4">Top Protocols</div>
              {data && data.protocols.length > 0 ? (
                <div className="space-y-2.5">
                  {data.protocols.slice(0, 6).map((p, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-[#F0F5FF] flex items-center justify-center text-[9px] font-bold text-[#0052FF]">{p.icon}</div>
                        <span className="text-[12px] text-[#111] font-medium">{p.name}</span>
                      </div>
                      <span className="text-[12px] text-[#999] tabular-nums">{p.txCount}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {["Aerodrome", "Uniswap V3", "Morpho", "Aave V3", "Moonwell", "BaseSwap"].map((n, i) => (
                    <div key={i} className="flex items-center justify-between opacity-20">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-[#F5F5F5] flex items-center justify-center text-[9px] font-bold text-[#CCC]">{n[0]}</div>
                        <span className="text-[12px] text-[#DDD] font-medium">{n}</span>
                      </div>
                      <span className="text-[12px] text-[#DDD]">—</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ═══ AI SUMMARY ═══ */}
            <div className="bg-white rounded-3xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded-md bg-[#F0F5FF] flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-[#0052FF]" />
                </div>
                <span className="text-[10px] font-semibold text-[#999] uppercase tracking-[0.15em]">AI Summary</span>
              </div>
              {data ? (
                <p className="text-[13px] text-[#737373] leading-relaxed">
                  {calcScore(data.stats) >= 60 ? (
                    <>{reputation(calcScore(data.stats)).label}-level wallet with <strong className="text-[#111]">{data.stats.totalTx.toLocaleString()} transactions</strong> across <strong className="text-[#111]">{data.stats.uniqueContracts} protocols</strong>. {data.stats.totalVolEth.toFixed(2)} ETH volume indicates strong economic activity. Broad protocol diversity suggests experienced DeFi usage.</>
                  ) : calcScore(data.stats) >= 30 ? (
                    <>Active wallet with <strong className="text-[#111]">{data.stats.totalTx.toLocaleString()} transactions</strong> over <strong className="text-[#111]">{data.stats.activeMonths} months</strong>. Growing onchain presence with developing protocol usage patterns.</>
                  ) : (
                    <>Early-stage wallet with <strong className="text-[#111]">{data.stats.totalTx.toLocaleString()} transactions</strong>. {data.stats.ageDays}d old. Building initial onchain footprint on Base.</>
                  )}
                </p>
              ) : (
                <p className="text-[13px] text-[#CCC] leading-relaxed">
                  AI analysis will appear here after scanning a wallet. Understand trading style, risk profile, and onchain behavior.
                </p>
              )}
            </div>

            {/* ═══ RECENT ACTIVITY ═══ */}
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 flex items-center justify-between border-b border-[#F5F5F5]">
                <span className="text-[10px] font-semibold text-[#999] uppercase tracking-[0.15em]">Recent Activity</span>
                {data && <span className="text-[12px] text-[#BBB]">{data.stats.totalTx.toLocaleString()} total</span>}
              </div>
              {data ? (
                <div>
                  <div className="px-6 py-2 grid grid-cols-12 gap-2 text-[9px] font-semibold text-[#CCC] uppercase tracking-[0.1em] border-b border-[#F5F5F5]">
                    <span className="col-span-5">Transaction</span>
                    <span className="col-span-3">Type</span>
                    <span className="col-span-2 text-right">Value</span>
                    <span className="col-span-2 text-right">Age</span>
                  </div>
                  {data.recentTxs.slice(0, 8).map((tx, i) => {
                    const isOut = tx.from?.toLowerCase() === data.address;
                    const type = tx.isContract ? "Contract" : isOut ? "Sent" : "Received";
                    const tc = isOut ? "#737373" : tx.isContract ? "#0052FF" : "#22C55E";
                    return (
                      <div key={i} className="px-6 py-2 grid grid-cols-12 gap-2 text-[12px] border-b border-[#F8F8F8] last:border-0 hover:bg-[#FAFAFA] transition-colors">
                        <a href={`https://basescan.org/tx/${tx.hash}`} target="_blank" className="col-span-5 text-[#111] font-mono truncate hover:text-[#0052FF] transition-colors">
                          {tx.hash.slice(0, 10)}...
                        </a>
                        <span className="col-span-3" style={{ color: tc }}>{type}</span>
                        <span className="col-span-2 text-right text-[#999] font-mono">{tx.value}</span>
                        <span className="col-span-2 text-right text-[#BBB]">{timeAgo(tx.timeStamp)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-6 py-2 grid grid-cols-12 gap-2 text-[9px] font-semibold text-[#CCC] uppercase tracking-[0.1em] border-b border-[#F5F5F5]">
                  <span className="col-span-5">Transaction</span>
                  <span className="col-span-3">Type</span>
                  <span className="col-span-2 text-right">Value</span>
                  <span className="col-span-2 text-right">Age</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────── */}
      <footer className="border-t border-[#F0F0F0] py-6 px-6">
        <div className="max-w-[1240px] mx-auto flex items-center justify-between text-[12px] text-[#CCC]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-[#EEE] rounded flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">B</span>
            </div>
            Basewallet
          </div>
          <span>Data from Base Blockscout · Not financial advice</span>
        </div>
      </footer>
    </div>
  );
}
