// Genera los mapas estáticos que usan los vídeos (sin dependencias de red al renderizar).
//   mapas/espana.js  → window.MAPA_ESPANA  (provincias, comunidades, contorno, vecinos, recuadro de Canarias)
//   mapas/madrid.js  → window.MAPA_MADRID  (179 municipios de la Comunidad de Madrid)
//   mapas/europa.js  → window.MAPA_EUROPA  (países de Europa: UE sí/no, euro sí/no)
//   + un .svg de muestra de cada uno para revisar a ojo.
//
// Datos:
//   - España: npm `es-atlas` (MIT; geometría del Instituto Geográfico Nacional, CC BY 4.0 «© IGN»).
//   - Vecinos y Europa: Natural Earth 1:50m (dominio público) vía npm `world-atlas`.
// Uso (una sola vez; ya están generados):
//   node produccion/motor-video/mapas/generar-mapas.mjs /home/claude/_deps_video/node_modules
// Dependencias: es-atlas@0.6 world-atlas@2 topojson-client@3 topojson-simplify@3 d3-geo@3 polylabel@1

import { createRequire } from 'node:module';
import { writeFileSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const NM = resolve(process.argv[2] || 'node_modules');
const SALIDA = dirname(fileURLToPath(import.meta.url));
const req = createRequire(join(NM, 'x.js'));
const imp = (p) => import(pathToFileURL(req.resolve(p)).href);
const topojson = await imp('topojson-client');
const simp = await imp('topojson-simplify');
const d3 = await imp('d3-geo');
const polylabel = req('polylabel');
const leer = (p) => JSON.parse(readFileSync(req.resolve(p), 'utf8'));
const r1 = (v) => Math.round(v * 10) / 10;

// Punto interior bonito para rótulos (polígono más grande en pantalla).
function etiqueta(geo, camino, proy) {
  const polis = geo.type === 'Polygon' ? [geo.coordinates] : geo.type === 'MultiPolygon' ? geo.coordinates : [];
  let mejor = null; let area = -1;
  for (const p of polis) { const f = { type: 'Polygon', coordinates: p }; const a = camino.area(f); if (a > area) { area = a; mejor = f; } }
  if (!mejor) return camino.centroid(geo).map(r1);
  const proyectado = mejor.coordinates.map((an) => an.map((q) => proy(q)).filter(Boolean));
  let [x, y] = polylabel(proyectado, 0.5);
  if (!isFinite(x)) [x, y] = camino.centroid(mejor);
  return [r1(x), r1(y)];
}
function caja(camino, geo) { const [[a, b], [c, d]] = camino.bounds(geo); return [r1(a), r1(b), r1(c - a), r1(d - b)]; }

// ───────────────────────── ESPAÑA ─────────────────────────
{
  const es = leer('es-atlas/es/provinces.json');
  const mundo = leer('world-atlas/countries-50m.json');
  const ANCHO = 1000;
  // Proyección cónica conforme para la Península y Baleares.
  const proy = d3.geoConicConformal().parallels([37, 43]).rotate([3.7, 0]);
  const encuadre = { type: 'MultiPoint', coordinates: [[-9.4, 43.85], [4.4, 43.85], [-9.4, 35.2], [4.4, 35.2], [3.3, 42.4]] };
  proy.fitWidth(ANCHO - 20, encuadre);
  let [[x0, y0], [x1, y1]] = d3.geoPath(proy).bounds(encuadre);
  const tr = proy.translate(); proy.translate([tr[0] - x0 + 10, tr[1] - y0 + 10]);
  const ALTO_PEN = Math.round(y1 - y0 + 20);
  // Canarias a la misma escala, en recuadro abajo a la izquierda.
  const RC = { x: 10, y: ALTO_PEN - 40, w: 380, h: 170 };
  const proyC = d3.geoConicConformal().parallels([27.5, 29.5]).rotate([15.8, 0]).scale(proy.scale());
  const islas = { type: 'MultiPoint', coordinates: [[-18.2, 29.45], [-13.35, 27.6]] };
  proyC.translate([0, 0]);
  { const [[a, b], [c, d]] = d3.geoPath(proyC).bounds(islas); proyC.translate([RC.x + (RC.w - (c - a)) / 2 - a, RC.y + (RC.h - (d - b)) / 2 - b]); }
  const ALTO = Math.round(RC.y + RC.h + 10);
  const cam = d3.geoPath(proy).digits(1);
  const camC = d3.geoPath(proyC).digits(1);
  const CANARIAS = new Set(['35', '38']);
  const CCAA_DE = {
    '04': '01', '11': '01', '14': '01', '18': '01', '21': '01', '23': '01', '29': '01', '41': '01',
    '22': '02', '44': '02', '50': '02', '33': '03', '07': '04', '35': '05', '38': '05', '39': '06',
    '05': '07', '09': '07', '24': '07', '34': '07', '37': '07', '40': '07', '42': '07', '47': '07', '49': '07',
    '02': '08', '13': '08', '16': '08', '19': '08', '45': '08', '08': '09', '17': '09', '25': '09', '43': '09',
    '03': '10', '12': '10', '46': '10', '06': '11', '10': '11', '15': '12', '27': '12', '32': '12', '36': '12',
    '28': '13', '30': '14', '31': '15', '01': '16', '20': '16', '48': '16', '26': '17', '51': '18', '52': '19',
  };
  const NOMBRE_PROV = { '03': 'Alicante', '07': 'Baleares', '12': 'Castellón', '46': 'Valencia', '01': 'Álava' };
  const NOMBRE_CCAA = {
    '01': 'Andalucía', '02': 'Aragón', '03': 'Asturias', '04': 'Islas Baleares', '05': 'Canarias', '06': 'Cantabria',
    '07': 'Castilla y León', '08': 'Castilla-La Mancha', '09': 'Cataluña', '10': 'Comunidad Valenciana', '11': 'Extremadura',
    '12': 'Galicia', '13': 'Comunidad de Madrid', '14': 'Región de Murcia', '15': 'Navarra', '16': 'País Vasco',
    '17': 'La Rioja', '18': 'Ceuta', '19': 'Melilla',
  };
  const geoms = es.objects.provinces.geometries.filter((g) => g.id !== '54');
  const pinta = (id, geo) => (CANARIAS.has(id) ? camC : cam)(geo);
  const proyDe = (id) => (CANARIAS.has(id) ? proyC : proy);
  const provincias = geoms.map((g) => {
    const geo = topojson.feature(es, g).geometry;
    const c = CANARIAS.has(g.id) ? camC : cam;
    const nombre = NOMBRE_PROV[g.id] || g.properties.name.split('/').pop();
    return { id: g.id, nombre, ccaa: CCAA_DE[g.id], d: pinta(g.id, geo), et: etiqueta(geo, c, proyDe(g.id)), caja: caja(c, geo) };
  }).sort((a, b) => a.id.localeCompare(b.id));
  const ccaa = Object.keys(NOMBRE_CCAA).map((id) => {
    const partes = geoms.filter((g) => CCAA_DE[g.id] === id);
    const geo = topojson.merge(es, partes);
    const c = id === '05' ? camC : cam;
    return { id, nombre: NOMBRE_CCAA[id], provincias: partes.map((g) => g.id).sort(), d: c(geo), et: etiqueta(geo, c, id === '05' ? proyC : proy), caja: caja(c, geo) };
  });
  const pen = geoms.filter((g) => !CANARIAS.has(g.id));
  const can = geoms.filter((g) => CANARIAS.has(g.id));
  const contorno = cam(topojson.merge(es, pen)) + camC(topojson.merge(es, can));
  // Vecinos (Portugal, Francia, Andorra, Marruecos, Argelia) recortados al encuadre peninsular.
  const camV = d3.geoPath(proy.clipExtent([[0, 0], [ANCHO, ALTO_PEN + 200]])).digits(1);
  const VEC = { Portugal: 'portugal', France: 'francia', Andorra: 'andorra', Morocco: 'marruecos', Algeria: 'argelia', 'W. Sahara': 'marruecos' };
  const vecinos = {};
  const pre = simp.presimplify(mundo);
  const sm = simp.simplify(pre, simp.quantile(pre, 0.3));
  for (const g of sm.objects.countries.geometries) {
    const k = VEC[g.properties.name]; if (!k) continue;
    const d = camV(topojson.feature(sm, g)); if (d) vecinos[k] = (vecinos[k] || '') + d;
  }
  proy.clipExtent(null);
  const datos = {
    ancho: ANCHO, alto: ALTO, recuadroCanarias: RC, contorno, vecinos, provincias, ccaa,
    fuente: 'es-atlas (IGN, CC BY 4.0) + Natural Earth',
    // Proyección para colocar puntos a partir de [lon, lat]: usa M.mapas.lonlat(...) (aproximación lineal local)
    ref: [[-9, 43], proy([-9, 43]).map(r1), [3, 43], proy([3, 43]).map(r1), [-9, 37], proy([-9, 37]).map(r1), [3, 37], proy([3, 37]).map(r1)],
  };
  // Madrid y Val d'Aran desde municipios.
  const mun = leer('es-atlas/es/municipalities.json');
  const preM = simp.presimplify(mun);
  const munS = simp.simplify(preM, simp.quantile(preM, 0.25));
  const ARAN = ['Arres', 'Bausen', 'Bossòst', 'Es Bòrdes', 'Canejan', 'Les', 'Naut Aran', 'Vielha e Mijaran', 'Vilamòs'];
  const aranG = munS.objects.municipalities.geometries.filter((g) => g.id.startsWith('25') && ARAN.includes(g.properties.name));
  datos.aran = { d: cam(topojson.merge(munS, aranG)), et: etiqueta(topojson.merge(munS, aranG), cam, proy), municipios: aranG.length };
  writeFileSync(join(SALIDA, 'espana.js'), `// GENERADO por generar-mapas.mjs — no editar. ${datos.fuente}\nwindow.MAPA_ESPANA = ${JSON.stringify(datos)};\n`);
  const colCCAA = ['#F4B942', '#E07A5F', '#3D8B85', '#8D99AE', '#E9C46A', '#6BAA75'];
  writeFileSync(join(SALIDA, 'espana.svg'), [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ANCHO} ${ALTO}" width="${ANCHO}" height="${ALTO}">`,
    `<rect width="${ANCHO}" height="${ALTO}" fill="#DCEBF0"/>`,
    ...Object.values(vecinos).map((d) => `<path d="${d}" fill="#EAE4D8" stroke="#fff"/>`),
    `<rect x="${RC.x}" y="${RC.y}" width="${RC.w}" height="${RC.h}" fill="#DCEBF0" stroke="#8D99AE"/>`,
    ...provincias.map((p, i) => `<path d="${p.d}" fill="${colCCAA[+p.ccaa % 6]}" stroke="#fff" stroke-width="1"/>`),
    `<path d="${datos.aran.d}" fill="#2B2D42"/>`,
    ...provincias.map((p) => `<text x="${p.et[0]}" y="${p.et[1]}" font-size="10" text-anchor="middle">${p.nombre}</text>`),
    '</svg>'].join('\n'));
  console.log('España', ANCHO, ALTO, provincias.length, 'provincias', ccaa.length, 'ccaa', 'Aran', aranG.length, 'municipios');

  // Comunidad de Madrid: 179 municipios.
  const madG = munS.objects.municipalities.geometries.filter((g) => g.id.startsWith('28'));
  const madFC = topojson.merge(munS, madG);
  const pm = d3.geoConicConformal().parallels([40, 41]).rotate([3.7, 0]).fitExtent([[10, 10], [790, 790]], madFC);
  const cm = d3.geoPath(pm).digits(1);
  const [[mx0, my0], [mx1, my1]] = cm.bounds(madFC);
  pm.translate([pm.translate()[0] - mx0 + 10, pm.translate()[1] - my0 + 10]);
  const madrid = {
    ancho: Math.round(mx1 - mx0 + 20), alto: Math.round(my1 - my0 + 20), contorno: cm(madFC),
    municipios: madG.map((g) => { const geo = topojson.feature(munS, g).geometry; return { id: g.id, nombre: g.properties.name, d: cm(geo), et: etiqueta(geo, cm, pm) }; }),
  };
  madrid.capital = madrid.municipios.find((m) => m.id === '28079')?.et;
  writeFileSync(join(SALIDA, 'madrid.js'), `// GENERADO por generar-mapas.mjs — no editar. es-atlas (IGN, CC BY 4.0)\nwindow.MAPA_MADRID = ${JSON.stringify(madrid)};\n`);
  writeFileSync(join(SALIDA, 'madrid.svg'), [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${madrid.ancho} ${madrid.alto}" width="${madrid.ancho}" height="${madrid.alto}">`,
    ...madrid.municipios.map((m) => `<path d="${m.d}" fill="#F4B942" stroke="#fff"/><circle cx="${m.et[0]}" cy="${m.et[1]}" r="3"/>`), '</svg>'].join('\n'));
  console.log('Madrid', madrid.ancho, madrid.alto, madrid.municipios.length, 'municipios');
}

// ───────────────────────── EUROPA ─────────────────────────
{
  const mundo = leer('world-atlas/countries-50m.json');
  // nombre world-atlas → [código, nombre, UE, euro]   (euro: 21 países en 2026, con Bulgaria desde el 1-1-2026)
  const P = {
    Germany: ['DE', 'Alemania', 1, 1], Austria: ['AT', 'Austria', 1, 1], Belgium: ['BE', 'Bélgica', 1, 1], Bulgaria: ['BG', 'Bulgaria', 1, 1],
    Cyprus: ['CY', 'Chipre', 1, 1], Croatia: ['HR', 'Croacia', 1, 1], Denmark: ['DK', 'Dinamarca', 1, 0], Slovakia: ['SK', 'Eslovaquia', 1, 1],
    Slovenia: ['SI', 'Eslovenia', 1, 1], Spain: ['ES', 'España', 1, 1], Estonia: ['EE', 'Estonia', 1, 1], Finland: ['FI', 'Finlandia', 1, 1],
    France: ['FR', 'Francia', 1, 1], Greece: ['GR', 'Grecia', 1, 1], Hungary: ['HU', 'Hungría', 1, 0], Ireland: ['IE', 'Irlanda', 1, 1],
    Italy: ['IT', 'Italia', 1, 1], Latvia: ['LV', 'Letonia', 1, 1], Lithuania: ['LT', 'Lituania', 1, 1], Luxembourg: ['LU', 'Luxemburgo', 1, 1],
    Malta: ['MT', 'Malta', 1, 1], Netherlands: ['NL', 'Países Bajos', 1, 1], Poland: ['PL', 'Polonia', 1, 0], Portugal: ['PT', 'Portugal', 1, 1],
    Czechia: ['CZ', 'Chequia', 1, 0], Romania: ['RO', 'Rumanía', 1, 0], Sweden: ['SE', 'Suecia', 1, 0],
    Norway: ['NO', 'Noruega', 0, 0], Switzerland: ['CH', 'Suiza', 0, 0], 'United Kingdom': ['GB', 'Reino Unido', 0, 0], Iceland: ['IS', 'Islandia', 0, 0],
    Serbia: ['RS', 'Serbia', 0, 0], 'Bosnia and Herz.': ['BA', 'Bosnia', 0, 0], Albania: ['AL', 'Albania', 0, 0], Macedonia: ['MK', 'Macedonia del Norte', 0, 0],
    Montenegro: ['ME', 'Montenegro', 0, 0], Moldova: ['MD', 'Moldavia', 0, 0], Ukraine: ['UA', 'Ucrania', 0, 0], Belarus: ['BY', 'Bielorrusia', 0, 0],
    Kosovo: ['XK', 'Kosovo', 0, 0], Turkey: ['TR', 'Turquía', 0, 0], Russia: ['RU', 'Rusia', 0, 0], Andorra: ['AD', 'Andorra', 0, 0],
    Liechtenstein: ['LI', 'Liechtenstein', 0, 0], Morocco: ['MA', 'Marruecos', 0, 0], Algeria: ['DZ', 'Argelia', 0, 0], Tunisia: ['TN', 'Túnez', 0, 0],
    Libya: ['LY', 'Libia', 0, 0], Georgia: ['GE', 'Georgia', 0, 0], Syria: ['SY', 'Siria', 0, 0], Lebanon: ['LB', 'Líbano', 0, 0], Israel: ['IL', 'Israel', 0, 0],
    Egypt: ['EG', 'Egipto', 0, 0], Kazakhstan: ['KZ', 'Kazajistán', 0, 0], Armenia: ['AM', 'Armenia', 0, 0], Azerbaijan: ['AZ', 'Azerbaiyán', 0, 0],
    Iraq: ['IQ', 'Irak', 0, 0], Iran: ['IR', 'Irán', 0, 0], Jordan: ['JO', 'Jordania', 0, 0], Monaco: ['MC', 'Mónaco', 0, 0], 'San Marino': ['SM', 'San Marino', 0, 0],
    Vatican: ['VA', 'Vaticano', 0, 0], Palestine: ['PS', 'Palestina', 0, 0], 'Saudi Arabia': ['SA', 'Arabia Saudí', 0, 0],
  };
  const UNIR = { 'N. Cyprus': 'Cyprus', Åland: 'Finland' };
  const pre = simp.presimplify(mundo);
  const sm = simp.simplify(pre, simp.quantile(pre, 0.35));
  const geoms = sm.objects.countries.geometries;
  // Crimea: se dibuja como parte de Ucrania (reconocimiento de España y de la UE).
  const rusia = geoms.find((g) => g.properties.name === 'Russia');
  const enCrimea = (poli) => {
    const c = topojson.feature(sm, { type: 'Polygon', arcs: poli }).geometry.coordinates[0];
    const xs = c.map((q) => q[0]); const ys = c.map((q) => q[1]);
    return Math.min(...xs) > 31 && Math.max(...xs) < 37.5 && Math.min(...ys) > 43.5 && Math.max(...ys) < 47;
  };
  const crimea = rusia.arcs.filter(enCrimea);
  if (crimea.length) { rusia.arcs = rusia.arcs.filter((p) => !enCrimea(p)); geoms.push({ type: 'MultiPolygon', arcs: crimea, properties: { name: 'Crimea' } }); UNIR.Crimea = 'Ukraine'; }
  // Encuadre 16:10 aprox. (sin Islandia): de Portugal a Finlandia y Chipre.
  const ANCHO = 1000; const ALTO = 820;
  const proy = d3.geoAzimuthalEqualArea().rotate([-12, -52]);
  const enc = { type: 'MultiPoint', coordinates: [[-10.5, 51.5], [-9.6, 36.8], [14.5, 35.4], [34.6, 34.6], [31.5, 70.2], [5, 71], [-8, 58.5], [33, 50]] };
  proy.fitExtent([[25, 20], [ANCHO - 25, ALTO - 20]], enc);
  proy.clipExtent([[0, 0], [ANCHO, ALTO]]);
  const cam = d3.geoPath(proy).digits(1);
  const paises = [];
  const resto = [];
  for (const g of geoms) { const n = g.properties.name; if (!P[n] && !UNIR[n]) resto.push(g); }
  for (const [en, [id, nombre, ue, euro]] of Object.entries(P)) {
    const partes = geoms.filter((g) => g.properties.name === en || UNIR[g.properties.name] === en);
    if (!partes.length) { console.warn('Europa: no encontrado', en); continue; }
    let geo = topojson.merge(sm, partes);
    let d = cam(geo);
    if (!d || d.length < 40) { // país diminuto que la simplificación borra (Malta): geometría original
      const orig = mundo.objects.countries.geometries.filter((g) => g.properties.name === en);
      geo = topojson.merge(mundo, orig); d = cam(geo);
    }
    if (!d) { console.warn('Europa: fuera del encuadre', en); continue; }
    const [bx, by, bw, bh] = caja(cam, geo);
    paises.push({ id, nombre, ue: !!ue, euro: !!euro, d, et: etiqueta(geo, cam, proy), caja: [bx, by, bw, bh], pequeno: Math.max(bw, bh) < 22 });
  }
  const fondo = cam(topojson.merge(sm, resto)) || '';
  const capitales = { Bruselas: [4.35, 50.85], Estrasburgo: [7.75, 48.58], Luxemburgo: [6.13, 49.61], Fráncfort: [8.68, 50.11], Madrid: [-3.7, 40.42] };
  const ciudades = Object.fromEntries(Object.entries(capitales).map(([k, v]) => [k, proy(v).map(r1)]));
  const datos = { ancho: ANCHO, alto: ALTO, fondo, paises, ciudades, fuente: 'Natural Earth 1:50m (dominio público)' };
  writeFileSync(join(SALIDA, 'europa.js'), `// GENERADO por generar-mapas.mjs — no editar. ${datos.fuente}\nwindow.MAPA_EUROPA = ${JSON.stringify(datos)};\n`);
  writeFileSync(join(SALIDA, 'europa.svg'), [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ANCHO} ${ALTO}" width="${ANCHO}" height="${ALTO}">`,
    `<rect width="${ANCHO}" height="${ALTO}" fill="#DCEBF0"/><path d="${fondo}" fill="#EAE4D8" stroke="#fff"/>`,
    ...paises.map((p) => `<path d="${p.d}" fill="${p.ue ? (p.euro ? '#3B5BA9' : '#8FA3D6') : '#D8D2C6'}" stroke="#fff" stroke-width="0.8"/>`),
    ...paises.filter((p) => p.ue || ['CH', 'NO', 'GB'].includes(p.id)).map((p) => `<text x="${p.et[0]}" y="${p.et[1]}" font-size="11" text-anchor="middle">${p.nombre}</text>`),
    '</svg>'].join('\n'));
  console.log('Europa', paises.length, 'países;', paises.filter((p) => p.ue).length, 'UE;', paises.filter((p) => p.euro).length, 'euro');
}
