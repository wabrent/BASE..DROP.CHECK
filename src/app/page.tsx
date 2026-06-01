"use client";

import { useState } from "react";

// ── Types ──────────────────────────────────────────────
interface WalletStats {
  totalTx: number;
  activeMonths: number;
  uniqueContracts: number;
  totalVolEth: number;
  balEth: number;
  uniqueTokens: number;
  ageDays: number;
}

interface Protocol {
  name: string;
  icon: string;
  txCount: number;
}

interface TokenInfo {
  symbol: string;
  name: string;
  address: string;
}

interface TxInfo {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  isContract: boolean;
}

interface WalletData {
  address: string;
  stats: WalletStats;
  protocols: Protocol[];
  tokens: TokenInfo[];
  twitterMetrics: { tweet_count: number; followers_count: number; following_count: number; listed_count: number } | null;
  recentTxs: TxInfo[];
}

function timeAgo(ts: string) {
  const s = Math.floor(Date.now() / 1000) - parseInt(ts);
  if (s < 60) return s + "s";
  if (s < 3600) return Math.floor(s / 60) + "m";
  if (s < 86400) return Math.floor(s / 3600) + "h";
  return Math.floor(s / 86400) + "d";
}

// ── Calculate reputation score ──────────────────────────
function calcScore(s: WalletStats) {
  let score = 0;
  if (s.totalTx >= 500) score += 25; else if (s.totalTx >= 100) score += 15; else if (s.totalTx >= 10) score += 8;
  if (s.activeMonths >= 12) score += 20; else if (s.activeMonths >= 6) score += 14; else if (s.activeMonths >= 3) score += 8;
  if (s.uniqueContracts >= 20) score += 20; else if (s.uniqueContracts >= 10) score += 14; else if (s.uniqueContracts >= 5) score += 8;
  if (s.totalVolEth >= 10) score += 15; else if (s.totalVolEth >= 1) score += 10; else if (s.totalVolEth >= 0.1) score += 5;
  if (s.ageDays >= 365) score += 12; else if (s.ageDays >= 180) score += 8; else if (s.ageDays >= 90) score += 4;
  if (s.balEth >= 0.1) score += 8; else if (s.balEth >= 0.01) score += 4;
  return Math.min(score, 100);
}

function getReputationLabel(score: number) {
  if (score >= 80) return { label: "Elite", color: "#0052FF" };
  if (score >= 60) return { label: "Experienced", color: "#0052FF" };
  if (score >= 40) return { label: "Active", color: "#666666" };
  if (score >= 20) return { label: "Beginner", color: "#999999" };
  return { label: "New", color: "#BBBBBB" };
}

// ── Components ──────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 40, circ = 2 * Math.PI * r, offset = circ - (score / 100) * circ;
  const rep = getReputationLabel(score);
  return (
    <div className="flex items-center gap-5">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#EAEAEA" strokeWidth="4" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={rep.color} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 50 50)" className="transition-all duration-1000 ease-out" />
        <text x="50" y="46" textAnchor="middle" fill="#111" fontSize="22" fontWeight="700">
          {score}
        </text>
        <text x="50" y="64" textAnchor="middle" fill="#999" fontSize="9" fontWeight="500">
          /100
        </text>
      </svg>
      <div>
        <div className="text-xs font-medium tracking-wide uppercase" style={{ color: rep.color }}>{rep.label}</div>
        <div className="text-[11px] text-[#666] mt-1">Reputation Score</div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="p-5">
      <div className="text-[10px] font-medium text-[#999] uppercase tracking-widest">{label}</div>
      <div className="text-2xl font-semibold text-[#111] mt-1.5 tracking-tight">{value}</div>
      {sub && <div className="text-[11px] text-[#BBB] mt-1">{sub}</div>}
    </div>
  );
}

function MiniProgress({ label, value, max, color = "#0052FF" }: { label: string; value: number; max: number; color?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="py-2.5">
      <div className="flex justify-between text-[11px] mb-1.5">
        <span className="text-[#666] font-medium">{label}</span>
        <span className="text-[#111] font-semibold">{value}</span>
      </div>
      <div className="h-1 bg-[#F0F0F0] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: pct + "%", background: color }} />
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

  async function scan() {
    const raw = input.trim();
    if (!raw) return setError("Enter a wallet address or Basename");
    const isAddr = raw.startsWith("0x") && raw.length === 42;
    if (!isAddr && !raw.includes(".")) return setError("Enter a valid address or name.base.eth");

    setLoading(true);
    setError("");
    setData(null);

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
  const rep = getReputationLabel(score);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* ── Navigation ────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#FAFAFA]/80 backdrop-blur-md border-b border-[#EAEAEA]">
        <div className="max-w-[1200px] mx-auto px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#0052FF] rounded-lg flex items-center justify-center">
              <span className="text-white text-[11px] font-bold">B</span>
            </div>
            <span className="text-sm font-semibold tracking-tight">Basewallet</span>
          </div>
          <div className="flex items-center gap-8 text-[13px]">
            <a href="#" className="text-[#111] font-medium">Wallet</a>
            <a href="#" className="text-[#999] hover:text-[#666] transition-colors">Trending</a>
            <a href="#" className="text-[#999] hover:text-[#666] transition-colors">Feed</a>
            <button className="bg-[#0052FF] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#0045DD] transition-colors">
              Connect
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero / Search ─────────────────────────────── */}
      <section className="pt-20 pb-12 px-8 max-w-[1200px] mx-auto">
        <div className="max-w-[640px] mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 text-[10px] font-semibold text-[#999] uppercase tracking-[0.2em] mb-6">
            <div className="w-5 h-px bg-[#DDD]" />
            Base Wallet Intelligence
          </div>
          <h1 className="text-[42px] font-bold tracking-[-0.03em] leading-[1.1] text-[#111] mb-4">
            Understand any<br />
            <span className="text-[#0052FF]">Base wallet</span>
          </h1>
          <p className="text-[15px] text-[#666] leading-relaxed max-w-[440px] mx-auto">
            Protocols, tokens, reputation, and smart money analytics — all in one place.
          </p>

          <div className="mt-8 bg-white border border-[#EAEAEA] rounded-2xl p-2 flex gap-2 shadow-sm">
            <input
              className="flex-1 bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-[#BBB]"
              placeholder="0x... or name.base.eth"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && scan()}
            />
            <input
              className="w-44 bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-[#BBB] border-l border-[#EAEAEA]"
              placeholder="@handle"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
            />
            <button
              className="bg-[#0052FF] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#0045DD] transition-colors disabled:opacity-60"
              onClick={scan}
              disabled={loading}
            >
              {loading ? "Loading…" : "Analyze"}
            </button>
          </div>
          {error && (
            <div className="mt-3 text-[13px] text-red-500 font-medium">{error}</div>
          )}
        </div>

        {/* ── Loading skeleton ─────────────────────────── */}
        {loading && (
          <div className="max-w-[900px] mx-auto space-y-6 animate-fade-up">
            <div className="bg-white border border-[#EAEAEA] rounded-2xl p-8 animate-shimmer h-24" />
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white border border-[#EAEAEA] rounded-2xl p-6 animate-shimmer h-20" />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Results ────────────────────────────────────── */}
      {data && (
        <main className="max-w-[1200px] mx-auto px-8 pb-24 space-y-6 animate-fade-up">
          {/* Wallet header + Score */}
          <div className="bg-white border border-[#EAEAEA] rounded-2xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-base font-semibold text-[#111] font-mono tracking-tight">
                  {data.address.slice(0, 10)}...{data.address.slice(-6)}
                </h2>
                <a href={`https://basescan.org/address/${data.address}`} target="_blank"
                  className="text-[#BBB] hover:text-[#666] transition-colors text-sm">
                  ↗
                </a>
              </div>
              <div className="flex items-center gap-4 text-[12px] text-[#999]">
                <span>First tx: {data.stats.ageDays}d ago</span>
                <span>·</span>
                <span>{data.stats.totalTx.toLocaleString()} transactions</span>
              </div>
            </div>
            <ScoreRing score={score} />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white border border-[#EAEAEA] rounded-2xl">
              <StatCard label="Total TXs" value={data.stats.totalTx.toLocaleString()} sub="on Base" />
            </div>
            <div className="bg-white border border-[#EAEAEA] rounded-2xl">
              <StatCard label="Volume" value={data.stats.totalVolEth.toFixed(2) + " ETH"} sub="total sent" />
            </div>
            <div className="bg-white border border-[#EAEAEA] rounded-2xl">
              <StatCard label="Balance" value={data.stats.balEth.toFixed(4) + " ETH"} sub="current" />
            </div>
            <div className="bg-white border border-[#EAEAEA] rounded-2xl">
              <StatCard label="Age" value={data.stats.ageDays + "d"} sub={data.stats.activeMonths + " active months"} />
            </div>
          </div>

          {/* Reputation Breakdown + Twitter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Reputation Score Breakdown */}
            <div className="bg-white border border-[#EAEAEA] rounded-2xl p-6">
              <div className="text-[10px] font-semibold text-[#999] uppercase tracking-[0.15em] mb-5">Score Breakdown</div>
              <div className="space-y-1">
                <MiniProgress label="Activity" value={Math.min(data.stats.totalTx, 500)} max={500} />
                <MiniProgress label="Longevity" value={Math.min(data.stats.activeMonths, 12)} max={12} color="#666666" />
                <MiniProgress label="Protocol Diversity" value={Math.min(data.stats.uniqueContracts, 20)} max={20} color="#999999" />
                <MiniProgress label="Volume" value={Math.min(data.stats.totalVolEth, 10)} max={10} color="#666666" />
                <MiniProgress label="Age" value={Math.min(data.stats.ageDays, 365)} max={365} color="#999999" />
              </div>
              <div className="mt-5 pt-4 border-t border-[#EAEAEA] flex justify-between items-center">
                <span className="text-[11px] text-[#666] font-medium">Total Score</span>
                <span className="text-lg font-bold text-[#111]" style={{ color: rep.color }}>{score}/100</span>
              </div>
            </div>

            {/* Twitter + Tokens */}
            <div className="bg-white border border-[#EAEAEA] rounded-2xl p-6">
              <div className="text-[10px] font-semibold text-[#999] uppercase tracking-[0.15em] mb-5">
                {data.twitterMetrics ? "X / Twitter" : "Token Activity"}
              </div>
              {data.twitterMetrics ? (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ["Posts", data.twitterMetrics.tweet_count?.toLocaleString() || "0"],
                    ["Followers", data.twitterMetrics.followers_count?.toLocaleString() || "0"],
                    ["Following", data.twitterMetrics.following_count?.toLocaleString() || "0"],
                    ["Listed", data.twitterMetrics.listed_count?.toLocaleString() || "0"],
                  ].map(([l, v], i) => (
                    <div key={i}>
                      <div className="text-[10px] text-[#999] uppercase tracking-wider">{l}</div>
                      <div className="text-xl font-semibold text-[#111] mt-1">{v}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] text-[#999] uppercase tracking-wider">Tokens</div>
                    <div className="text-xl font-semibold text-[#111] mt-1">{data.stats.uniqueTokens}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#999] uppercase tracking-wider">Protocols</div>
                    <div className="text-xl font-semibold text-[#111] mt-1">{data.stats.uniqueContracts}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Summary Card */}
          <div className="bg-white border border-[#EAEAEA] rounded-2xl p-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 bg-[#0052FF]/10 rounded-full flex items-center justify-center">
                <span className="text-[#0052FF] text-[9px] font-bold">AI</span>
              </div>
              <span className="text-[10px] font-semibold text-[#999] uppercase tracking-[0.15em]">AI Wallet Summary</span>
            </div>
            <p className="text-[14px] text-[#444] leading-relaxed">
              This wallet has been active on Base for <strong className="text-[#111]">{data.stats.ageDays} days</strong> with{" "}
              <strong className="text-[#111]">{data.stats.totalTx.toLocaleString()} transactions</strong> across{" "}
              <strong className="text-[#111]">{data.stats.uniqueContracts} unique protocols</strong>. The activity pattern
              suggests an <strong className="text-[#111]">{rep.label.toLowerCase()}-level</strong> user with{" "}
              <strong className="text-[#111]">{data.stats.totalVolEth.toFixed(2)} ETH</strong> in total volume.
              {data.stats.uniqueContracts >= 10 ? (
                <span> High protocol diversity indicates broad DeFi experience.</span>
              ) : (
                <span> Focused protocol usage suggests a deliberate engagement strategy.</span>
              )}
            </p>
          </div>

          {/* Protocols */}
          {data.protocols.length > 0 && (
            <div className="bg-white border border-[#EAEAEA] rounded-2xl p-6">
              <div className="text-[10px] font-semibold text-[#999] uppercase tracking-[0.15em] mb-4">
                Top Protocols ({data.protocols.length} detected)
              </div>
              <div className="space-y-3">
                {data.protocols.slice(0, 8).map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-[11px] font-semibold text-[#666]">
                        {p.icon}
                      </div>
                      <span className="text-[13px] text-[#111] font-medium">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-1 bg-[#F0F0F0] rounded-full overflow-hidden">
                        <div className="h-full bg-[#0052FF] rounded-full transition-all duration-700"
                          style={{ width: Math.min((p.txCount / (data.protocols[0]?.txCount || 1)) * 100, 100) + "%" }} />
                      </div>
                      <span className="text-[12px] text-[#999] font-medium w-12 text-right">{p.txCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transaction Table — Stripe style */}
          <div className="bg-white border border-[#EAEAEA] rounded-2xl overflow-hidden">
            <div className="px-6 py-3 border-b border-[#EAEAEA] flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[#999] uppercase tracking-[0.15em]">Recent Transactions</span>
              <span className="text-[11px] text-[#BBB]">{data.stats.totalTx.toLocaleString()} total</span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#EAEAEA] text-left">
                  <th className="px-6 py-2 text-[10px] font-semibold text-[#BBB] uppercase tracking-wider">Tx Hash</th>
                  <th className="px-6 py-2 text-[10px] font-semibold text-[#BBB] uppercase tracking-wider">Type</th>
                  <th className="px-6 py-2 text-[10px] font-semibold text-[#BBB] uppercase tracking-wider text-right">Value</th>
                  <th className="px-6 py-2 text-[10px] font-semibold text-[#BBB] uppercase tracking-wider text-right">Age</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTxs.slice(0, 10).map((t, i) => {
                  const isOut = t.from?.toLowerCase() === data.address;
                  const type = t.isContract ? "Contract" : isOut ? "Sent" : "Received";
                  const typeColor = isOut ? "#666" : t.isContract ? "#0052FF" : "#22C55E";
                  return (
                    <tr key={i} className="border-b border-[#EAEAEA]/50 hover:bg-[#FAFAFA] transition-colors">
                      <td className="px-6 py-2.5">
                        <a href={`https://basescan.org/tx/${t.hash}`} target="_blank"
                          className="text-[13px] text-[#111] font-mono hover:text-[#0052FF] transition-colors">
                          {t.hash.slice(0, 10)}...
                        </a>
                      </td>
                      <td className="px-6 py-2.5">
                        <span className="text-[12px]" style={{ color: typeColor }}>{type}</span>
                      </td>
                      <td className="px-6 py-2.5 text-right">
                        <span className="text-[12px] text-[#666] font-mono">{t.value} ETH</span>
                      </td>
                      <td className="px-6 py-2.5 text-right">
                        <span className="text-[12px] text-[#BBB]">{timeAgo(t.timeStamp)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="text-center pt-8">
            <p className="text-[11px] text-[#CCC]">
              Data from Base Blockscout. Not financial advice.
            </p>
          </div>
        </main>
      )}

      {/* ── Empty State ────────────────────────────────── */}
      {!data && !loading && (
        <div className="max-w-[1200px] mx-auto px-8 pb-24">
          <div className="bg-white border border-[#EAEAEA] rounded-2xl p-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#F5F5F5] flex items-center justify-center mx-auto mb-5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#BBB" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <p className="text-[15px] text-[#666] font-medium">Enter a wallet address to get started</p>
            <p className="text-[13px] text-[#BBB] mt-1.5">Supports 0x... addresses and name.base.eth Basenames</p>
          </div>

          {/* Example Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
            {[
              { title: "Wallet profiling", desc: "Enriched context: age, activity patterns, protocol interactions, and reputation scoring." },
              { title: "Smart money tracking", desc: "Identify profitable wallets. Track PnL, winning trades, and investment style." },
              { title: "AI-powered insights", desc: "Automated wallet analysis — style, risk profile, and portfolio composition." },
            ].map((c, i) => (
              <div key={i} className="bg-white border border-[#EAEAEA] rounded-2xl p-6">
                <div className="w-8 h-8 rounded-lg bg-[#F5F5F5] flex items-center justify-center mb-4">
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
