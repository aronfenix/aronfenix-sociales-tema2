#!/usr/bin/env node
/*
 * Render de un vídeo: node produccion/motor-video/render.js N [--draft] [--desde S] [--hasta S]
 *
 *  - Recalcula duraciones (audios reales si existen en produccion/audio/vN/, si no estimadas) → datos/vN.js
 *  - Abre produccion/vN/anim.html con Playwright (1280×800), recorre fotogramas con window.seek(t),
 *    captura JPEG y los pasa por tubería a ffmpeg.
 *  - Audio: cada produccion/audio/vN/escena-XX.mp3 colocado al inicio de su escena (resto silencio); sin audios → pista muda.
 *  - Salida final: videos/vN-<slug>.mp4 (H.264 yuv420p CRF 23 veryfast, AAC 128k, +faststart) + videos/poster/vN.jpg
 *    --draft: 8 fps → produccion/borradores/vN-borrador.mp4
 *    --desde/--hasta: solo un tramo (pruebas) → produccion/borradores/vN-tramo.mp4 (no toca tiempos.json)
 *  - Actualiza data/tiempos.json: { "N": [inicio escena 1, …] } (+ "_info".N con estimado/real).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const { chromium } = require('playwright');
const duraciones = require('./duraciones.js');

const RAIZ = path.resolve(__dirname, '..', '..');
const PROD = path.join(RAIZ, 'produccion');
const args = process.argv.slice(2);
const N = +args.find((a) => /^\d+$/.test(a));
if (!N) { console.error('Uso: node render.js N [--draft] [--desde S --hasta S]'); process.exit(1); }
const DRAFT = args.includes('--draft');
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? parseFloat(args[i + 1]) : null; };
const DESDE = opt('--desde'), HASTA = opt('--hasta');
const TRAMO = DESDE !== null || HASTA !== null;
const FPS = DRAFT ? 8 : 25;

function ffmpeg(argv, entrada) {
  return new Promise((res, rej) => {
    const p = spawn('ffmpeg', argv, { stdio: [entrada ? 'pipe' : 'ignore', 'ignore', 'pipe'] });
    let err = ''; p.stderr.on('data', (d) => { err += d; if (err.length > 20000) err = err.slice(-10000); });
    p.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg salió con ' + c + '\n' + err.slice(-3000)))));
    p.on('error', rej);
    if (entrada) entrada(p);
  });
}

async function pistaAudio(datos, total, t0, dest) {
  const conAudio = datos.escenas.filter((e) => e.mp3);
  if (!conAudio.length) return null;
  const argv = ['-y', '-hide_banner'];
  conAudio.forEach((e) => argv.push('-i', e.mp3));
  const filtros = conAudio.map((e, i) => {
    const ms = Math.max(0, Math.round((e.inicio + e.pre - t0) * 1000));
    return `[${i}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,adelay=${ms}|${ms}[a${i}]`;
  });
  const mezcla = conAudio.map((_, i) => `[a${i}]`).join('') + `amix=inputs=${conAudio.length}:normalize=0:dropout_transition=0,apad,atrim=0:${total.toFixed(3)}[sal]`;
  argv.push('-filter_complex', filtros.concat(mezcla).join(';'), '-map', '[sal]', '-c:a', 'pcm_s16le', '-ar', '48000', dest);
  await ffmpeg(argv);
  return dest;
}

function actualizarTiempos(datos) {
  const f = path.join(RAIZ, 'data', 'tiempos.json');
  let j = {};
  try { j = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { j = {}; }
  j[String(datos.id)] = datos.escenas.map((e) => Math.round(e.inicio * 100) / 100);
  j._info = j._info || {};
  j._info[String(datos.id)] = { estimado: datos.estimado, audiosReales: datos.audiosReales, escenas: datos.escenas.length, duracion: Math.round(datos.total * 100) / 100, cabecera: datos.cabecera, generado: new Date().toISOString() };
  j._nota = 'Inicio (s) de cada escena en el MP4, incluida la cabecera de 3 s. Lo escribe produccion/motor-video/render.js. Si _info.N.estimado es true, las duraciones son estimadas (faltan audios) y cambiarán al renderizar con los audios reales.';
  const orden = {}; Object.keys(j).filter((k) => /^\d+$/.test(k)).sort((a, b) => a - b).forEach((k) => (orden[k] = j[k]));
  orden._info = j._info; orden._nota = j._nota;
  const tmp = f + '.tmp' + process.pid;
  fs.writeFileSync(tmp, JSON.stringify(orden, null, 1) + '\n');
  fs.renameSync(tmp, f);
}

(async () => {
  const datos = duraciones.escribir(N);
  const html = path.join(PROD, 'v' + N, 'anim.html');
  if (!fs.existsSync(html)) throw new Error('No existe ' + html);
  const t0 = TRAMO ? Math.max(0, DESDE || 0) : 0;
  const t1 = TRAMO ? Math.min(datos.total, HASTA || datos.total) : datos.total;
  const total = t1 - t0;
  const nFrames = Math.round(total * FPS);
  const salida = TRAMO ? path.join(PROD, 'borradores', `v${N}-tramo.mp4`)
    : DRAFT ? path.join(PROD, 'borradores', `v${N}-borrador.mp4`) : path.join(RAIZ, 'videos', `${datos.slug}.mp4`);
  fs.mkdirSync(path.dirname(salida), { recursive: true });
  fs.mkdirSync(path.join(RAIZ, 'videos', 'poster'), { recursive: true });
  const tmpDir = fs.mkdtempSync(path.join(require('os').tmpdir(), `render-v${N}-`));
  console.log(`v${N}: ${datos.titulo} · ${total.toFixed(1)} s · ${nFrames} fotogramas a ${FPS} fps · ${datos.estimado ? 'duraciones ESTIMADAS' : 'audios reales'} (${datos.audiosReales}/${datos.escenas.length})`);

  const audio = await pistaAudio(datos, total, t0, path.join(tmpDir, 'narracion.wav'));
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  pagina.on('console', (m) => { if (m.type() === 'error') console.warn('  [página] ' + m.text()); });
  pagina.on('pageerror', (e) => console.warn('  [página] ' + e.message));
  await pagina.goto('file://' + html);
  await pagina.waitForFunction(() => window.LISTO === true, null, { timeout: 45000 });
  const errores = await pagina.evaluate(() => window.ERRORES || []);
  if (errores.length) console.warn('  Avisos de la animación:\n   - ' + errores.join('\n   - '));
  const dur = await pagina.evaluate(() => window.DURACION);
  if (Math.abs(dur - datos.total) > 0.01) throw new Error('DURACION de la página no coincide con datos');
  const cdp = await pagina.context().newCDPSession(pagina);
  const captura = async () => Buffer.from((await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92, optimizeForSpeed: true })).data, 'base64');

  // Póster: final de la cabecera (título del vídeo).
  if (!TRAMO) {
    await pagina.evaluate(() => window.seek(2.6));
    fs.writeFileSync(path.join(RAIZ, 'videos', 'poster', `v${N}.jpg`), await captura());
  }

  const tmpSalida = salida.replace(/\.mp4$/, '.parcial.mp4');
  const argv = ['-y', '-hide_banner', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-'];
  if (audio) argv.push('-i', audio); else argv.push('-f', 'lavfi', '-t', total.toFixed(3), '-i', 'anullsrc=r=48000:cl=stereo');
  argv.push('-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', DRAFT ? '26' : '23', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '128k', '-ac', '2', '-t', (nFrames / FPS).toFixed(3), '-movflags', '+faststart', tmpSalida);
  const inicio = Date.now();
  await ffmpeg(argv, async (proc) => {
    const escribe = (buf) => new Promise((res, rej) => { if (proc.stdin.write(buf)) res(); else proc.stdin.once('drain', res); proc.stdin.once('error', rej); });
    try {
      let ultimo = -1;
      for (let i = 0; i < nFrames; i++) {
        const t = t0 + (i + 0.0001) / FPS;
        await pagina.evaluate((x) => window.seek(x), t);
        await escribe(await captura());
        const pct = Math.floor((i / nFrames) * 10);
        if (pct !== ultimo) { ultimo = pct; const s = (Date.now() - inicio) / 1000; process.stdout.write(`  ${pct * 10}% (${i}/${nFrames}) ${s.toFixed(0)} s\n`); }
      }
    } catch (e) { console.error(e); }
    proc.stdin.end();
  });
  await navegador.close();
  fs.renameSync(tmpSalida, salida);
  fs.rmSync(tmpDir, { recursive: true, force: true });
  if (!TRAMO) actualizarTiempos(datos);
  const info = execFileSync('ffprobe', ['-v', 'error', '-count_packets', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_packets,r_frame_rate:format=duration,size', '-of', 'default=nw=1', salida]).toString().trim().replace(/\n/g, ' · ');
  console.log(`Hecho en ${((Date.now() - inicio) / 1000).toFixed(0)} s → ${path.relative(RAIZ, salida)}\n  ${info}`);
})().catch((e) => { console.error(e); process.exit(1); });
