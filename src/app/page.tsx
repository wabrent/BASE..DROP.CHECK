"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ArrowRight, Search, Shield, Layers, Sparkles, TrendingUp, Zap, Circle, Download } from "lucide-react";
import { toPng } from "html-to-image";

// ── Background — blockchain network style ─────────────
function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    let id: number;
    const nodes: { x: number; y: number; vx: number; vy: number; r: number }[] = [];
    for (let i = 0; i < 40; i++) nodes.push({ x: Math.random()*c.width, y: Math.random()*c.height, vx: (Math.random()-0.5)*0.2, vy: (Math.random()-0.5)*0.2, r: Math.random()*1.2+0.3 });
    function resize() { c!.width = window.innerWidth; c!.height = window.innerHeight; }
    resize(); window.addEventListener("resize", resize);
    function draw() {
      ctx!.clearRect(0,0,c!.width,c!.height);
      // Subtle grid
      ctx!.strokeStyle = "rgba(255,255,255,0.012)";
      ctx!.lineWidth = 0.5;
      const step = 60;
      for (let x = 0; x < c!.width; x += step) { ctx!.beginPath(); ctx!.moveTo(x,0); ctx!.lineTo(x,c!.height); ctx!.stroke(); }
      for (let y = 0; y < c!.height; y += step) { ctx!.beginPath(); ctx!.moveTo(0,y); ctx!.lineTo(c!.width,y); ctx!.stroke(); }
      // Nodes + connections
      nodes.forEach((n, i) => {
        n.x += n.vx; n.y += n.vy;
        if (n.x<0) n.x=c!.width; if (n.x>c!.width) n.x=0;
        if (n.y<0) n.y=c!.height; if (n.y>c!.height) n.y=0;
        ctx!.beginPath(); ctx!.arc(n.x,n.y,n.r,0,Math.PI*2);
        ctx!.fillStyle = "rgba(0,82,255,0.15)";
        ctx!.fill();
        for (let j=i+1; j<nodes.length; j++) {
          const dx=nodes[j].x-n.x, dy=nodes[j].y-n.y, d=Math.sqrt(dx*dx+dy*dy);
          if (d<150) { ctx!.beginPath(); ctx!.moveTo(n.x,n.y); ctx!.lineTo(nodes[j].x,nodes[j].y); ctx!.strokeStyle=`rgba(0,82,255,${0.03*(1-d/150)})`; ctx!.stroke(); }
        }
      });
      id = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(id); window.removeEventListener("resize",resize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none opacity-70" />;
}

// ── Types ──────────────────────────────────────────────
interface WalletStats { totalTx: number; activeMonths: number; uniqueContracts: number; totalVolEth: number; balEth: number; uniqueTokens: number; ageDays: number; }
interface Protocol { name: string; icon: string; txCount: number; }
interface WalletData { address: string; stats: WalletStats; protocols: Protocol[]; twitterMetrics: any; recentTxs: { hash: string; from: string; to: string; value: string; timeStamp: string; isContract: boolean }[]; }
function calcScore(s: WalletStats) { let x=0; if(s.totalTx>=500)x+=25;else if(s.totalTx>=100)x+=15;else if(s.totalTx>=10)x+=8;if(s.activeMonths>=12)x+=20;else if(s.activeMonths>=6)x+=14;else if(s.activeMonths>=3)x+=8;if(s.uniqueContracts>=20)x+=20;else if(s.uniqueContracts>=10)x+=14;else if(s.uniqueContracts>=5)x+=8;if(s.totalVolEth>=10)x+=15;else if(s.totalVolEth>=1)x+=10;else if(s.totalVolEth>=0.1)x+=5;if(s.ageDays>=365)x+=12;else if(s.ageDays>=180)x+=8;else if(s.ageDays>=90)x+=4;if(s.balEth>=0.1)x+=8;else if(s.balEth>=0.01)x+=4;return Math.min(x,100); }
function reputation(score: number) { if(score>=80)return{label:"Elite",color:"#0052FF",bg:"rgba(0,82,255,0.10)"}; if(score>=60)return{label:"Experienced",color:"#0052FF",bg:"rgba(0,82,255,0.08)"}; if(score>=40)return{label:"Active",color:"#888",bg:"rgba(255,255,255,0.05)"}; if(score>=20)return{label:"Beginner",color:"#666",bg:"rgba(255,255,255,0.03)"}; return{label:"New",color:"#555",bg:"rgba(255,255,255,0.02)"}; }
function timeAgo(ts:string){const s=Math.floor(Date.now()/1000)-parseInt(ts);if(s<60)return s+"s";if(s<3600)return Math.floor(s/60)+"m";if(s<86400)return Math.floor(s/3600)+"h";return Math.floor(s/86400)+"d";}
function riskLevel(score:number){if(score>=70)return{label:"Low Risk",color:"#10B981"};if(score>=40)return{label:"Medium",color:"#F59E0B"};return{label:"High Risk",color:"#EF4444"};}

// ── Score Ring (Large) ────────────────────────────────
function ScoreRing({ score, animate }: { score: number; animate: boolean }) {
  const r=62, circ=2*Math.PI*r;
  const rep = reputation(score);
  return (
    <div className="relative">
      <svg width="150" height="150" viewBox="0 0 150 150">
        <circle cx="75" cy="75" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
        <circle cx="75" cy="75" r={r} fill="none" stroke={rep.color} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={animate ? (circ-(score/100)*circ) : circ}
          strokeLinecap="round" transform="rotate(-90 75 75)"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[44px] font-bold tracking-[-0.04em]" style={{color:rep.color}}>{score}</span>
        <span className="text-[10px] text-white/30 font-medium mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

// ── Dashboard — real product look ─────────────────────
function Dashboard({ data, score, animate, dashRef }: { data?: WalletData; score?: number; animate: boolean; dashRef?: React.Ref<HTMLDivElement> }) {
  const s = data ? data.stats : null;
  const sc = score || 0;
  const rep = reputation(sc);
  const risk = riskLevel(sc);
  const showData = !!data;

  return (
    <div ref={dashRef} className="bg-[#0B0B0B] border border-white/[0.06] rounded-3xl overflow-hidden backdrop-blur-sm">
      {/* Dashboard chrome — dots */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.04]">
        <Circle className="w-2.5 h-2.5 fill-[#EF4444] text-[#EF4444]" />
        <Circle className="w-2.5 h-2.5 fill-[#F59E0B] text-[#F59E0B]" />
        <Circle className="w-2.5 h-2.5 fill-[#10B981] text-[#10B981]" />
        <span className="text-[10px] text-white/15 ml-3 font-medium">Basewallet Intelligence</span>
        <span className="ml-auto text-[10px] text-white/10">{showData ? data!.address.slice(0,10)+"..."+data!.address.slice(-6) : "0x7d1e...9a2f"}</span>
      </div>

      <div className="p-6 space-y-5">
        {/* Row 1: Score + Reputation + Smart Money + Risk */}
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-1 flex flex-col items-center justify-center py-2">
            <ScoreRing score={showData ? sc : 87} animate={animate} />
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold mt-2`} style={{background:rep.bg,color:rep.color}}>
              {showData ? rep.label : "Elite"}
            </span>
          </div>
          <div className="col-span-3 grid grid-cols-3 gap-3">
            {[
              { label: "Smart Money", value: showData ? sc : 92, max: 100, color: "#0052FF" },
              { label: "Protocol Diversity", value: showData ? Math.min(s!.uniqueContracts*5, 100) : 85, max: 100, color: "#3B82FF" },
              { label: "Risk Level", value: showData ? (sc>=70?85:sc>=40?55:30) : 78, max: 100, color: risk.color },
            ].map((m, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4 flex flex-col justify-between">
                <div className="text-[9px] uppercase tracking-wider text-white/30 mb-2">{m.label}</div>
                <div>
                  <div className="text-xl font-bold tracking-[-0.02em] text-white mb-1">{m.value}</div>
                  <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{width:m.value+"%",background:m.color,transition:"width 1s ease"}} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2: Stats pills */}
        <div className="grid grid-cols-4 gap-3">
          {[
            ["Activity", showData ? s!.activeMonths+" mo" : "14 mo", "Active months on Base"],
            ["Transactions", showData ? s!.totalTx.toLocaleString() : "337", "Total onchain actions"],
            ["Volume", showData ? s!.totalVolEth.toFixed(1)+" ETH" : "12.4 ETH", "Total value transferred"],
            ["Age", showData ? s!.ageDays+"d" : "420d", "Since first transaction"],
          ].map(([label, val, sub], i) => (
            <div key={i} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl px-4 py-3.5">
              <div className="text-[9px] uppercase tracking-wider text-white/25 mb-1">{label}</div>
              <div className="text-lg font-semibold text-white tracking-[-0.02em]">{val}</div>
              <div className="text-[9px] text-white/15 mt-0.5">{sub}</div>
            </div>
          ))}
        </div>

        {/* Row 3: Chart + Activity heatmap */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4">
            <div className="text-[9px] uppercase tracking-wider text-white/25 mb-3">Activity Timeline</div>
            <svg viewBox="0 0 300 60" className="w-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0052FF" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#0052FF" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polyline fill="none" stroke="#0052FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                points="0,45 15,40 30,35 45,38 60,28 75,32 90,22 105,25 120,15 135,18 150,8 165,12 180,5 195,8 210,12 225,3 240,6 255,10 270,2 285,5 300,0"
                opacity={showData ? 1 : 0.4} />
              <polygon fill="url(#chartGrad)"
                points="0,45 15,40 30,35 45,38 60,28 75,32 90,22 105,25 120,15 135,18 150,8 165,12 180,5 195,8 210,12 225,3 240,6 255,10 270,2 285,5 300,0 300,60 0,60"
                opacity={showData ? 0.6 : 0.2} />
            </svg>
            {/* Heatmap row */}
            <div className="flex gap-1 mt-3">
              {Array.from({length:28}).map((_, i) => (
                <div key={i} className="h-3 flex-1 rounded-sm" style={{background:`rgba(0,82,255,${0.05+Math.random()*0.2})`}} title={`Day ${28-i}`} />
              ))}
            </div>
            <div className="flex justify-between text-[8px] text-white/15 mt-1.5">
              <span>28 days ago</span>
              <span>Today</span>
            </div>
          </div>

          {/* AI Summary + Protocols */}
          <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#0052FF]" />
              <span className="text-[9px] uppercase tracking-wider text-white/25">AI Analysis</span>
            </div>
            <p className="text-[10px] text-white/35 leading-relaxed flex-1">
              {showData
                ? `${rep.label}-level wallet with ${s!.totalTx.toLocaleString()} transactions across ${s!.uniqueContracts} protocols. ${s!.totalVolEth.toFixed(1)} ETH volume. ${sc>=60?"Demonstrates sophisticated DeFi engagement patterns.":"Building consistent onchain presence."}`
                : "Elite-level wallet. 337 transactions across 24 protocols. 12.4 ETH volume. Demonstrates sophisticated DeFi engagement patterns."}
            </p>
            <div className="border-t border-white/[0.04] pt-3">
              <div className="text-[9px] uppercase tracking-wider text-white/25 mb-2">Top Protocols</div>
              <div className="space-y-1">
                {(showData ? data!.protocols.slice(0,4).map(p=>[p.name,p.txCount] as [string,number]) : [["Aerodrome",56],["Uniswap V3",34],["Morpho",21],["Aave V3",18]] as [string,number][]).map(([n,c],i)=>(
                  <div key={i} className="flex justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-sm bg-[#0052FF]/15 flex items-center justify-center text-[6px] font-bold text-[#0052FF]">{n[0]}</div>
                      <span className="text-white/45">{n}</span>
                    </div>
                    <span className="text-white/20 tabular-nums">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Trust Logos ────────────────────────────────────────
function TrustSection() {
  const logos = [
    { name: "Base", letter: "B" },
    { name: "Coinbase", letter: "C" },
    { name: "Aerodrome", letter: "A" },
    { name: "Uniswap", letter: "U" },
    { name: "Morpho", letter: "M" },
  ];
  return (
    <div className="w-full">
      <div className="grid grid-cols-3 gap-4 mb-10 max-w-[600px] mx-auto">
        {[["10M+","Wallets Analyzed"],["250M+","Transactions Indexed"],["300+","Base Protocols"]].map(([v,l],i)=>(
          <div key={i} className="text-center">
            <div className="text-xl font-bold text-white tracking-[-0.02em]">{v}</div>
            <div className="text-[10px] text-white/25 uppercase tracking-wider mt-1">{l}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-8 opacity-15">
        {logos.map((l, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/80">{l.letter}</div>
            <span className="text-[11px] text-white/50 font-medium">{l.name}</span>
          </div>
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
  const [animate, setAnimate] = useState(false);
  const [page, setPage] = useState<"wallet"|"trending"|"leaderboard">("wallet");
  const [sharing, setSharing] = useState(false);
  const dashRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (data) setTimeout(()=>setAnimate(true), 400); }, [data]);

  async function analyze() {
    const raw = input.trim();
    if (!raw) return setError("Enter a wallet address");
    const isAddr = raw.startsWith("0x") && raw.length === 42;
    if (!isAddr && !raw.includes(".")) return setError("Enter 0x... or name.base.eth");
    setLoading(true); setError(""); setData(null); setAnimate(false);
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

  async function downloadCard() {
    if (!dashRef.current) return;
    setSharing(true);
    try {
      const dataUrl = await toPng(dashRef.current, { quality: 1, pixelRatio: 2, backgroundColor: "#0B0B0B" });
      const link = document.createElement("a");
      link.download = "basewallet-card.png";
      link.href = dataUrl;
      link.click();
    } catch(e) { console.error(e); }
    setSharing(false);
  }

  async function shareToTwitter() {
    if (!dashRef.current) return;
    setSharing(true);
    try {
      const dataUrl = await toPng(dashRef.current, { quality: 0.95, pixelRatio: 2, backgroundColor: "#0B0B0B" });
      const addr = data ? data.address.slice(0, 10) + "..." + data.address.slice(-6) : "";
      const text = encodeURIComponent(`Base Wallet Intelligence ${addr}\nScore: ${score}/100 · ${reputation(score).label}\n\nbase-teal-nu.vercel.app`);
      // Open Twitter intent — image needs upload, so share link instead
      const twUrl = `https://twitter.com/intent/tweet?text=${text}`;
      window.open(twUrl, "_blank");
    } catch(e) { console.error(e); }
    setSharing(false);
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <NetworkBackground />

      {/* ── Nav ──────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-[#050505]/85 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="max-w-[1400px] mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0052FF] rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">B</span>
            </div>
            <span className="text-sm font-semibold tracking-tight">Basewallet</span>
          </div>
          <div className="flex items-center gap-10 text-[13px] font-medium">
            {(["wallet","trending","leaderboard"] as const).map(t => (
              <button key={t} onClick={() => setPage(t)}
                className={`capitalize transition-colors ${page === t ? "text-white" : "text-white/40 hover:text-white/70"}`}>
                {t}
              </button>
            ))}
          </div>
          <button className="bg-white text-black text-xs font-semibold px-4 py-2 rounded-full hover:bg-gray-200 transition-colors">
            Connect Wallet
          </button>
        </div>
      </nav>

      {/* ── Page Content ──────────────────────────────── */}
      {page === "wallet" ? (
        <>
          {/* Summary bar above hero */}
          <div className="border-b border-white/[0.04] bg-white/[0.01]">
            <div className="max-w-[1400px] mx-auto px-8 py-2.5 flex items-center gap-6 text-[10px] text-white/25">
              <span>Base Mainnet</span>
              <span className="text-white/10">·</span>
              <span>Block height: 45,231,882</span>
              <span className="text-white/10">·</span>
              <span>Gas: 0.001 Gwei</span>
              <span className="text-white/10">·</span>
              <span className="text-[#10B981]">● Live</span>
            </div>
          </div>

          {/* Hero */}
          <section className="relative px-8 pt-14 pb-8">
            <div className="max-w-[1400px] mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-12 lg:gap-16 items-center">
                {/* Left */}
                <div>
                  <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.5}}
                    className="inline-flex items-center gap-2 text-[10px] font-semibold text-white/30 uppercase tracking-[0.25em] mb-6">
                    <div className="w-6 h-px bg-[#0052FF]/40" />
                    The Reputation Layer for Base
                  </motion.div>

                  <motion.h1 initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{delay:0.1,duration:0.6}}
                    className="text-[62px] sm:text-[80px] lg:text-[100px] font-extrabold tracking-[-0.04em] leading-[0.92] mb-5">
                    Understand<br />
                    <span className="text-[#0052FF]">any wallet</span>
                  </motion.h1>

                  <motion.p initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.2,duration:0.5}}
                    className="text-[15px] text-white/40 leading-relaxed max-w-[420px] mb-8">
                    Analyze wallets, discover smart money, and track on-chain reputation across the Base ecosystem.
                  </motion.p>

                  <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.3,duration:0.5}}
                    className="flex flex-col sm:flex-row gap-3 mb-8">
                    <div className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-2xl flex items-center p-1.5 hover:border-white/[0.12] transition-colors">
                      <Search className="w-4 h-4 text-white/15 ml-3 flex-shrink-0" />
                      <input className="flex-1 bg-transparent px-2 py-3 text-[14px] outline-none placeholder:text-white/15 text-white"
                        placeholder="Analyze any Base address, ENS or basename"
                        value={input} onChange={e=>setInput(e.target.value)}
                        onKeyDown={e=>e.key==="Enter"&&analyze()} />
                      <button className="bg-white text-black text-[13px] font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
                        onClick={analyze} disabled={loading}>
                        {loading ? "…" : <><span>Analyze Wallet</span><ArrowRight className="w-3.5 h-3.5" /></>}
                      </button>
                    </div>
                  </motion.div>
                  {error && <div className="text-[13px] text-red-400 font-medium -mt-4 mb-4">{error}</div>}
                </div>

                {/* Right — Dashboard (the main element) */}
                <motion.div initial={{opacity:0,y:30,scale:0.97}} animate={{opacity:1,y:0,scale:1}} transition={{delay:0.3,duration:0.8,ease:"easeOut"}} className="relative">
                  <div className="absolute -inset-12 bg-[#0052FF]/5 blur-[100px] rounded-full" />
                                                  <div className="relative">
                    <Dashboard data={data||undefined} score={data?score:87} animate={animate} dashRef={dashRef} />
                    {/* Share / Download buttons */}
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.6}} className="flex justify-end gap-2 mt-3">
                      <button onClick={downloadCard} disabled={sharing}
                        className="flex items-center gap-1.5 text-[11px] font-medium text-white/25 hover:text-white/50 border border-white/[0.06] hover:border-white/[0.12] rounded-xl px-3 py-2 transition-colors disabled:opacity-30">
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                      <button onClick={shareToTwitter} disabled={sharing}
                        className="flex items-center gap-1.5 text-[11px] font-medium text-white/25 hover:text-[#1DA1F2] border border-white/[0.06] hover:border-[#1DA1F2]/20 rounded-xl px-3 py-2 transition-colors disabled:opacity-30">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        Share
                      </button>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Trust Section */}
          <section className="px-8 pb-20">
            <div className="max-w-[1400px] mx-auto">
              <TrustSection />
            </div>
          </section>
        </>
      ) : (
        <section className="relative px-8 pt-32 pb-24 flex items-center justify-center min-h-[60vh]">
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.5}} className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mx-auto mb-6">
              {page==="trending" ? <TrendingUp className="w-7 h-7 text-[#0052FF]/40" /> : <Zap className="w-7 h-7 text-[#0052FF]/40" />}
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">{page==="trending"?"Trending Wallets":"Leaderboard"}</h2>
            <p className="text-white/30 text-sm max-w-[340px] mx-auto mb-8">
              {page==="trending" ? "Top wallets by ROI, profit, and activity on Base." : "Compare wallet reputations across the ecosystem."}
            </p>
            <button onClick={()=>setPage("wallet")} className="text-[13px] font-medium text-[#0052FF] hover:text-[#3B82FF] transition-colors inline-flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Back to Analyzer
            </button>
            <div className="mt-8 px-4 py-2 rounded-full bg-[#0052FF]/8 border border-[#0052FF]/15 text-[11px] text-[#0052FF]/60 font-medium inline-block">Coming soon</div>
          </motion.div>
        </section>
      )}

      {/* ── Footer ────────────────────────────────────── */}
      <footer className="border-t border-white/[0.04] py-6 px-8">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between text-[11px] text-white/15">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-white/[0.03] rounded flex items-center justify-center">
              <span className="text-[7px] font-bold text-white/20">B</span>
            </div>
            Basewallet
          </div>
          <span>Data from Base Blockscout · Not financial advice</span>
        </div>
      </footer>
    </div>
  );
}
