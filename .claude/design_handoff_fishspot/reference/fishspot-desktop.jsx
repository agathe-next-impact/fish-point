/* ============================================================
   FishSpot — DESKTOP web app screens
   Exposes: DesktopApp (render inside <ChromeWindow>)
   ============================================================ */
const { useState: dUseState, useEffect: dUseEffect } = React;

/* ── top navigation ──────────────────────────────────────── */
function TopNav({ page, setPage }) {
  const links = [['map','Carte'],['spots','Spots'],['explore','Par département'],['regs','Réglementation']];
  return (
    <div style={{ height:64, display:'flex', alignItems:'center', gap:28, padding:'0 26px',
      borderBottom:'1px solid var(--line)', background:'#fff', flexShrink:0, position:'relative', zIndex:20 }}>
      <button onClick={()=>setPage('home')} style={{ display:'flex', alignItems:'center', gap:9, background:'none', border:'none', cursor:'pointer' }}>
        <div style={{ width:34, height:34, borderRadius:10, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', boxShadow:'0 3px 10px rgba(14,140,127,0.35)' }}>
          <FSIcon name="fish" size={21} fill />
        </div>
        <span className="dsp" style={{ fontSize:20, fontWeight:800, color:'var(--ink)' }}>FishSpot</span>
      </button>
      <div style={{ display:'flex', gap:4, marginLeft:8 }}>
        {links.map(([id,label])=>(
          <button key={id} onClick={()=>setPage(id==='explore'||id==='regs'?'spots':id)} style={{
            background:'none', border:'none', cursor:'pointer', padding:'8px 13px', borderRadius:9,
            fontSize:14.5, fontWeight: page===id?700:600,
            color: (page===id) ? 'var(--accent-deep)':'var(--muted)',
            background: page===id ? 'var(--aqua-soft)':'transparent',
          }}>{label}</button>
        ))}
      </div>
      <div style={{ flex:1 }} />
      <button className="btn" style={{ background:'none', color:'var(--ink)', padding:'9px 14px', fontSize:14.5 }}>Connexion</button>
      <button className="btn btn-primary" style={{ padding:'10px 18px', fontSize:14.5 }}>Inscription</button>
    </div>
  );
}

/* ── filter rail (shared by map + spots) ─────────────────── */
function FilterRail({ compact = false }) {
  const Section = ({ title, children }) => (
    <div style={{ marginBottom:22 }}>
      <div style={{ fontSize:12, fontWeight:700, color:'var(--faint)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:10 }}>{title}</div>
      {children}
    </div>
  );
  const [water,setWater] = dUseState(['Lac']);
  const [fish,setFish] = dUseState(['Carnassier']);
  const toggle = (arr,set,v)=> set(arr.includes(v)?arr.filter(x=>x!==v):[...arr,v]);
  return (
    <div className="fs-scroll" style={{ width: compact?248:268, flexShrink:0, borderRight:'1px solid var(--line)',
      padding:'22px 20px', overflowY:'auto', background:'#fbfdfc' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <span className="dsp" style={{ fontSize:18, fontWeight:700 }}>Filtres</span>
        <button style={{ background:'none', border:'none', color:'var(--teal)', fontSize:13, fontWeight:700, cursor:'pointer' }}>Réinitialiser</button>
      </div>
      <Section title="Département">
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 13px', borderRadius:11, boxShadow:'inset 0 0 0 1.5px var(--line)', fontSize:14, color:'var(--ink)', cursor:'pointer' }}>
          <FSIcon name="pin" size={16} style={{ color:'var(--teal)' }} sw={2} />
          <span style={{ flex:1, fontWeight:600 }}>Tous les départements</span>
          <FSIcon name="chevD" size={16} style={{ color:'var(--faint)' }} />
        </div>
      </Section>
      <Section title="Type d'eau">
        <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
          {WATER_TYPES.map(w=>(
            <span key={w} className={water.includes(w)?'chip on':'chip'} onClick={()=>toggle(water,setWater,w)} style={{ fontSize:12.5 }}>{w}</span>
          ))}
        </div>
      </Section>
      <Section title="Type de poisson">
        <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
          {FISH_TYPES.map(f=>(
            <span key={f} className={fish.includes(f)?'chip on':'chip'} onClick={()=>toggle(fish,setFish,f)} style={{ fontSize:12.5 }}>{f}</span>
          ))}
        </div>
      </Section>
      <Section title="Accès">
        <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
          {['Libre','Carte de pêche','AAPPMA spécifique','Payant'].map((a,i)=>(
            <label key={a} style={{ display:'flex', alignItems:'center', gap:10, fontSize:13.5, color:'var(--ink)', cursor:'pointer' }}>
              <span style={{ width:19, height:19, borderRadius:6, boxShadow: i<2?'none':'inset 0 0 0 1.5px var(--line)',
                background: i<2?'var(--teal)':'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {i<2 && <FSIcon name="shield" size={12} style={{ color:'#fff' }} sw={3} />}
              </span>
              {a}
            </label>
          ))}
        </div>
      </Section>
      <Section title="Score minimum">
        <input type="range" min="0" max="100" defaultValue="70" style={{ width:'100%', accentColor:'var(--teal)' }} />
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--faint)', marginTop:4 }}>
          <span>0</span><span style={{ color:'var(--teal)', fontWeight:700 }}>70+</span><span>100</span>
        </div>
      </Section>
    </div>
  );
}

/* ── desktop spot card ───────────────────────────────────── */
function SpotCardD({ s, onClick, delay = 0 }) {
  return (
    <button onClick={onClick} className="card anim-rise" style={{ textAlign:'left', border:'none', cursor:'pointer', padding:0, animationDelay:`${delay}s`, transition:'transform .2s ease, box-shadow .2s ease' }}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='var(--sh-md)';}}
      onMouseLeave={e=>{e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='';}}>
      <div style={{ height:140, background:s.photo, position:'relative' }}>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,transparent 50%,rgba(0,0,0,0.28))' }} />
        <div style={{ position:'absolute', top:12, right:12 }}><ScoreBadge value={s.score} size="sm" /></div>
        <div style={{ position:'absolute', left:12, bottom:10 }}><AccessTag access={s.access} dark /></div>
      </div>
      <div style={{ padding:'13px 15px 15px' }}>
        <div className="dsp" style={{ fontSize:17, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.name}</div>
        <div style={{ fontSize:13, color:'var(--muted)', margin:'3px 0 10px', display:'flex', alignItems:'center', gap:6 }}>
          <FSIcon name="pin" size={14} sw={2} style={{ color:'var(--faint)' }} />{s.dept}
        </div>
        <div style={{ display:'flex', gap:7 }}>
          <span className="chip" style={{ cursor:'default', fontSize:12, padding:'5px 10px', background:'var(--aqua-soft)', color:'var(--teal-deep)', boxShadow:'none' }}>{s.water}</span>
          <span className="chip" style={{ cursor:'default', fontSize:12, padding:'5px 10px', boxShadow:'inset 0 0 0 1.5px var(--line)' }}>{s.fish}</span>
        </div>
      </div>
    </button>
  );
}

/* ── LANDING ─────────────────────────────────────────────── */
function DHome({ setPage }) {
  const feats = [
    ['map','Carte Interactive','Des milliers de spots géolocalisés avec filtres avancés et vue satellite.'],
    ['shield','Réglementation','Données réglementaires à jour par département, espèce et cours d\u2019eau.'],
    ['book','Carnet de Prises','Loggez vos prises avec photos, conditions météo et statistiques.'],
    ['users','Communauté','Partagez vos spots, avis et échangez avec d\u2019autres pêcheurs.'],
  ];
  return (
    <div className="fs-scroll" style={{ position:'absolute', inset:0, overflowY:'auto', background:'var(--paper)' }}>
      {/* hero */}
      <div style={{ position:'relative', background:'linear-gradient(160deg,#0c4350 0%,#08303a 60%,#06262e 100%)', color:'#fff', overflow:'hidden' }}>
        {/* decorative map behind */}
        <div style={{ position:'absolute', right:-40, top:0, bottom:0, width:'46%', opacity:.9 }}>
          <div style={{ position:'absolute', inset:0 }}><MapCanvas spots={SPOTS} active={'sc'} dark compact /></div>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,#08303a 0%,transparent 55%)' }} />
        </div>
        <div style={{ position:'relative', padding:'76px 56px 86px', maxWidth:640 }}>
          <span className="anim-rise" style={{ display:'inline-flex', alignItems:'center', gap:7, fontSize:13, fontWeight:700,
            background:'rgba(95,201,184,0.18)', color:'var(--aqua)', padding:'7px 14px', borderRadius:99, marginBottom:22 }}>
            <FSIcon name="leaf" size={15} sw={2} /> Spots autorisés vérifiés en France
          </span>
          <h1 className="dsp anim-rise" style={{ fontSize:54, fontWeight:800, lineHeight:1.02, margin:'0 0 18px', animationDelay:'.06s' }}>
            Trouvez les meilleurs spots de pêche en France
          </h1>
          <p className="anim-rise" style={{ fontSize:18, lineHeight:1.5, opacity:.86, margin:'0 0 30px', maxWidth:520, animationDelay:'.12s' }}>
            Carte interactive, réglementation en temps réel, conditions météo et carnet de prises. Rejoignez la communauté des pêcheurs.
          </p>
          <div className="anim-rise" style={{ display:'flex', gap:13, animationDelay:'.18s' }}>
            <button className="btn btn-primary" style={{ padding:'14px 24px', fontSize:16 }} onClick={()=>setPage('map')}>
              <FSIcon name="map" size={19} sw={2} /> Voir la carte
            </button>
            <button className="btn btn-ghost" style={{ padding:'14px 24px', fontSize:16 }}>Créer un compte gratuit</button>
          </div>
          <div className="anim-rise" style={{ display:'flex', gap:30, marginTop:42, animationDelay:'.24s' }}>
            {[['12 400+','spots cartographiés'],['98','départements'],['45 000','pêcheurs actifs']].map(([a,b])=>(
              <div key={b}>
                <div className="dsp" style={{ fontSize:28, fontWeight:800, color:'var(--aqua)' }}>{a}</div>
                <div style={{ fontSize:13, opacity:.7 }}>{b}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* features */}
      <div style={{ padding:'64px 56px 20px' }}>
        <div style={{ textAlign:'center', maxWidth:640, margin:'0 auto 44px' }}>
          <h2 className="dsp" style={{ fontSize:36, fontWeight:800, margin:'0 0 12px' }}>Tout ce dont vous avez besoin pour pêcher sereinement</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
          {feats.map(([ic,t,d],i)=>(
            <div key={t} className="card anim-rise" style={{ padding:'26px 22px', boxShadow:'var(--sh-sm)', animationDelay:`${i*.08}s` }}>
              <div style={{ width:50, height:50, borderRadius:14, background:'var(--aqua-soft)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--teal-deep)', marginBottom:18 }}>
                <FSIcon name={ic} size={26} sw={1.9} />
              </div>
              <div className="dsp" style={{ fontSize:19, fontWeight:700, marginBottom:8 }}>{t}</div>
              <p style={{ fontSize:14.5, lineHeight:1.5, color:'var(--muted)', margin:0 }}>{d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding:'40px 56px 64px' }}>
        <div style={{ position:'relative', overflow:'hidden', borderRadius:'var(--r-xl)', background:'linear-gradient(120deg,var(--teal-deep),var(--teal))', color:'#fff', padding:'52px 56px', textAlign:'center' }}>
          <div style={{ position:'absolute', right:-30, top:-30, opacity:.12 }}><FSIcon name="fish" size={220} fill /></div>
          <h2 className="dsp" style={{ fontSize:34, fontWeight:800, margin:'0 0 12px', position:'relative' }}>Prêt à découvrir de nouveaux spots ?</h2>
          <p style={{ fontSize:17, opacity:.9, margin:'0 0 26px', position:'relative' }}>Rejoignez des milliers de pêcheurs qui utilisent FishSpot pour trouver les meilleurs coins.</p>
          <button className="btn" style={{ background:'#fff', color:'var(--teal-deep)', padding:'14px 28px', fontSize:16, position:'relative' }} onClick={()=>setPage('map')}>Explorer la carte</button>
        </div>
      </div>

      {/* footer */}
      <div style={{ background:'#06262e', color:'rgba(255,255,255,0.7)', padding:'44px 56px 28px' }}>
        <div style={{ display:'flex', gap:60 }}>
          <div style={{ maxWidth:280 }}>
            <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:14 }}>
              <div style={{ width:30, height:30, borderRadius:9, background:'var(--teal)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}><FSIcon name="fish" size={18} fill /></div>
              <span className="dsp" style={{ fontSize:18, fontWeight:800, color:'#fff' }}>FishSpot</span>
            </div>
            <p style={{ fontSize:13.5, lineHeight:1.5, margin:0 }}>Les meilleurs spots de pêche autorisés en France. Carte interactive, réglementation et conditions en temps réel.</p>
          </div>
          {[['Explorer',['Carte','Spots','Par département','Réglementation']],['Communauté',['Feed','Classements','Ajouter un spot']],['Légal',['Mentions légales','Confidentialité','CGU','Contact']]].map(([h,items])=>(
            <div key={h}>
              <div style={{ fontSize:13, fontWeight:700, color:'#fff', marginBottom:12 }}>{h}</div>
              {items.map(it=>(<div key={it} style={{ fontSize:13.5, marginBottom:8, cursor:'pointer' }}>{it}</div>))}
            </div>
          ))}
        </div>
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.1)', marginTop:32, paddingTop:18, fontSize:12.5 }}>© 2026 FishSpot. Tous droits réservés.</div>
      </div>
    </div>
  );
}

/* ── MAP page ────────────────────────────────────────────── */
function DMap({ setPage }) {
  const [active, setActive] = dUseState('sc');
  const s = SPOTS.find(x=>x.id===active);
  return (
    <div style={{ position:'absolute', inset:0, display:'flex' }}>
      <FilterRail />
      <div style={{ flex:1, position:'relative' }}>
        <MapCanvas spots={SPOTS} active={active} onPick={setActive} dark play />
        {/* search overlay */}
        <div style={{ position:'absolute', top:18, left:20, right:20, display:'flex', gap:12, zIndex:25 }} className="anim-rise">
          <div style={{ flex:1, maxWidth:420, display:'flex', alignItems:'center', gap:10, background:'#fff', borderRadius:13, padding:'12px 16px', boxShadow:'var(--sh-md)' }}>
            <FSIcon name="search" size={19} style={{ color:'var(--faint)' }} />
            <span style={{ color:'var(--faint)', fontSize:14.5 }}>Rechercher un spot, une ville…</span>
          </div>
        </div>
        {/* active spot floating card */}
        {s && (
          <div key={s.id} className="anim-pop" style={{ position:'absolute', right:22, bottom:22, width:330, zIndex:45 }}>
            <div className="card" style={{ boxShadow:'var(--sh-lg)' }}>
              <div style={{ height:130, background:s.photo, position:'relative' }}>
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,transparent 45%,rgba(0,0,0,0.35))' }} />
                <div style={{ position:'absolute', top:12, right:12 }}><ScoreBadge value={s.score} /></div>
                <div style={{ position:'absolute', left:14, right:64, bottom:12, color:'#fff' }}>
                  <div className="dsp" style={{ fontSize:20, fontWeight:800, lineHeight:1.08, textShadow:'0 2px 8px rgba(0,0,0,0.35)' }}>{s.name}</div>
                  <div style={{ fontSize:12.5, opacity:.92, marginTop:3 }}>{s.dept}</div>
                </div>
              </div>
              <div style={{ padding:'14px 16px 16px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <AccessTag access={s.access} />
                  <span className="chip" style={{ cursor:'default', fontSize:12, padding:'5px 10px', background:'var(--aqua-soft)', color:'var(--teal-deep)', boxShadow:'none' }}>{s.water}</span>
                </div>
                <p style={{ fontSize:13.5, lineHeight:1.5, color:'var(--muted)', margin:'0 0 14px' }}>{s.desc}</p>
                <div style={{ display:'flex', gap:9 }}>
                  <button className="btn btn-primary" style={{ flex:1, padding:'11px', fontSize:14 }} onClick={()=>setPage('spots')}>Voir la fiche</button>
                  <button className="btn btn-outline" style={{ padding:'11px 14px', fontSize:14 }}><FSIcon name="heart" size={17} sw={2} /></button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── SPOTS list page ─────────────────────────────────────── */
function DSpots({ setPage }) {
  const [view, setView] = dUseState('grid');
  return (
    <div style={{ position:'absolute', inset:0, display:'flex' }}>
      <FilterRail />
      <div className="fs-scroll" style={{ flex:1, overflowY:'auto', background:'var(--paper)' }}>
        <div style={{ padding:'26px 30px 8px', display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
          <div>
            <h1 className="dsp" style={{ fontSize:32, fontWeight:800, margin:0 }}>Spots de pêche</h1>
            <div style={{ fontSize:14.5, color:'var(--muted)', marginTop:4 }}>8 spots correspondent à vos filtres</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <span style={{ fontSize:13.5, color:'var(--muted)', fontWeight:600 }}>Trier&nbsp;: Score</span>
            <div style={{ display:'flex', background:'#fff', borderRadius:10, padding:3, boxShadow:'inset 0 0 0 1.5px var(--line)' }}>
              {['grid','map'].map(v=>(
                <button key={v} onClick={()=>v==='map'?setPage('map'):setView(v)} style={{ border:'none', cursor:'pointer', padding:'7px 11px', borderRadius:8,
                  background: view===v?'var(--accent)':'transparent', color: view===v?'#fff':'var(--muted)' }}>
                  <FSIcon name={v==='grid'?'filter':'map'} size={17} sw={2} />
                </button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ padding:'18px 30px 40px', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
          {SPOTS.map((s,i)=>(<SpotCardD key={s.id} s={s} delay={i*0.05} onClick={()=>setPage('map')} />))}
        </div>
      </div>
    </div>
  );
}

/* ── Desktop app shell ───────────────────────────────────── */
function DesktopApp({ extPage, onState }) {
  const [page, setPage] = dUseState('home');
  dUseEffect(()=>{ if(extPage) setPage(extPage); }, [extPage]);
  dUseEffect(()=>{ onState && onState(page); }, [page]);

  let body;
  if (page==='home')      body = <DHome setPage={setPage} />;
  else if (page==='map')  body = <DMap setPage={setPage} />;
  else                    body = <DSpots setPage={setPage} />;

  return (
    <div className="fs-app" style={{ height:'100%', width:'100%', display:'flex', flexDirection:'column', background:'var(--paper)' }}>
      <TopNav page={page} setPage={setPage} />
      <div style={{ flex:1, position:'relative' }}>
        <div key={page} className="screen-enter" style={{ position:'absolute', inset:0 }}>{body}</div>
      </div>
    </div>
  );
}

window.DesktopApp = DesktopApp;
