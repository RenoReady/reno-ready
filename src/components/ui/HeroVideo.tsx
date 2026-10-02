"use client";

/**
 * HeroVideo — responsive, muted, looping showcase player.
 *
 *  - Server-renders a <video preload="none"> with its poster, so the frame
 *    paints instantly and no video bytes load until playback starts.
 *  - Autoplays muted once mounted, unless the visitor prefers reduced motion
 *    or has data-saver / a 2G connection — then it waits for a tap.
 *  - Pauses while scrolled off-screen and resumes when it comes back.
 *  - Phones get the lighter 720p source via <source media>.
 */

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoomVideo } from "@/lib/roomPages";

interface HeroVideoProps extends RoomVideo {
  /** Accessible description of what the video shows */
  label:      string;
  className?: string;
}

type NetworkInformation = { saveData?: boolean; effectiveType?: string };

export default function HeroVideo({ src, mobileSrc, poster, label, className }: HeroVideoProps) {
  const videoRef     = useRef<HTMLVideoElement>(null);
  const userPaused   = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [muted,   setMuted]   = useState(true);
  // true when playback waits on the visitor (reduced motion, data saver, autoplay blocked, or they paused)
  const [needsTap, setNeedsTap] = useState(false);

  // Decide whether to autoplay, then keep playback tied to visibility
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;            // React doesn't reliably render the muted attribute

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const conn = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    const lightMode = !!conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? "");
    if (reduceMotion || lightMode) { userPaused.current = true; setNeedsTap(true); }

    // Browsers refuse playback in background tabs, so wait until the tab is shown
    let inView = false;
    const play = () => {
      if (document.hidden || !inView || userPaused.current) return;
      v.play().catch(() => { if (!document.hidden) setNeedsTap(true); });
    };
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) play(); else v.pause();
    }, { threshold: 0.25 });
    io.observe(v);
    document.addEventListener("visibilitychange", play);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", play); };
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { userPaused.current = false; v.play().catch(() => setNeedsTap(true)); }
    else          { userPaused.current = true;  setNeedsTap(true); v.pause(); }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted && v.paused) { userPaused.current = false; v.play().catch(() => {}); }
  };

  return (
    <div className={cn("group relative aspect-video w-full overflow-hidden rounded-3xl bg-sand-200 shadow-warm-xl ring-1 ring-charcoal/5", className)}>
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        poster={poster}
        preload="none"
        muted
        loop
        playsInline
        disablePictureInPicture
        aria-label={label}
        onPlay={() => { setPlaying(true); setNeedsTap(false); }}
        onPause={() => setPlaying(false)}
        onClick={togglePlay}
      >
        {mobileSrc && <source src={mobileSrc} type="video/mp4" media="(max-width: 768px)" />}
        <source src={src} type="video/mp4" />
      </video>

      {/* Large play affordance while paused (reduced motion, data saver, or user pause) */}
      {needsTap && !playing && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Play video"
          className="absolute inset-0 flex items-center justify-center bg-charcoal/10 transition-colors hover:bg-charcoal/20"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 shadow-warm-lg sm:h-20 sm:w-20">
            <Play size={28} className="ml-1 text-terracotta" fill="currentColor" />
          </span>
        </button>
      )}

      {/* Corner controls */}
      <div className="absolute bottom-3 right-3 flex gap-2 sm:bottom-4 sm:right-4">
        {playing && (
          <button
            type="button"
            onClick={togglePlay}
            aria-label="Pause video"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-charcoal/70 text-white backdrop-blur-sm transition-colors hover:bg-charcoal"
          >
            <Pause size={16} fill="currentColor" />
          </button>
        )}
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? "Turn sound on" : "Mute video"}
          aria-pressed={!muted}
          className="flex h-10 items-center gap-2 rounded-full bg-charcoal/70 px-3.5 text-xs font-bold text-white backdrop-blur-sm transition-colors hover:bg-charcoal"
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          <span className="hidden sm:inline">{muted ? "Sound off" : "Sound on"}</span>
        </button>
      </div>
    </div>
  );
}
