"use client";

import { useEffect, useRef } from "react";
import { Mascot } from "./mascot";

/*
 * Motion terhubung scroll untuk landing page.
 * - Semua gaya diset lewat CSSOM (el.style.x = ...) setelah mount, bukan atribut style
 *   di HTML, sehingga lolos CSP tanpa 'unsafe-inline'.
 * - prefers-reduced-motion: semua langsung di keadaan akhir, tanpa gerak.
 * - Scroll dibaca lewat requestAnimationFrame (maksimal satu hitungan per frame).
 */

const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function onScrollFrame(cb: () => void) {
  let raf = 0;
  const tick = () => {
    raf = 0;
    cb();
  };
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  schedule();
  return () => {
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    if (raf) cancelAnimationFrame(raf);
  };
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/* ------------------------------------------------------------------ */
/* Jejak langkah: garis menggambar diri, maskot berjalan dari kartu ke kartu */

export type TrailStep = { title: string; body: string; tone: string; icon: React.ReactNode };

/** Kurva halus Catmull-Rom melewati semua titik, dikonversi ke Bézier kubik. */
function smoothPath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function ScrollTrail({ steps }: { steps: TrailStep[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const line = useRef<SVGPathElement>(null);
  const ghost = useRef<SVGPathElement>(null);
  const walker = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const root = wrap.current;
    const s = svg.current;
    const path = line.current;
    const faint = ghost.current;
    const who = walker.current;
    if (!root || !s || !path || !faint || !who) return;

    let len = 0;
    let stops: number[] = [];
    const still = reduced();

    const layout = () => {
      const box = root.getBoundingClientRect();
      // Titik singgah: tengah sisi atas tiap kartu
      const pins = cards.current.map((el) => {
        const r = el!.getBoundingClientRect();
        return { x: r.left - box.left + r.width / 2, y: r.top - box.top };
      });
      if (!pins.length) return;
      const start = { x: pins[0].x - 40, y: Math.max(8, pins[0].y - 70) };
      const end = { x: pins[pins.length - 1].x + 40, y: pins[pins.length - 1].y - 70 };
      const d = smoothPath([start, ...pins, end]);

      s.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
      s.setAttribute("width", String(box.width));
      s.setAttribute("height", String(box.height));
      path.setAttribute("d", d);
      faint.setAttribute("d", d);
      len = path.getTotalLength();

      // Panjang lintasan di tiap titik singgah (dicari dengan sampling)
      stops = pins.map((p) => {
        let best = 0;
        let bestDist = Infinity;
        for (let l = 0; l <= len; l += 4) {
          const q = path.getPointAtLength(l);
          const dist = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
          if (dist < bestDist) {
            bestDist = dist;
            best = l;
          }
        }
        return best;
      });
      path.style.strokeDasharray = `${len}`;
      who.style.opacity = "1";
      update();
    };

    const update = () => {
      if (!len) return;
      const r = root.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 saat bagian atas masuk 80% layar, 1 saat bagian bawah melewati 65% layar
      const p = still ? 1 : clamp((vh * 0.8 - r.top) / (r.height + vh * 0.15));
      const at = p * len;
      path.style.strokeDashoffset = `${len - at}`;

      const pt = path.getPointAtLength(at);
      const ahead = path.getPointAtLength(Math.min(len, at + 2));
      const tilt = clamp((ahead.x - pt.x) * 6, -12, 12);
      who.style.transform = `translate(${pt.x}px, ${pt.y}px) translate(-50%, -78%) rotate(${tilt}deg)`;

      cards.current.forEach((el, i) => {
        if (el) el.dataset.on = at >= stops[i] - 6 ? "true" : "false";
      });
    };

    const ro = new ResizeObserver(layout);
    ro.observe(root);
    const off = onScrollFrame(update);
    layout();
    return () => {
      ro.disconnect();
      off();
    };
  }, []);

  return (
    <div ref={wrap} className="relative">
      <svg ref={svg} className="pointer-events-none absolute inset-0" aria-hidden="true" focusable="false">
        <path ref={ghost} fill="none" stroke="var(--ink)" strokeOpacity="0.25" strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" />
        <path ref={line} fill="none" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" />
      </svg>

      <ol className="relative grid gap-16 pt-20 md:grid-cols-4 md:gap-6 md:pt-24">
        {steps.map((s, i) => (
          <li
            key={s.title}
            ref={(el) => {
              cards.current[i] = el;
            }}
            data-on="false"
            className={`card card-lg group relative px-5 pb-6 pt-10 transition-transform duration-500 ease-out
              ${i % 2 === 1 ? "ml-10 md:ml-0 md:mt-20" : "mr-10 md:mr-0"} ${s.tone}
              -rotate-2 data-[on=true]:rotate-0 data-[on=true]:-translate-y-1`}
          >
            <span className="font-display absolute -top-5 left-5 grid size-10 place-items-center rounded-full border-2 border-ink bg-paper text-sm font-extrabold">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span
              aria-hidden="true"
              className="absolute -top-4 right-4 grid size-8 scale-0 place-items-center rounded-full border-2 border-ink bg-yellow-400 text-ink transition-transform duration-300 group-data-[on=true]:scale-100"
            >
              <svg viewBox="0 0 24 24" className="size-5"><path d="M5 12.5 10 17 19 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <div className="mb-3 text-ink">{s.icon}</div>
            <h3 className="font-display text-lg font-extrabold leading-tight">{s.title}</h3>
            <p className="mt-2 text-sm">{s.body}</p>
          </li>
        ))}
      </ol>

      <div ref={walker} className="pointer-events-none absolute left-0 top-0 z-20 w-16 opacity-0 transition-opacity md:w-20" aria-hidden="true">
        <Mascot mood="happy" className="w-full drop-shadow-[2px_2px_0_var(--ink)]" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pita teks berjalan: kecepatannya mengikuti scroll, arah bisa dibalik */

export function ScrollMarquee({
  items,
  reverse = false,
  className = "",
}: {
  items: string[];
  reverse?: boolean;
  className?: string;
}) {
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = track.current;
    if (!el || reduced()) return;
    return onScrollFrame(() => {
      const half = el.scrollWidth / 2;
      if (!half) return;
      const shift = (window.scrollY * 0.6) % half;
      el.style.transform = `translate3d(${reverse ? shift - half : -shift}px, 0, 0)`;
    });
  }, [reverse]);

  const row = [...items, ...items, ...items];
  return (
    <div className={`overflow-hidden border-y-2 border-ink py-3 ${className}`} aria-hidden="true">
      <div ref={track} className="flex w-max gap-6 will-change-transform">
        {[...row, ...row].map((t, i) => (
          <span key={i} className="font-display flex items-center gap-6 whitespace-nowrap text-lg font-extrabold uppercase">
            {t}
            <svg viewBox="0 0 24 24" className="size-5"><path d="M12 2 C 13 9, 15 11, 22 12 C 15 13, 13 15, 12 22 C 11 15, 9 13, 2 12 C 9 11, 11 9, 12 2 Z" fill="currentColor" /></svg>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Parallax ringan: elemen bergeser & sedikit berputar mengikuti scroll */

export function Parallax({
  children,
  speed = 0.15,
  rotate = 0.02,
  className = "",
}: {
  children: React.ReactNode;
  speed?: number;
  rotate?: number;
  className?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = el.current;
    if (!node || reduced()) return;
    return onScrollFrame(() => {
      const y = Math.min(window.scrollY, 900);
      node.style.transform = `translate3d(0, ${y * speed}px, 0) rotate(${y * rotate}deg)`;
    });
  }, [speed, rotate]);
  return (
    <div ref={el} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Muncul saat masuk layar (sekali), tanpa library. Hanya gerak, tanpa opacity: teks selalu
   kontras penuh, termasuk saat transisi. */

export function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = el.current;
    if (!node || reduced()) return;
    // Hanya sembunyikan yang masih di bawah layar: tanpa JS atau di atas lipatan, konten tetap tampil
    if (node.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    node.dataset.shown = "false";
    node.style.transitionDelay = `${delay}ms`;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            node.dataset.shown = "true";
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [delay]);
  return (
    <div
      ref={el}
      className={`transition-[translate,rotate] duration-700 ease-[cubic-bezier(.2,.9,.3,1.2)] data-[shown=false]:translate-y-10 data-[shown=false]:-rotate-2 ${className}`}
    >
      {children}
    </div>
  );
}
