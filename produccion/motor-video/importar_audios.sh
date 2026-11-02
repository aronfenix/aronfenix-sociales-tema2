#!/usr/bin/env bash
# Importa las locuciones (ElevenLabs) a produccion/audio/vN/escena-XX.mp3 normalizadas a −16 LUFS.
#   produccion/motor-video/importar_audios.sh <carpeta_con_los_mp3>
# Usa produccion/mapa_audios.tsv (columnas: vídeo, escena, nombre de archivo; separadas por tabulador).
# Al final comprueba que están TODAS las escenas de data/guiones.json (58).
# AUDIO_DIR=/otra/carpeta cambia el destino (solo para pruebas).
set -uo pipefail
if [[ $# -lt 1 || ! -d "$1" ]]; then echo "Uso: $0 <carpeta_con_mp3>"; exit 1; fi
ORIGEN="$(cd "$1" && pwd)"
PROD="$(cd "$(dirname "$0")/.." && pwd)"
RAIZ="$(cd "$PROD/.." && pwd)"
MAPA="$PROD/mapa_audios.tsv"
DEST="${AUDIO_DIR:-$PROD/audio}"
ok=0; faltan=0; errores=0
while IFS=$'\t' read -r v e f || [[ -n "${v:-}" ]]; do
  v="${v//$'\r'/}"; e="${e//$'\r'/}"; f="${f//$'\r'/}"
  [[ -z "$v" || "$v" == \#* ]] && continue
  [[ "${v,,}" == "video" || "${v,,}" == "vídeo" ]] && continue      # cabecera opcional
  n="${v#v}"; esc=$(printf '%02d' "$((10#$e))")
  src="$ORIGEN/$f"
  if [[ ! -f "$src" ]]; then echo "FALTA  v$n escena $esc ← $f"; faltan=$((faltan+1)); continue; fi
  mkdir -p "$DEST/v$n"
  tmp="$DEST/v$n/.escena-$esc.tmp.mp3"
  if ffmpeg -nostdin -y -v error -i "$src" -af "loudnorm=I=-16:TP=-1.5:LRA=11" -ar 44100 -ac 1 -c:a libmp3lame -b:a 128k "$tmp"; then
    mv -f "$tmp" "$DEST/v$n/escena-$esc.mp3"; ok=$((ok+1))
    printf 'ok     v%s escena %s ← %s (%.1f s)\n' "$n" "$esc" "$f" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$DEST/v$n/escena-$esc.mp3")"
  else
    echo "ERROR  v$n escena $esc ← $f"; rm -f "$tmp"; errores=$((errores+1))
  fi
done < "$MAPA"
echo "Importados: $ok · no encontrados: $faltan · errores: $errores"
# Comprobación final contra los guiones
node -e '
const g = require(process.argv[1]); const fs = require("fs"); const path = require("path");
let total = 0, faltan = [];
for (const v of g.videos) for (const e of v.escenas) { total++; const f = path.join(process.argv[2], "v" + v.id, "escena-" + String(e.n).padStart(2, "0") + ".mp3"); if (!fs.existsSync(f)) faltan.push("v" + v.id + "/escena-" + String(e.n).padStart(2, "0")); }
console.log(`Audios presentes: ${total - faltan.length} de ${total}` + (faltan.length ? "\nFaltan: " + faltan.join(", ") : " ✓"));
process.exit(faltan.length ? 2 : 0);
' "$RAIZ/data/guiones.json" "$DEST"
