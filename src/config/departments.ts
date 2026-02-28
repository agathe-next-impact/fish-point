export interface Department {
  code: string;
  name: string;
  region: string;
  federation: string;
}

export const DEPARTMENTS: Department[] = [
  { code: '01', name: 'Ain', region: 'Auvergne-Rhône-Alpes', federation: 'Fédération de pêche de l\'Ain' },
  { code: '02', name: 'Aisne', region: 'Hauts-de-France', federation: 'Fédération de pêche de l\'Aisne' },
  { code: '03', name: 'Allier', region: 'Auvergne-Rhône-Alpes', federation: 'Fédération de pêche de l\'Allier' },
  { code: '04', name: 'Alpes-de-Haute-Provence', region: 'Provence-Alpes-Côte d\'Azur', federation: 'Fédération de pêche des Alpes-de-Haute-Provence' },
  { code: '05', name: 'Hautes-Alpes', region: 'Provence-Alpes-Côte d\'Azur', federation: 'Fédération de pêche des Hautes-Alpes' },
  { code: '06', name: 'Alpes-Maritimes', region: 'Provence-Alpes-Côte d\'Azur', federation: 'Fédération de pêche des Alpes-Maritimes' },
  { code: '07', name: 'Ardèche', region: 'Auvergne-Rhône-Alpes', federation: 'Fédération de pêche de l\'Ardèche' },
  { code: '08', name: 'Ardennes', region: 'Grand Est', federation: 'Fédération de pêche des Ardennes' },
  { code: '09', name: 'Ariège', region: 'Occitanie', federation: 'Fédération de pêche de l\'Ariège' },
  { code: '10', name: 'Aube', region: 'Grand Est', federation: 'Fédération de pêche de l\'Aube' },
  { code: '13', name: 'Bouches-du-Rhône', region: 'Provence-Alpes-Côte d\'Azur', federation: 'Fédération de pêche des Bouches-du-Rhône' },
  { code: '21', name: 'Côte-d\'Or', region: 'Bourgogne-Franche-Comté', federation: 'Fédération de pêche de la Côte-d\'Or' },
  { code: '25', name: 'Doubs', region: 'Bourgogne-Franche-Comté', federation: 'Fédération de pêche du Doubs' },
  { code: '29', name: 'Finistère', region: 'Bretagne', federation: 'Fédération de pêche du Finistère' },
  { code: '31', name: 'Haute-Garonne', region: 'Occitanie', federation: 'Fédération de pêche de la Haute-Garonne' },
  { code: '33', name: 'Gironde', region: 'Nouvelle-Aquitaine', federation: 'Fédération de pêche de la Gironde' },
  { code: '34', name: 'Hérault', region: 'Occitanie', federation: 'Fédération de pêche de l\'Hérault' },
  { code: '35', name: 'Ille-et-Vilaine', region: 'Bretagne', federation: 'Fédération de pêche d\'Ille-et-Vilaine' },
  { code: '38', name: 'Isère', region: 'Auvergne-Rhône-Alpes', federation: 'Fédération de pêche de l\'Isère' },
  { code: '40', name: 'Landes', region: 'Nouvelle-Aquitaine', federation: 'Fédération de pêche des Landes' },
  { code: '44', name: 'Loire-Atlantique', region: 'Pays de la Loire', federation: 'Fédération de pêche de Loire-Atlantique' },
  { code: '45', name: 'Loiret', region: 'Centre-Val de Loire', federation: 'Fédération de pêche du Loiret' },
  { code: '56', name: 'Morbihan', region: 'Bretagne', federation: 'Fédération de pêche du Morbihan' },
  { code: '59', name: 'Nord', region: 'Hauts-de-France', federation: 'Fédération de pêche du Nord' },
  { code: '64', name: 'Pyrénées-Atlantiques', region: 'Nouvelle-Aquitaine', federation: 'Fédération de pêche des Pyrénées-Atlantiques' },
  { code: '67', name: 'Bas-Rhin', region: 'Grand Est', federation: 'Fédération de pêche du Bas-Rhin' },
  { code: '69', name: 'Rhône', region: 'Auvergne-Rhône-Alpes', federation: 'Fédération de pêche du Rhône' },
  { code: '73', name: 'Savoie', region: 'Auvergne-Rhône-Alpes', federation: 'Fédération de pêche de la Savoie' },
  { code: '74', name: 'Haute-Savoie', region: 'Auvergne-Rhône-Alpes', federation: 'Fédération de pêche de la Haute-Savoie' },
  { code: '75', name: 'Paris', region: 'Île-de-France', federation: 'Fédération de pêche de Paris' },
  { code: '83', name: 'Var', region: 'Provence-Alpes-Côte d\'Azur', federation: 'Fédération de pêche du Var' },
  { code: '85', name: 'Vendée', region: 'Pays de la Loire', federation: 'Fédération de pêche de la Vendée' },
];

export function getDepartmentByCode(code: string): Department | undefined {
  return DEPARTMENTS.find((d) => d.code === code);
}

export function getDepartmentsByRegion(region: string): Department[] {
  return DEPARTMENTS.filter((d) => d.region === region);
}
