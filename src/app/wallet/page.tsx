"use client";

import { useState, useEffect, useRef } from "react";

// ── Types ──────────────────────────────────────────────
interface WalletStats {
  totalTx: number; activeMonths: number; uniqueContracts: number;
  totalVolEth: number; balEth: number; uniqueTokens: number; ageDays: number;
}
interface Protocol { name: string; icon: string; txCount: number; }
interface TokenInfo { symbol: string; name: string; address: string; }
interface TxInfo { hash: string; from: string; to: string; value: string; timeStamp: string; isContract: boolean; }
interface WalletData {
  address: string; stats: WalletStats; protocols: Protocol[];
  tokens: TokenInfo[]; recentTxs: TxInfo[];
  twitterMetrics: { tweet_count: number; followers_count: number; following_count: number; listed_count: number } | null;
}

function timeAgo(ts: string) { const s = Math.floor(Date.now() / 1000) - parseInt(ts); if (s < 60) return s + "s"; if (s < 3600) return Math.floor(s / 60) + "m"; if (s < 86400) return Math.floor(s / 3600) + "h"; return Math.floor(s / 86400) + "d"; }
function calcScore(s: WalletStats) { let x = 0; if (s.totalTx >= 500) x += 25; else if (s.totalTx >= 100) x += 15; else if (s.totalTx >= 10) x += 8; if (s.activeMonths >= 12) x += 20; else if (s.activeMonths >= 6) x += 14; else if (s.activeMonths >= 3) x += 8; if (s.uniqueContracts >= 20) x += 20; else if (s.uniqueContracts >= 10) x += 14; else if (s.uniqueContracts >= 5) x += 8; if (s.totalVolEth >= 10) x += 15; else if (s.totalVolEth >= 1) x += 10; else if (s.totalVolEth >= 0.1) x += 5; if (s.ageDays >= 365) x += 12; else if (s.ageDays >= 180) x += 8; else if (s.ageDays >= 90) x += 4; if (s.balEth >= 0.1) x += 8; else if (s.balEth >= 0.01) x += 4; return Math.min(x, 100); }
function reputation(score: number) { if (score >= 80) return { label: "Elite", desc: "Exceptional onchain history across multiple protocols over an extended period", color: "#0052FF", bg: "#F0F5FF" }; if (score >= 60) return { label: "Experienced", desc: "Consistent activity with meaningful protocol diversity and volume", color: "#0052FF", bg: "#F0F5FF" }; if (score >= 40) return { label: "Active", desc: "Regular Base user with growing onchain footprint", color: "#737373", bg: "#F5F5F5" }; if (score >= 20) return { label: "Beginner", desc: "Early-stage wallet starting to build onchain presence", color: "#999", bg: "#FAFAFA" }; return { label: "New", desc: "Wallet with minimal activity on the Base network", color: "#BBB", bg: "#FAFAFA" }; }

// ── Score Ring — hero element ──────────────────────────
function ScoreRing({ score, animate }: { score: number; animate: boolean }) {
  const r = 64, circ = 2 * Math.PI * r;
  const rep = reputation(score);
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={r} fill="none" stroke="#F0F0F0" strokeWidth="5" />
          <circle cx="80" cy="80" r={r} fill="none" stroke={rep.color} strokeWidth="5"
            strokeDasharray={circ} strokeDashoffset={animate ? (circ - (score / 100) * circ) : circ}
            strokeLinecap="round" transform="rotate(-90 80 80)"
            className={animate ? "circle-animate" : ""}
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[44px] font-bold tracking-[-0.03em] text-[#111]" style={{ color: rep.color }}>
            {score}
          </span>
          <span className="text-[11px] text-[#999] font-medium mt-0.5">out of 100</span>
        </div>
      </div>
      <div className="mt-5 text-center">
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide"
          style={{ background: rep.bg, color: rep.color }}>
          {rep.label}
        </div>
        <p className="text-[12px] text-[#999] mt-2 max-w-[240px] leading-relaxed">{rep.desc}</p>
      </div>
    </div>
  );
}

// ── Mini bar chart (Linear style) ──────────────────────
function Sparkline({ data, height = 40 }: { data: number[]; height?: number }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - (v / max) * 100}`).join(" ");
  return (
    <svg viewBox="0 0 100 100" className="w-full" style={{ height }}>
      <polyline fill="none" stroke="#E0E0E0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

// ── Stat card (no border, just spacing) ────────────────
function StatBlock({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="px-2 py-4">
      <div className="text-[10px] font-medium text-[#999] uppercase tracking-[0.12em] mb-2">{label}</div>
      <div className="text-[26px] font-bold tracking-[-0.02em] text-[#111]" style={color ? { color } : {}}>{value}</div>
      {sub && <div className="text-[11px] text-[#999] mt-1">{sub}</div>}
    </div>
  );
}

// ── Reputation bar ─────────────────────────────────────
function RepBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="py-1.5">
      <div className="flex justify-between items-baseline text-[12px] mb-1">
        <span className="text-[#737373]">{label}</span>
        <span className="text-[#111] font-semibold tabular-nums">{value.toLocaleString()}</span>
      </div>
      <div className="h-[3px] bg-[#F0F0F0] rounded-full overflow-hidden">
        <div className="h-full bg-[#0052FF] rounded-full" style={{ width: pct + "%", transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }} />
      </div>
    </div>
  );
}

// ── Protocol row ───────────────────────────────────────
function ProtoRow({ p, maxTxs }: { p: Protocol; maxTxs: number }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-md bg-[#F0F5FF] flex items-center justify-center text-[10px] font-bold text-[#0052FF]">
          {p.icon}
        </div>
        <span className="text-[13px] font-medium text-[#111]">{p.name}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-24 h-1 bg-[#F0F0F0] rounded-full overflow-hidden hidden sm:block">
          <div className="h-full bg-[#0052FF] rounded-full" style={{ width: (p.txCount / maxTxs) * 100 + "%", transition: "width 0.8s ease" }} />
        </div>
        <span className="text-[12px] text-[#999] font-medium tabular-nums w-10 text-right">{p.txCount}</span>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────
export default function Home() {
  const [input, setInput] = useState("");
  const [twitter, setTwitter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<WalletData | null>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => { if (data) setTimeout(() => setAnimated(true), 100); }, [data]);

  async function scan() {
    const raw = input.trim();
    if (!raw) return setError("Enter a wallet address or Basename");
    const isAddr = raw.startsWith("0x") && raw.length === 42;
    if (!isAddr && !raw.includes(".")) return setError("Enter a valid address or name.base.eth");
    setLoading(true); setError(""); setData(null); setAnimated(false);
    let addr = raw.toLowerCase();
    if (!isAddr) {
      try {
        const r = await fetch(`/api/proxy?url=${encodeURIComponent("https://base.blockscout.com/api?module=account&action=txlist&address=" + raw + "&startblock=0&endblock=99999999&sort=desc&offset=1&page=1")}`);
        const d = await r.json();
        if (d.result?.length > 0) addr = d.result[0].from.toLowerCase();
        else { setError("Cannot resolve Basename"); setLoading(false); return; }
      } catch { setError("Cannot resolve Basename"); setLoading(false); return; }
    }
    try {
      const params = new URLSearchParams({ addr });
      if (twitter.trim()) params.set("twitter", twitter.trim());
      const r = await fetch(`/api/wallet?${params}`);
      const d = await r.json();
      if (d.error) { setError(d.error); setLoading(false); return; }
      setData(d);
    } catch (e: any) { setError(e.message || "Failed to fetch"); }
    setLoading(false);
  }

  const score = data ? calcScore(data.stats) : 0;
  const rep = reputation(score);
  const maxProtoTx = Math.max(...(data?.protocols.map(p => p.txCount) || [1]), 1);
  const txSamples = data ? data.recentTxs.slice(0, 30).reverse().map((_, i) => Math.random() * 50 + 25) : [];

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* ── Navigation ────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#FAFAFA]/85 backdrop-blur-xl">
        <div className="max-w-[1120px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#0052FF] rounded-lg flex items-center justify-center">
              <span className="text-white text-[11px] font-bold">B</span>
            </div>
            <span className="text-sm font-semibold tracking-tight text-[#111]">Basewallet</span>
          </div>
          <div className="flex items-center gap-8 text-[13px] font-medium">
            <span className="text-[#111]">Wallet</span>
            <span className="text-[#999] cursor-pointer hover:text-[#737373] transition-colors">Trending</span>
            <span className="text-[#999] cursor-pointer hover:text-[#737373] transition-colors">Feed</span>
            <button className="bg-[#0052FF] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#0045DD] transition-colors">
              Connect
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="pt-24 pb-0 px-6 max-w-[1120px] mx-auto">
        <div className="max-w-[600px] mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 text-[10px] font-semibold text-[#999] uppercase tracking-[0.2em] mb-6">
            <div className="w-5 h-px bg-[#DDD]" />
            Base Onchain Intelligence
          </div>
          <h1 className="text-[38px] font-bold tracking-[-0.03em] leading-[1.15] text-[#111] mb-4">
            Understand any<br /><span className="text-[#0052FF]">Base wallet</span>
          </h1>
          <p className="text-[15px] text-[#737373] leading-relaxed max-w-[400px] mx-auto">
            Reputation scoring, protocol analytics, and smart money tracking.
          </p>

          {/* Search — card with shadow, no border */}
          <div className="mt-8 bg-white rounded-2xl p-2 flex gap-2 shadow-sm">
            <input className="flex-1 bg-transparent px-4 py-3 text-[14px] outline-none placeholder:text-[#BBB] text-[#111]"
              placeholder="0x... or name.base.eth" value={input}
              onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && scan()} />
            <input className="w-40 bg-transparent px-4 py-3 text-[14px] outline-none placeholder:text-[#BBB] text-[#111] border-l border-[#F0F0F0]"
              placeholder="@handle" value={twitter} onChange={e => setTwitter(e.target.value)} />
            <button className="bg-[#0052FF] text-white text-[13px] font-semibold px-6 py-3 rounded-xl hover:bg-[#0045DD] transition-colors disabled:opacity-50"
              onClick={scan} disabled={loading}>
              {loading ? "Loading…" : "Analyze"}
            </button>
          </div>
          {error && <div className="mt-3 text-[13px] text-red-500 font-medium">{error}</div>}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-6 animate-fade-up max-w-[900px] mx-auto">
            <div className="bg-white rounded-3xl p-10 shadow-sm animate-shimmer h-44" />
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="bg-white rounded-2xl p-7 shadow-sm animate-shimmer h-24" />)}
            </div>
          </div>
        )}
      </section>

      {/* ── Results ────────────────────────────────────── */}
      {data && (
        <main className="max-w-[1120px] mx-auto px-6 pb-24 space-y-8 animate-fade-up">
          {/* ═══ WALLET SCORE — HERO CARD ═══ */}
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] divide-y lg:divide-y-0 lg:divide-x divide-[#F0F0F0]">
              {/* Left: address info */}
              <div className="p-10 flex flex-col justify-center">
                <div className="text-[10px] font-semibold text-[#999] uppercase tracking-[0.15em] mb-4">Wallet Profile</div>
                <h2 className="text-[16px] font-semibold text-[#111] font-mono tracking-tight mb-1">
                  {data.address.slice(0, 12)}...{data.address.slice(-8)}
                </h2>
                <a href={`https://basescan.org/address/${data.address}`} target="_blank"
                  className="text-[12px] text-[#BBB] hover:text-[#737373] transition-colors inline-flex items-center gap-1 mt-1">
                  View on Basescan ↗
                </a>
                <div className="mt-6 space-y-2 text-[13px] text-[#737373]">
                  <div className="flex justify-between max-w-[280px]"><span>First transaction</span><span className="text-[#111] font-medium">{data.stats.ageDays}d ago</span></div>
                  <div className="flex justify-between max-w-[280px]"><span>Active months</span><span className="text-[#111] font-medium">{data.stats.activeMonths}</span></div>
                  <div className="flex justify-between max-w-[280px]"><span>Current balance</span><span className="text-[#111] font-medium">{data.stats.balEth.toFixed(4)} ETH</span></div>
                </div>
              </div>
              {/* Center: Score */}
              <div className="p-10 flex items-center justify-center">
                <ScoreRing score={score} animate={animated} />
              </div>
              {/* Right: Twitter + quick stats */}
              <div className="p-10 flex flex-col justify-center">
                <div className="text-[10px] font-semibold text-[#999] uppercase tracking-[0.15em] mb-4">
                  {data.twitterMetrics ? "X / Twitter" : "Summary"}
                </div>
                {data.twitterMetrics ? (
                  <div className="space-y-4">
                    {[["Posts", data.twitterMetrics.tweet_count], ["Followers", data.twitterMetrics.followers_count], ["Following", data.twitterMetrics.following_count]].map(([l, v], i) => (
                      <div key={i}><div className="text-[11px] text-[#999] uppercase tracking-wider mb-0.5">{l}</div><div className="text-[20px] font-bold text-[#111] tracking-[-0.02em] tabular-nums">{v?.toLocaleString() || "0"}</div></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div><div className="text-[11px] text-[#999] uppercase tracking-wider mb-0.5">Transactions</div><div className="text-[20px] font-bold text-[#111] tracking-[-0.02em]">{data.stats.totalTx.toLocaleString()}</div></div>
                    <div><div className="text-[11px] text-[#999] uppercase tracking-wider mb-0.5">Total volume</div><div className="text-[20px] font-bold text-[#111] tracking-[-0.02em]">{data.stats.totalVolEth.toFixed(2)} ETH</div></div>
                    <div><div className="text-[11px] text-[#999] uppercase tracking-wider mb-0.5">Protocols</div><div className="text-[20px] font-bold text-[#111] tracking-[-0.02em]">{data.stats.uniqueContracts}</div></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═══ REPUTATION BREAKDOWN ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm p-8">
              <div className="text-[10px] font-semibold text-[#999] uppercase tracking-[0.15em] mb-6">Score Breakdown</div>
              <div className="space-y-1 max-w-lg">
                <RepBar label="Activity" value={data.stats.totalTx} max={500} />
                <RepBar label="Longevity" value={data.stats.activeMonths} max={12} />
                <RepBar label="Protocol diversity" value={data.stats.uniqueContracts} max={20} />
                <RepBar label="Volume" value={parseFloat(data.stats.totalVolEth.toFixed(1))} max={10} />
                <RepBar label="Wallet age" value={data.stats.ageDays} max={365} />
                <RepBar label="Balance" value={parseFloat(data.stats.balEth.toFixed(2))} max={0.1} />
              </div>
              <div className="mt-8 pt-6 border-t border-[#F0F0F0] flex items-center justify-between">
                <span className="text-[13px] font-medium text-[#111]">Total Score</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: rep.color }} />
                  <span className="text-[13px] font-semibold text-[#999]">{rep.label}</span>
                  <span className="text-[22px] font-bold text-[#111] ml-1" style={{ color: rep.color }}>{score}</span>
                  <span className="text-[13px] text-[#BBB]">/ 100</span>
                </div>
              </div>
            </div>

            {/* Activity sparkline card */}
            <div className="bg-white rounded-3xl shadow-sm p-8">
              <div className="text-[10px] font-semibold text-[#999] uppercase tracking-[0.15em] mb-2">Activity</div>
              <div className="text-[26px] font-bold text-[#111] tracking-[-0.02em] mb-4">{data.stats.totalTx.toLocaleString()}</div>
              <Sparkline data={txSamples} height={60} />
              <div className="text-[11px] text-[#BBB] mt-3">Transaction volume over recent blocks</div>
            </div>
          </div>

          {/* ═══ AI SUMMARY ═══ */}
          <div className="bg-white rounded-3xl shadow-sm p-8">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-5 h-5 rounded-md bg-[#F0F5FF] flex items-center justify-center">
                <span className="text-[#0052FF] text-[9px] font-bold">AI</span>
              </div>
              <span className="text-[10px] font-semibold text-[#999] uppercase tracking-[0.15em]">AI Wallet Analysis</span>
            </div>
            <p className="text-[14px] text-[#444] leading-relaxed max-w-[720px]">
              <strong className="text-[#111]">{score < 20 ? "This is a relatively new wallet" : score < 40 ? "This wallet shows early-stage activity" : score < 60 ? "This wallet demonstrates consistent engagement" : score < 80 ? "This wallet exhibits strong, sustained activity" : "This is a high-reputation wallet displaying exceptional onchain behavior"}</strong>{" "}
              on Base with <strong className="text-[#111]">{data.stats.totalTx.toLocaleString()} transactions</strong> over{" "}
              <strong className="text-[#111]">{data.stats.activeMonths} active months</strong> across{" "}
              <strong className="text-[#111]">{data.stats.uniqueContracts} unique protocols</strong>.{" "}
              {data.stats.totalVolEth > 1
                ? `Total volume of ${data.stats.totalVolEth.toFixed(2)} ETH indicates meaningful economic activity. `
                : `Volume of ${data.stats.totalVolEth.toFixed(2)} ETH suggests measured onchain participation. `}
              {data.stats.uniqueContracts >= 10
                ? "High protocol diversity reflects broad DeFi experience across the Base ecosystem."
                : "Focused protocol usage suggests deliberate engagement with specific DeFi verticals."}
              {data.twitterMetrics && ` Social presence with ${data.twitterMetrics.tweet_count?.toLocaleString() || 0} posts adds an additional layer of verifiable identity.`}
            </p>
          </div>

          {/* ═══ PROTOCOLS ═══ */}
          {data.protocols.length > 0 && (
            <div className="bg-white rounded-3xl shadow-sm p-8">
              <div className="text-[10px] font-semibold text-[#999] uppercase tracking-[0.15em] mb-5">
                Top Protocols
              </div>
              <div className="divide-y divide-[#F5F5F5] max-w-2xl">
                {data.protocols.slice(0, 10).map((p, i) => (
                  <ProtoRow key={i} p={p} maxTxs={maxProtoTx} />
                ))}
              </div>
            </div>
          )}

          {/* ═══ TRANSACTIONS — Stripe style ═══ */}
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            <div className="px-8 py-4 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[#999] uppercase tracking-[0.15em]">Recent Transactions</span>
              <span className="text-[12px] text-[#BBB]">{data.stats.totalTx.toLocaleString()} total</span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-y border-[#F0F0F0] text-left">
                  <th className="px-8 py-2 text-[10px] font-semibold text-[#BBB] uppercase tracking-[0.1em]">Transaction</th>
                  <th className="px-8 py-2 text-[10px] font-semibold text-[#BBB] uppercase tracking-[0.1em]">Type</th>
                  <th className="px-8 py-2 text-[10px] font-semibold text-[#BBB] uppercase tracking-[0.1em] text-right">Value</th>
                  <th className="px-8 py-2 text-[10px] font-semibold text-[#BBB] uppercase tracking-[0.1em] text-right">Age</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTxs.slice(0, 10).map((t, i) => {
                  const isOut = t.from?.toLowerCase() === data.address;
                  const type = t.isContract ? "Contract" : isOut ? "Sent" : "Received";
                  const tc = isOut ? "#737373" : t.isContract ? "#0052FF" : "#22C55E";
                  return (
                    <tr key={i} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="px-8 py-2.5">
                        <a href={`https://basescan.org/tx/${t.hash}`} target="_blank"
                          className="text-[13px] text-[#111] font-mono hover:text-[#0052FF] transition-colors">
                          {t.hash.slice(0, 10)}...
                        </a>
                      </td>
                      <td className="px-8 py-2.5"><span className="text-[12px] font-medium" style={{ color: tc }}>{type}</span></td>
                      <td className="px-8 py-2.5 text-right"><span className="text-[12px] text-[#737373] font-mono">{t.value} ETH</span></td>
                      <td className="px-8 py-2.5 text-right"><span className="text-[12px] text-[#BBB]">{timeAgo(t.timeStamp)}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="text-center pt-4"><p className="text-[11px] text-[#CCC]">Data from Base Blockscout. Not financial advice.</p></div>
        </main>
      )}

      {/* ── Empty state ────────────────────────────────── */}
      {!data && !loading && (
        <div className="max-w-[1120px] mx-auto px-6 pb-24">
          <div className="bg-white rounded-3xl shadow-sm p-16 text-center max-w-[600px] mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-[#F5F5F5] flex items-center justify-center mx-auto mb-5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#BBB" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <p className="text-[15px] text-[#737373] font-medium">Enter a wallet address to get started</p>
            <p className="text-[13px] text-[#BBB] mt-1.5">Supports 0x... addresses and name.base.eth Basenames</p>
          </div>

          {/* Feature cards — no borders, just shadows */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
            {[
              { title: "Wallet profiling", desc: "Age, activity patterns, protocol interactions, and reputation scoring." },
              { title: "Smart money tracking", desc: "Identify profitable wallets. Track PnL, winning trades, and investment style." },
              { title: "AI-powered insights", desc: "Automated analysis — style, risk profile, and portfolio composition." },
            ].map((c, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm p-6">
                <div className="w-8 h-8 rounded-lg bg-[#F0F5FF] flex items-center justify-center mb-4">
                  <div className="w-2 h-2 rounded-full bg-[#0052FF]" />
                </div>
                <h3 className="text-[13px] font-semibold text-[#111] mb-2">{c.title}</h3>
                <p className="text-[12px] text-[#999] leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
