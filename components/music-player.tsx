"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Pause, Play, Volume1, Volume2, VolumeX } from "lucide-react";

const DEFAULT_VOLUME = 0.8;

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

/**
 * El volumen pasa por un GainNode de Web Audio porque en iPhone
 * `audio.volume` es de solo lectura y un deslizador normal no funcionaría.
 */
export function useMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const lastVolume = useRef(DEFAULT_VOLUME);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME);

  const applyVolume = useCallback((value: number, fadeSeconds = 0.05) => {
    const ctx = ctxRef.current;
    const gain = gainRef.current;
    if (ctx && gain) {
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(value, now + fadeSeconds);
    } else if (audioRef.current) {
      audioRef.current.volume = value;
    }
  }, []);

  const connect = useCallback((audio: HTMLAudioElement) => {
    if (ctxRef.current) return;
    const Ctx = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
    if (!Ctx) return;
    try {
      const ctx = new Ctx();
      const gain = ctx.createGain();
      gain.gain.value = 0;
      ctx.createMediaElementSource(audio).connect(gain).connect(ctx.destination);
      ctxRef.current = ctx;
      gainRef.current = gain;
    } catch {
      // Sin Web Audio: se usa audio.volume como respaldo
    }
  }, []);

  // Llamar dentro de un clic: los navegadores bloquean el audio sin interacción
  const start = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    connect(audio);
    void ctxRef.current?.resume();
    if (!gainRef.current) audio.volume = volume;
    audio
      .play()
      .then(() => applyVolume(volume, 2.5))
      .catch(() => setPlaying(false));
  }, [applyVolume, connect, volume]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void ctxRef.current?.resume();
      audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }, []);

  const setVolume = useCallback(
    (value: number) => {
      setVolumeState(value);
      if (value > 0) lastVolume.current = value;
      applyVolume(value);
    },
    [applyVolume],
  );

  const toggleMute = useCallback(() => {
    setVolume(volume > 0 ? 0 : lastVolume.current);
  }, [setVolume, volume]);

  const audioProps = {
    ref: audioRef,
    onPlay: () => setPlaying(true),
    onPause: () => setPlaying(false),
  };

  return { audioProps, start, toggle, playing, volume, setVolume, toggleMute };
}

type ControlsProps = Pick<ReturnType<typeof useMusic>, "toggle" | "playing" | "volume" | "setVolume" | "toggleMute">;

export function MusicControls({ toggle, playing, volume, setVolume, toggleMute }: ControlsProps) {
  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const percent = Math.round(volume * 100);

  return (
    <motion.div
      role="group"
      aria-label="Control de la música"
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.6 }}
      className="glass fixed top-3 right-3 z-40 flex items-center gap-1 rounded-full py-1 pr-4 pl-1 sm:top-5 sm:right-6"
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pausar la música" : "Reproducir la música"}
        className="relative flex size-10 cursor-pointer items-center justify-center rounded-full bg-gold/15 text-gold-soft transition-colors hover:bg-gold/25 focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:outline-none"
      >
        {playing ? <Pause className="size-4 fill-current" aria-hidden /> : <Play className="size-4 fill-current" aria-hidden />}
        {playing && (
          <span className="absolute inset-0 animate-ping rounded-full border border-gold/30 [animation-duration:2.5s] motion-reduce:hidden" />
        )}
      </button>

      <button
        type="button"
        onClick={toggleMute}
        aria-label={volume === 0 ? "Activar el sonido" : "Silenciar"}
        className="flex size-10 cursor-pointer items-center justify-center rounded-full text-mist transition-colors hover:text-gold-soft focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:outline-none"
      >
        <VolumeIcon className="size-5" aria-hidden />
      </button>

      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={percent}
        onChange={(e) => setVolume(Number(e.target.value) / 100)}
        aria-label="Volumen"
        aria-valuetext={`${percent}%`}
        className="volume-range w-24 sm:w-32"
        style={{ "--fill": `${percent}%` } as React.CSSProperties}
      />
      <span className="ml-2 w-8 text-right text-xs text-mist tabular-nums">{percent}%</span>
    </motion.div>
  );
}
