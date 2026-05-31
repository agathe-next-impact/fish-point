/* ============================================================
   FishSpot — shared UI pieces
   Exposes: ScoreBadge, MapCanvas, SpotCardWide, AccessTag, WeatherChip
   ============================================================ */

function scoreClass(s){ return s >= 80 ? 'score-hi' : 'score-mid'; }
function scoreBg(s){ return s >= 80 ? 'rgba(31,157,107,0.12)' : 'rgba(217,138,28,0.14)'; }

function ScoreBadge({ value, size = 'md' }) {
  const dims = size === 'sm' ? { w: 38, h: 38, fs: 15, lf: 8 } :
               size === 'lg' ? { w: 60, h: 60, fs: 24, lf: 10 } :
               { w: 46, h: 46, fs: 18, lf: 9 };
  return (
    <div className="score" style={{
      width: dims.w, height: dims.h, fontSize: dims.fs,
      background: scoreBg(value), borderRadius: dims.lf,
      flexDirection:'column', gap: 1,
    }}>
      <span className={scoreClass(value)}>{value}</span>
    </div>
  );
}

function AccessTag({ access, dark = false }) {
  const free = access === 'Libre';
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600,
      padding:'4px 9px', borderRadius:999,
      background: dark ? 'rgba(255,255,255,0.16)' : (free ? 'rgba(31,157,107,0.12)' : 'rgba(18,42,47,0.06)'),
      color: dark ? '#fff' : (free ? '#1f9d6b' : 'var(--muted)'),
    }}>
      <FSIcon name={free ? 'leaf' : 'shield'} size={12} sw={2.2} />
      {access}
    </span>
  );
}

function WeatherChip({ icon, label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, color:'var(--muted)', fontSize:13, fontWeight:600 }}>
      <FSIcon name={icon} size={16} sw={2} style={{ color:'var(--teal)' }} />
      {label}
    </div>
  );
}

/* ── Stylized map canvas with dropping pins ──────────────── */
function MapCanvas({ spots = SPOTS, active, onPick, dark = true, play = false, compact = false }) {
  // generate soft "land" blobs once
  return (
    <div style={{
      position:'absolute', inset:0, overflow:'hidden',
      background: dark
        ? 'radial-gradient(120% 100% at 30% 10%, #0c4350 0%, #08303a 55%, #06262e 100%)'
        : 'radial-gradient(120% 100% at 30% 10%, #cfe8e3 0%, #aed8d0 60%, #98ccc3 100%)',
    }}>
      {/* faint lat/long grid */}
      <svg width="100%" height="100%" style={{ position:'absolute', inset:0, opacity: dark ? 0.10 : 0.18 }}>
        <defs>
          <pattern id="grid" width="46" height="46" patternUnits="userSpaceOnUse">
            <path d="M46 0H0V46" fill="none" stroke={dark ? '#9fd8d0' : '#3d7a72'} strokeWidth="0.7" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* land masses (abstract France-ish blobs) */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
        <g fill={dark ? '#0f4a4a' : '#7bbcae'} opacity={dark ? 0.55 : 0.7}>
          <path d="M30 18 C48 10 70 16 78 34 C86 52 80 74 64 86 C46 96 24 88 18 68 C12 50 16 28 30 18 Z" />
        </g>
        <g fill={dark ? '#125454' : '#8ec9bb'} opacity={dark ? 0.5 : 0.6}>
          <path d="M38 26 C52 22 66 28 70 42 C74 58 66 72 54 78 C40 84 30 74 28 60 C26 44 28 30 38 26 Z" />
        </g>
        {/* a river line */}
        <path d="M44 30 C50 42 46 52 54 60 C60 66 58 74 66 80" fill="none"
          stroke={dark ? '#2aa39433' : '#ffffff66'} strokeWidth="1.4" strokeLinecap="round" />
      </svg>

      {/* compass */}
      {!compact && (
        <div style={{ position:'absolute', top:16, right:16, width:38, height:38, borderRadius:'50%',
          background: dark?'rgba(255,255,255,0.10)':'rgba(255,255,255,0.6)', backdropFilter:'blur(8px)',
          display:'flex', alignItems:'center', justifyContent:'center', color: dark?'#cfeee8':'#0a6b61',
          fontFamily:'var(--display)', fontWeight:700, fontSize:13, boxShadow:'var(--sh-sm)' }}>N</div>
      )}

      {/* pins */}
      {spots.map((s, i) => {
        const isActive = active === s.id;
        return (
          <button key={s.id} onClick={() => onPick && onPick(s.id)}
            className={play ? 'mappin' : 'mappin'}
            style={{
              position:'absolute', left:`${s.x}%`, top:`${s.y}%`, transform:'translate(-50%,-100%)',
              border:'none', background:'none', cursor:'pointer', padding:0, zIndex: isActive?20:10,
              animation:`pin-drop .6s cubic-bezier(.2,.8,.3,1.1) both`, animationDelay:`${0.12 + i*0.08}s`,
            }}>
            {/* ping ring on active */}
            {isActive && (
              <span style={{ position:'absolute', left:'50%', bottom:2, width:34, height:34, marginLeft:-17,
                borderRadius:'50%', background:'var(--accent)', animation:'ping 1.6s ease-out infinite', zIndex:-1 }} />
            )}
            <div style={{
              width: isActive?40:30, height: isActive?40:30, borderRadius:'50% 50% 50% 0',
              transform:'rotate(-45deg)', transition:'all .2s ease',
              background: isActive ? 'var(--accent)' : (s.score>=80?'#1f9d6b':'var(--amber-deep)'),
              boxShadow:'0 6px 14px rgba(0,0,0,0.35)',
              display:'flex', alignItems:'center', justifyContent:'center',
              border:'2.5px solid rgba(255,255,255,0.92)',
            }}>
              <span style={{ transform:'rotate(45deg)', color:'#fff', fontWeight:800, fontSize: isActive?14:11,
                fontFamily:'var(--display)' }}>{s.score}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

Object.assign(window, { ScoreBadge, AccessTag, WeatherChip, MapCanvas, scoreClass, scoreBg });
