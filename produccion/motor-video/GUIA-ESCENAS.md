# Guía para escribir un `anim.html` con el motor de vídeo

Referencia completa y comprobada: `produccion/v1/anim.html` (13 escenas). Cópiala como punto de partida.

**Reglas de convivencia (varios agentes en paralelo):**
- **No edites** `comun.js`, `comun.css`, `iconos.js`, `render.js`, `duraciones.js`, `mapas/*`. Son comunes. Si te falta algo, créalo **dentro de tu `anim.html`** (iconos con `M.registrarIcono`, funciones auxiliares locales).
- No toques `data/guiones.json` ni `data/preguntas.json`. `data/tiempos.json` lo escribe `render.js` (cada vídeo solo actualiza su clave).
- Hay 2 CPU: revisa con `capturas.js` y `render.js N --draft`; no lances renders completos a 25 fps salvo que te lo pidan.

## 1. Esqueleto

```html
<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>Vídeo N · Título</title>
<link rel="stylesheet" href="../motor-video/comun.css"></head>
<body>
<script src="../motor-video/comun.js"></script>
<script src="../motor-video/iconos.js"></script>
<script src="../motor-video/mapas/espana.js"></script>   <!-- solo si usas mapas: espana.js / madrid.js / europa.js -->
<script src="../motor-video/datos/vN.js"></script>        <!-- lo genera duraciones.js (render y capturas lo regeneran) -->
<script>
'use strict';
const C = M.C;
const ap = (el, base, t, t0, tipo = 'pop', dur = 0.55) => M.ponAp(el, base, M.aparicion(t, t0, dur, tipo));
const ponP = (el, x, pies, s = 1, extra = {}) => M.pon(el, { x, y: pies - 50 * s, s, ...extra }); // persona con los pies en y=pies

M.escena(1, (E) => {
  // MONTAJE (una vez): crear elementos dentro de E.g y calcular momentos.
  const urna = M.icono('urna', E.g, { papeletas: 3 });
  const rot = M.rotulo(E.g, 'Votar = prestar el poder', { tam: 48, fondo: C.estado });
  const tVot = E.m('votamos');              // instante (s, local) en que la voz dice «votamos»
  // ACTUALIZAR (cada fotograma): solo atributos/transformaciones en función de t.
  return (t, d) => {
    ap(urna, { x: 300, y: 400, s: 2 }, t, 0.2, 'sube');
    ap(rot, { x: 640, y: 90 + M.onda(t, 3, 3) }, t, tVot);
  };
});
// … una M.escena(n, …) por cada escena del guion …
M.cabecera({ iconos: ['urna', 'muneca', 'banderaUE'] });   // iconos opcionales bajo el título
M.iniciar();
</script></body></html>
```

`M.iniciar()` carga la fuente, monta todo, expone `window.seek(t)`, `window.DURACION`, `window.INICIOS` y pone `window.LISTO = true`.
Si falta una escena se dibuja un marcador rojo con su `pantalla` (y aparece un aviso).

## 2. Reloj, escenas y momentos

- La página es **determinista**: lo que se ve depende solo de `t`. Prohibido `Math.random()` (usa `M.azar(semilla)`), `Date`, `setTimeout`, `requestAnimationFrame`, transiciones/animaciones CSS.
- `M.escena(n, fabrica)` — `fabrica(E)` se ejecuta una vez; devuelve `actualizar(t, d)` que se llama en cada fotograma con el **tiempo local** `t` (0…d) y la duración `d` de la escena. La duración cambia cuando lleguen los audios: **no escribas tiempos absolutos de voz**; calcúlalos con `E.m()`.
- Objeto `E`:
  - `E.g` grupo SVG de la escena (lienzo 1280×800). `E.html` capa HTML (casi nunca hace falta).
  - `E.d` duración, `E.pre` (0,5 s en la escena 1, 0 en las demás), `E.habla` duración de la voz, `E.finVoz = pre + habla`.
  - `E.m('palabra clave', k = 1, desfase = 0)` → instante local en que se pronuncia la k-ésima aparición de la clave (búsqueda sin mayúsculas ni tildes, reparto por caracteres con pausas en la puntuación). **Si la clave no está en `voz` sale un aviso** en `capturas.js`/`render.js`: corrígelo. Elige claves inequívocas (`'a la vida'` mejor que `'vida'` si «vida» sale dos veces).
  - `E.f(fraccion)` → instante de una fracción de la voz. `E.voz`, `E.pantalla`, `E.ultima`, `E.datos` (título, ideas…).
- Transición: fundido de 0,45 s entre escenas (la nueva aparece sobre la anterior congelada en su final). La cabecera dura 3 s.
- Los subtítulos los pone el motor solos (frases troceadas en bloques de ≤ 2 líneas, repartidos por caracteres). No los dibujes tú.
- La última escena dura 3 s más; los subtítulos desaparecen 0,5 s después de acabar la voz.

## 3. Animación (utilidades)

| Función | Qué hace |
|---|---|
| `M.p(t, t0, dur)` | progreso lineal 0→1 entre `t0` y `t0+dur` |
| `M.e(t, t0, dur, 'outCubic')` | igual con easing (`lineal, inQuad, outQuad, inOutQuad, inCubic, outCubic, inOutCubic, outBack, outElastic, outBounce`) |
| `M.ventana(t, t0, t1, dur)` | 0→1 en t0, 1→0 en t1 (para destacar un rato) |
| `M.onda(t, periodo, amp, fase)` | oscilación suave; úsala para que **nada quede quieto** |
| `M.aparicion(t, t0, dur, tipo)` | `{o, s, dy}`; tipos `'pop'` (escala con rebote), `'sube'`, `'fundido'`, `'cae'` (cae desde arriba con bote) |
| `M.pon(el, {x, y, s, sx, sy, r, o, dy})` | coloca (traslación, escala, giro en grados, opacidad; o ≤ 0 oculta) |
| `M.ponAp(el, base, ap)` | `pon` combinado con una aparición |
| `M.opacidad(el, o)` | solo opacidad |
| `M.camara(grupo, t, d, {desde: 1, hasta: 1.04, cx, cy, dx, dy})` | zoom/desplazamiento lento durante toda la escena |
| `M.contador(t, t0, dur, desde, hasta)` + `M.num(n)` | contadores («48.000.000», formato es-ES) |
| `M.ponTexto(textEl, str)` | cambia el texto de un `<text>` (contadores, años) |
| `M.escribir(txt, p)` | texto letra a letra |
| `M.mezcla(c1, c2, p)`, `M.aclara(c, p)`, `M.oscurece(c, p)` | colores |
| `M.azar(semilla)` | generador pseudoaleatorio determinista |

Patrón habitual: `ap(el, {x, y, s}, t, E.m('clave') - 0.2)` → aparece un poco antes de que se diga la palabra.
Para que algo desaparezca: `M.ponAp(el, {x, y, o: 1 - M.e(t, tFuera, 0.4)}, M.aparicion(t, tDentro))`.

## 4. Elementos de dibujo

- `M.el(tag, attrs, padre)`, `M.g(padre)`, `M.svg(padre, '<marcado SVG>')`.
- `M.texto(padre, str, {x, y, tam, peso, color, anchor, max, interlineado, borde})` — `max` (px) parte en líneas; `\n` fuerza salto. Devuelve `<text>` con `.ancho`/`.alto`. `M.medir(str, tam, peso)` mide.
- `M.rotulo(padre, str, {tam, fondo, color, borde, grosor, pad, max})` — píldora centrada en (0,0) con `.ancho/.alto`.
- `M.tarjeta(padre, {ancho, alto, fondo, trazo, grosor, radio})`, `M.bocadillo(padre, {ancho, alto, colaX, colaY, pensamiento})` (mete cosas en `b.contenido`), `M.marca(padre, ok, r)` (✓/✗ en círculo, color + símbolo), `M.sombra(padre, rx, ry)`.
- `M.flecha(padre, {x1, y1, x2, y2, curva, color, grosor, discontinua})` → `{g, poner(p)}`; `poner(M.e(t, t0, 0.6))` la dibuja progresivamente.
- `M.ideasClave(E, {tiempos, titulo, y, colores, tTitulo})` → `actualizar(t)`: tarjetas numeradas con `E.datos.ideas` (por defecto aparecen en «Uno:», «Dos:», «Tres:»).
- `M.hemiciclo(padre, {n: 350, cx, cy, rInt, rExt, filas, color})` → `{g, asientos[], pos[]}` ordenados de izquierda a derecha; colorea con `asientos[i].setAttribute('fill', …)`.
- `M.calendarioMes(padre, {anio, mes, ancho, color, titulo})` → `{g, dias: {d: {g, fondo, texto, x, y}}, celda}` (lunes primero; fines de semana en rojo).

## 5. Iconos y personajes (`iconos.js`)

`M.icono(nombre, padre, opciones)` → `<g>` centrado en (0,0), caja ~100×100 (de −50 a 50). Escala con `s` (s: 1 ≈ 100 px). Hoja visual: `produccion/capturas/catalogo-1.png` y `catalogo-2.png` (`node capturas.js catalogo`).

Disponibles: alquiler, arbol, ayuntamiento, balanza (`inclina`), balon, banderaUE (`mastil`), basura, bloque (`ancho, alto, color`), bolsa (impuestos €), bombilla, calendario (`mes, dia, color`), camion, canasta, carretera, casa (`color, tejado`), check, coche (`color`), colegio, cono (obras), corazon, corona, cruz, cupula (parlamento con cúpula; `acento`), dni, edificio (columnas; `color, tejado, simbolo`), escoba, escudo, espiga, estrella, euro (moneda), exclamacion, fabrica, farola (`encendida`), gota (agua), grupo (3 personas), hablar, hoja (medio ambiente), hucha (pensiones), igual, interrogacion, libro (`titulo` con `\n`, `subtitulo`, `color`, `ancho`, `alto`, `tamTitulo`), libroAbierto, libros (biblioteca), lista (censo), llave, logo (`tipo: 'parque'|'aparcamiento'|'pista'`), lupa, maletin, mano, manos (servicios sociales), mascaras (cultura), mayores, mazo (juez), megafono, mesa (`rx, ry`), monedas, mundo, muneca (`color` del nivel, `texto`), nube, paloma, papeleta (`color` p. ej. sepia `#E9D8B4`, `marca: false`), pasaporte, pausa, pensar, policia, rayo (poder), regalo, reloj (`M.ponHora(icono, h, min)`), relojArena (`p`), salvavidas (emergencias), sanidad, senal, silbato, sobre, sol, tractor, trofeo, trono, uniforme, urna (`papeletas: n`).

Personas: `M.persona(padre, opciones)` — pies en y = 50 (usa `ponP`). Opciones: `piel, pelo, ropa, pantalon, peinado ('corto'|'largo'|'mono'|'rizado'|'calvo'|'coleta'), edad ('adulto'|'nino'|'mayor'), silla, uniforme, gafas, serio, cara: false, falda, lleva ('papeleta'|'megafono'|'libro'|'baston'), brazoD, brazoI`. Mueve brazos con `M.brazo(p, 'd', ángulo)` (−160 = brazo derecho arriba; lo que lleve en la mano se mantiene derecho). `M.gente(n, semilla, extra)` da n juegos de opciones variados y deterministas.

Icono propio: `M.registrarIcono('miIcono', (o) => '<path … />')` (caja −50…50, trazo `#2B2D42` de 3,5, esquinas redondeadas, colores de la paleta). `M.monocromo(marcado)` lo vuelve blanco con contorno.

## 6. Mapas (sin red: datos ya convertidos en `mapas/`)

- `M.mapas.espana(padre, {modo: 'provincias'|'ccaa'|'contorno', relleno: color | (id) => color, trazo, grosor, lineasCCAA, vecinos (true), marco (mar + recorte redondeado; por defecto si hay vecinos), mar, marCanarias, recuadro})` → `{g, provincias: {id: path}, ccaa: {id: path}, datos, punto(id) → [x, y]}`. Coordenadas 1000×921; Canarias en recuadro abajo a la izquierda. Ids INE de provincia (`'28'` Madrid, `'42'` Soria, `'08'` Barcelona, `'51'` Ceuta, `'52'` Melilla…) y de comunidad (`'13'` Madrid, `'05'` Canarias, `'18'` Ceuta, `'19'` Melilla…). `datos.provincias[i] = {id, nombre, ccaa, d, et:[x,y], caja}`; `datos.aran` (Val d'Aran) para el mapa de lenguas. Ceuta y Melilla son diminutas: márcalas con un círculo/etiqueta.
- `M.mapas.madrid(padre, {relleno, trazo})` → `{g, municipios: [{id, nombre, path, et}], ancho, alto, capital}` (179 municipios).
- `M.mapas.europa(padre, {relleno: color | (pais) => color, fondo, mar})` → `{g, paises: {ES: {path, nombre, ue, euro, et, pequeno}…}, ciudades: {Bruselas: [x,y]…}}` (1000×820; 27 UE, 21 con euro en 2026; Suiza, Noruega, Reino Unido, etc. fuera).
- Encajar en una caja: `const f = M.mapas.encajar(ancho, alto, {x, y, w, h}); M.pon(mapa.g, f)`.
- Puntos dentro de un territorio: `path.isPointInFill(new DOMPoint(x, y))` (en coordenadas del mapa), con `M.azar` para que sea determinista (ver escena 4 del vídeo 1).
- Fuentes: es-atlas (IGN, CC BY 4.0) y Natural Earth (dominio público).

## 7. Composición y estilo (obligatorio)

- **Zona segura**: contenido en x 40…1240, y 30…660. **Los subtítulos ocupan y ≥ 676** (caja oscura de hasta 2 líneas): nada importante por debajo de 660.
- **Texto**: mínimo 24 px (preferible 28–50); rótulos cortos (2–5 palabras); títulos de escena arriba (y ≈ 60–100) con `M.rotulo` de 44–50 px.
- **Colores de nivel fijos** (`M.C`): ayto `#F4B942`, prov `#E9C46A`, ccaa `#E07A5F`, estado `#3D8B85`, ue `#3B5BA9` + estrellas `#F6C445`. No los uses para otra cosa. Acierto `C.ok` / error `C.error` siempre con ✓/✗ (`M.marca`).
- Fondo crema (lo pone el motor); suelo: `M.el('rect', {x: 0, y: 560–600, width: 1280, height: 300, fill: C.arena})`.
- **Neutralidad**: solo los partidos inventados (`logo` parque/aparcamiento/pista, colores `C.parque`, `C.aparcamiento`, `C.pista`). Nada de colores, logos o personas reales. El rey = `corona` sin rostro.
- **Movimiento continuo**: cada escena debe moverse de principio a fin (apariciones sincronizadas con `E.m`, `M.onda` en lo que ya está, `M.camara`). Evita pantallas vacías al principio: pon algo que encaje con la primera frase desde t ≈ 0,2.
- Cuando cambies de «fase» dentro de una escena, haz desaparecer del todo lo anterior (no lo dejes medio transparente debajo).
- Personas a escala 1–1,35 (100–135 px) con los pies en y ≈ 640–650; iconos principales s 0,8–2.

## 8. Revisión y render

```bash
node produccion/motor-video/duraciones.js N                 # recalcula datos/vN.js (estimado o con audios)
node produccion/motor-video/capturas.js N                   # PNG de cada escena al 10/50/90 % → produccion/capturas/vN/
node produccion/motor-video/capturas.js N --escena 4 --pct 5,30,60,95
node produccion/motor-video/capturas.js N --t 41.2          # instante absoluto
node produccion/motor-video/render.js N --draft             # borrador 8 fps → produccion/borradores/vN-borrador.mp4
node produccion/motor-video/render.js N --draft --desde 60 --hasta 75   # solo un tramo
```

Mira las capturas (`eXX-hoja.png` = los 3 instantes en fila) y corrige solapes, textos cortados, cosas fuera de cuadro, subtítulos que tapan y huecos. Lee los **AVISOS** que imprime `capturas.js` (claves no encontradas, iconos desconocidos, errores de escena).
Vista previa en navegador: abre `produccion/vN/anim.html?preview` (controles, saltar a escenas, ×0,5/×1/×2, audio si existe). `?t=12.5` o `?escena=4&p=0.5` para saltar.
