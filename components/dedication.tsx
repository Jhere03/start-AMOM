"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { ChevronDown, Heart, Lock, Sparkles } from "lucide-react";
import { CANCION, FIRMA, INICIAL, MENSAJE, MOTIVOS, NOMBRE } from "@/config/dedicatoria";
import { buildConstellation } from "@/lib/constellation";
import { cn } from "@/lib/utils";
import { NightSky } from "@/components/night-sky";
import { StarBouquet } from "@/components/star-bouquet";
import { MusicControls, useMusic } from "@/components/music-player";

const pad = (n: number) => String(n).padStart(2, "0");

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
  show: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay, duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function Dedication() {
  const [opened, setOpened] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [discovered, setDiscovered] = useState<Set<number>>(() => new Set());
  const constellation = useMemo(() => buildConstellation(MOTIVOS.length), []);
  const reduced = !!useReducedMotion();
  const allFound = discovered.size === MOTIVOS.length;
  const { audioProps, start, ...music } = useMusic();

  useEffect(() => {
    document.body.style.overflow = opened ? "" : "hidden";
  }, [opened]);

  const open = () => {
    setOpened(true);
    start();
  };

  const reveal = useCallback((index: number) => {
    setSelected(index);
    setDiscovered((prev) => (prev.has(index) ? prev : new Set(prev).add(index)));
  }, []);

  const revealNext = () => {
    const pending = MOTIVOS.map((_, i) => i).filter((i) => !discovered.has(i));
    const pool = pending.length ? pending : MOTIVOS.map((_, i) => i).filter((i) => i !== selected);
    reveal(pool[Math.floor(Math.random() * pool.length)]);
  };

  // Tiempo que tarda en dibujarse la constelación antes de mostrar el mensaje
  const textDelay = reduced ? 0 : 1.4;

  return (
    <>
      <NightSky />

      {CANCION && <audio {...audioProps} src={`/${CANCION}`} loop preload="auto" />}

      <AnimatePresence>{!opened && <IntroGate onOpen={open} />}</AnimatePresence>

      {opened && CANCION && <MusicControls {...music} />}

      {opened && (
        <main className="relative">
          {/* ─── Hero: constelación + mensaje ─── */}
          <section className="mx-auto grid min-h-dvh max-w-6xl items-center gap-4 px-4 pt-24 pb-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-12">
            <div className="relative mx-auto w-[min(100%,54svh)] lg:w-[min(100%,82svh)]">
              <div className="aspect-[600/720]">
                <StarBouquet
                  constellation={constellation}
                  initial={INICIAL}
                  selected={selected}
                  discovered={discovered}
                  onSelect={reveal}
                />
              </div>
            </div>

            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={textDelay}
                className="flex items-center gap-2 text-[0.7rem] font-medium tracking-[0.35em] text-gold/80 uppercase"
              >
                <Sparkles className="size-3.5" aria-hidden />
                Constelación de {NOMBRE}
              </motion.p>
              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={textDelay + 0.1}
                className="mt-2 font-mono text-[0.65rem] tracking-widest text-mist/60"
              >
                AR 21h 09m · Dec +14° 02′ · Flos Aurea
              </motion.p>

              <motion.h1
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={textDelay + 0.3}
                className="mt-6 font-heading text-[2rem] leading-[1.15] font-light text-balance text-ink sm:text-[2.6rem] lg:text-[3.1rem]"
              >
                {MENSAJE},
              </motion.h1>
              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={textDelay + 0.7}
                className="text-gold-shimmer -mt-1 px-3 pb-2 font-script text-6xl leading-[1.3] sm:text-7xl lg:-ml-3 lg:text-8xl"
              >
                {NOMBRE}
              </motion.p>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={textDelay + 1.1}
                className="mt-6 w-full max-w-md"
              >
                <ReasonCard selected={selected} />

                <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 lg:justify-start">
                  <Progress discovered={discovered} selected={selected} onSelect={reveal} />
                  <button
                    type="button"
                    onClick={revealNext}
                    className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-5 text-sm font-medium text-gold-soft transition-colors hover:border-gold/60 hover:bg-gold/20 focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:outline-none"
                  >
                    <Sparkles className="size-4" aria-hidden />
                    {discovered.size ? "Otro motivo" : "Descubrir un motivo"}
                  </button>
                </div>
              </motion.div>
            </div>

            <motion.a
              href="#motivos"
              aria-label="Ver todos los motivos"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduced ? 0 : constellation.duration }}
              className="mx-auto mt-4 flex size-11 items-center justify-center rounded-full text-mist/70 transition-colors hover:text-gold lg:col-span-2"
            >
              <ChevronDown className="size-6 animate-bounce motion-reduce:animate-none" />
            </motion.a>
          </section>

          {/* ─── Todos los motivos ─── */}
          <section id="motivos" className="mx-auto max-w-5xl scroll-mt-8 px-4 py-20 sm:px-6">
            <SectionTitle eyebrow={`Para ${NOMBRE}`} title="Motivos por los que te amo" />
            <p className="mx-auto mt-4 max-w-md text-center text-sm text-mist">
              Cada pétalo guarda uno. Toca los que aún brillan en secreto.
            </p>

            <ul className="mt-12 grid gap-4 sm:grid-cols-2">
              {MOTIVOS.map((motivo, i) => (
                <ReasonTile key={i} index={i} text={motivo} open={discovered.has(i)} onReveal={() => reveal(i)} />
              ))}
            </ul>

            <AnimatePresence>
              {allFound && (
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-12 text-center font-heading text-2xl text-gold-soft italic"
                >
                  Y mil motivos más que no caben en el cielo ✦
                </motion.p>
              )}
            </AnimatePresence>
          </section>

          {/* ─── Cierre ─── */}
          <section className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6">
            <Heart className="size-6 fill-gold/80 text-gold" aria-hidden />
            <p className="mt-8 font-heading text-3xl leading-snug font-light text-balance text-ink sm:text-4xl">
              De todas las estrellas del cielo, ninguna brilla como tú,
            </p>
            <p className="text-gold-shimmer mt-2 px-3 pb-2 font-script text-6xl leading-[1.3] sm:text-7xl">{NOMBRE}</p>
            {FIRMA && <p className="mt-10 text-xs tracking-[0.3em] text-mist uppercase">{FIRMA}</p>}
          </section>

          <footer className="border-t border-white/5 px-4 py-8 text-center text-xs text-mist/60">
            Hecho con <Heart className="inline size-3 fill-current align-[-1px] text-gold/70" aria-label="amor" /> solo
            para {NOMBRE} · {new Date().getFullYear()}
          </footer>
        </main>
      )}
    </>
  );
}

function IntroGate({ onOpen }: { onOpen: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      exit={{ opacity: 0, scale: 1.08, filter: "blur(12px)" }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.4, rotate: -45 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
          className="relative"
        >
          <div className="absolute inset-0 rounded-full bg-gold/40 blur-2xl" />
          <Sparkles className="relative size-10 text-gold-soft" aria-hidden />
        </motion.div>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0.4}
          className="mt-8 font-heading text-2xl font-light text-ink italic sm:text-3xl"
        >
          Tengo algo para ti,
        </motion.p>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0.8}
          className="text-gold-shimmer px-4 pb-2 font-script text-7xl leading-[1.35] sm:text-8xl"
        >
          {NOMBRE}
        </motion.p>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={1.1}
          className="mt-2 max-w-xs text-sm text-mist"
        >
          Una constelación de flores amarillas, dibujada solo para ti.
        </motion.p>

        <motion.button
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={1.5}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={onOpen}
          className="group relative mt-10 inline-flex h-12 cursor-pointer items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[#FFB020] via-gold to-gold-soft px-8 text-sm font-semibold tracking-wide text-night shadow-[0_0_40px_-6px_rgba(255,211,78,0.7)] focus-visible:ring-2 focus-visible:ring-gold-soft focus-visible:ring-offset-2 focus-visible:ring-offset-night focus-visible:outline-none"
        >
          <Heart className="size-4 fill-night/80" aria-hidden />
          Abrir mi regalo
        </motion.button>
      </div>
    </motion.div>
  );
}

function ReasonCard({ selected }: { selected: number | null }) {
  return (
    <div className="glass relative min-h-[7.5rem] overflow-hidden rounded-2xl px-6 py-5 text-left">
      <AnimatePresence mode="wait" initial={false}>
        {selected === null ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-full flex-col justify-center"
          >
            <p className="text-[0.7rem] tracking-[0.3em] text-gold/70 uppercase">{MOTIVOS.length} secretos</p>
            <p className="mt-2 font-heading text-xl text-ink/90 italic">
              Toca cada pétalo de la flor para descubrir por qué te amo.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
            transition={{ duration: 0.45 }}
          >
            <p className="text-[0.7rem] tracking-[0.3em] text-gold/70 uppercase">
              Pétalo {pad(selected + 1)} · de {pad(MOTIVOS.length)}
            </p>
            <p className="mt-2 font-heading text-[1.7rem] leading-tight text-gold-soft">{MOTIVOS[selected]}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Progress({
  discovered,
  selected,
  onSelect,
}: {
  discovered: Set<number>;
  selected: number | null;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center" role="list" aria-label="Pétalos">
        {MOTIVOS.map((_, i) => (
          <button
            key={i}
            type="button"
            role="listitem"
            onClick={() => onSelect(i)}
            aria-label={`Motivo ${i + 1}${discovered.has(i) ? " (descubierto)" : ""}`}
            className="flex size-6 cursor-pointer items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:outline-none"
          >
            <span
              className={cn(
                "block rounded-full transition-all duration-500",
                selected === i
                  ? "size-2.5 bg-gold shadow-[0_0_10px_2px_rgba(255,211,78,0.7)]"
                  : discovered.has(i)
                    ? "size-1.5 bg-gold/80"
                    : "size-1.5 bg-white/20",
              )}
            />
          </button>
        ))}
      </div>
      <span className="text-xs whitespace-nowrap text-mist tabular-nums">
        {discovered.size}/{MOTIVOS.length}
      </span>
    </div>
  );
}

function ReasonTile({
  index,
  text,
  open,
  onReveal,
}: {
  index: number;
  text: string;
  open: boolean;
  onReveal: () => void;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay: (index % 2) * 0.08 }}
    >
      <button
        type="button"
        onClick={onReveal}
        className={cn(
          "glass group flex min-h-20 w-full cursor-pointer items-center gap-5 rounded-2xl px-6 py-5 text-left transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:outline-none",
          open ? "border-gold/25" : "hover:border-gold/30",
        )}
      >
        <span
          className={cn(
            "font-heading text-3xl tabular-nums transition-colors",
            open ? "text-gold" : "text-mist/40 group-hover:text-gold/60",
          )}
        >
          {pad(index + 1)}
        </span>
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="open"
              initial={{ opacity: 0, filter: "blur(6px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              className="font-heading text-xl leading-snug text-ink"
            >
              {text}
            </motion.span>
          ) : (
            <motion.span key="closed" exit={{ opacity: 0 }} className="flex items-center gap-2 text-sm text-mist/70">
              <Lock className="size-3.5" aria-hidden />
              Toca para descubrirlo
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </motion.li>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <p className="flex items-center gap-3 text-[0.7rem] tracking-[0.35em] text-gold/80 uppercase">
        <span className="h-px w-8 bg-gradient-to-r from-transparent to-gold/60" />
        {eyebrow}
        <span className="h-px w-8 bg-gradient-to-l from-transparent to-gold/60" />
      </p>
      <h2 className="mt-4 font-heading text-4xl font-light text-ink sm:text-5xl">{title}</h2>
    </div>
  );
}
