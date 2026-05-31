/* ============================================================
   FishSpot — icon set (inline SVG) + mock data
   Exposes to window: FSIcon, SPOTS, CATCHES, WATER_TYPES, FISH_TYPES, ACCESS_TYPES
   ============================================================ */

// Single icon component. stroke-based, inherits currentColor.
function FSIcon({ name, size = 22, sw = 1.9, style = {}, fill = false }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    // fish silhouette
    fish: <g><path d="M3 12c3-4 7-6 11-6 4 0 7 2 8 6-1 4-4 6-8 6-4 0-8-2-11-6z" {...p} fill={fill?'currentColor':'none'} stroke={fill?'none':'currentColor'} /><path d="M14 6l4-3v6M14 18l4 3v-6" {...p} fill={fill?'currentColor':'none'} stroke={fill?'none':'currentColor'} /><circle cx="7.5" cy="11" r="0.6" fill={fill?'#fff':'currentColor'} stroke="none" /></g>,
    pin: <g><path d="M12 21s7-6.4 7-12a7 7 0 10-14 0c0 5.6 7 12 7 12z" {...p} fill={fill?'currentColor':'none'} stroke={fill?'none':'currentColor'} /><circle cx="12" cy="9" r="2.4" fill={fill?'#fff':'none'} stroke={fill?'none':'currentColor'} {...(fill?{}:p)} /></g>,
    map: <g><path d="M9 4L3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4z" {...p} /><path d="M9 4v14M15 6v14" {...p} /></g>,
    water: <g><path d="M3 8c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2" {...p} /><path d="M3 13c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2" {...p} /><path d="M3 18c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2" {...p} /></g>,
    book: <g><path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3V4z" {...p} /><path d="M5 4a3 3 0 00-1 6" {...p} /></g>,
    users: <g><circle cx="9" cy="8" r="3" {...p} /><path d="M3.5 19a5.5 5.5 0 0111 0" {...p} /><path d="M16 5.5a3 3 0 010 5.8M16.5 19c0-2-1-3.7-2.5-4.7" {...p} /></g>,
    shield: <g><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" {...p} /><path d="M9 12l2 2 4-4" {...p} /></g>,
    plus: <g><path d="M12 5v14M5 12h14" {...p} /></g>,
    chart: <g><path d="M4 20V4" {...p} /><path d="M4 20h16" {...p} /><rect x="7" y="11" width="3" height="6" rx="1" {...p} /><rect x="12.5" y="7" width="3" height="10" rx="1" {...p} /><rect x="18" y="13" width="3" height="4" rx="1" {...p} /></g>,
    user: <g><circle cx="12" cy="8" r="3.5" {...p} /><path d="M5 20a7 7 0 0114 0" {...p} /></g>,
    search: <g><circle cx="11" cy="11" r="6.5" {...p} /><path d="M16 16l4 4" {...p} /></g>,
    filter: <g><path d="M3 5h18l-7 8v5l-4 2v-7L3 5z" {...p} /></g>,
    star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5z" {...p} fill={fill?'currentColor':'none'} stroke={fill?'none':'currentColor'} />,
    heart: <path d="M12 20s-7-4.6-9.2-9C1.5 8.3 2.8 5 6 5c2 0 3.2 1.3 4 2.5C10.8 6.3 12 5 14 5c3.2 0 4.5 3.3 3.2 6-2.2 4.4-5.2 9-5.2 9z" {...p} fill={fill?'currentColor':'none'} stroke={fill?'none':'currentColor'} />,
    chevron: <path d="M9 6l6 6-6 6" {...p} />,
    chevL: <path d="M15 6l-6 6 6 6" {...p} />,
    chevD: <path d="M6 9l6 6 6-6" {...p} />,
    close: <path d="M6 6l12 12M18 6L6 18" {...p} />,
    camera: <g><rect x="3" y="7" width="18" height="13" rx="3" {...p} /><circle cx="12" cy="13.5" r="3.5" {...p} /><path d="M8 7l1.5-3h5L16 7" {...p} /></g>,
    cloud: <g><path d="M7 18a4 4 0 010-8 5 5 0 019.6 1.5A3.5 3.5 0 0117 18H7z" {...p} /></g>,
    sun: <g><circle cx="12" cy="12" r="4" {...p} /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19" {...p} /></g>,
    thermo: <g><path d="M10 14V5a2 2 0 014 0v9a4 4 0 11-4 0z" {...p} /></g>,
    wind: <g><path d="M3 8h11a3 3 0 10-3-3" {...p} /><path d="M3 13h15a3 3 0 11-3 3" {...p} /></g>,
    location: <g><circle cx="12" cy="12" r="3" {...p} /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" {...p} /></g>,
    clock: <g><circle cx="12" cy="12" r="8.5" {...p} /><path d="M12 7.5V12l3 2" {...p} /></g>,
    trophy: <g><path d="M7 4h10v3a5 5 0 01-10 0V4z" {...p} /><path d="M7 5H4v1a3 3 0 003 3M17 5h3v1a3 3 0 01-3 3M9 14h6v3H9zM8 20h8" {...p} /></g>,
    ruler: <g><rect x="3" y="8" width="18" height="8" rx="2" {...p} /><path d="M7 8v3M11 8v4M15 8v3M19 8v4" {...p} /></g>,
    download: <g><path d="M12 4v10M8 11l4 3 4-3" {...p} /><path d="M5 19h14" {...p} /></g>,
    bell: <g><path d="M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6z" {...p} /><path d="M10 19a2 2 0 004 0" {...p} /></g>,
    home: <g><path d="M4 11l8-7 8 7" {...p} /><path d="M6 10v9h12v-9" {...p} /></g>,
    leaf: <g><path d="M5 19C4 12 9 5 19 5c0 10-7 15-14 14z" {...p} /><path d="M5 19c4-5 7-7 11-9" {...p} /></g>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
      {paths[name] || null}
    </svg>
  );
}

const WATER_TYPES = ['Rivière', 'Lac', 'Étang', 'Mer', 'Canal', 'Ruisseau'];
const FISH_TYPES  = ['Carnassier', 'Salmonidé', 'Cyprinidé', 'Silure', 'Marin', 'Crustacé', 'Autre'];
const ACCESS_TYPES = ['Libre', 'Carte de pêche', 'AAPPMA spécifique', 'Payant', 'Membres uniquement', 'Restreint', 'Privé'];

// Gradient backgrounds used as photo placeholders (water moods)
const PHOTOS = {
  alpine:  'linear-gradient(150deg, #1f6f7e 0%, #2c97a3 45%, #7fc9c2 100%)',
  forest:  'linear-gradient(150deg, #1d5e4f 0%, #2f8466 50%, #79b98f 100%)',
  river:   'linear-gradient(150deg, #2a6e86 0%, #4f9bb0 55%, #a7d6cf 100%)',
  sea:     'linear-gradient(150deg, #143f5e 0%, #2e6c92 50%, #6fb0c4 100%)',
  pond:    'linear-gradient(150deg, #4a6a3a 0%, #6f9a55 55%, #b9cf8a 100%)',
  canal:   'linear-gradient(150deg, #3a5a63 0%, #5b8a8a 55%, #9fc0b4 100%)',
  dusk:    'linear-gradient(150deg, #1b4d57 0%, #b2722e 120%)',
};

// x/y are % positions on the stylized map canvas
const SPOTS = [
  { id:'sc', name:'Lac de Sainte-Croix', water:'Lac', fish:'Carnassier', dept:'04 · Alpes-de-Haute-Provence', region:'Verdon', access:'Carte de pêche', cat:'2ème catégorie', score:92, dist:'2,4 km', photo:PHOTOS.alpine, x:74, y:73, species:['Brochet','Perche','Sandre'], desc:"Eaux turquoise au cœur des gorges du Verdon. Spot mythique pour le carnassier en float-tube." },
  { id:'an', name:"Lac d'Annecy", water:'Lac', fish:'Salmonidé', dept:'74 · Haute-Savoie', region:'Savoie', access:'Carte de pêche', cat:'2ème catégorie', score:90, dist:'5,1 km', photo:PHOTOS.alpine, x:78, y:50, species:['Omble chevalier','Truite','Féra'], desc:"L'un des lacs les plus purs d'Europe. Pêche à la traîne réputée pour l'omble." },
  { id:'ga', name:'Le Gardon', water:'Rivière', fish:'Salmonidé', dept:'30 · Gard', region:'Occitanie', access:'1ère catégorie', cat:'1ère catégorie', score:88, dist:'12 km', photo:PHOTOS.river, x:64, y:74, species:['Truite fario','Barbeau'], desc:"Rivière vive et limpide, idéale pour la pêche à la mouche au lever du jour." },
  { id:'do', name:'La Dordogne', water:'Rivière', fish:'Carnassier', dept:'24 · Dordogne', region:'Nouvelle-Aquitaine', access:'Carte de pêche', cat:'2ème catégorie', score:87, dist:'8,3 km', photo:PHOTOS.forest, x:42, y:66, species:['Brochet','Black-bass','Aspe'], desc:"Grands plats et fosses profondes. Terrain de jeu varié pour le lancer." },
  { id:'qu', name:'Baie de Quiberon', water:'Mer', fish:'Marin', dept:'56 · Morbihan', region:'Bretagne', access:'Libre', cat:'—', score:81, dist:'1,2 km', photo:PHOTOS.sea, x:18, y:46, species:['Bar','Maquereau','Dorade'], desc:"Pêche du bord aux leurres souples. Meilleur sur le coefficient montant." },
  { id:'la', name:'Étang de Lacanau', water:'Étang', fish:'Carnassier', dept:'33 · Gironde', region:'Nouvelle-Aquitaine', access:'Carte de pêche', cat:'2ème catégorie', score:85, dist:'6,0 km', photo:PHOTOS.pond, x:33, y:64, species:['Black-bass','Brochet'], desc:"Vaste plan d'eau peu profond, paradis du black-bass au leurre de surface." },
  { id:'lo', name:'La Loire à Orléans', water:'Rivière', fish:'Silure', dept:'45 · Loiret', region:'Centre-Val de Loire', access:'Libre', cat:'2ème catégorie', score:78, dist:'15 km', photo:PHOTOS.river, x:50, y:48, species:['Silure','Sandre','Aspe'], desc:"Le plus long fleuve de France. Postes à silure dans les fosses des ponts." },
  { id:'cm', name:'Canal du Midi', water:'Canal', fish:'Cyprinidé', dept:'31 · Haute-Garonne', region:'Occitanie', access:'Libre', cat:'2ème catégorie', score:64, dist:'3,7 km', photo:PHOTOS.canal, x:52, y:78, species:['Gardon','Carpe','Brème'], desc:"Pêche au coup à l'ombre des platanes. Convivial et accessible à tous." },
];

const CATCHES = [
  { id:1, fish:'Brochet', spot:'Lac de Sainte-Croix', size:'82 cm', weight:'4,1 kg', date:'18 mai', photo:PHOTOS.alpine, weather:'sun', temp:'19°', lure:'Leurre souple' },
  { id:2, fish:'Truite fario', spot:'Le Gardon', size:'34 cm', weight:'0,5 kg', date:'12 mai', photo:PHOTOS.river, weather:'cloud', temp:'14°', lure:'Mouche sèche' },
  { id:3, fish:'Black-bass', spot:'Étang de Lacanau', size:'41 cm', weight:'1,2 kg', date:'5 mai', photo:PHOTOS.pond, weather:'sun', temp:'21°', lure:'Frog de surface' },
  { id:4, fish:'Bar', spot:'Baie de Quiberon', size:'56 cm', weight:'1,9 kg', date:'28 avr', photo:PHOTOS.sea, weather:'wind', temp:'16°', lure:'Leurre de surface' },
];

Object.assign(window, { FSIcon, SPOTS, CATCHES, PHOTOS, WATER_TYPES, FISH_TYPES, ACCESS_TYPES });
