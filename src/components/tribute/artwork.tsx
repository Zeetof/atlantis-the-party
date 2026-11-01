import { cn } from "@/lib/utils";

/**
 * Original abstract tribute artwork. No album art, artist likeness, lyrics or
 * copyrighted marks — built from type, vinyl-inspired geometry and chrome.
 */
export function TributeArtwork({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        "grain relative isolate aspect-square overflow-hidden border border-white/15 bg-ink",
        className,
      )}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 46%, rgba(229,57,53,0.28) 0%, rgba(229,57,53,0.05) 34%, transparent 62%), linear-gradient(145deg, #1a0a0a 0%, #080808 45%, #101010 100%)",
        }}
      />
      <svg
        viewBox="0 0 600 600"
        className="absolute inset-0 h-full w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="chrome-line" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="0.45" stopColor="#8b8882" stopOpacity="0.18" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.45" />
          </linearGradient>
          <radialGradient id="center-glow">
            <stop offset="0" stopColor="#E53935" stopOpacity="0.5" />
            <stop offset="1" stopColor="#E53935" stopOpacity="0" />
          </radialGradient>
          <clipPath id="disc-clip">
            <circle cx="300" cy="300" r="232" />
          </clipPath>
        </defs>

        <circle cx="300" cy="300" r="245" fill="url(#center-glow)" opacity="0.55" />
        <g clipPath="url(#disc-clip)" opacity="0.6">
          {Array.from({ length: 38 }).map((_, index) => (
            <circle
              key={index}
              cx="300"
              cy="300"
              r={64 + index * 4.4}
              stroke="url(#chrome-line)"
              strokeWidth={index % 5 === 0 ? 0.9 : 0.4}
              opacity={index % 3 === 0 ? 0.7 : 0.36}
            />
          ))}
        </g>

        <circle cx="300" cy="300" r="232" stroke="rgba(245,242,237,0.22)" strokeWidth="1" />
        <circle cx="300" cy="300" r="244" stroke="rgba(229,57,53,0.55)" strokeWidth="1" strokeDasharray="2 9" />
        <circle cx="300" cy="300" r="64" fill="#080808" stroke="rgba(245,242,237,0.22)" />
        <circle cx="300" cy="300" r="5" fill="#E53935" />

        <path
          d="M300 56 A244 244 0 0 1 544 300"
          stroke="#E53935"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M300 544 A244 244 0 0 1 56 300"
          stroke="rgba(245,242,237,0.35)"
          strokeWidth="1"
          strokeLinecap="round"
        />

        {[
          [110, 112],
          [482, 128],
          [92, 486],
          [502, 462],
          [300, 48],
          [300, 552],
        ].map(([x, y], index) => (
          <g key={index} stroke="rgba(245,242,237,0.5)" strokeWidth="1">
            <line x1={x - 5} y1={y} x2={x + 5} y2={y} />
            <line x1={x} y1={y - 5} x2={x} y2={y + 5} />
          </g>
        ))}

        <text
          x="300"
          y="322"
          textAnchor="middle"
          fontFamily="Anton, Impact, sans-serif"
          fontSize={compact ? 190 : 210}
          fill="#F5F2ED"
          fillOpacity="0.96"
          letterSpacing="2"
          style={{ paintOrder: "stroke" }}
          stroke="rgba(0,0,0,0.35)"
          strokeWidth="1"
        >
          999
        </text>

        <text
          x="300"
          y="92"
          textAnchor="middle"
          fontFamily="Manrope, Helvetica, sans-serif"
          fontSize="10"
          letterSpacing="6"
          fill="rgba(245,242,237,0.55)"
        >
          ATLANTIS 4.0
        </text>
        <text
          x="300"
          y="514"
          textAnchor="middle"
          fontFamily="Manrope, Helvetica, sans-serif"
          fontSize="9"
          letterSpacing="5"
          fill="rgba(245,242,237,0.45)"
        >
          DECEMBER 30, 2026
        </text>
        <text
          x="40"
          y="300"
          textAnchor="middle"
          transform="rotate(-90 40 300)"
          fontFamily="Manrope, Helvetica, sans-serif"
          fontSize="8"
          letterSpacing="4"
          fill="rgba(229,57,53,0.9)"
        >
          FOREVER
        </text>
        <text
          x="560"
          y="300"
          textAnchor="middle"
          transform="rotate(90 560 300)"
          fontFamily="Manrope, Helvetica, sans-serif"
          fontSize="8"
          letterSpacing="4"
          fill="rgba(245,242,237,0.4)"
        >
          IN THE MUSIC
        </text>
      </svg>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/20" />
    </div>
  );
}
