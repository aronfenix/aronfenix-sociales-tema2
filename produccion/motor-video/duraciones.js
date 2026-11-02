#!/usr/bin/env node
/*
 * Duraciones de escena de cada vídeo y fichero de datos para la animación.
 *
 *   node produccion/motor-video/duraciones.js          → todos los vídeos
 *   node produccion/motor-video/duraciones.js 1 3      → solo esos
 *
 * Para cada escena:
 *   - si existe produccion/audio/vN/escena-XX.mp3 → habla = duración real (ffprobe)
 *   - si no → habla = palabras de `voz` / 2,45 palabras por segundo (ESTIMADA)
 *   dur = pre + habla + 0,6 s de respiro  (pre = 0,5 s solo en la escena 1; la última escena +3 s)
 * La cabecera dura 3 s y va antes de la escena 1.
 *
 * Escribe produccion/motor-video/datos/vN.js (window.DATOS_VIDEO = {...}), que carga anim.html.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..', '..');           // /…/sociales-tema2
const PROD = path.join(RAIZ, 'produccion');
const PPS = 2.45;            // palabras por segundo (estimación)
const RESPIRO = 0.6;
const PRE_PRIMERA = 0.5;
const EXTRA_ULTIMA = 3;
const CABECERA = 3;
// Carpeta de audios (por defecto produccion/audio). AUDIO_DIR permite probar con otra carpeta.
const AUDIO = process.env.AUDIO_DIR ? path.resolve(process.env.AUDIO_DIR) : path.join(PROD, 'audio');

const guiones = () => JSON.parse(fs.readFileSync(path.join(RAIZ, 'data', 'guiones.json'), 'utf8'));
const dos = (n) => String(n).padStart(2, '0');
const r3 = (v) => Math.round(v * 1000) / 1000;

function duracionAudio(f) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', f]).toString().trim();
  const d = parseFloat(out);
  if (!isFinite(d) || d <= 0) throw new Error('Duración no válida en ' + f);
  return d;
}

function calcular(id) {
  const v = guiones().videos.find((x) => x.id === +id);
  if (!v) throw new Error('No existe el vídeo ' + id);
  let t = CABECERA;
  const ultima = v.escenas.length - 1;
  const escenas = v.escenas.map((e, i) => {
    const mp3 = path.join(AUDIO, 'v' + v.id, `escena-${dos(e.n)}.mp3`);
    const hay = fs.existsSync(mp3);
    const palabras = e.voz.split(/\s+/).filter(Boolean).length;
    const habla = hay ? duracionAudio(mp3) : palabras / PPS;
    const pre = i === 0 ? PRE_PRIMERA : 0;
    const dur = pre + habla + RESPIRO + (i === ultima ? EXTRA_ULTIMA : 0);
    const o = { n: e.n, pantalla: e.pantalla, voz: e.voz, inicio: r3(t), dur: r3(dur), pre, habla: r3(habla), estimado: !hay, audio: hay ? (process.env.AUDIO_DIR ? 'file://' + mp3 : `../audio/v${v.id}/escena-${dos(e.n)}.mp3`) : null, mp3: hay ? mp3 : null };
    t += dur;
    return o;
  });
  return {
    id: v.id, slug: v.slug, titulo: v.titulo, subtitulo: v.subtitulo, ideas: v.ideas,
    cabecera: CABECERA, total: r3(t), estimado: escenas.some((e) => e.estimado),
    audiosReales: escenas.filter((e) => !e.estimado).length, escenas,
  };
}

function escribir(id) {
  const d = calcular(id);
  const salida = { ...d, escenas: d.escenas.map(({ mp3, ...e }) => e) };
  const dir = path.join(__dirname, 'datos');
  fs.mkdirSync(dir, { recursive: true });
  const f = path.join(dir, `v${d.id}.js`);
  const tmp = f + '.tmp';
  fs.writeFileSync(tmp, `// GENERADO por duraciones.js — no editar. ${d.estimado ? 'Duraciones ESTIMADAS (faltan audios).' : 'Duraciones reales de los audios.'}\nwindow.DATOS_VIDEO = ${JSON.stringify(salida, null, 1)};\n`);
  fs.renameSync(tmp, f);
  return d;
}

module.exports = { calcular, escribir, CABECERA };

if (require.main === module) {
  const ids = process.argv.slice(2).filter((a) => /^\d+$/.test(a));
  const lista = ids.length ? ids : guiones().videos.map((v) => v.id);
  for (const id of lista) {
    const d = escribir(id);
    const m = Math.floor(d.total / 60), s = (d.total % 60).toFixed(1);
    console.log(`v${d.id} ${d.slug}: ${d.escenas.length} escenas, ${m}:${s.padStart(4, '0')} (${d.total.toFixed(1)} s) · audios reales ${d.audiosReales}/${d.escenas.length}${d.estimado ? ' · ESTIMADO' : ''}`);
    console.log('   inicios: ' + d.escenas.map((e) => e.inicio.toFixed(1)).join(' '));
  }
}
