"use client";

import { useEffect, useRef } from "react";
import Hls from "hls.js";
import { motion } from "motion/react";
import { ArrowRight, ChevronDown } from "lucide-react";

export default function AIBuilderPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoSrc = "https://stream.mux.com/T6oQJQ02cQ6N01TR6iHwZkKFkbepS34dkkIc9iukgy400g.m3u8";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(videoSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch((e) => console.log("Auto-play prevented:", e));
      });
      return () => { hls.destroy(); };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = videoSrc;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch((e) => console.log("Auto-play prevented:", e));
      });
    }
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-black text-white overflow-hidden">
      {/* ── Navbar ────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-transparent px-6 py-4 flex items-center justify-between">
        <div className="flex-shrink-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 2v4m0 12v4M2 12h4m12 0h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
          </svg>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <button className="flex items-center gap-1 text-sm font-medium text-white/80 hover:text-white transition-colors" style={{ fontFamily: "Instrument Sans" }}>
            Products <ChevronDown className="w-4 h-4" />
          </button>
          <button className="text-sm font-medium text-white/80 hover:text-white transition-colors" style={{ fontFamily: "Instrument Sans" }}>
            Customer Stories
          </button>
          <button className="text-sm font-medium text-white/80 hover:text-white transition-colors" style={{ fontFamily: "Instrument Sans" }}>
            Resources
          </button>
          <button className="text-sm font-medium text-white/80 hover:text-white transition-colors" style={{ fontFamily: "Instrument Sans" }}>
            Pricing
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button className="hidden sm:block text-sm font-medium text-white/80 hover:text-white transition-colors" style={{ fontFamily: "Instrument Sans" }}>
            Book A Demo
          </button>
          <button className="bg-white text-black text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-gray-100 transition-colors" style={{ fontFamily: "Instrument Sans" }}>
            Get Started
          </button>
        </div>
      </nav>

      {/* ── Background Video ───────────────────────── */}
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-60"
        poster="https://images.unsplash.com/photo-1647356191320-d7a1f80ca777?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGRhcmslMjB0ZWNobm9sb2d5JTIwbmV1cmFsJTIwbmV0d29ya3xlbnwxfHx8fDE3Njg5NzIyNTV8MA&ixlib=rb-4.1.0&q=80&w=1080"
      />

      {/* ── Overlay + Gradients ────────────────────── */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-blue-900/20 blur-[120px] mix-blend-screen rounded-full" />
      <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] bg-indigo-900/20 blur-[120px] mix-blend-screen rounded-full" />

      {/* ── Hero Content ───────────────────────────── */}
      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center mt-20 px-6">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-5xl lg:text-[48px] leading-[1.1] text-white"
          style={{ fontFamily: "Instrument Serif", fontStyle: "italic" }}
        >
          Design at the speed of thought
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-6xl sm:text-8xl lg:text-[136px] font-semibold leading-[0.9] tracking-tighter mt-4 bg-gradient-to-b from-white via-white to-[#b4c0ff] bg-clip-text text-transparent"
          style={{ fontFamily: "Instrument Sans" }}
        >
          Build Faster
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-lg sm:text-[20px] leading-[1.65] text-white opacity-70 max-w-xl mt-8"
          style={{ fontFamily: "Instrument Sans" }}
        >
          Create fully functional, SEO-optimized websites in seconds with our advanced AI engine.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center gap-6 mt-12"
        >
          <button className="group flex items-center gap-0 pl-6 pr-2 py-2 bg-white text-[#0a0400] rounded-full font-medium text-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 transition-all"
            style={{ fontFamily: "Instrument Sans" }}>
            Start Building Free
            <span className="ml-3 w-10 h-10 bg-[#3054ff] hover:bg-[#2040e0] rounded-full flex items-center justify-center transition-colors">
              <ArrowRight className="w-5 h-5 text-white" />
            </span>
          </button>

          <button className="group flex items-center gap-2 text-white/70 hover:text-white backdrop-blur-sm hover:bg-white/5 px-4 py-2 rounded-lg transition-all"
            style={{ fontFamily: "Instrument Sans" }}>
            See Examples
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
