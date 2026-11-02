// Prueba automática de las actividades (motor de preguntas).
// Requiere el sitio servido:  cd sociales-tema2 && python3 -m http.server 8765
// Uso: node produccion/pruebas/probar-actividades.js [url_base] [carpeta_capturas]
//   ESCENARIO=tablet-horizontal-arrastre,movil-toque …  para lanzar solo algunos (los 7 seguidos tardan ~10 min;
//   conviene repartirlos en 2 procesos en paralelo). Sale con código 1 si algo falla.
// Ver también capturas-estados.js (capturas de arrastre en vuelo, selección, D'Hondt paso 2 y mapa ampliado).
// Resuelve las 25 preguntas con arrastres reales (táctiles por CDP y de ratón) y con «tocar y tocar»,
// fuerza fallos para comprobar explicación + minuto, y vigila errores de consola y scroll horizontal.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.argv[2] || 'http://localhost:8765/';
const CAPT = process.argv[3] || '/tmp/capturas';
fs.mkdirSync(CAPT, { recursive: true });
const RAIZ = path.resolve(__dirname, '../..');
const PREG = JSON.parse(fs.readFileSync(path.join(RAIZ, 'data/preguntas.json'), 'utf8'));
// tiempos.json lo reescribe el render de vídeo (puede cambiar durante la prueba): se compara con el que cargó la página.
const tiemposDePagina = (page) => page.evaluate(() => Motor.cargarDatos().then((d) => d.tiempos));

const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
const minuto = (s) => { s = Math.floor(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const miles = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const ESCENARIOS = [
  { nombre: 'tablet-horizontal-arrastre', viewport: { width: 1280, height: 800 }, touch: true, modo: 'tactil', fallar: true },
  { nombre: 'tablet-vertical-arrastre', viewport: { width: 800, height: 1280 }, touch: true, modo: 'tactil', fallar: false },
  { nombre: 'movil-arrastre', viewport: { width: 390, height: 844 }, touch: true, modo: 'tactil', fallar: true },
  { nombre: 'tablet-horizontal-toque', viewport: { width: 1280, height: 800 }, touch: true, modo: 'toque', fallar: false },
  { nombre: 'tablet-vertical-toque', viewport: { width: 800, height: 1280 }, touch: true, modo: 'toque', fallar: true },
  { nombre: 'movil-toque', viewport: { width: 390, height: 844 }, touch: true, modo: 'toque', fallar: false },
  { nombre: 'ordenador-raton', viewport: { width: 1366, height: 768 }, touch: false, modo: 'raton', fallar: true },
];

let fallosTotales = 0;
function fallo(msg) { fallosTotales++; console.log('  ✗ ' + msg); }
function afirmar(c, msg) { if (!c) fallo(msg); }

(async () => {
  const navegador = await chromium.launch();
  const soloEsc = process.env.ESCENARIO;
  for (const esc of ESCENARIOS) {
    if (soloEsc && !soloEsc.split(',').includes(esc.nombre)) continue; // ESCENARIO=a,b para elegir
    console.log('\n## ' + esc.nombre);
    const ctx = await navegador.newContext({ viewport: esc.viewport, hasTouch: esc.touch, isMobile: esc.touch && esc.viewport.width < 500, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const errores = [];
    page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
    page.on('pageerror', (e) => errores.push(e.message));
    const cdp = esc.modo === 'tactil' ? await ctx.newCDPSession(page) : null;
    const H = esc.viewport.height;

    // ── entrada ──
    async function pulsar(loc) {
      if (esc.modo === 'raton') await loc.click(); else await loc.tap();
      await page.waitForTimeout(60);
    }
    async function caja(loc) { await loc.scrollIntoViewIfNeeded(); return loc.boundingBox(); }
    const toque = (tipo, x, y) => cdp.send('Input.dispatchTouchEvent', { type: tipo, touchPoints: tipo === 'touchEnd' ? [] : [{ x, y, radiusX: 4, radiusY: 4, force: 1 }] });
    async function arrastrar(origen, destino, ajusteY) {
      const a = await caja(origen);
      const x0 = a.x + a.width / 2, y0 = a.y + a.height / 2;
      const ini = esc.modo === 'tactil' ? (x, y) => toque('touchStart', x, y) : async (x, y) => { await page.mouse.move(x, y); await page.mouse.down(); };
      const mov = esc.modo === 'tactil' ? (x, y) => toque('touchMove', x, y) : (x, y) => page.mouse.move(x, y);
      const fin = esc.modo === 'tactil' ? (x, y) => toque('touchEnd', x, y) : async () => { await page.mouse.up(); };
      await ini(x0, y0);
      await mov(x0 + 6, y0 + 6); await mov(x0 + 14, y0 + 12);
      let x = x0 + 14, y = y0 + 12, b;
      for (let k = 0; k < 400; k++) {
        b = await destino.boundingBox();
        const cy = b.y + (ajusteY ? ajusteY(b) : b.height / 2);
        if (cy > 90 && cy < H - 90) break;
        y = cy < 90 ? 10 : H - 10;
        await mov(x, y); await page.waitForTimeout(25);
      }
      let tx, ty;
      for (let s = 1; s <= 6; s++) { // se recalcula el destino en cada paso (el autoscroll puede moverlo)
        b = await destino.boundingBox();
        tx = b.x + Math.min(b.width / 2, 60); ty = b.y + (ajusteY ? ajusteY(b) : b.height / 2);
        await mov(x + (tx - x) * s / 6, y + (ty - y) * s / 6); await page.waitForTimeout(12);
      }
      b = await destino.boundingBox();
      tx = b.x + Math.min(b.width / 2, 60); ty = b.y + (ajusteY ? ajusteY(b) : b.height / 2);
      await mov(tx, ty); await page.waitForTimeout(20);
      await fin(tx, ty);
      await page.waitForTimeout(80);
      // Sin pausas ni «toques neutros»: un arrastre rápido es un «fling» para Chromium y, si el motor no consumiera
      // el touchmove, el toque siguiente (p. ej. «Comprobar») se perdería. La prueba lo comprueba así, a lo bruto.
    }
    async function mover(origen, destino) {
      if (esc.modo === 'toque') { await pulsar(origen); await pulsar(destino); }
      else await arrastrar(origen, destino);
    }
    async function escribir(loc, txt) { await loc.scrollIntoViewIfNeeded(); await pulsar(loc); await loc.fill(''); await page.keyboard.type(String(txt)); }
    const comprobar = () => pulsar(page.locator('.boton-comprobar'));

    async function sinScrollHorizontal(donde) {
      const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      afirmar(r.sw <= r.cw, `scroll horizontal en ${donde}: ${r.sw} > ${r.cw}`);
    }

    // ── resolutores ──
    const Z = '.pregunta .zona';
    async function resolver(p, mal) {
      if (p.tipo === 'clasificar') {
        for (let vuelta = 0; ; vuelta++) {
          if (vuelta > 40) { fallo(p.id + ': bucle sin fin colocando fichas'); break; }
          const f = page.locator(`${Z} .banco .ficha`).first();
          if (!(await f.count())) break;
          const i = +(await f.getAttribute('data-ficha'));
          const cat = mal ? (p.tarjetas[i].cat + 1) % p.categorias.length : p.tarjetas[i].cat;
          await mover(f, page.locator(`${Z} [data-destino="c${cat}"]`));
          if (mal) { // basta con un fallo; el resto bien
            mal = false;
          }
        }
      } else if (p.tipo === 'emparejar') {
        for (let vuelta = 0; ; vuelta++) {
          if (vuelta > 40) { fallo(p.id + ': bucle sin fin colocando fichas'); break; }
          const f = page.locator(`${Z} .banco .ficha`).first();
          if (!(await f.count())) break;
          const i = +(await f.getAttribute('data-ficha'));
          let dest = i;
          if (mal) { dest = (i + 1) % p.pares.length; mal = false; }
          const hueco = page.locator(`${Z} [data-destino="p${dest}"]`);
          if (await hueco.locator('.ficha').count()) { // ocupado (por el fallo forzado): usar el primero libre
            const libres = page.locator(`${Z} .hueco-pareja:not(.lleno)`);
            await mover(f, libres.first());
          } else await mover(f, hueco);
        }
      } else if (p.tipo === 'huecos') {
        const resp = []; p.frases.forEach((fr) => fr.replace(/\{([^}]+)\}/g, (_, r) => resp.push(r)));
        const orden = resp.map((r, k) => k);
        if (mal && resp.length > 1) { orden[0] = 1; orden[1] = 0; }
        for (let k = 0; k < resp.length; k++) {
          const h = page.locator(`${Z} [data-destino="h${k}"]`);
          if (await h.locator('.ficha').count()) continue;
          const palabra = resp[orden[k]];
          const fichas = page.locator(`${Z} .banco .ficha`);
          const n = await fichas.count(); let elegida = null;
          for (let j = 0; j < n; j++) if (norm(await fichas.nth(j).innerText()) === norm(palabra)) { elegida = fichas.nth(j); break; }
          if (!elegida) { fallo('palabra no encontrada en banco: ' + palabra); continue; }
          await mover(elegida, h);
        }
      } else if (p.tipo === 'ordenar') {
        if (mal) return; // el orden barajado ya es incorrecto
        for (let pos = 0; pos < p.elementos.length; pos++) {
          const items = page.locator(`${Z} .ficha-orden`);
          const actual = await page.evaluate((pos) => Array.from(document.querySelectorAll('.pregunta .ficha-orden')).findIndex((li) => +li.dataset.ficha === pos), pos);
          if (actual === pos) continue;
          const origen = items.nth(actual), destino = items.nth(pos);
          if (esc.modo === 'toque') { await pulsar(origen); await pulsar(destino); }
          else await arrastrar(origen, destino, () => 8);
        }
      } else if (p.tipo === 'numeros') {
        const ins = page.locator(`${Z} .entrada-num`);
        for (let k = 0; k < p.campos.length; k++) {
          if (await ins.nth(k).evaluate((i) => i.readOnly)) continue;
          await escribir(ins.nth(k), mal && k === 0 ? p.campos[k].respuesta + 1 : p.campos[k].respuesta);
        }
      } else if (p.tipo === 'dhondt') {
        // paso 1
        for (let i = 0; i < p.partidos.length; i++) for (let j = 0; j < p.divisores; j++) {
          const inp = page.locator(`${Z} input[data-celda="${i}-${j}"]`);
          if (await inp.evaluate((x) => x.readOnly)) continue;
          const v = p.partidos[i].votos / (j + 1);
          let txt = Number.isInteger(v) ? ((i + j) % 2 ? miles(v) : String(v)) : String(Math.round(v)); // «16.000» y «16000»
          if (mal && i === 0 && j === 1) txt = '12000';
          await escribir(inp, txt);
        }
        await comprobar();
        if (mal) return 'fallo-paso1';
        await page.waitForSelector(`${Z} .celda-cociente`);
        // paso 2
        const todos = [];
        p.partidos.forEach((pt, i) => { for (let j = 0; j < p.divisores; j++) todos.push({ i, j, v: pt.votos / (j + 1) }); });
        todos.sort((a, b) => b.v - a.v);
        for (const c of todos.slice(0, p.escanos)) await pulsar(page.locator(`${Z} button[data-celda="${c.i}-${c.j}"]`));
        await comprobar();
        await page.waitForSelector(`${Z} .escanos-bloque:not([hidden])`);
        const ins = page.locator(`${Z} .escanos-bloque .entrada-num`);
        for (let i = 0; i < p.partidos.length; i++) await escribir(ins.nth(i), p.solucion[p.partidos[i].nombre]);
      } else if (p.tipo === 'mapa') {
        const tocarPais = async (id) => {
          const pt = await page.evaluate((id) => {
            const svg = document.querySelector('.mapa-svg');
            const pais = window.EUROPA.paises.find((x) => x.id === id);
            const zona = document.querySelector(`.zona-pequena[data-pais="${id}"]`);
            const q = svg.createSVGPoint(); q.x = pais.x; q.y = pais.y;
            const s = q.matrixTransform(svg.getScreenCTM());
            return { x: s.x, y: s.y, pequeno: !!zona };
          }, id);
          if (pt.y < 0 || pt.y > H) { await page.mouse.wheel(0, pt.y - H / 2); await page.waitForTimeout(200); return tocarPais(id); }
          if (esc.modo === 'raton') await page.mouse.click(pt.x, pt.y); else await page.touchscreen.tap(pt.x, pt.y);
          await page.waitForTimeout(80);
        };
        await page.locator('.mapa-svg').scrollIntoViewIfNeeded();
        const marcados = await page.evaluate(() => Array.from(document.querySelectorAll('.lista-marcados li')).map((li) => li.dataset.pais));
        const ue = ['ES', 'FR', esc.viewport.width < 500 ? 'LU' : 'MT'].filter((x) => !marcados.includes(x));
        await pulsar(page.locator('.pincel[data-pincel="ue"]'));
        if (esc.viewport.width < 500 && !mal && ue.includes('LU')) { // en móvil, probar el zoom para tocar Luxemburgo
          await tocarPais('BE'); // marca Bélgica y centra el zoom ahí
          await pulsar(page.locator('.mapa-zoom button').first());
          await page.waitForTimeout(100);
          await tocarPais('BE'); // la desmarca
          await tocarPais('LU');
          await pulsar(page.locator('.mapa-zoom button').nth(1));
          await page.waitForTimeout(100);
          ue.splice(ue.indexOf('LU'), 1);
        }
        for (const id of (mal ? ['ES', 'FR', 'CH'] : ue)) {
          const yaUe = await page.evaluate((id) => !!document.querySelector(`.pais.marcado-ue[data-pais="${id}"]`), id);
          if (!yaUe) await tocarPais(id);
        }
        await pulsar(page.locator('.pincel[data-pincel="no"]'));
        const yaNo = await page.evaluate(() => document.querySelectorAll('.lista-marcados .punto.no').length);
        if (!yaNo) { if (!mal) await tocarPais('NO'); else await tocarPais('IS'); }
        const est = await page.evaluate(() => Array.from(document.querySelectorAll('.lista-marcados li')).map((li) => li.dataset.pais + ':' + li.querySelector('.tipo').textContent));
        if (!mal) afirmar(est.length === 4, 'mapa: marcados ' + est.join(','));
      }
    }

    for (let v = 1; v <= 5; v++) {
      await page.goto(`${BASE}actividades/actividad.html?v=${v}`);
      await page.waitForSelector('.pregunta');
      await page.waitForTimeout(150);
      const bloque = PREG.videos.find((x) => x.video === v);
      for (let qi = 0; qi < bloque.preguntas.length; qi++) {
        const p = bloque.preguntas[qi];
        await page.waitForSelector(`.pregunta[data-pregunta="${p.id}"]`);
        await page.waitForTimeout(120);
        const capt = async (suf) => { await page.waitForTimeout(320); return page.screenshot({ path: path.join(CAPT, `${esc.nombre}-${p.id}-${p.tipo}${suf}.png`), fullPage: true }); };
        if (qi === 0 || ['dhondt', 'mapa', 'huecos', 'ordenar', 'emparejar'].includes(p.tipo)) await capt('-0inicio');
        await sinScrollHorizontal(p.id);
        // Comprobar sin terminar → aviso (no cuenta como intento)
        if (p.tipo !== 'ordenar') {
          await comprobar();
          const aviso = await page.locator('.pregunta .aviso').innerText();
          afirmar(aviso.length > 5, `${p.id}: no avisa de que falta algo`);
          afirmar(!(await page.locator('.respuesta-mal').isVisible()), `${p.id}: marcó fallo sin estar completa`);
        }
        if (esc.fallar) {
          const r = await resolver(p, true);
          if (r !== 'fallo-paso1') await comprobar();
          await page.waitForSelector('.respuesta-mal', { timeout: 3000 }).catch(async () => { fallo(`${p.id}: no aparece el panel de fallo; aviso: ` + await page.locator('.pregunta .aviso').innerText()); await capt('-ERROR'); });
          const expl = await page.locator('.respuesta-mal .explicacion').innerText().catch(() => '');
          if (p.tipo === 'dhondt') afirmar(expl.includes('÷'), `${p.id}: explicación del paso 1 incorrecta: ${expl}`);
          else afirmar(expl === p.explicacion, `${p.id}: explicación distinta: «${expl}»`);
          const esc0 = Math.min(...p.escenas);
          const seg = (await tiemposDePagina(page))[v][esc0 - 1];
          const enlace = page.locator('.respuesta-mal .enlace-repaso');
          const txt = await enlace.innerText().catch(() => '');
          afirmar(txt.includes('minuto ' + minuto(seg)), `${p.id}: enlace de repaso «${txt}» ≠ minuto ${minuto(seg)}`);
          const href = await enlace.getAttribute('href').catch(() => '');
          afirmar(href === `../leccion.html?v=${v}&t=${Math.floor(seg)}`, `${p.id}: href repaso ${href}`);
          const marcasMal = await page.locator('.pregunta .marca.mal, .marcas-mapa circle[fill="#D1495B"], .ficha-orden.mal').count();
          afirmar(marcasMal > 0, `${p.id}: no hay marcas ✗`);
          if (['clasificar', 'dhondt', 'mapa', 'ordenar', 'huecos'].includes(p.tipo) && (qi < 2 || p.tipo === 'dhondt' || p.tipo === 'mapa')) await capt('-1fallo');
          await sinScrollHorizontal(p.id + ' fallo');
          await pulsar(page.locator('.boton-reintentar'));
          afirmar(!(await page.locator('.respuesta-mal').isVisible()), `${p.id}: el panel de fallo no se oculta al reintentar`);
        }
        await resolver(p, false);
        if (p.tipo !== 'ordenar' && p.tipo !== 'dhondt') {
          await page.waitForTimeout(30);
          const avisoViejo = await page.locator('.pregunta .aviso').innerText();
          afirmar(!avisoViejo, `${p.id}: sigue el aviso «${avisoViejo}» con todo completo`);
        }
        if (['huecos', 'emparejar', 'clasificar'].includes(p.tipo) && !esc.fallar && qi < 3) await capt('-2colocado');
        await comprobar();
        const bien = await page.waitForSelector('.respuesta-bien', { timeout: 3000 }).then(() => true).catch(() => false);
        if (!bien) {
          const est = await page.evaluate(() => ({ aviso: document.querySelector('.pregunta .aviso')?.textContent, mal: document.querySelector('.respuesta-mal:not([hidden]) .explicacion')?.textContent }));
          fallo(`${p.id} (${p.tipo}): no se corrige como acertada ${JSON.stringify(est)}`);
          await capt('-ERROR');
          break;
        }
        const marcasMal = await page.locator('.pregunta .marca.mal').count();
        afirmar(marcasMal === 0, `${p.id}: quedan marcas ✗ tras acertar`);
        if (p.tipo === 'dhondt' || p.tipo === 'mapa' || qi === 0) await capt('-3bien');
        console.log(`  ✓ ${p.id} ${p.tipo}`);
        await pulsar(page.locator('.boton-siguiente'));
      }
      await page.waitForSelector('[data-final]', { timeout: 3000 }).catch(() => fallo(`v${v}: no aparece pantalla final`));
      const nota = await page.locator('.final .nota').innerText().catch(() => '');
      const esperado = esc.fallar ? '0 de 5' : '5 de 5';
      afirmar(nota.startsWith(esperado), `v${v}: nota final «${nota}» (esperado ${esperado})`);
      await page.waitForTimeout(320);
      if (v === 1 || v === 5) await page.screenshot({ path: path.join(CAPT, `${esc.nombre}-v${v}-final.png`), fullPage: true });
      await sinScrollHorizontal('final v' + v);
      const prog = await page.evaluate(() => Motor.progreso.estado(1));
      afirmar(prog.completado, 'progreso no guardado');
    }
    // Huecos sin banco (escribir): no está en los datos, se prueba con una pregunta propia.
    if (esc.nombre === 'ordenador-raton' || esc.nombre === 'movil-toque') {
      await page.evaluate(() => Motor.montar(document.getElementById('preguntas'), 1, { preguntas: [
        { id: 'x1', tipo: 'huecos', enunciado: 'Escribe la palabra.', frases: ['Votar es {prestar} el poder.', 'Se vota una pregunta en un {referéndum}.'], escenas: [5], explicacion: 'Explicación de prueba.' }] }));
      await page.waitForSelector('.hueco-escrito');
      const ins = page.locator('.hueco-escrito');
      await escribir(ins.nth(0), 'Prestar '); await escribir(ins.nth(1), 'referendum');
      await page.screenshot({ path: path.join(CAPT, `${esc.nombre}-huecos-escribir.png`), fullPage: true });
      await comprobar();
      afirmar(await page.locator('.respuesta-bien').isVisible(), 'huecos sin banco: «Prestar »/«referendum» no se aceptan');
      const sup = await page.evaluate(() => Motor.progreso.leer().videos[1].superadas);
      afirmar(!sup.includes('x1'), 'preguntas propias: no deberían guardarse en el progreso');
      console.log('  ✓ huecos sin banco (escribir)');
      // Fallo escribiendo: explicación + minuto
      await page.evaluate(() => Motor.montar(document.getElementById('preguntas'), 1, { preguntas: [
        { id: 'x2', tipo: 'huecos', enunciado: 'Escribe la palabra.', frases: ['Votar es {prestar} el poder.'], escenas: [5], explicacion: 'Explicación de prueba.' }] }));
      await page.waitForSelector('.pregunta[data-pregunta="x2"]');
      await escribir(page.locator('.hueco-escrito'), 'regalar');
      await comprobar();
      afirmar(await page.locator('.respuesta-mal .explicacion').innerText() === 'Explicación de prueba.', 'huecos sin banco: falta la explicación al fallar');
      afirmar(await page.locator('.hueco-escrito.mal').count() === 1, 'huecos sin banco: el hueco no se marca como mal');
    }
    // API para la lección: alPedirRepaso(segundos, info) y alTerminar(resultado)
    if (esc.nombre === 'tablet-horizontal-toque' || esc.nombre === 'ordenador-raton') {
      await page.goto(`${BASE}actividades/actividad.html?v=2`);
      await page.waitForSelector('.pregunta');
      await page.evaluate(() => {
        window.__repaso = null; window.__fin = null;
        return Motor.montar(document.getElementById('preguntas'), 2, {
          preguntas: [{ id: 'api1', tipo: 'numeros', enunciado: 'Prueba', campos: [{ etiqueta: '¿2 + 2?', respuesta: 4 }], escenas: [7, 3], explicacion: 'Cuatro.' }],
          alPedirRepaso: (s, info) => { window.__repaso = { s, info }; },
          alTerminar: (r) => { window.__fin = r; }
        });
      });
      await page.waitForSelector('.pregunta[data-pregunta="api1"]');
      await escribir(page.locator('.entrada-num'), '5');
      await comprobar();
      const url0 = page.url();
      await pulsar(page.locator('.enlace-repaso'));
      const rep = await page.evaluate(() => window.__repaso);
      const t = await tiemposDePagina(page);
      afirmar(rep && Math.abs(rep.s - t['2'][2]) < 1e-6 && rep.info.escena === 3, 'API: alPedirRepaso no recibe los segundos de la escena 3: ' + JSON.stringify(rep));
      afirmar(page.url() === url0, 'API: con alPedirRepaso no debe navegar');
      await pulsar(page.locator('.boton-reintentar'));
      await escribir(page.locator('.entrada-num'), '4');
      await comprobar();
      await pulsar(page.locator('.boton-siguiente'));
      const fin = await page.evaluate(() => window.__fin);
      afirmar(fin && fin.video === 2 && fin.total === 1 && fin.aciertosPrimera === 0 && fin.preguntas[0].intentos === 2, 'API: alTerminar con datos raros: ' + JSON.stringify(fin));
      console.log('  ✓ API alPedirRepaso / alTerminar');
    }
    // Índice de actividades con progreso
    await page.goto(`${BASE}actividades/index.html`);
    await page.waitForSelector('.tarjeta-actividad');
    await sinScrollHorizontal('índice');
    afirmar((await page.locator('.estado-actividad.completa').count()) === 5, 'índice: no muestra las 5 completas');
    await page.screenshot({ path: path.join(CAPT, `${esc.nombre}-indice.png`), fullPage: true });
    if (errores.length) { fallo('errores de consola: ' + errores.join(' | ')); }
    await ctx.close();
  }
  await navegador.close();
  console.log(fallosTotales ? `\n${fallosTotales} FALLOS` : '\nTODO BIEN');
  process.exit(fallosTotales ? 1 : 0);
})();
