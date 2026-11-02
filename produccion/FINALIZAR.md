# Pasos pendientes para terminar (cuando Álvaro vuelva)

Estado: animaciones, actividades y app hechas. Faltan la voz real y la publicación.

## 1. Traer los audios (necesita la carpeta conectada)

Álvaro añade `C:\Users\alvar\Documents\VideosClase` a la conversación («Añadir carpeta» en la app de escritorio).

- Los 58 audios se llaman `tts_*_20261102_0747..0751*.mp3` (el `tts_En_un_20261102_074118.mp3` fue una prueba y no se usa).
- La correspondencia vídeo → escena → archivo está en `produccion/mapa_audios.tsv`.
- Se traen con `device_stage_files`: como mucho 50 por llamada, así que hacen falta dos llamadas. Llegan a `/mnt/user-data/uploads/VideosClase/`.

## 2. Montar los vídeos con voz

```bash
cd /home/claude/sociales-tema2
produccion/motor-video/importar_audios.sh /mnt/user-data/uploads/VideosClase   # copia, normaliza y comprueba los 58
produccion/motor-video/render_todo.sh                                            # de 5 a 9 min por vídeo
```

El render reescribe `data/tiempos.json` con las duraciones reales. Las preguntas y la app lo leen solas.

## 3. Publicar

Álvaro crea un repositorio vacío `aronfenix/sociales-tema2`. Después:

- `add_repo`, con `access: push`;
- `git remote add origin …` y `git push -u origin main`;
- en GitHub, activar Pages: Settings → Pages → rama main, carpeta `/`.

Dirección final: https://aronfenix.github.io/sociales-tema2/

Como alternativa sin repositorio, se puede publicar como artifact o pasarle un zip.
