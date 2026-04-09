import React from 'react';
import './AegixLogo.css';

export default function AegixLogo({ className = "w-10 h-10", hideText = true }: { className?: string, hideText?: boolean }) {
  return (
    <div className={`aegix-wrap ${className}`}>
      <div className="aegix-mark relative w-full h-full">
        <div className="aegix-glow-orb"></div>
        <svg viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <radialGradient id="cg" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#00e5c0" stopOpacity="0.40"/>
              <stop offset="100%" stopColor="#00e5c0" stopOpacity="0"/>
            </radialGradient>
            <clipPath id="hc">
              <polygon points="140,28 237,84 237,196 140,252 43,196 43,84"/>
            </clipPath>
          </defs>

          <g className="ring-deco">
            <polygon points="140,16 248,78 248,202 140,264 32,202 32,78"
              stroke="#00e5c0" strokeWidth="0.7" fill="none"
              strokeDasharray="8 14" strokeLinejoin="round" opacity="0.20"
              className="dp-deco"/>
          </g>

          <polygon points="140,28 237,84 237,196 140,252 43,196 43,84"
            stroke="#00e5c0" strokeWidth="2.5" fill="rgba(0,229,192,0.04)"
            strokeLinejoin="round" className="dp-outer"/>

          <rect className="scan-line" x="43" y="139" width="194" height="2"
            fill="#00e5c0" opacity="0" clipPath="url(#hc)"/>

          <g className="ring-mid">
            <polygon points="140,68 202,104 202,176 140,212 78,176 78,104"
              stroke="#00e5c0" strokeWidth="1.5" fill="none"
              strokeLinejoin="round" opacity="0.52" className="dp-mid"/>
          </g>

          <line x1="140" y1="28"  x2="140" y2="68"  stroke="#00e5c0" strokeWidth="1.1" opacity="0.42" pathLength={1} className="dl t-o2m"/>
          <line x1="237" y1="84"  x2="202" y2="104" stroke="#00e5c0" strokeWidth="1.1" opacity="0.42" pathLength={1} className="dl t-o2m"/>
          <line x1="237" y1="196" x2="202" y2="176" stroke="#00e5c0" strokeWidth="1.1" opacity="0.42" pathLength={1} className="dl t-o2m"/>
          <line x1="140" y1="252" x2="140" y2="212" stroke="#00e5c0" strokeWidth="1.1" opacity="0.42" pathLength={1} className="dl t-o2m"/>
          <line x1="43"  y1="196" x2="78"  y2="176" stroke="#00e5c0" strokeWidth="1.1" opacity="0.42" pathLength={1} className="dl t-o2m"/>
          <line x1="43"  y1="84"  x2="78"  y2="104" stroke="#00e5c0" strokeWidth="1.1" opacity="0.42" pathLength={1} className="dl t-o2m"/>

          <line x1="140" y1="68"  x2="140" y2="100" stroke="#00e5c0" strokeWidth="1.2" opacity="0.74" pathLength={1} className="dl t-m2i"/>
          <line x1="202" y1="104" x2="175" y2="120" stroke="#00e5c0" strokeWidth="1.2" opacity="0.74" pathLength={1} className="dl t-m2i"/>
          <line x1="202" y1="176" x2="175" y2="160" stroke="#00e5c0" strokeWidth="1.2" opacity="0.74" pathLength={1} className="dl t-m2i"/>
          <line x1="140" y1="212" x2="140" y2="180" stroke="#00e5c0" strokeWidth="1.2" opacity="0.74" pathLength={1} className="dl t-m2i"/>
          <line x1="78"  y1="176" x2="105" y2="160" stroke="#00e5c0" strokeWidth="1.2" opacity="0.74" pathLength={1} className="dl t-m2i"/>
          <line x1="78"  y1="104" x2="105" y2="120" stroke="#00e5c0" strokeWidth="1.2" opacity="0.74" pathLength={1} className="dl t-m2i"/>

          <line x1="140" y1="100" x2="140" y2="118" stroke="#00e5c0" strokeWidth="1" opacity="0.60" pathLength={1} className="dl t-i2c"/>
          <line x1="175" y1="120" x2="159" y2="129" stroke="#00e5c0" strokeWidth="1" opacity="0.60" pathLength={1} className="dl t-i2c"/>
          <line x1="175" y1="160" x2="159" y2="151" stroke="#00e5c0" strokeWidth="1" opacity="0.60" pathLength={1} className="dl t-i2c"/>
          <line x1="140" y1="180" x2="140" y2="162" stroke="#00e5c0" strokeWidth="1" opacity="0.60" pathLength={1} className="dl t-i2c"/>
          <line x1="105" y1="160" x2="121" y2="151" stroke="#00e5c0" strokeWidth="1" opacity="0.60" pathLength={1} className="dl t-i2c"/>
          <line x1="105" y1="120" x2="121" y2="129" stroke="#00e5c0" strokeWidth="1" opacity="0.60" pathLength={1} className="dl t-i2c"/>

          <line x1="140" y1="68"  x2="140" y2="212" stroke="#00e5c0" strokeWidth="0.7" opacity="0.09" pathLength={1} className="dl t-diag"/>
          <line x1="78"  y1="104" x2="202" y2="176" stroke="#00e5c0" strokeWidth="0.7" opacity="0.09" pathLength={1} className="dl t-diag"/>
          <line x1="202" y1="104" x2="78"  y2="176" stroke="#00e5c0" strokeWidth="0.7" opacity="0.09" pathLength={1} className="dl t-diag"/>

          <circle className="np-xs d055" cx="140" cy="28"  r="5.5" fill="#00e5c0" opacity="0.65"/>
          <circle className="np-xs d062" cx="237" cy="84"  r="5.5" fill="#00e5c0" opacity="0.65"/>
          <circle className="np-xs d069" cx="237" cy="196" r="5.5" fill="#00e5c0" opacity="0.65"/>
          <circle className="np-xs d076" cx="140" cy="252" r="5.5" fill="#00e5c0" opacity="0.65"/>
          <circle className="np-xs d083" cx="43"  cy="196" r="5.5" fill="#00e5c0" opacity="0.65"/>
          <circle className="np-xs d090" cx="43"  cy="84"  r="5.5" fill="#00e5c0" opacity="0.65"/>

          <circle className="np d110" cx="140" cy="68"  r="7" fill="#00e5c0"/>
          <circle className="np d117" cx="202" cy="104" r="7" fill="#00e5c0"/>
          <circle className="np d124" cx="202" cy="176" r="7" fill="#00e5c0"/>
          <circle className="np d131" cx="140" cy="212" r="7" fill="#00e5c0"/>
          <circle className="np d138" cx="78"  cy="176" r="7" fill="#00e5c0"/>
          <circle className="np d145" cx="78"  cy="104" r="7" fill="#00e5c0"/>

          <circle className="np-sm d165" cx="140" cy="100" r="6" fill="#00e5c0" opacity="0.93"/>
          <circle className="np-sm d172" cx="175" cy="120" r="6" fill="#00e5c0" opacity="0.93"/>
          <circle className="np-sm d179" cx="175" cy="160" r="6" fill="#00e5c0" opacity="0.93"/>
          <circle className="np-sm d186" cx="140" cy="180" r="6" fill="#00e5c0" opacity="0.93"/>
          <circle className="np-sm d193" cx="105" cy="160" r="6" fill="#00e5c0" opacity="0.93"/>
          <circle className="np-sm d200" cx="105" cy="120" r="6" fill="#00e5c0" opacity="0.93"/>

          <g className="core-g">
            <circle cx="140" cy="140" r="42" fill="url(#cg)"/>
            <circle cx="140" cy="140" r="30" fill="#000000" stroke="#00e5c0" strokeWidth="2"/>
            <circle className="core-fill" cx="140" cy="140" r="22" fill="#00e5c0"/>
            <circle cx="140" cy="140" r="8.5" fill="#000000"/>
            <circle cx="137" cy="137" r="3"   fill="#00e5c0" opacity="0.45"/>
          </g>
        </svg>
      </div>

      {!hideText && (
        <>
          <div className="divider mt-8 mb-6"></div>

          <div className="wordmark">
            <div className="wm-name">
              Aegix<span className="cyan">Chain</span><span className="ai">AI</span>
            </div>
            <div className="wm-tag">Blockchain Security Intelligence</div>
          </div>
        </>
      )}
    </div>
  );
}
