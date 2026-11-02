#!/usr/bin/env node
/*
 * Capturas PNG para revisar una animación sin renderizar el vídeo.
 *
 *   node produccion/motor-video/capturas.js N                    → cada escena al 10 %, 50 % y 90 % (+ cabecera)
 *   node produccion/motor-video/capturas.js N --escena 4 [--escena 7]
 *   node produccion/motor-video/capturas.js N --pct 5,30,60,95   → otros porcentajes
 *   node produccion/motor-video/capturas.js N --t 41.2 --t 50    → instantes absolutos
 *   node produccion/motor-video/capturas.js catalogo             → hojas de iconos (catalogo-1.png, catalogo-2.png)
 *
 * Salida: produccion/capturas/vN/eXX-PP.png y una hoja por escena eXX-hoja.png (los 3 instantes en fila, a la mitad).
 * Muestra los avisos de la página (window.ERRORES): claves de momento que no se encuentran, iconos desconocidos…
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const duraciones = require('./duraciones.js');

const RAIZ = path.resolve(__dirname, '..', '..');
const PROD = path.join(RAIZ, 'produccion');
const args = process.argv.slice(2);
const multi = (k) => { const r = []; args.forEach((a, i) => { if (a === k) r.push(args[i + 1]); }); return r; };

(async () => {
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage({ viewport: { width: 1280, height: 800 } });
  pagina.on('pageerror', (e) => console.warn('[página] ' + e.message));
  if (args[0] === 'catalogo') {
    const dir = path.join(PROD, 'capturas'); fs.mkdirSync(dir, { recursive: true });
    for (const p of [1, 2]) {
      await pagina.goto('file://' + path.join(__dirname, 'catalogo.html') + '?pagina=' + p);
      await pagina.waitForFunction(() => window.LISTO === true);
      await pagina.screenshot({ path: path.join(dir, `catalogo-${p}.png`) });
      console.log(path.join(dir, `catalogo-${p}.png`));
    }
    await navegador.close(); return;
  }
  const N = +args[0];
  const datos = duraciones.escribir(N);
  const dir = path.join(PROD, 'capturas', 'v' + N); fs.mkdirSync(dir, { recursive: true });
  await pagina.goto('file://' + path.join(PROD, 'v' + N, 'anim.html'));
  await pagina.waitForFunction(() => window.LISTO === true, null, { timeout: 45000 });
  const seek = (t) => pagina.evaluate((x) => window.seek(x), t);
  const tiempos = multi('--t').map(Number);
  if (tiempos.length) {
    for (const t of tiempos) { await seek(t); const f = path.join(dir, `t${t.toFixed(1)}.png`); await pagina.screenshot({ path: f }); console.log(f); }
  } else {
    const pct = (multi('--pct')[0] || '10,50,90').split(',').map(Number);
    const sel = multi('--escena').map(Number);
    const escenas = sel.length ? datos.escenas.filter((e) => sel.includes(e.n)) : datos.escenas;
    if (!sel.length) { await seek(2.6); await pagina.screenshot({ path: path.join(dir, 'cabecera.png') }); }
    for (const e of escenas) {
      const fs_ = [];
      for (const p of pct) {
        await seek(e.inicio + (e.dur * p) / 100);
        const f = path.join(dir, `e${String(e.n).padStart(2, '0')}-${String(p).padStart(2, '0')}.png`);
        await pagina.screenshot({ path: f }); fs_.push(f);
      }
      const hoja = path.join(dir, `e${String(e.n).padStart(2, '0')}-hoja.png`);
      const entradas = fs_.flatMap((f) => ['-i', f]);
      execFileSync('ffmpeg', ['-y', '-v', 'error', ...entradas, '-filter_complex', fs_.map((_, i) => `[${i}]scale=640:400[s${i}]`).join(';') + ';' + fs_.map((_, i) => `[s${i}]`).join('') + `hstack=inputs=${fs_.length}`, hoja]);
      console.log(`escena ${e.n} (${e.dur.toFixed(1)} s): ${hoja}`);
    }
  }
  const errores = await pagina.evaluate(() => window.ERRORES || []);
  if (errores.length) console.warn('AVISOS:\n - ' + errores.join('\n - '));
  await navegador.close();
})().catch((e) => { console.error(e); process.exit(1); });
