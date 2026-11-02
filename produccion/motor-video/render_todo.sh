#!/usr/bin/env bash
# Renderiza los 5 vídeos en serie.  produccion/motor-video/render_todo.sh [--draft]
# (Recalcula duraciones con los audios que haya y reescribe data/tiempos.json.)
cd "$(dirname "$0")" || exit 1
fallos=0
for n in 1 2 3 4 5; do
  if [[ ! -f "../v$n/anim.html" ]]; then echo "== v$n: falta produccion/v$n/anim.html, se salta"; fallos=$((fallos+1)); continue; fi
  echo "== Vídeo $n"
  node render.js "$n" "$@" || { echo "== v$n: ERROR"; fallos=$((fallos+1)); }
done
echo "Terminado. Fallos: $fallos"
exit $fallos
