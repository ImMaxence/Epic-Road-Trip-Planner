import type { JSX } from "react";
import type { Cover } from "../lib/api";

/**
 * Travel-poster illustrations drawn for the project (no stock photos).
 * Every scene shares the same perspective road so the collection reads as one series.
 */

const INK = "#1d2433";
const PAPER = "#fffaf0";

function Road({ horizon, surface = "#2d323c" }: { horizon: number; surface?: string }) {
  const bottom = 240;
  const halfAt = (y: number) => 3 + (98 - 3) * ((y - horizon) / (bottom - horizon));
  const yAt = (t: number) => horizon + (bottom - horizon) * t * t;
  const dashes = [0.2, 0.34, 0.48, 0.62, 0.76, 0.9].map((t) => {
    const y1 = yAt(t);
    const y2 = yAt(Math.min(1, t + 0.07));
    const w1 = halfAt(y1) * 0.045 + 0.4;
    const w2 = halfAt(y2) * 0.045 + 0.4;
    return `M${200 - w1} ${y1}L${200 + w1} ${y1}L${200 + w2} ${y2}L${200 - w2} ${y2}Z`;
  });
  return (
    <g>
      <path d={`M${200 - 98} ${bottom}L${200 - 3} ${horizon}L${200 + 3} ${horizon}L${200 + 98} ${bottom}Z`} fill={surface} />
      <path d={`M${200 - 98} ${bottom}L${200 - 3} ${horizon}M${200 + 98} ${bottom}L${200 + 3} ${horizon}`} stroke={PAPER} strokeWidth="1.6" opacity="0.8" />
      <path d={dashes.join("")} fill="#f2b705" />
    </g>
  );
}

function Mountain() {
  return (
    <>
      <rect width="400" height="240" fill="#f6e2b8" />
      <circle cx="292" cy="74" r="32" fill="#e8553e" />
      <path d="M0 152 62 92l46 40 54-62 58 66 50-42 58 46 72-54v156H0Z" fill="#a9bedb" />
      <path d="m162 70 18 19-11-3-7 9-8-9-8 2Z" fill={PAPER} />
      <path d="M0 178 82 116l58 48 72-58 78 64 58-42 52 34v78H0Z" fill="#2f5d9e" />
      <path d="m212 106 22 18-12-3-10 9-10-9-10 2Z" fill={PAPER} />
      <path d="M0 204c90-34 150-18 210-6s120 4 190-14v56H0Z" fill="#2f7a52" />
      <Road horizon={176} />
      <path d="M318 196v-22l10 10m-10-4-9 7" stroke={INK} strokeWidth="3" fill="none" />
      <circle cx="318" cy="166" r="11" fill="#1d5139" />
    </>
  );
}

function Beach() {
  return (
    <>
      <rect width="400" height="240" fill="#f9e6bf" />
      <circle cx="96" cy="70" r="28" fill="#f2b705" />
      <rect y="132" width="400" height="44" fill="#2f5d9e" />
      <path d="M0 146h400M0 158h400" stroke="#a9bedb" strokeWidth="2" strokeDasharray="22 14" />
      <path d="M0 176h400v64H0Z" fill="#e9c98f" />
      <path d="M300 132V64h16v68Z" fill={PAPER} />
      <path d="M300 78h16v12h-16zm0 24h16v12h-16z" fill="#c0311d" />
      <path d="m296 64 12-12 12 12Z" fill={INK} />
      <path d="M314 58h22" stroke="#f2b705" strokeWidth="4" strokeLinecap="round" />
      <path d="M270 132c14-12 50-16 76-6l-6 6Z" fill="#7a4a2a" />
      <path d="M150 128 152 98l18 28Zm2-30v34" fill={PAPER} stroke={INK} strokeWidth="2" />
      <path d="M140 132h34l-6 6h-22Z" fill="#c0311d" />
      <Road horizon={172} surface="#3a3f49" />
    </>
  );
}

function Forest() {
  const tree = (x: number, y: number, s: number, fill: string) => (
    <path key={`${x}-${y}`} d={`M${x} ${y - 60 * s}l${18 * s} ${26 * s}h${-8 * s}l${16 * s} ${22 * s}h${-10 * s}l${14 * s} ${18 * s}h${-60 * s}l${14 * s} ${-18 * s}h${-10 * s}l${16 * s} ${-22 * s}h${-8 * s}Z`} fill={fill} />
  );
  return (
    <>
      <rect width="400" height="240" fill="#e8efd9" />
      <circle cx="200" cy="120" r="70" fill="#f6e2b8" />
      <path d="M0 160c80-20 140-24 200-14s130 10 200-8v102H0Z" fill="#9cbf8f" />
      {[20, 60, 100, 300, 340, 380].map((x, i) => tree(x, 150, 0.9, i % 2 ? "#2f7a52" : "#1d5139"))}
      {[-10, 40, 90, 310, 360, 410].map((x, i) => tree(x, 205, 1.3, i % 2 ? "#1d5139" : "#14402c"))}
      <Road horizon={150} />
      <path d="M0 236h400" stroke="#14402c" strokeWidth="8" />
    </>
  );
}

function City() {
  return (
    <>
      <rect width="400" height="240" fill="#f3dcc8" />
      <circle cx="320" cy="62" r="26" fill="#e8553e" opacity="0.9" />
      <path d="M0 170V122h28v-14h24v14h18V96h22v74h26v-40l20-16 20 16v40h18V84l12-36 12 36v86h20v-52h40v52h22v-62h24l12-14 12 14v62h26V128h26v42Z" fill="#7a8fb3" />
      <path d="M0 176v-30h40l16-14 16 14v30h20v-44h30v-12h10v12h18v44h30v-56h12l8-20 8 20h12v56h24v-38h50v38h22v-24l18-12 18 12v24h28v-36h20v36Z" fill="#2f5d9e" />
      <path d="M122 140h6v8h-6zm14 0h6v8h-6zm112-4h6v8h-6zm16 0h6v8h-6zm-196 18h6v8h-6zm16 0h6v8h-6zm260-8h6v8h-6z" fill="#f2b705" />
      <path d="M0 176h400v64H0Z" fill="#c7b79a" />
      <Road horizon={178} />
      <path d="M86 200v-38m-8 0h16" stroke={INK} strokeWidth="3" />
      <rect x="77" y="150" width="18" height="12" rx="2" fill="#0b6b47" stroke={PAPER} strokeWidth="1.5" />
    </>
  );
}

function Campfire() {
  return (
    <>
      <rect width="400" height="240" fill="#1f2a44" />
      <circle cx="320" cy="58" r="20" fill="#f6e2b8" />
      <circle cx="328" cy="52" r="18" fill="#1f2a44" />
      <g fill="#f6e2b8">
        {[
          [40, 40], [90, 70], [150, 30], [200, 60], [250, 24], [120, 100], [370, 110], [60, 110], [270, 90],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.8" />
        ))}
      </g>
      <path d="M0 168 70 118l50 34 70-58 80 66 50-30 80 40v70H0Z" fill="#2b3a5c" />
      <path d="M0 240v-52c80-16 150-14 210-6s120 6 190-8v66Z" fill="#1d3a2c" />
      <Road horizon={168} surface="#121722" />
      <path d="m40 214 46-62 46 62Z" fill="#c0311d" />
      <path d="m86 152-14 62h28Z" fill="#7a1f12" />
      <path d="M306 214c-12-10-6-26 6-40 0 10 8 12 10 4 8 10 14 26 2 36Z" fill="#f2b705" />
      <path d="M310 214c-6-6-2-14 4-20 2 6 6 6 8 2 2 8 2 14-4 18Z" fill="#e8553e" />
      <path d="M290 218h48M296 222l36-8" stroke="#7a4a2a" strokeWidth="5" strokeLinecap="round" />
    </>
  );
}

const SCENES: Record<Cover, () => JSX.Element> = {
  mountain: Mountain,
  beach: Beach,
  forest: Forest,
  city: City,
  campfire: Campfire,
};

export function CoverArt({ cover, className }: { cover: Cover; className?: string }) {
  const Scene = SCENES[cover] ?? City;
  return (
    <svg className={className} viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <Scene />
    </svg>
  );
}

export const COVERS: Cover[] = ["mountain", "beach", "forest", "city", "campfire"];
