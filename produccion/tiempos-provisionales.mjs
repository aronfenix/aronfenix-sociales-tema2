// Crea data/tiempos.json PROVISIONAL (solo si no existe) estimando el inicio de cada escena:
// 3 s de cabecera + 0,5 s de silencio inicial; cada escena dura (palabras de `voz` / 140 ppm) + 0,6 s de respiro.
// El render de los vídeos SOBRESCRIBIRÁ este archivo con los tiempos medidos en el MP4 final.
// Uso: node produccion/tiempos-provisionales.mjs [--forzar]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const destino = new URL('../data/tiempos.json', import.meta.url);
if (existsSync(destino) && !process.argv.includes('--forzar')) { console.log('data/tiempos.json ya existe; no se toca.'); process.exit(0); }
const g = JSON.parse(readFileSync(new URL('../data/guiones.json', import.meta.url), 'utf8'));
const salida = { _nota: 'PROVISIONAL: estimado a 140 palabras/min + 3 s de cabecera. El render de los vídeos sobrescribirá este archivo con los tiempos reales medidos en el MP4.' };
for (const v of g.videos) {
  let t = 3 + 0.5; const inicios = [];
  for (const e of v.escenas) { inicios.push(Math.round(t * 10) / 10); t += e.voz.split(/\s+/).filter(Boolean).length / 140 * 60 + 0.6; }
  salida[v.id] = inicios;
}
writeFileSync(destino, JSON.stringify(salida, null, 1) + '\n');
console.log('Escrito data/tiempos.json provisional');
