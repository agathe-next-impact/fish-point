/* ============================================================
   FishSpot — MOBILE PWA screens
   Exposes: MobileApp  (render inside <IOSDevice>)
   ============================================================ */
const { useState: mUseState, useEffect: mUseEffect, useRef: mUseRef } = React;

/* status-bar clearance + tab-bar height */
const SB = 54;          /* status bar clearance */
const TABH = 84;        /* bottom tab bar height (incl. home indicator pad) */

/* ── bottom tab bar ──────────────────────────────────────── */
function TabBar({ tab, setTab }) {
  const items = [
    { id:'map',    label:'Carte',   icon:'map' },
    { id:'catches',label:'Prises',  icon:'fish' },
    { id:'add',    label:'',        icon:'plus', center:true },
    { id:'stats',  label:'Stats',   icon:'chart' },
    { id:'profile',label:'Profil',  icon:'user' },
  ];
  return (
    <div style={{
      position:'absolute', left:0, right:0, bottom:0, height:TABH, zIndex:40,
      paddingBottom:26, display:'flex', alignItems:'center', justifyContent:'space-around',
      background:'rgba(255,255,255,0.86)', backdropFilter:'blur(18px) saturate(180%)',
      WebkitBackdropFilter:'blur(18px) saturate(180%)',
      borderTop:'1px solid var(--line-soft)', boxShadow:'0 -6px 24px rgba(8,48,58,0.06)',
    }}>
      {items.map(it => {
        if (it.center) return (
          <button key={it.id} onClick={()=>setTab('add')} style={{
            width:54, height:54, borderRadius:18, border:'none', cursor:'pointer',
            background:'var(--accent)', color:'#fff', marginTop:-22,
            boxShadow:'0 8px 20px rgba(14,140,127,0.4)', display:'flex',
            alignItems:'center', justifyContent:'center', transition:'transform .15s ease',
          }}><FSIcon name="plus" size={26} sw={2.4} /></button>
        );
        const on = tab === it.id;
        return (
          <button key={it.id} onClick={()=>setTab(it.id)} style={{
            background:'none', border:'none', cursor:'pointer', display:'flex',
            flexDirection:'column', alignItems:'center', gap:3, width:58,
            color: on ? 'var(--accent)' : 'var(--faint)', transition:'color .15s ease',
          }}>
            <FSIcon name={it.icon} size={23} sw={on?2.2:1.9} fill={on && (it.icon==='fish')} />
            <span style={{ fontSize:11, fontWeight: on?700:600 }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── MAP screen ──────────────────────────────────────────── */
function MMap({ openSpot, active, setActive }) {
  const [sheet, setSheet] = mUseState(false); // expanded list
  const sorted = SPOTS.slice().sort((a,b)=>b.score-a.score);
  return (
    <div style={{ position:'absolute', inset:0 }}>
      <MapCanvas spots={SPOTS} active={active} onPick={(id)=>{setActive(id); setSheet(false);}} dark play compact />

      {/* search bar */}
      <div style={{ position:'absolute', top:SB, left:14, right:14, zIndex:25 }} className="anim-rise">
        <div style={{ display:'flex', alignItems:'center', gap:10, background:'#fff', borderRadius:14,
          padding:'13px 15px', boxShadow:'var(--sh-md)' }}>
          <FSIcon name="search" size={19} style={{ color:'var(--faint)' }} />
          <span style={{ color:'var(--faint)', fontSize:15, flex:1 }}>Rechercher un spot, une ville…</span>
          <div style={{ width:28, height:28, borderRadius:8, background:'var(--aqua-soft)',
            display:'flex', alignItems:'center', justifyContent:'center', color:'var(--teal-deep)' }}>
            <FSIcon name="filter" size={16} sw={2} />
          </div>
        </div>
        {/* quick filter chips */}
        <div className="fs-scroll" style={{ display:'flex', gap:8, marginTop:10, overflowX:'auto', paddingBottom:2 }}>
          {['À proximité','Carnassier','Score 80+','Accès libre'].map((c,i)=>(
            <span key={c} className={i===0?'chip on':'chip'} style={{ boxShadow: i===0?'none':'0 1px 4px rgba(8,48,58,0.12)' }}>{c}</span>
          ))}
        </div>
      </div>

      {/* locate button */}
      <button style={{ position:'absolute', right:14, bottom: sheet?'auto':148, top: sheet?SB+118:'auto', zIndex:25,
        width:46, height:46, borderRadius:14, border:'none', background:'#fff', cursor:'pointer',
        boxShadow:'var(--sh-md)', color:'var(--teal)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <FSIcon name="location" size={22} sw={2} />
      </button>

      {/* bottom sheet */}
      <div style={{
        position:'absolute', left:0, right:0, bottom:0, zIndex:36,
        background:'#fff', borderRadius:'24px 24px 0 0', boxShadow:'0 -10px 40px rgba(8,48,58,0.16)',
        transition:'transform .4s cubic-bezier(.2,.8,.3,1)',
        transform: sheet ? 'translateY(0)' : `translateY(calc(100% - ${TABH + 132}px))`,
        maxHeight:`calc(100% - ${SB+96}px)`, display:'flex', flexDirection:'column',
      }}>
        <div onClick={()=>setSheet(s=>!s)} style={{ padding:'12px 0 6px', cursor:'pointer', flexShrink:0 }}>
          <div style={{ width:40, height:5, borderRadius:99, background:'var(--line)', margin:'0 auto 12px' }} />
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px' }}>
            <div>
              <div className="dsp" style={{ fontSize:20, fontWeight:700 }}>8 spots à proximité</div>
              <div style={{ fontSize:13, color:'var(--muted)', marginTop:1 }}>Triés par score · rayon 30 km</div>
            </div>
            <FSIcon name="chevD" size={22} style={{ color:'var(--faint)', transform: sheet?'rotate(180deg)':'none', transition:'transform .3s' }} />
          </div>
        </div>
        <div className="fs-scroll" style={{ overflowY:'auto', padding:'8px 14px 110px' }}>
          {sorted.map((s,i)=>(
            <button key={s.id} onClick={()=>openSpot(s.id)} style={{
              display:'flex', gap:12, width:'100%', textAlign:'left', alignItems:'center',
              padding:'10px', border:'none', background: active===s.id?'var(--aqua-soft)':'transparent',
              borderRadius:16, cursor:'pointer', marginBottom:2, transition:'background .15s',
            }}>
              <div style={{ width:58, height:58, borderRadius:13, background:s.photo, flexShrink:0,
                position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,transparent 40%,rgba(0,0,0,0.25))' }} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:15.5, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.name}</div>
                <div style={{ fontSize:12.5, color:'var(--muted)', marginTop:2, display:'flex', gap:7, alignItems:'center' }}>
                  <span>{s.water}</span><span style={{opacity:.4}}>·</span><span>{s.dist}</span>
                </div>
                <div style={{ marginTop:6 }}><AccessTag access={s.access} /></div>
              </div>
              <ScoreBadge value={s.score} size="sm" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── SPOT DETAIL ─────────────────────────────────────────── */
function MSpotDetail({ id, back, loading }) {
  const s = SPOTS.find(x=>x.id===id) || SPOTS[0];
  const [liked, setLiked] = mUseState(false);
  return (
    <div className="fs-scroll" style={{ position:'absolute', inset:0, overflowY:'auto', background:'var(--paper)' }}>
      {/* hero */}
      <div style={{ position:'relative', height:300, background:s.photo }}>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,rgba(8,48,58,0.35) 0%,transparent 35%,rgba(8,48,58,0.55) 100%)' }} />
        <button onClick={back} style={{ position:'absolute', top:SB, left:16, width:40, height:40, borderRadius:'50%',
          border:'none', background:'rgba(255,255,255,0.9)', backdropFilter:'blur(8px)', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', color:'var(--ink)', boxShadow:'var(--sh-sm)' }}>
          <FSIcon name="chevL" size={22} sw={2.2} />
        </button>
        <button onClick={()=>setLiked(v=>!v)} style={{ position:'absolute', top:SB, right:16, width:40, height:40, borderRadius:'50%',
          border:'none', background:'rgba(255,255,255,0.9)', backdropFilter:'blur(8px)', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', color: liked?'#e0556a':'var(--ink)', boxShadow:'var(--sh-sm)', transition:'color .2s' }}>
          <FSIcon name="heart" size={20} fill={liked} sw={2.2} />
        </button>
        <div style={{ position:'absolute', left:20, right:20, bottom:18, color:'#fff' }}>
          <AccessTag access={s.access} dark />
          <div className="dsp" style={{ fontSize:30, fontWeight:800, marginTop:8, textShadow:'0 2px 10px rgba(0,0,0,0.3)' }}>{s.name}</div>
          <div style={{ fontSize:14, opacity:.92, marginTop:3, display:'flex', alignItems:'center', gap:6 }}>
            <FSIcon name="pin" size={15} sw={2} /> {s.dept}
          </div>
        </div>
      </div>

      <div style={{ padding:'18px 20px 40px' }}>
        {/* score + stats row */}
        <div style={{ display:'flex', gap:10, marginBottom:18 }}>
          {loading ? (
            <React.Fragment>
              <div className="sk" style={{ flex:1, height:74 }} />
              <div className="sk" style={{ flex:1, height:74 }} />
              <div className="sk" style={{ flex:1, height:74 }} />
            </React.Fragment>
          ) : (
            <React.Fragment>
              <div className="card anim-rise" style={{ flex:1, padding:'12px', boxShadow:'var(--sh-sm)', display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <span className={'dsp '+scoreClass(s.score)} style={{ fontSize:26, fontWeight:800 }}>{s.score}</span>
                <span style={{ fontSize:11.5, color:'var(--muted)', fontWeight:600 }}>Score spot</span>
              </div>
              <div className="card anim-rise" style={{ flex:1, padding:'12px', boxShadow:'var(--sh-sm)', display:'flex', flexDirection:'column', alignItems:'center', gap:4, animationDelay:'.06s' }}>
                <span className="dsp" style={{ fontSize:26, fontWeight:800, color:'var(--teal)' }}>{s.cat==='1ère catégorie'?'1ère':'2ème'}</span>
                <span style={{ fontSize:11.5, color:'var(--muted)', fontWeight:600 }}>Catégorie</span>
              </div>
              <div className="card anim-rise" style={{ flex:1, padding:'12px', boxShadow:'var(--sh-sm)', display:'flex', flexDirection:'column', alignItems:'center', gap:4, animationDelay:'.12s' }}>
                <FSIcon name="water" size={24} style={{ color:'var(--teal)' }} sw={2} />
                <span style={{ fontSize:11.5, color:'var(--muted)', fontWeight:600 }}>{s.water}</span>
              </div>
            </React.Fragment>
          )}
        </div>

        <p style={{ fontSize:15, lineHeight:1.55, color:'var(--ink)', margin:'0 0 18px' }}>{s.desc}</p>

        {/* species */}
        <div className="dsp" style={{ fontSize:17, fontWeight:700, marginBottom:10 }}>Espèces présentes</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:22 }}>
          {s.species.map(sp=>(
            <span key={sp} className="chip" style={{ cursor:'default', background:'var(--aqua-soft)', color:'var(--teal-deep)', boxShadow:'none' }}>
              <FSIcon name="fish" size={14} fill /> {sp}
            </span>
          ))}
        </div>

        {/* weather card */}
        <div className="card" style={{ padding:'16px 18px', marginBottom:22, boxShadow:'var(--sh-sm)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <span className="dsp" style={{ fontSize:16, fontWeight:700 }}>Conditions du jour</span>
            <span style={{ fontSize:12, color:'#1f9d6b', fontWeight:700, background:'rgba(31,157,107,0.12)', padding:'4px 10px', borderRadius:99 }}>Favorable</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <WeatherChip icon="sun" label="19°C" />
            <WeatherChip icon="wind" label="12 km/h" />
            <WeatherChip icon="water" label="Niveau bas" />
            <WeatherChip icon="clock" label="Aube ★" />
          </div>
        </div>

        {/* regulation */}
        <div className="card" style={{ padding:'16px 18px', marginBottom:24, boxShadow:'var(--sh-sm)', borderLeft:'4px solid var(--teal)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <FSIcon name="shield" size={18} style={{ color:'var(--teal)' }} />
            <span className="dsp" style={{ fontSize:16, fontWeight:700 }}>Réglementation</span>
          </div>
          <div style={{ fontSize:14, color:'var(--muted)', lineHeight:1.5 }}>
            Carte de pêche obligatoire · Ouverture carnassier en cours · Maille brochet 60 cm · No-kill recommandé.
          </div>
        </div>

        {/* CTA */}
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn btn-primary" style={{ flex:1 }}><FSIcon name="map" size={18} sw={2} /> Itinéraire</button>
          <button className="btn btn-soft" style={{ flex:1 }}><FSIcon name="plus" size={18} sw={2.2} /> Noter une prise</button>
        </div>
      </div>
    </div>
  );
}

/* ── PRISES (catches) ────────────────────────────────────── */
function MCatches() {
  return (
    <div className="fs-scroll" style={{ position:'absolute', inset:0, overflowY:'auto', background:'var(--paper)', paddingBottom:TABH+10 }}>
      <div style={{ paddingTop:SB+8, padding:`${SB+8}px 20px 16px` }}>
        <div className="dsp" style={{ fontSize:30, fontWeight:800 }}>Mes prises</div>
        <div style={{ fontSize:14, color:'var(--muted)', marginTop:2 }}>Saison 2026 · 24 prises enregistrées</div>
      </div>
      {/* mini summary */}
      <div style={{ display:'flex', gap:10, padding:'0 20px 18px' }}>
        {[['24','Prises'],['4,1 kg','Record'],['7','Espèces']].map(([a,b],i)=>(
          <div key={b} className="card anim-rise" style={{ flex:1, padding:'12px', textAlign:'center', boxShadow:'var(--sh-sm)', animationDelay:`${i*.06}s` }}>
            <div className="dsp" style={{ fontSize:21, fontWeight:800, color:'var(--teal)' }}>{a}</div>
            <div style={{ fontSize:11.5, color:'var(--muted)', fontWeight:600, marginTop:2 }}>{b}</div>
          </div>
        ))}
      </div>
      <div style={{ padding:'0 16px' }}>
        {CATCHES.map((c,i)=>(
          <div key={c.id} className="card anim-rise" style={{ display:'flex', gap:14, padding:'12px', marginBottom:12, boxShadow:'var(--sh-sm)', animationDelay:`${i*.07}s` }}>
            <div style={{ width:84, height:84, borderRadius:14, background:c.photo, flexShrink:0, position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,transparent,rgba(0,0,0,0.3))' }} />
              <span style={{ position:'absolute', left:8, bottom:6, color:'#fff', fontSize:11, fontWeight:700 }}>{c.date}</span>
            </div>
            <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', justifyContent:'center' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span className="dsp" style={{ fontSize:18, fontWeight:700 }}>{c.fish}</span>
                <span style={{ display:'flex', gap:5, alignItems:'center', color:'var(--amber-deep)', fontSize:13, fontWeight:700 }}>
                  <FSIcon name="ruler" size={15} sw={2} />{c.size}
                </span>
              </div>
              <div style={{ fontSize:13, color:'var(--muted)', margin:'3px 0 8px' }}>{c.spot}</div>
              <div style={{ display:'flex', gap:14 }}>
                <WeatherChip icon={c.weather} label={c.temp} />
                <WeatherChip icon="fish" label={c.weight} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── ADD CATCH ───────────────────────────────────────────── */
function MAddCatch({ done }) {
  const [step] = mUseState(0);
  const [fish, setFish] = mUseState('Brochet');
  const [size, setSize] = mUseState(72);
  const fishes = ['Brochet','Sandre','Black-bass','Truite','Carpe','Bar'];
  return (
    <div className="fs-scroll" style={{ position:'absolute', inset:0, overflowY:'auto', background:'var(--paper)', paddingBottom:TABH+20 }}>
      <div style={{ padding:`${SB+8}px 20px 8px`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <button onClick={done} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:15, fontWeight:600, cursor:'pointer' }}>Annuler</button>
        <span className="dsp" style={{ fontSize:18, fontWeight:700 }}>Nouvelle prise</span>
        <span style={{ width:48 }} />
      </div>

      <div style={{ padding:'10px 20px' }}>
        {/* photo dropzone */}
        <div className="anim-rise" style={{ height:170, borderRadius:18, background:'var(--aqua-soft)',
          border:'2px dashed rgba(14,140,127,0.4)', display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', gap:8, color:'var(--teal-deep)', marginBottom:20 }}>
          <FSIcon name="camera" size={34} sw={1.8} />
          <span style={{ fontSize:14, fontWeight:600 }}>Ajouter une photo</span>
        </div>

        {/* fish select */}
        <label style={{ fontSize:13, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.04em' }}>Espèce</label>
        <div className="fs-scroll" style={{ display:'flex', gap:8, overflowX:'auto', margin:'10px 0 20px', paddingBottom:2 }}>
          {fishes.map(f=>(
            <button key={f} onClick={()=>setFish(f)} className={fish===f?'chip on':'chip'} style={{ flexShrink:0, fontSize:14, padding:'9px 15px' }}>{f}</button>
          ))}
        </div>

        {/* size slider */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8 }}>
          <label style={{ fontSize:13, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.04em' }}>Taille</label>
          <span className="dsp" style={{ fontSize:22, fontWeight:800, color:'var(--teal)' }}>{size} cm</span>
        </div>
        <input type="range" min="10" max="120" value={size} onChange={e=>setSize(+e.target.value)}
          style={{ width:'100%', accentColor:'var(--teal)', marginBottom:22 }} />

        {/* spot picker */}
        <label style={{ fontSize:13, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.04em' }}>Spot</label>
        <div className="card" style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', marginTop:10, marginBottom:20, boxShadow:'var(--sh-sm)' }}>
          <div style={{ width:40, height:40, borderRadius:11, background:SPOTS[0].photo }} />
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:15 }}>Lac de Sainte-Croix</div>
            <div style={{ fontSize:12.5, color:'var(--muted)' }}>04 · Alpes-de-Haute-Provence</div>
          </div>
          <FSIcon name="chevron" size={20} style={{ color:'var(--faint)' }} />
        </div>

        {/* auto weather */}
        <div className="card" style={{ padding:'14px 16px', marginBottom:24, boxShadow:'var(--sh-sm)', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:42, height:42, borderRadius:11, background:'rgba(242,169,59,0.16)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--amber-deep)' }}>
            <FSIcon name="sun" size={22} sw={2} />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:14 }}>Météo capturée automatiquement</div>
            <div style={{ fontSize:12.5, color:'var(--muted)' }}>19°C · Ensoleillé · Vent 12 km/h</div>
          </div>
        </div>

        <button onClick={done} className="btn btn-primary" style={{ width:'100%', padding:'15px' }}>
          Enregistrer la prise
        </button>
      </div>
    </div>
  );
}

/* ── STATS (dashboard) ───────────────────────────────────── */
function MStats() {
  const bars = [40,65,30,80,55,92,70];
  const days = ['L','M','M','J','V','S','D'];
  return (
    <div className="fs-scroll" style={{ position:'absolute', inset:0, overflowY:'auto', background:'var(--paper)', paddingBottom:TABH+10 }}>
      <div style={{ padding:`${SB+8}px 20px 12px` }}>
        <div className="dsp" style={{ fontSize:30, fontWeight:800 }}>Statistiques</div>
        <div style={{ fontSize:14, color:'var(--muted)', marginTop:2 }}>Votre saison en chiffres</div>
      </div>
      <div style={{ padding:'0 20px' }}>
        <div className="card anim-rise" style={{ padding:'18px', marginBottom:16, boxShadow:'var(--sh-sm)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <span className="dsp" style={{ fontSize:16, fontWeight:700 }}>Prises cette semaine</span>
            <span style={{ fontSize:13, color:'#1f9d6b', fontWeight:700 }}>+18%</span>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:10, height:120 }}>
            {bars.map((h,i)=>(
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:7 }}>
                <div style={{ width:'100%', height:`${h}%`, borderRadius:7, background: i===5?'var(--teal)':'var(--aqua-soft)',
                  transformOrigin:'bottom', animation:'rise .6s cubic-bezier(.2,.8,.3,1) both', animationDelay:`${i*.06}s` }} />
                <span style={{ fontSize:11, color:'var(--faint)', fontWeight:600 }}>{days[i]}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', gap:12, marginBottom:16 }}>
          {[['trophy','Record','Brochet 82 cm'],['fish','Top espèce','Carnassier']].map(([ic,a,b],i)=>(
            <div key={a} className="card anim-rise" style={{ flex:1, padding:'16px', boxShadow:'var(--sh-sm)', animationDelay:`${i*.08}s` }}>
              <div style={{ width:40, height:40, borderRadius:11, background:'var(--aqua-soft)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--teal-deep)', marginBottom:10 }}>
                <FSIcon name={ic} size={21} sw={2} fill={ic==='fish'} />
              </div>
              <div style={{ fontSize:12.5, color:'var(--muted)', fontWeight:600 }}>{a}</div>
              <div className="dsp" style={{ fontSize:16, fontWeight:700, marginTop:2 }}>{b}</div>
            </div>
          ))}
        </div>
        <div className="card anim-rise" style={{ padding:'18px', boxShadow:'var(--sh-sm)' }}>
          <span className="dsp" style={{ fontSize:16, fontWeight:700 }}>Spots favoris</span>
          {SPOTS.slice(0,3).map((s,i)=>(
            <div key={s.id} style={{ display:'flex', alignItems:'center', gap:12, marginTop:14 }}>
              <span className="dsp" style={{ fontSize:15, fontWeight:800, color:'var(--faint)', width:18 }}>{i+1}</span>
              <div style={{ width:34, height:34, borderRadius:9, background:s.photo }} />
              <span style={{ flex:1, fontWeight:600, fontSize:14 }}>{s.name}</span>
              <ScoreBadge value={s.score} size="sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── PROFILE ─────────────────────────────────────────────── */
function MProfile() {
  return (
    <div className="fs-scroll" style={{ position:'absolute', inset:0, overflowY:'auto', background:'var(--paper)', paddingBottom:TABH+10 }}>
      <div style={{ background:'linear-gradient(160deg,#0c4350,#08303a)', padding:`${SB+18}px 20px 26px`, color:'#fff', borderRadius:'0 0 26px 26px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ width:68, height:68, borderRadius:'50%', background:'linear-gradient(135deg,var(--aqua),var(--teal))',
            display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--display)', fontSize:26, fontWeight:800, color:'#fff', border:'3px solid rgba(255,255,255,0.25)' }}>JL</div>
          <div>
            <div className="dsp" style={{ fontSize:24, fontWeight:800 }}>Julien Lambert</div>
            <div style={{ fontSize:13.5, opacity:.8, marginTop:2, display:'flex', alignItems:'center', gap:6 }}>
              <FSIcon name="pin" size={14} sw={2} /> Annecy · Membre depuis 2024
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:24, marginTop:20 }}>
          {[['24','Prises'],['12','Spots'],['340','Points']].map(([a,b])=>(
            <div key={b}>
              <div className="dsp" style={{ fontSize:22, fontWeight:800 }}>{a}</div>
              <div style={{ fontSize:12, opacity:.7 }}>{b}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding:'18px 16px' }}>
        {[['fish','Mes prises','24'],['pin','Mes spots','12 enregistrés'],['shield','Carte de pêche','Valide 2026'],['bell','Notifications',''],['download','Mode hors-ligne','PWA']].map(([ic,a,b])=>(
          <div key={a} className="card" style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', marginBottom:10, boxShadow:'var(--sh-sm)' }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'var(--aqua-soft)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--teal-deep)' }}>
              <FSIcon name={ic} size={20} sw={2} />
            </div>
            <span style={{ flex:1, fontWeight:600, fontSize:15 }}>{a}</span>
            {b && <span style={{ fontSize:13, color:'var(--muted)', fontWeight:600 }}>{b}</span>}
            <FSIcon name="chevron" size={18} style={{ color:'var(--faint)' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Mobile App shell ────────────────────────────────────── */
function MobileApp({ extTab, extSpot, onState }) {
  const [tab, setTab] = mUseState('map');
  const [spot, setSpot] = mUseState(null);     // open detail id
  const [active, setActive] = mUseState('sc');  // active map pin
  const [loading, setLoading] = mUseState(false);

  // external control (self-play tour)
  mUseEffect(()=>{ if(extTab){ setSpot(null); setTab(extTab); } }, [extTab]);
  mUseEffect(()=>{ if(extSpot!==undefined && extSpot!==null){ openSpot(extSpot); } else if(extSpot===null){ setSpot(null); } }, [extSpot]);

  function openSpot(id){
    if(!id){ setSpot(null); return; }
    setActive(id); setSpot(id); setLoading(true);
    setTimeout(()=>setLoading(false), 700);
  }
  function changeTab(t){ setSpot(null); setTab(t); }

  const dark = tab==='map' && !spot;
  mUseEffect(()=>{ onState && onState({ tab, spot }); }, [tab, spot]);

  let screen;
  if (spot) screen = <MSpotDetail id={spot} back={()=>setSpot(null)} loading={loading} />;
  else if (tab==='map')     screen = <MMap openSpot={openSpot} active={active} setActive={setActive} />;
  else if (tab==='catches') screen = <MCatches />;
  else if (tab==='add')     screen = <MAddCatch done={()=>changeTab('catches')} />;
  else if (tab==='stats')   screen = <MStats />;
  else if (tab==='profile') screen = <MProfile />;

  return (
    <IOSDevice dark={dark}>
      <div className="fs-app" style={{ position:'relative', height:'100%', width:'100%', overflow:'hidden', background: dark?'#08303a':'var(--paper)' }}>
        <div key={(spot||tab)} className="screen-enter" style={{ position:'absolute', inset:0 }}>
          {screen}
        </div>
        {!spot && tab!=='add' && <TabBar tab={tab} setTab={changeTab} />}
      </div>
    </IOSDevice>
  );
}

window.MobileApp = MobileApp;
