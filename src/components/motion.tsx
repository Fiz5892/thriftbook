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

/**
 * Kurva halus Catmull-Rom melewati semua titik, dikonversi ke Bézier kubik.
 * Mengembalikan perintah awal dan tiap segmen terpisah, agar panjang lintasan sampai titik ke-i
 * bisa dihitung dari prefiks path tanpa sampling.
 */
function smoothSegments(pts: { x: number; y: number }[]) {
  const head = `M ${pts[0].x} ${pts[0].y}`;
  const segs: string[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    segs.push(`C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`);
  }
  return { head, segs };
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
    let near = false; // hanya bekerja saat bagian ini dekat layar
    let raf = 0;
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
      const { head, segs } = smoothSegments([start, ...pins, end]);

      // Kartu ke-i berada tepat di ujung segmen ke-i, jadi panjang lintasan sampai kartu itu
      // = panjang prefiks path. Cukup N kali getTotalLength (dulu ribuan getPointAtLength,
      // yang menjadi long task ±200 ms di Lighthouse).
      stops = pins.map((_, i) => {
        path.setAttribute("d", `${head} ${segs.slice(0, i + 1).join(" ")}`);
        return path.getTotalLength();
      });

      const d = `${head} ${segs.join(" ")}`;
      s.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
      s.setAttribute("width", String(box.width));
      s.setAttribute("height", String(box.height));
      path.setAttribute("d", d);
      faint.setAttribute("d", d);
      len = path.getTotalLength();
      path.style.strokeDasharray = `${len}`;
      who.style.opacity = "1";
      update();
    };

    const update = () => {
      if (!len || !near) return;
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

    // Ukur ulang paling banyak sekali per frame, dan hanya saat dekat layar
    const schedule = () => {
      if (!near || raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        layout();
      });
    };
    const ro = new ResizeObserver(schedule);
    const io = new IntersectionObserver(
      ([e]) => {
        near = e.isIntersecting;
        if (near) schedule();
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(root);
    ro.observe(root);
    const off = onScrollFrame(update);
    return () => {
      ro.disconnect();
      io.disconnect();
      off();
      if (raf) cancelAnimationFrame(raf);
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
    // Lebar dibaca saat ukuran berubah saja; membacanya tiap frame scroll memaksa reflow
    let half = 0;
    const ro = new ResizeObserver(([entry]) => {
      half = entry.contentRect.width / 2;
    });
    ro.observe(el);
    const off = onScrollFrame(() => {
      if (!half) return;
      const shift = (window.scrollY * 0.6) % half;
      el.style.transform = `translate3d(${reverse ? shift - half : -shift}px, 0, 0)`;
    });
    return () => {
      ro.disconnect();
      off();
    };
  }, [reverse]);

  // Satu string teks per salinan (bukan satu elemen + SVG per kata): DOM pita turun dari
  // ±90 elemen menjadi 2, sehingga hidrasi dan layout jauh lebih ringan.
  const line = Array.from({ length: 3 }, () => items.join("  ✦  ")).join("  ✦  ") + "  ✦  ";
  return (
    <div className={`overflow-hidden border-y-2 border-ink py-3 ${className}`} aria-hidden="true">
      <div ref={track} className="flex w-max will-change-transform">
        <span className="font-display whitespace-pre pr-0 text-lg font-extrabold uppercase">{line}</span>
        <span className="font-display whitespace-pre text-lg font-extrabold uppercase">{line}</span>
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
    // Posisi dibaca dari IntersectionObserver (asinkron, tanpa memaksa layout). Membaca
    // getBoundingClientRect lalu menulis atribut untuk tiap elemen memicu layout thrashing.
    let first = true;
    const io = new IntersectionObserver(
      ([e]) => {
        if (first) {
          first = false;
          // Di atas lipatan atau sudah terlewati: biarkan tampil apa adanya
          if (e.isIntersecting || e.boundingClientRect.top < 0) {
            io.disconnect();
            return;
          }
          node.style.transitionDelay = `${delay}ms`;
          node.dataset.shown = "false";
          return;
        }
        if (e.isIntersecting) {
          node.dataset.shown = "true";
          io.disconnect();
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
