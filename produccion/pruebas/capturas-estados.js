// Capturas de estados intermedios del motor (para revisión visual): ficha en pleno arrastre táctil,
// selección «tocar y tocar», D'Hondt paso 2 y mapa ampliado en móvil.
// Uso (con el sitio servido en :8765):  node produccion/pruebas/capturas-estados.js [url_base] [carpeta]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const BASE = process.argv[2] || 'http://localhost:8765/';
const CAPT = process.argv[3] || '/tmp/capturas-estados';
fs.mkdirSync(CAPT, { recursive: true });

(async () => {
  const nav = await chromium.launch();
  const errores = [];
  async function pagina(viewport) {
    const ctx = await nav.newContext({ viewport, hasTouch: true, isMobile: viewport.width < 500, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
    page.on('pageerror', (e) => errores.push(e.message));
    return { ctx, page, cdp: await ctx.newCDPSession(page) };
  }
  const toque = (cdp, type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, radiusX: 4, radiusY: 4, force: 1 }] });

  // 1) Tablet horizontal: ficha volando sobre la caja «Deber».
  {
    const { ctx, page, cdp } = await pagina({ width: 1280, height: 800 });
    await page.goto(BASE + 'actividades/actividad.html?v=1');
    await page.waitForSelector('.banco .ficha');
    const f = await page.locator('.banco .ficha').first().boundingBox();
    const d = await page.locator('[data-destino="c1"]').boundingBox();
    const x0 = f.x + f.width / 2, y0 = f.y + f.height / 2;
    await toque(cdp, 'touchStart', x0, y0);
    for (let s = 1; s <= 10; s++) await toque(cdp, 'touchMove', x0 + (d.x + 120 - x0) * s / 10, y0 + (d.y + 90 - y0) * s / 10);
    await page.waitForTimeout(100);
    await page.screenshot({ path: path.join(CAPT, '1-arrastre-en-vuelo.png') });
    await toque(cdp, 'touchEnd');
    await page.waitForTimeout(100);
    // 2) «Tocar y tocar»: ficha elegida, cajas resaltadas.
    await page.locator('.banco .ficha').first().tap();
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(CAPT, '2-tocar-seleccion.png') });
    await ctx.close();
  }
  // 3) D'Hondt paso 2 (tablet vertical), con 2 cocientes elegidos.
  {
    const { ctx, page } = await pagina({ width: 800, height: 1280 });
    await page.goto(BASE + 'actividades/actividad.html?v=4');
    await page.waitForSelector('.pregunta');
    await page.evaluate(() => Motor.cargarDatos().then((d) => Motor.montar(document.getElementById('preguntas'), 4, { preguntas: [d.preguntas.videos[3].preguntas[2]] })));
    await page.waitForSelector('.entrada-cociente');
    const votos = [48000, 30000, 14000];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) await page.locator(`input[data-celda="${i}-${j}"]`).fill(String(Math.round(votos[i] / (j + 1))));
    await page.locator('.boton-comprobar').tap();
    await page.waitForSelector('.celda-cociente');
    await page.locator('button[data-celda="0-0"]').tap();
    await page.locator('button[data-celda="1-0"]').tap();
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(CAPT, '3-dhondt-paso2.png'), fullPage: true });
    await ctx.close();
  }
  // 4) Móvil: mapa ampliado sobre el Benelux y Luxemburgo tocado.
  {
    const { ctx, page } = await pagina({ width: 390, height: 844 });
    await page.goto(BASE + 'actividades/actividad.html?v=5');
    await page.waitForSelector('.pregunta');
    await page.evaluate(() => Motor.cargarDatos().then((d) => Motor.montar(document.getElementById('preguntas'), 5, { preguntas: [d.preguntas.videos[4].preguntas[3]] })));
    await page.waitForSelector('.mapa-svg .pais');
    await page.locator('.mapa-svg').scrollIntoViewIfNeeded();
    const punto = (id) => page.evaluate((id) => {
      const svg = document.querySelector('.mapa-svg'); const p = window.EUROPA.paises.find((x) => x.id === id);
      const q = svg.createSVGPoint(); q.x = p.x; q.y = p.y; const s = q.matrixTransform(svg.getScreenCTM()); return { x: s.x, y: s.y };
    }, id);
    let p = await punto('BE'); await page.touchscreen.tap(p.x, p.y); await page.waitForTimeout(100);
    await page.locator('.mapa-zoom button').first().tap(); await page.waitForTimeout(100);
    await page.locator('.mapa-zoom button').first().tap(); await page.waitForTimeout(150);
    p = await punto('LU'); await page.touchscreen.tap(p.x, p.y); await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(CAPT, '4-mapa-movil-ampliado.png'), fullPage: true });
    const marcados = await page.evaluate(() => Array.from(document.querySelectorAll('.lista-marcados li')).map((li) => li.dataset.pais));
    console.log('mapa móvil, marcados:', marcados.join(','));
    if (!(marcados.includes('BE') && marcados.includes('LU'))) errores.push('mapa: no se marcaron BE y LU con zoom');
    await ctx.close();
  }
  await nav.close();
  console.log(errores.length ? 'ERRORES: ' + errores.join(' | ') : 'Capturas en ' + CAPT + ' (sin errores de consola)');
  process.exit(errores.length ? 1 : 0);
})();
