# Sociales 5.º · Tema 2 «Un voto de confianza» — especificación común

Material para alumnado de 10-11 años (5.º de Primaria, Madrid) que en noviembre de 2026 estudia la organización política de España coincidiendo con las elecciones generales del 29 de noviembre de 2026. Hay huelga educativa y el profesor solo da la mitad de las clases: todo debe funcionar SOLO, en casa o en clase sin profe, en **tablets Android del cole (Chrome, táctil)** y en ordenadores.

Idioma: castellano de España. Tono: claro, cercano, sin infantilismo excesivo.

## Estructura del repositorio (`/home/claude/sociales-tema2`)

```
index.html              ← app final (portal + lecciones vídeo→preguntas)
leccion.html?v=1        ← vídeo n + sus preguntas al terminar
actividades/
  index.html            ← lista de las 5 actividades sueltas
  actividad.html?v=1    ← solo las preguntas del vídeo n
assets/
  css/estilos.css       ← estilos comunes
  js/motor.js           ← motor de preguntas (todos los tipos)
  js/europa.js|.svg     ← mapa para la pregunta tipo «mapa»
  fonts/                ← fuentes locales (sin CDN)
data/
  guiones.json          ← guiones de los vídeos (escenas: pantalla + voz)
  preguntas.json        ← preguntas de comprobación (esquema en `_tipos`)
  tiempos.json          ← inicio en segundos de cada escena de cada vídeo (lo genera el render)
videos/
  v1-quien-decide.mp4 … v5-union-europea.mp4
  poster/vN.jpg         ← fotograma de portada
produccion/             ← fuentes de animación, audio, scripts de render (no hace falta publicarlo)
```

Todo estático, sin servidor, sin CDN (las tablets del cole y GitHub Pages). Rutas relativas. Debe funcionar servido desde `https://aronfenix.github.io/<repo>/`.

## Identidad visual (común a vídeos y actividades)

- Fondo crema `#FBF6EC`, tinta `#2B2D42`, gris suave `#8D99AE`, blanco `#FFFFFF`.
- Colores fijos de los niveles («muñecas rusas»), iguales en todo:
  - Ayuntamiento/municipio `#F4B942` (mostaza)
  - Provincia `#E9C46A` claro (solo si hace falta distinguirla)
  - Comunidad autónoma `#E07A5F` (terracota)
  - Estado `#3D8B85` (verde azulado)
  - Unión Europea `#3B5BA9` (azul) con estrellas `#F6C445`
- Acierto `#2A9D8F`, error `#D1495B` (usar también iconos ✓/✗, nunca solo color).
- Tipografía: Nunito (variable o 400/700/900) instalada localmente desde npm `@fontsource/nunito` o `@fontsource-variable/nunito`, copiada a `assets/fonts/`.
- Estilo: infografía plana, iconos SVG sencillos dibujados a mano en código (formas geométricas redondeadas), sin fotos, sin emojis como iconos principales.
- NEUTRALIDAD POLÍTICA: ningún partido, logo, candidato o color de partido real. Los únicos «partidos» son inventados: «Los del Parque» (icono árbol), «Los del Aparcamiento» (icono coche), «Los de la Pista» (icono canasta), en grises/tonos neutros diferenciados por icono. No usar personas reales salvo mencionar «el rey» como figura genérica (corona, sin rostro).
- Personajes: figuritas planas redondeadas, diversas, sin rasgos de personas reales.

## Vídeos

- 1280×800, 25 fps, H.264 (yuv420p, CRF ~23, preset veryfast) + AAC 128k, `+faststart`. Objetivo < 30 MB cada uno.
- Voz: archivos de audio por escena en `produccion/audio/vN/escena-XX.mp3` (voz clonada del profesor, ElevenLabs). La duración de cada escena = duración de su audio + ~0,6 s de respiro (la primera escena puede tener 0,5 s de silencio inicial). La última escena se alarga ~3 s con las ideas clave en pantalla.
- Subtítulos incrustados (dibujados en la propia animación, abajo, 2 líneas máx., fondo semitransparente), troceados por frases y repartidos en el tiempo de la escena proporcionalmente al número de caracteres.
- Cabecera de 3 s al principio: título y subtítulo del vídeo, número «Vídeo N de 5». (Cuenta como tiempo antes de la escena 1.)
- Animación HTML/SVG/CSS controlada por un reloj determinista (`window.seek(t)`), renderizada fotograma a fotograma con Playwright (Chromium preinstalado: `require('playwright')`, `chromium.launch()` sin opciones; NO instalar Playwright) y ensamblada con ffmpeg.
- Cada escena debe ilustrar lo que dice el campo `pantalla` del guion y moverse durante toda la escena (aparición progresiva sincronizada con la voz, nada de diapositivas estáticas). Los rótulos en pantalla son cortos.
- Generar `data/tiempos.json`: `{ "1": [inicio_escena1_s, inicio_escena2_s, …], … }` medidos en el MP4 final (incluyendo la cabecera).

## Preguntas (motor)

- Esquema en `data/preguntas.json` (`_tipos`). Tipos: clasificar, ordenar, emparejar, huecos, numeros, dhondt, mapa.
- Arrastre con Pointer Events (funciona con dedo y ratón; `touch-action: none` en lo arrastrable). Alternativa accesible: tocar tarjeta y luego tocar destino.
- Botón «Comprobar». Corrección inmediata por elemento (✓/✗). Si hay fallos: mostrar la `explicacion` y «Vuelve a ver el vídeo en el minuto m:ss» (de `tiempos.json` + `escenas`); en la lección, ese enlace salta el vídeo a ese punto. Permitir reintentar. Al acertar, pasar a la siguiente.
- Pantalla final: aciertos a la primera sobre 5, mensaje, botón «Repetir» y «Siguiente vídeo».
- Progreso en `localStorage` (envuelto en try/catch): vídeo visto, preguntas superadas. En el portal, cada lección muestra su estado.
- Letra grande (mín. 18 px en tablet), objetivos táctiles ≥ 44 px, sin scroll horizontal, funciona en vertical y horizontal.
