# Producción de los vídeos (Sociales 5.º · Tema 2)

Carpeta de trabajo; no hace falta publicarla. Todo funciona sin red.

```
produccion/
  motor-video/           motor común
    comun.js comun.css   reloj determinista (window.seek), escenas, cabecera, subtítulos, utilidades
    iconos.js            iconos, personas, hemiciclo, calendario, mapas
    mapas/               España (provincias, CCAA), Madrid (179 municipios), Europa — ya generados
    fuentes/             Nunito (OFL)
    datos/vN.js          duraciones de escena (GENERADO por duraciones.js)
    duraciones.js        audio real (ffprobe) + 0,6 s, o estimación (palabras / 2,45) + 0,6 s
    render.js            Playwright → JPEG → ffmpeg → videos/vN-slug.mp4 + póster + data/tiempos.json
    capturas.js          PNG de revisión (y hojas de iconos)
    importar_audios.sh   copia y normaliza las locuciones según mapa_audios.tsv
    render_todo.sh       los 5 vídeos en serie
    GUIA-ESCENAS.md      cómo se escribe un anim.html
  v1/anim.html … v5/anim.html   animación de cada vídeo
  audio/vN/escena-XX.mp3        locuciones (cuando lleguen)
  mapa_audios.tsv               vídeo · escena · nombre del archivo de ElevenLabs
  borradores/  capturas/        salidas de revisión
```

## Flujo

1. **Sin audios** (ahora): las duraciones son estimadas. `node produccion/motor-video/render.js N --draft` para revisar (8 fps, `borradores/`).
2. **Cuando lleguen los audios** (un solo paso cada uno):
   ```bash
   produccion/motor-video/importar_audios.sh /ruta/a/la/carpeta/con/los/mp3   # normaliza a −16 LUFS y comprueba los 58
   produccion/motor-video/render_todo.sh                                        # 5 vídeos finales a 25 fps (≈ 10-12 min cada uno con 2 CPU)
   ```
   Las escenas se estiran solas a la duración real (cada escena = audio + 0,6 s; la 1.ª lleva 0,5 s de entrada; la última, +3 s), los subtítulos y los «momentos» se recalculan, la narración se coloca al inicio de cada escena y `data/tiempos.json` se reescribe con `"_info": {"N": {"estimado": false, …}}`.
3. Salidas: `videos/vN-<slug>.mp4` (1280×800, 25 fps, H.264 CRF 23, AAC 128k, +faststart), `videos/poster/vN.jpg`, `data/tiempos.json` (`{"N": [inicio escena 1, …]}` en segundos, cabecera incluida).

Revisión rápida de una animación: `node produccion/motor-video/capturas.js N` o abrir `produccion/vN/anim.html?preview` en el navegador.

Requisitos: node, ffmpeg/ffprobe y Playwright con Chromium ya instalados (`require('playwright')`).
Mapas regenerables con `node produccion/motor-video/mapas/generar-mapas.mjs <node_modules>` (es-atlas, world-atlas, topojson-client, topojson-simplify, d3-geo, polylabel).
