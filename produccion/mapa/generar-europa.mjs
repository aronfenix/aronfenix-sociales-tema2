// Genera assets/js/europa.js y assets/js/europa.svg (mapa estático de Europa para la pregunta tipo «mapa»).
// Se ejecuta UNA vez en tiempo de preparación; el resultado no tiene dependencias en ejecución.
//
// Datos: Natural Earth (dominio público) vía npm `world-atlas` (countries-50m).
// Uso:  node produccion/mapa/generar-europa.mjs <carpeta_node_modules> <carpeta_salida_assets_js>
//   p. ej. node produccion/mapa/generar-europa.mjs /home/claude/_deps/node_modules assets/js
// (dependencias: world-atlas@2 topojson-client@3 topojson-simplify@3 d3-geo@3 polylabel@1)

import { createRequire } from 'node:module';
import { writeFileSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const NM = resolve(process.argv[2] || 'node_modules');
const SALIDA = resolve(process.argv[3] || 'assets/js');
const req = createRequire(join(NM, 'x.js'));
const imp = (p) => import(pathToFileURL(req.resolve(p)).href);

const topojson = await imp('topojson-client');
const simp = await imp('topojson-simplify');
const d3 = await imp('d3-geo');
const polylabel = req('polylabel');

const mundo = JSON.parse(readFileSync(req.resolve('world-atlas/countries-50m.json'), 'utf8'));

// Nombre en world-atlas → [código, nombre en castellano, ¿UE?]
const PAISES = {
  'Germany': ['DE', 'Alemania', true], 'Austria': ['AT', 'Austria', true], 'Belgium': ['BE', 'Bélgica', true],
  'Bulgaria': ['BG', 'Bulgaria', true], 'Cyprus': ['CY', 'Chipre', true], 'Croatia': ['HR', 'Croacia', true],
  'Denmark': ['DK', 'Dinamarca', true], 'Slovakia': ['SK', 'Eslovaquia', true], 'Slovenia': ['SI', 'Eslovenia', true],
  'Spain': ['ES', 'España', true], 'Estonia': ['EE', 'Estonia', true], 'Finland': ['FI', 'Finlandia', true],
  'France': ['FR', 'Francia', true], 'Greece': ['GR', 'Grecia', true], 'Hungary': ['HU', 'Hungría', true],
  'Ireland': ['IE', 'Irlanda', true], 'Italy': ['IT', 'Italia', true], 'Latvia': ['LV', 'Letonia', true],
  'Lithuania': ['LT', 'Lituania', true], 'Luxembourg': ['LU', 'Luxemburgo', true], 'Malta': ['MT', 'Malta', true],
  'Netherlands': ['NL', 'Países Bajos', true], 'Poland': ['PL', 'Polonia', true], 'Portugal': ['PT', 'Portugal', true],
  'Czechia': ['CZ', 'República Checa', true], 'Romania': ['RO', 'Rumanía', true], 'Sweden': ['SE', 'Suecia', true],
  'Norway': ['NO', 'Noruega', false], 'Switzerland': ['CH', 'Suiza', false], 'United Kingdom': ['GB', 'Reino Unido', false],
  'Iceland': ['IS', 'Islandia', false], 'Serbia': ['RS', 'Serbia', false], 'Bosnia and Herz.': ['BA', 'Bosnia y Herzegovina', false],
  'Albania': ['AL', 'Albania', false], 'Macedonia': ['MK', 'Macedonia del Norte', false], 'Montenegro': ['ME', 'Montenegro', false],
  'Moldova': ['MD', 'Moldavia', false], 'Ukraine': ['UA', 'Ucrania', false], 'Belarus': ['BY', 'Bielorrusia', false],
  'Kosovo': ['XK', 'Kosovo', false], 'Turkey': ['TR', 'Turquía', false],
};
// Territorios que se dibujan junto a otro país (misma zona táctil).
const UNIR = { 'N. Cyprus': 'Cyprus', 'Åland': 'Finland' };

// Simplificación ligera (conserva Malta, Luxemburgo, etc.).
const pre = simp.presimplify(mundo);
const simplificado = simp.simplify(pre, simp.quantile(pre, 0.35));
const geoms = simplificado.objects.countries.geometries;

// Crimea: Natural Earth la incluye en Rusia (control de facto). Para un material escolar español
// se dibuja como parte de Ucrania (reconocimiento de España y de la UE).
{
  const rusia = geoms.find((g) => g.properties.name === 'Russia');
  const enCrimea = (poli) => {
    const c = topojson.feature(simplificado, { type: 'Polygon', arcs: poli }).geometry.coordinates[0];
    const xs = c.map((q) => q[0]); const ys = c.map((q) => q[1]);
    return Math.min(...xs) > 31 && Math.max(...xs) < 37.5 && Math.min(...ys) > 43.5 && Math.max(...ys) < 47;
  };
  const crimea = rusia.arcs.filter(enCrimea);
  if (crimea.length) {
    rusia.arcs = rusia.arcs.filter((p) => !enCrimea(p));
    geoms.push({ type: 'MultiPolygon', arcs: crimea, properties: { name: 'Crimea' } });
    UNIR['Crimea'] = 'Ukraine';
  } else console.warn('Crimea no encontrada');
}

// Proyección: azimutal equivalente de Lambert centrada en Europa (como ETRS89-LAEA).
const ANCHO = 1000;
const puntosEncuadre = {
  type: 'MultiPoint',
  coordinates: [[-24.6, 63.3], [-24, 66.6], [-10.2, 36.6], [34.8, 34.4], [44.5, 46], [41.5, 52.5], [31, 70.6], [24, 71.2], [14.4, 34.7], [25, 34.2]],
};
const proy = d3.geoAzimuthalEqualArea().rotate([-12, -53]);
proy.fitWidth(ANCHO - 30, puntosEncuadre);
const [[x0, y0], [x1, y1]] = d3.geoPath(proy).bounds(puntosEncuadre);
const ALTO = Math.round(y1 - y0 + 30);
const t = proy.translate();
proy.translate([t[0] - x0 + 15, t[1] - y0 + 15]);
proy.clipExtent([[0, 0], [ANCHO, ALTO]]);
const camino = d3.geoPath(proy).digits(1);

const tocables = [];
const fondo = [];
for (const g of geoms) {
  const n = g.properties.name;
  if (PAISES[n] || UNIR[n]) continue;
  fondo.push(g);
}
for (const [nombreEn, [codigo, nombre, ue]] of Object.entries(PAISES)) {
  const partes = geoms.filter((g) => g.properties.name === nombreEn || UNIR[g.properties.name] === nombreEn);
  if (!partes.length) { console.warn('No encontrado:', nombreEn); continue; }
  const geo = topojson.merge(simplificado, partes);
  const d = camino(geo);
  if (!d) { console.warn('Fuera del encuadre:', nombreEn); continue; }
  // Polígono más grande (en pantalla) para colocar la etiqueta y el ✓/✗.
  let mejor = null; let area = -1;
  for (const poligono of geo.coordinates) {
    const f = { type: 'Polygon', coordinates: poligono };
    const a = d3.geoPath(proy).area(f);
    if (a > area) { area = a; mejor = f; }
  }
  const anillos = [];
  const pm = d3.geoPath(proy);
  // Proyectar anillos del polígono mayor para polylabel.
  const proyectado = mejor.coordinates.map((anillo) => anillo.map((p) => proy(p)).filter(Boolean));
  let [cx, cy] = polylabel(proyectado, 0.5);
  if (!isFinite(cx)) [cx, cy] = pm.centroid(mejor);
  const [[bx0, by0], [bx1, by1]] = pm.bounds(geo);
  const tam = Math.max(bx1 - bx0, by1 - by0);
  tocables.push({ id: codigo, nombre, ue, d, x: +cx.toFixed(1), y: +cy.toFixed(1), pequeno: tam < 30 });
}
const fondoD = camino(topojson.merge(simplificado, fondo));

const datos = { ancho: ANCHO, alto: ALTO, fondo: fondoD, paises: tocables };
const cabecera = `// GENERADO por produccion/mapa/generar-europa.mjs — no editar a mano.
// Fuente: Natural Earth 1:50m (dominio público) vía world-atlas. Proyección azimutal equivalente de Lambert.
`;
writeFileSync(join(SALIDA, 'europa.js'), cabecera + 'window.EUROPA = ' + JSON.stringify(datos) + ';\n');

// SVG estático de referencia (mismo contenido).
const svg = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ANCHO} ${ALTO}" width="${ANCHO}" height="${ALTO}">`,
  `<rect width="${ANCHO}" height="${ALTO}" fill="#DCEBF0"/>`,
  `<path d="${fondoD}" fill="#E6E1D6" stroke="#FFFFFF" stroke-width="0.8"/>`,
  ...tocables.map((p) => `<path id="${p.id}" d="${p.d}" fill="${p.ue ? '#C9D3EE' : '#F2EEE6'}" stroke="#2B2D42" stroke-width="0.7"><title>${p.nombre}</title></path>`),
  '</svg>'].join('\n');
writeFileSync(join(SALIDA, 'europa.svg'), svg + '\n');

console.log(`ancho ${ANCHO} alto ${ALTO}; ${tocables.length} países tocables; pequeños: ${tocables.filter((p) => p.pequeno).map((p) => p.nombre).join(', ')}`);
console.log('bytes europa.js:', readFileSync(join(SALIDA, 'europa.js')).length);
