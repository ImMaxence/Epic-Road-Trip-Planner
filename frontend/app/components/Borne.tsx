/** French kilometre milestone ("borne kilométrique"): white body, coloured dome. */
export type BorneTone = "red" | "green" | "blue" | "ink" | "yellow";

const CAP: Record<BorneTone, string> = {
  red: "#c0311d",
  green: "#0b6b47",
  blue: "#1f4fa8",
  ink: "#1d2433",
  yellow: "#f2b705",
};

interface BorneProps {
  label?: string;
  cap?: string;
  tone?: BorneTone;
  size?: number;
  className?: string;
  title?: string;
}

export function Borne({ label, cap, tone = "red", size = 40, className, title }: BorneProps) {
  const capText = tone === "yellow" ? "#1d2433" : "#ffffff";
  return (
    <svg
      className={`borne ${className ?? ""}`}
      width={size}
      height={size * 1.3}
      viewBox="0 0 40 52"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      <path d="M5 51V19a15 15 0 0 1 30 0v32Z" fill="#fffaf0" stroke="#1d2433" strokeWidth="2.5" />
      <path d="M6.25 21v-2a13.75 13.75 0 0 1 27.5 0v2Z" fill={CAP[tone]} />
      <path d="M5 21h30" stroke="#1d2433" strokeWidth="1.5" />
      {cap ? (
        <text x="20" y="16.5" textAnchor="middle" fontSize="9.5" fill={capText}>
          {cap}
        </text>
      ) : null}
      {label ? (
        <text x="20" y="41" textAnchor="middle" fontSize={label.length > 2 ? 12 : 17} fill="#1d2433">
          {label}
        </text>
      ) : (
        <g stroke="#1d2433" strokeWidth="2" strokeLinecap="round">
          <path d="M13 31h14M15 38h10" />
        </g>
      )}
    </svg>
  );
}
