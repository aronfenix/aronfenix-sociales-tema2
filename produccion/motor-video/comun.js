/* Motor de vídeos animados — núcleo común (Sociales 5.º · Tema 2 «Un voto de confianza»)
 *
 * Reloj determinista: la página expone window.seek(t) y window.DURACION (segundos).
 * Nada depende del reloj real salvo la reproducción en la vista previa (?preview).
 * Documentación: GUIA-ESCENAS.md
 */
(function () {
  'use strict';
  const M = (window.M = window.M || {});
  const NS = 'http://www.w3.org/2000/svg';
  M.NS = NS;
  M.W = 1280; M.H = 800; M.FPS = 25;
  M.TRANSICION = 0.45;          // fundido entre escenas (s)
  M.ZONA = { x0: 40, x1: 1240, y0: 30, y1: 660 };   // zona segura de contenido (encima de subtítulos)

  // ───────────── Paleta (SPEC) ─────────────
  M.C = {
    crema: '#FBF6EC', tinta: '#2B2D42', gris: '#8D99AE', blanco: '#FFFFFF',
    ayto: '#F4B942', prov: '#E9C46A', ccaa: '#E07A5F', estado: '#3D8B85', ue: '#3B5BA9', estrella: '#F6C445',
    ok: '#2A9D8F', error: '#D1495B',
    // neutros de apoyo
    papel: '#FFFDF7', arena: '#EFE6D2', arenaOsc: '#D9CBAE', grisClaro: '#D6DBE4', grisOsc: '#5C6378', tierra: '#C9A97C',
    cielo: '#DCEBF0', mar: '#DCEBF0', tierraMapa: '#EAE4D8', verde: '#6BAA75', verdeOsc: '#4E8A5A', tronco: '#9C6B4E',
    // «partidos» inventados: tonos neutros diferenciados por icono
    parque: '#8F9A86', aparcamiento: '#8A8FA3', pista: '#A8957F',
  };
  M.NIVELES = {
    municipio: { color: M.C.ayto, nombre: 'Ayuntamiento' }, provincia: { color: M.C.prov, nombre: 'Provincia' },
    comunidad: { color: M.C.ccaa, nombre: 'Comunidad autónoma' }, estado: { color: M.C.estado, nombre: 'Estado' },
    ue: { color: M.C.ue, nombre: 'Unión Europea' },
  };
  M.PIEL = ['#F3CDAE', '#E2AE8C', '#C98D66', '#A06B48', '#74503A', '#F7DCC4'];
  M.PELO = ['#2B2D42', '#5A3825', '#8B5A2B', '#D9A441', '#B9B4AE', '#A0522D', '#1F1A17'];
  M.ROPA = ['#9D8EC7', '#E8A0BF', '#8CC0DE', '#A3B16B', '#D9C5A0', '#8E6C8A', '#7D8597', '#F2A65A', '#6FB3A8', '#C47A6A'];

  // ───────────── Matemáticas y easing ─────────────
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  M.clamp = clamp;
  M.lerp = (a, b, p) => a + (b - a) * p;
  M.ease = {
    lineal: (p) => p,
    inQuad: (p) => p * p, outQuad: (p) => 1 - (1 - p) * (1 - p), inOutQuad: (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2),
    inCubic: (p) => p * p * p, outCubic: (p) => 1 - Math.pow(1 - p, 3), inOutCubic: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
    outBack: (p) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
    outElastic: (p) => (p === 0 ? 0 : p === 1 ? 1 : Math.pow(2, -10 * p) * Math.sin((p * 10 - 0.75) * (2 * Math.PI / 3)) + 1),
    outBounce: (p) => { const n = 7.5625, d = 2.75; if (p < 1 / d) return n * p * p; if (p < 2 / d) return n * (p -= 1.5 / d) * p + 0.75; if (p < 2.5 / d) return n * (p -= 2.25 / d) * p + 0.9375; return n * (p -= 2.625 / d) * p + 0.984375; },
  };
  /** Progreso lineal 0..1 entre t0 y t0+dur. */
  M.p = (t, t0, dur = 0.6) => (dur <= 0 ? (t >= t0 ? 1 : 0) : clamp((t - t0) / dur));
  /** Progreso con easing (por defecto outCubic). */
  M.e = (t, t0, dur = 0.6, ease = 'outCubic') => M.ease[ease](M.p(t, t0, dur));
  /** Sube en [t0, t0+dur] y baja en [t1, t1+dur]: 0→1→0. */
  M.ventana = (t, t0, t1, dur = 0.4) => Math.min(M.e(t, t0, dur), 1 - M.e(t, t1, dur, 'inOutQuad'));
  /** Oscilación suave (para que nada quede quieto): -amp..amp */
  M.onda = (t, periodo = 3, amp = 1, fase = 0) => amp * Math.sin((t / periodo) * 2 * Math.PI + fase);
  /** Aparición «pop»: devuelve {o, s, dy} para M.pon. */
  M.aparicion = (t, t0, dur = 0.55, tipo = 'pop') => {
    const p = M.p(t, t0, dur);
    if (tipo === 'fundido') return { o: M.ease.outQuad(p), s: 1, dy: 0 };
    if (tipo === 'sube') return { o: M.ease.outQuad(clamp(p * 1.6)), s: 1, dy: (1 - M.ease.outCubic(p)) * 40 };
    if (tipo === 'cae') return { o: clamp(p * 3), s: 1, dy: -(1 - M.ease.outBounce(p)) * 260 };
    return { o: clamp(p * 2.5), s: p <= 0 ? 0.001 : Math.max(0.001, M.ease.outBack(p)), dy: 0 };
  };
  M.azar = (semilla = 1) => { let a = semilla >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  M.num = (n) => new Intl.NumberFormat('es-ES').format(Math.round(n));
  M.contador = (t, t0, dur, desde, hasta, ease = 'outCubic') => M.lerp(desde, hasta, M.e(t, t0, dur, ease));
  const hex2rgb = (h) => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
  M.mezcla = (c1, c2, p) => { const a = hex2rgb(c1), b = hex2rgb(c2); return '#' + a.map((v, i) => Math.round(M.lerp(v, b[i], clamp(p))).toString(16).padStart(2, '0')).join(''); };
  M.aclara = (c, p = 0.3) => M.mezcla(c, '#FFFFFF', p);
  M.oscurece = (c, p = 0.25) => M.mezcla(c, '#000000', p);

  // ───────────── DOM / SVG ─────────────
  M.el = (tag, attrs = {}, padre = null) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
    if (padre) padre.appendChild(e);
    return e;
  };
  M.g = (padre, attrs = {}) => M.el('g', attrs, padre);
  /** Grupo SVG con marcado en texto (coordenadas propias). */
  M.svg = (padre, marcado, attrs = {}) => { const g = M.g(padre, attrs); g.innerHTML = marcado; return g; };
  M.htmlEl = (tag, attrs = {}, padre = null) => { const e = document.createElement(tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (padre) padre.appendChild(e); return e; };
  const f2 = (v) => Math.round(v * 100) / 100;
  /** Coloca un elemento: posición, escala, giro (grados) y opacidad. o<=0.001 lo oculta. */
  M.pon = (el, o = {}) => {
    if (!el) return el;
    const x = o.x || 0, y = (o.y || 0) + (o.dy || 0), s = o.s === undefined ? 1 : o.s;
    const sx = o.sx === undefined ? s : o.sx * s, sy = o.sy === undefined ? s : o.sy * s;
    let tr = `translate(${f2(x + (o.dx || 0))} ${f2(y)})`;
    if (o.r) tr += ` rotate(${f2(o.r)})`;
    if (sx !== 1 || sy !== 1) tr += ` scale(${f2(Math.max(sx, 0.0001))} ${f2(Math.max(sy, 0.0001))})`;
    el.setAttribute('transform', tr);
    if (o.o !== undefined) { const op = clamp(o.o); el.setAttribute('opacity', f2(op)); el.style.display = op <= 0.001 ? 'none' : ''; }
    return el;
  };
  /** Igual que pon() pero mezclando una aparición (M.aparicion). */
  M.ponAp = (el, base, ap) => M.pon(el, { ...base, o: (base.o === undefined ? 1 : base.o) * ap.o, s: (base.s === undefined ? 1 : base.s) * ap.s, dy: (base.dy || 0) + ap.dy });
  M.opacidad = (el, o) => { const op = clamp(o); el.setAttribute('opacity', f2(op)); el.style.display = op <= 0.001 ? 'none' : ''; return el; };

  // ───────────── Texto ─────────────
  const lienzoMedida = document.createElement('canvas').getContext('2d');
  M.medir = (txt, tam = 40, peso = 800) => { lienzoMedida.font = `${peso} ${tam}px Nunito`; return lienzoMedida.measureText(txt).width; };
  /** Parte un texto en líneas de ancho ≤ max (px) con la fuente dada. */
  M.partir = (txt, max, tam = 40, peso = 800) => {
    const pal = String(txt).split(/\s+/).filter(Boolean); const lineas = []; let act = '';
    for (const w of pal) { const prueba = act ? act + ' ' + w : w; if (act && M.medir(prueba, tam, peso) > max) { lineas.push(act); act = w; } else act = prueba; }
    if (act) lineas.push(act);
    return lineas;
  };
  /**
   * Texto SVG. opciones: x, y, tam (px), peso, color, anchor ('middle'|'start'|'end'),
   * max (ancho máx. → varias líneas), interlineado (×tam), base ('central'|'alphabetic'), borde (color de contorno), grosorBorde.
   * Con varias líneas, y es el centro vertical del bloque. Devuelve <text> con .ancho y .alto.
   */
  M.texto = (padre, txt, o = {}) => {
    const tam = o.tam || 40, peso = o.peso || 800, il = o.interlineado || 1.15;
    const lineas = o.max ? M.partir(txt, o.max, tam, peso) : String(txt).split('\n');
    const t = M.el('text', {
      x: o.x || 0, y: o.y || 0, 'font-size': tam, 'font-weight': peso, fill: o.color || M.C.tinta,
      'text-anchor': o.anchor || 'middle', 'dominant-baseline': o.base || 'central', 'letter-spacing': o.espaciado,
      'font-style': o.cursiva ? 'italic' : undefined,
    }, padre);
    if (o.borde) { t.setAttribute('stroke', o.borde); t.setAttribute('stroke-width', o.grosorBorde || 8); t.setAttribute('paint-order', 'stroke'); t.setAttribute('stroke-linejoin', 'round'); }
    if (lineas.length === 1) t.textContent = lineas[0];
    else lineas.forEach((l, i) => { const s = M.el('tspan', { x: o.x || 0, dy: i === 0 ? -((lineas.length - 1) / 2) * tam * il : tam * il }, t); s.textContent = l; });
    t.ancho = Math.max(...lineas.map((l) => M.medir(l, tam, peso)));
    t.alto = lineas.length * tam * il; t.lineas = lineas;
    return t;
  };
  /** Cambia el contenido de un <text> de una línea (contadores). */
  M.ponTexto = (t, txt) => { if (t.textContent !== txt) t.textContent = txt; };
  /**
   * Rótulo: píldora de color con texto (centrada en 0,0). opciones: tam, fondo, color, pad, radio, max, peso, borde (trazo).
   * Devuelve <g> con .ancho/.alto.
   */
  M.rotulo = (padre, txt, o = {}) => {
    const g = M.g(padre); const tam = o.tam || 40, pad = o.pad === undefined ? tam * 0.55 : o.pad;
    const t0 = M.texto(null, txt, { tam, peso: o.peso || 850, max: o.max, interlineado: o.interlineado });
    const ancho = (o.ancho || t0.ancho + pad * 2), alto = o.alto || t0.alto + tam * 0.5;
    M.el('rect', { x: -ancho / 2, y: -alto / 2, width: ancho, height: alto, rx: o.radio === undefined ? Math.min(alto / 2, 26) : o.radio, fill: o.fondo || M.C.tinta, stroke: o.borde, 'stroke-width': o.borde ? (o.grosor || 4) : undefined }, g);
    M.texto(g, txt, { tam, peso: o.peso || 850, color: o.color || M.C.blanco, max: o.max, interlineado: o.interlineado });
    g.ancho = ancho; g.alto = alto;
    return g;
  };
  /** Revela un texto letra a letra (p de 0 a 1). */
  M.escribir = (txt, p) => txt.slice(0, Math.round(txt.length * clamp(p)));

  // ───────────── Formas útiles ─────────────
  /** Bocadillo de cómic centrado en 0,0 de ancho×alto; cola hacia (cx, cy) relativa al centro. */
  M.bocadillo = (padre, o = {}) => {
    const w = o.ancho || 200, h = o.alto || 150, r = o.radio || Math.min(w, h) * 0.3;
    const cx = o.colaX === undefined ? -w * 0.15 : o.colaX, cy = o.colaY === undefined ? h / 2 + 40 : o.colaY;
    const g = M.g(padre);
    const base = Math.min(w, h) * 0.18; const bx = clamp(cx, -w / 2 + r, w / 2 - r);
    const fill = o.fondo || M.C.blanco, st = o.trazo || M.C.tinta, sw = o.grosor === undefined ? 4 : o.grosor;
    if (o.pensamiento) {
      M.el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: h / 2, fill, stroke: st, 'stroke-width': sw }, g);
      [[0.35, 0.16], [0.7, 0.1]].forEach(([k, rr]) => M.el('circle', { cx: M.lerp(bx, cx, k), cy: M.lerp(h / 2, cy, k) + 6, r: Math.min(w, h) * rr, fill, stroke: st, 'stroke-width': sw }, g));
    } else {
      M.el('path', { d: `M${bx - base},${h / 2 - sw} L${cx},${cy} L${bx + base},${h / 2 - sw}Z`, fill, stroke: st, 'stroke-width': sw, 'stroke-linejoin': 'round' }, g);
      M.el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: r, fill, stroke: st, 'stroke-width': sw }, g);
      M.el('path', { d: `M${bx - base + sw},${h / 2 - sw / 2 - 1} L${bx + base - sw},${h / 2 - sw / 2 - 1}`, stroke: fill, 'stroke-width': sw + 2 }, g);
    }
    g.contenido = M.g(g);
    return g;
  };
  /**
   * Flecha (recta o curva) que se dibuja progresivamente. o: x1,y1,x2,y2, curva (px de flecha lateral), color, grosor, punta, discontinua.
   * Devuelve {g, poner(p)} — p de 0 a 1 = cuánto se ha dibujado.
   */
  M.flecha = (padre, o) => {
    const g = M.g(padre);
    const { x1, y1, x2, y2 } = o; const curva = o.curva || 0, color = o.color || M.C.tinta, gr = o.grosor || 7, pu = o.punta || gr * 2.8;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
    const qx = mx - (dy / L) * curva, qy = my + (dx / L) * curva;
    const ang = (Math.atan2(y2 - qy, x2 - qx) * 180) / Math.PI;
    const ex = x2 - Math.cos((ang * Math.PI) / 180) * pu * 0.6, ey = y2 - Math.sin((ang * Math.PI) / 180) * pu * 0.6;
    const camino = M.el('path', { d: `M${x1},${y1} Q${qx},${qy} ${ex},${ey}`, fill: 'none', stroke: color, 'stroke-width': gr, 'stroke-linecap': 'round' }, g);
    let largo = 0; try { largo = camino.getTotalLength(); } catch (e) { largo = 0; }
    if (!largo) largo = Math.hypot(ex - x1, ey - y1) * 1.1 + 1;
    const raya = gr * 0.2, hueco = gr * 2.2;
    const punta = M.el('path', { d: `M0,0 L${-pu},${-pu * 0.62} L${-pu * 0.78},0 L${-pu},${pu * 0.62}Z`, fill: color, stroke: color, 'stroke-width': 2, 'stroke-linejoin': 'round' }, g);
    const poner = (p) => {
      p = clamp(p);
      if (o.discontinua) {
        const visible = p * largo, paso = raya + hueco, n = Math.floor(visible / paso), resto = visible - n * paso;
        const arr = []; for (let i = 0; i < n; i++) arr.push(raya, hueco);
        arr.push(Math.min(raya, resto), largo + 10);
        camino.setAttribute('stroke-dasharray', arr.map(f2).join(' '));
      } else { camino.setAttribute('stroke-dasharray', `${f2(largo)} ${f2(largo + 10)}`); camino.setAttribute('stroke-dashoffset', f2(largo * (1 - p))); }
      M.pon(punta, { x: x2, y: y2, r: ang, s: clamp((p - 0.85) / 0.15), o: p > 0.85 ? 1 : 0 });
      M.opacidad(g, p > 0 ? 1 : 0);
    };
    poner(0);
    return { g, poner };
  };
  /** Marca ✓ / ✗ en círculo (centrada, radio r). */
  M.marca = (padre, ok = true, r = 30) => M.svg(padre,
    `<circle r="${r}" fill="${ok ? M.C.ok : M.C.error}" stroke="#fff" stroke-width="${r * 0.12}"/>` +
    (ok ? `<path d="M${-r * 0.45},${r * 0.02} L${-r * 0.12},${r * 0.35} L${r * 0.5},${-r * 0.32}" fill="none" stroke="#fff" stroke-width="${r * 0.2}" stroke-linecap="round" stroke-linejoin="round"/>`
      : `<path d="M${-r * 0.36},${-r * 0.36} L${r * 0.36},${r * 0.36} M${r * 0.36},${-r * 0.36} L${-r * 0.36},${r * 0.36}" stroke="#fff" stroke-width="${r * 0.2}" stroke-linecap="round"/>`));
  /** Tarjeta redondeada (rect) centrada. */
  M.tarjeta = (padre, o = {}) => M.el('rect', { x: -(o.ancho || 200) / 2, y: -(o.alto || 120) / 2, width: o.ancho || 200, height: o.alto || 120, rx: o.radio === undefined ? 22 : o.radio, fill: o.fondo || M.C.blanco, stroke: o.trazo || (o.sinTrazo ? undefined : M.C.tinta), 'stroke-width': o.sinTrazo ? undefined : (o.grosor || 4) }, padre);
  /** Sombra suave en el suelo (elipse). */
  M.sombra = (padre, rx = 40, ry = 9) => M.el('ellipse', { rx, ry, fill: M.C.tinta, opacity: 0.12 }, padre);

  // ───────────── Datos y escenas ─────────────
  const ESCENAS = {};
  let CABECERA_OPC = {};
  M.errores = (window.ERRORES = window.ERRORES || []);
  const avisa = (msg) => { if (!M.errores.includes(msg)) { M.errores.push(msg); console.error(msg); } };
  M.avisa = avisa;

  /** Registra la escena n. fabrica(E) monta los elementos y devuelve actualizar(t, d). */
  M.escena = (n, fabrica) => { ESCENAS[n] = fabrica; };
  /** Opciones de la cabecera: { iconos: ['urna', ...], color: '#...' }. */
  M.cabecera = (o) => { CABECERA_OPC = o || {}; };

  // Peso temporal de un texto: caracteres + pausas en la puntuación (lo mismo para subtítulos y momentos).
  const pesoTxt = (s) => { let w = 0; const cs = [...s]; for (let i = 0; i < cs.length; i++) { const ch = cs[i]; w += 1; if (ch === '.' && /\d/.test(cs[i - 1] || '') && /\d/.test(cs[i + 1] || '')) continue; /* 50.000: el punto de miles no es pausa */ if ('.?!…'.includes(ch)) w += 7; else if (':;'.includes(ch)) w += 5; else if (',' === ch) w += 3; } return w; };
  const normal = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  /** Trocea la voz en bloques de ≤2 líneas para subtítulos con su tiempo relativo (fracción 0..1). */
  function trocear(voz) {
    const TAM = 34, PESO = 750, MAX = 1100;
    const frases = voz.match(/(?:[^.!?…]|\.(?=\d))+(?:[.!?…]+[»"”]?|$)/g) || [voz]; // «50.000» no corta la frase
    const bloques = [];
    const cabe2 = (txt) => M.partir(txt, MAX, TAM, PESO).length <= 2;
    for (let fr of frases) {
      fr = fr.trim(); if (!fr) continue;
      if (cabe2(fr)) { bloques.push(fr); continue; }
      // Trocear por cláusulas (comas, dos puntos, punto y coma) y empaquetar.
      const clausulas = fr.match(/[^,;:]+[,;:]?/g).map((c) => c.trim()).filter(Boolean);
      let act = '';
      for (const c of clausulas) {
        const prueba = act ? act + ' ' + c : c;
        if (cabe2(prueba)) { act = prueba; continue; }
        if (act) bloques.push(act);
        if (cabe2(c)) { act = c; continue; }
        // cláusula larguísima: por palabras
        const pal = c.split(/\s+/); act = '';
        for (const w of pal) { const p2 = act ? act + ' ' + w : w; if (act && !cabe2(p2)) { bloques.push(act); act = w; } else act = p2; }
      }
      if (act) bloques.push(act);
    }
    // Equilibrar las dos líneas de cada bloque.
    const total = bloques.reduce((a, b) => a + pesoTxt(b), 0) || 1;
    let acc = 0;
    return bloques.map((b) => {
      let lineas = M.partir(b, MAX, TAM, PESO);
      if (lineas.length === 2) {
        const pal = b.split(/\s+/); let mejor = null;
        for (let i = 1; i < pal.length; i++) {
          const a = pal.slice(0, i).join(' '), c = pal.slice(i).join(' ');
          const wa = M.medir(a, TAM, PESO), wc = M.medir(c, TAM, PESO);
          if (wa > MAX || wc > MAX) continue;
          const coste = Math.max(wa, wc) - (/[,;:]$/.test(pal[i - 1]) ? 60 : 0);
          if (!mejor || coste < mejor.coste) mejor = { coste, l: [a, c] };
        }
        if (mejor) lineas = mejor.l;
      }
      const ini = acc / total; acc += pesoTxt(b);
      return { lineas, ini, fin: acc / total };
    });
  }

  let DATOS = null, capas = [], subt = null, subtCaja = null, subtActual = null, cab = 3;
  M.datos = () => DATOS;

  function crearEscenario() {
    const preview = /[?&]preview/.test(location.search);
    document.body.classList.add(preview ? 'preview' : 'render');
    const marco = M.htmlEl('div', { id: 'marco' }, document.body);
    const esc = M.htmlEl('div', { id: 'escenario' }, marco);
    const svg = M.el('svg', { id: 'lienzo', viewBox: '0 0 1280 800', width: 1280, height: 800 }, esc);
    M.htmlEl('div', { id: 'capa-html' }, esc);
    subt = M.htmlEl('div', { id: 'subtitulos', class: 'oculto' }, esc);
    subtCaja = M.htmlEl('div', { class: 'caja' }, subt);
    M.raiz = svg; M.escenario = esc; M.marco = marco;
    M.defs = M.el('defs', {}, svg);
    return preview;
  }

  function construirCabecera(capa) {
    const g = capa.g; const D = DATOS;
    const col = CABECERA_OPC.color || M.C.estado;
    M.el('rect', { width: 1280, height: 800, fill: M.C.crema }, g);
    // bandas de colores de los niveles (las «muñecas»)
    const franjas = M.g(g);
    const cols = [M.C.ayto, M.C.ccaa, M.C.estado, M.C.ue];
    cols.forEach((c, i) => M.el('rect', { x: i * 320, y: 0, width: 320, height: 18, fill: c }, franjas));
    const deco = M.g(g);
    const bolas = [];
    const r = M.azar(D.id * 17);
    for (let i = 0; i < 14; i++) bolas.push({ el: M.el('circle', { r: 10 + r() * 34, fill: cols[i % 4], opacity: 0.16 }, deco), x: r() * 1280, y: 60 + r() * 680, f: r() * 6 });
    const etiqueta = M.rotulo(g, `Vídeo ${D.id} de 5`, { tam: 34, fondo: col });
    const tit = M.texto(g, D.titulo, { tam: D.titulo.length > 22 ? 80 : 96, peso: 900, color: M.C.tinta, max: 1100 });
    const sub = M.texto(g, D.subtitulo, { tam: 44, peso: 700, color: M.C.grisOsc, max: 1100 });
    const tema = M.texto(g, 'Sociales 5.º · Tema 2 · Un voto de confianza', { tam: 26, peso: 800, color: M.C.gris });
    const iconos = (CABECERA_OPC.iconos || []).map((n) => (M.icono ? M.icono(n, g) : null)).filter(Boolean);
    return (t) => {
      bolas.forEach((b) => M.pon(b.el, { x: b.x + M.onda(t, 5, 14, b.f), y: b.y + M.onda(t, 4, 10, b.f + 1) }));
      M.ponAp(etiqueta, { x: 640, y: 215 }, M.aparicion(t, 0.1, 0.5));
      const yt = 360 - (tit.alto - 110) / 2;
      M.ponAp(tit, { x: 640, y: yt }, M.aparicion(t, 0.25, 0.6, 'sube'));
      M.ponAp(sub, { x: 640, y: yt + tit.alto / 2 + 60 }, M.aparicion(t, 0.55, 0.6, 'sube'));
      M.ponAp(tema, { x: 640, y: 740 }, M.aparicion(t, 0.8, 0.6, 'fundido'));
      const n = iconos.length;
      iconos.forEach((ic, i) => M.ponAp(ic, { x: 640 + (i - (n - 1) / 2) * 130, y: 590 + M.onda(t, 2.2, 6, i), s: 0.95 }, M.aparicion(t, 0.9 + i * 0.12, 0.5)));
    };
  }

  function placeholder(E) {
    const txt = M.texto(E.g, `Escena ${E.n} (sin dibujar): ${E.pantalla}`, { tam: 30, peso: 700, max: 1000, x: 640, y: 330, color: M.C.error });
    return () => {};
  }

  /** Construye todo. Llamar al final del anim.html: M.iniciar(). */
  M.iniciar = async () => {
    DATOS = window.DATOS_VIDEO;
    if (!DATOS) { document.body.textContent = 'Falta datos/vN.js (ejecuta: node produccion/motor-video/duraciones.js N)'; return; }
    const preview = crearEscenario();
    await Promise.all(['400', '700', '750', '800', '850', '900'].map((w) => document.fonts.load(`${w} 40px Nunito`, 'ÁÉÍÓÚáéíóúñÑ¿?¡!€ºª')));
    await document.fonts.ready;
    if (!document.fonts.check('800 40px Nunito')) avisa('La fuente Nunito no se ha cargado');
    cab = DATOS.cabecera;
    const raiz = M.raiz; const capaHtml = M.escenario.querySelector('#capa-html');
    // cabecera
    const gc = M.g(raiz, { class: 'escena', id: 'cabecera' });
    const capC = { g: gc, html: M.htmlEl('div', {}, capaHtml), inicio: 0, d: cab };
    capC.actualizar = construirCabecera(capC);
    capas = [capC];
    for (const e of DATOS.escenas) {
      const g = M.g(raiz, { class: 'escena', id: 'escena-' + e.n });
      const html = M.htmlEl('div', {}, capaHtml);
      const vozN = normal(e.voz); const totalPeso = pesoTxt(e.voz);
      const E = {
        n: e.n, d: e.dur, pre: e.pre, habla: e.habla, finVoz: e.pre + e.habla, voz: e.voz, pantalla: e.pantalla, g, html,
        ultima: e.n === DATOS.escenas[DATOS.escenas.length - 1].n, datos: DATOS,
        /** Instante (s, tiempo local) en que se dice `clave` (k-ésima aparición). desfase: fracción del propio texto clave (0 = inicio, 1 = final). */
        m(clave, k = 1, desfase = 0) {
          const c = normal(clave); let idx = -1;
          for (let i = 0; i < k; i++) { idx = vozN.indexOf(c, idx + 1); if (idx < 0) break; }
          if (idx < 0) { avisa(`Escena ${e.n}: no encuentro «${clave}» (aparición ${k}) en la voz`); return e.pre; }
          const antes = pesoTxt(e.voz.slice(0, idx + Math.round(c.length * desfase)));
          return e.pre + (antes / totalPeso) * e.habla;
        },
        /** Fracción de la voz → instante local. */
        f(fr) { return e.pre + fr * e.habla; },
      };
      E.subtitulos = trocear(e.voz).map((b) => ({ lineas: b.lineas, ini: e.pre + b.ini * e.habla, fin: e.pre + b.fin * e.habla }));
      let act = null;
      try { act = (ESCENAS[e.n] || placeholder)(E); } catch (err) { avisa(`Escena ${e.n} (montaje): ${err.message}`); act = null; }
      if (!ESCENAS[e.n]) avisa(`Escena ${e.n} sin dibujar (se usa marcador)`);
      capas.push({ g, html, E, inicio: e.inicio, d: e.dur, actualizar: act || (() => {}) });
    }
    window.DURACION = DATOS.total;
    window.INICIOS = DATOS.escenas.map((e) => e.inicio);
    window.seek = seek;
    const q = new URLSearchParams(location.search);
    let t0 = parseFloat(q.get('t') || '0');
    if (q.get('escena')) { const c = capas[+q.get('escena')]; if (c) t0 = c.inicio + (parseFloat(q.get('p') || '0.5')) * c.d; }
    seek(t0);
    if (preview) montarControles(t0);
    window.LISTO = true;
    document.dispatchEvent(new Event('video-listo'));
  };

  function ponSubtitulo(clave, lineas) {
    if (clave === subtActual) return;
    subtActual = clave;
    if (!lineas) { subt.classList.add('oculto'); return; }
    subt.classList.remove('oculto');
    subtCaja.innerHTML = '';
    for (const l of lineas) { const s = document.createElement('span'); s.textContent = l; subtCaja.appendChild(s); }
  }

  function dibujaCapa(c, t, op) {
    c.g.style.display = op > 0 ? '' : 'none'; c.html.style.display = op > 0 ? '' : 'none';
    if (op <= 0) return;
    c.g.setAttribute('opacity', f2(op)); c.html.style.opacity = f2(op);
    try { c.actualizar(clamp(t, 0, c.d), c.d); } catch (err) { avisa(`Escena ${c.E ? c.E.n : 'cabecera'} (t=${t.toFixed(2)}): ${err.message}`); }
  }

  /** Lleva la animación al instante T (segundos). Síncrono. */
  function seek(T) {
    T = clamp(+T || 0, 0, Math.max(0, DATOS.total - 0.0001));
    M.T = T;
    let i = 0;
    for (let k = 0; k < capas.length; k++) if (T >= capas[k].inicio) i = k;
    const c = capas[i]; const tl = T - c.inicio;
    const fundido = i > 0 && tl < M.TRANSICION;
    capas.forEach((k, j) => {
      if (j === i) dibujaCapa(k, tl, fundido ? M.ease.inOutQuad(tl / M.TRANSICION) : 1);
      else if (fundido && j === i - 1) dibujaCapa(k, k.d, 1);
      else dibujaCapa(k, 0, 0);
    });
    // orden: la escena entrante encima
    if (fundido && c.g.nextSibling) M.raiz.appendChild(c.g);
    // subtítulos
    if (i === 0) ponSubtitulo(null);
    else {
      const subs = c.E.subtitulos; let b = null;
      for (let k = 0; k < subs.length; k++) if (tl >= subs[k].ini - 0.05) b = k;
      const fin = c.E.ultima ? c.E.finVoz + 0.5 : c.d + 1;
      if (b === null && tl < 0.6) b = 0;
      if (b === null || tl > fin) ponSubtitulo(null);
      else ponSubtitulo(c.E.n + ':' + b, subs[b].lineas);
    }
    if (M.alSeek) M.alSeek(T);
    return T;
  }

  // ───────────── Vista previa ─────────────
  function montarControles(t0) {
    const escala = () => { const s = Math.min(1, (window.innerWidth - 24) / 1280, (window.innerHeight - 150) / 800); M.escenario.style.transform = `scale(${s})`; M.marco.style.width = 1280 * s + 'px'; M.marco.style.height = 800 * s + 'px'; };
    escala(); window.addEventListener('resize', escala);
    const ctl = M.htmlEl('div', { id: 'controles' }, document.body);
    ctl.innerHTML = `<div class="fila"><button id="bplay">▶ Reproducir</button><input id="barra" type="range" min="0" max="${DATOS.total}" step="0.04" value="${t0}"><span id="reloj">0:00</span>
      <button data-vel="0.5">×0,5</button><button data-vel="1" class="activa">×1</button><button data-vel="2">×2</button></div>
      <div class="fila escenas" style="margin-top:6px"></div><div class="info" id="info"></div>`;
    const fila = ctl.querySelector('.escenas');
    capas.forEach((c, i) => { const b = M.htmlEl('button', {}, fila); b.textContent = i === 0 ? 'Cab.' : 'E' + c.E.n; b.onclick = () => { ir(c.inicio + 0.01); }; });
    const barra = ctl.querySelector('#barra'), reloj = ctl.querySelector('#reloj'), bplay = ctl.querySelector('#bplay'), info = ctl.querySelector('#info');
    let T = t0, play = false, vel = 1, ultimo = 0, audioAct = null, audioIdx = -1;
    const audios = DATOS.escenas.map((e) => (e.audio ? new Audio(e.audio) : null));
    const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}.${Math.floor((s % 1) * 10)}`;
    const pararAudio = () => { if (audioAct) audioAct.pause(); audioAct = null; audioIdx = -1; };
    const sincAudio = () => {
      if (!play || vel !== 1) { pararAudio(); return; }
      let i = -1; DATOS.escenas.forEach((e, k) => { if (T >= e.inicio) i = k; });
      if (i < 0 || !audios[i]) { pararAudio(); return; }
      const off = T - DATOS.escenas[i].inicio - DATOS.escenas[i].pre;
      if (i !== audioIdx) { pararAudio(); if (off >= 0 && off < audios[i].duration + 0.1 || isNaN(audios[i].duration)) { audioAct = audios[i]; audioIdx = i; audioAct.currentTime = Math.max(0, off); audioAct.play().catch(() => {}); } }
    };
    const pinta = () => {
      seek(T); barra.value = T; reloj.textContent = fmt(T) + ' / ' + fmt(DATOS.total);
      let i = 0; capas.forEach((c, k) => { if (T >= c.inicio) i = k; });
      fila.querySelectorAll('button').forEach((b, k) => b.classList.toggle('activa', k === i));
      info.textContent = (i ? `Escena ${capas[i].E.n} · ${capas[i].d.toFixed(1)} s${DATOS.escenas[i - 1].estimado ? ' (estimada)' : ''}\nPantalla: ${capas[i].E.pantalla}` : 'Cabecera') + (M.errores.length ? '\n⚠ ' + M.errores.join('\n⚠ ') : '');
    };
    const ir = (t) => { T = clamp(t, 0, DATOS.total); pararAudio(); pinta(); sincAudio(); };
    const bucle = (ahora) => {
      if (!play) return;
      T += ((ahora - ultimo) / 1000) * vel; ultimo = ahora;
      if (T >= DATOS.total) { T = DATOS.total; play = false; bplay.textContent = '▶ Reproducir'; }
      pinta(); sincAudio();
      if (play) requestAnimationFrame(bucle);
    };
    bplay.onclick = () => { play = !play; bplay.textContent = play ? '❚❚ Pausa' : '▶ Reproducir'; if (play) { ultimo = performance.now(); requestAnimationFrame(bucle); } else pararAudio(); sincAudio(); };
    barra.oninput = () => ir(+barra.value);
    ctl.querySelectorAll('[data-vel]').forEach((b) => (b.onclick = () => { vel = +b.dataset.vel; ctl.querySelectorAll('[data-vel]').forEach((x) => x.classList.toggle('activa', x === b)); pararAudio(); sincAudio(); }));
    window.addEventListener('keydown', (ev) => { if (ev.code === 'Space') { ev.preventDefault(); bplay.click(); } if (ev.code === 'ArrowRight') ir(T + 5); if (ev.code === 'ArrowLeft') ir(T - 5); });
    pinta();
  }

  // ───────────── Componentes reutilizables ─────────────
  /** «Cámara» lenta: escala/desplaza un grupo a lo largo de la escena para que nunca quede quieto. */
  M.camara = (el, t, d, o = {}) => {
    const p = M.ease.inOutQuad(clamp(t / Math.max(d, 0.1)));
    const s = M.lerp(o.desde || 1, o.hasta || 1.04, p), cx = o.cx === undefined ? 640 : o.cx, cy = o.cy === undefined ? 380 : o.cy;
    const dx = M.lerp(0, o.dx || 0, p), dy = M.lerp(0, o.dy || 0, p);
    el.setAttribute('transform', `translate(${f2(cx + dx - cx * s)} ${f2(cy + dy - cy * s)}) scale(${f2(s * 1000) / 1000})`);
  };

  /**
   * Repaso final con las ideas clave (tarjetas que aparecen una a una).
   * E: escena; o: { tiempos: [t1,t2,t3], x, y, ancho, colores, titulo }.
   * Devuelve actualizar(t).
   */
  M.ideasClave = (E, o = {}) => {
    const ideas = o.ideas || E.datos.ideas; const g = M.g(E.g);
    const x = o.x === undefined ? 640 : o.x, ancho = o.ancho || 1100, y0 = o.y === undefined ? 150 : o.y;
    const cols = o.colores || [M.C.ayto, M.C.ccaa, M.C.estado];
    const tit = M.texto(g, o.titulo || 'Ideas clave', { tam: 52, peso: 900, x: 0, y: 0 });
    const tarjetas = ideas.map((idea, i) => {
      const gg = M.g(g);
      const txt = M.texto(null, idea, { tam: 33, peso: 750, max: ancho - 170, anchor: 'start' });
      const h = Math.max(110, txt.alto + 40);
      M.el('rect', { x: -ancho / 2, y: -h / 2, width: ancho, height: h, rx: 24, fill: M.C.blanco, stroke: cols[i % cols.length], 'stroke-width': 6 }, gg);
      M.el('circle', { cx: -ancho / 2 + 62, cy: 0, r: 36, fill: cols[i % cols.length] }, gg);
      M.texto(gg, String(i + 1), { tam: 44, peso: 900, x: -ancho / 2 + 62, y: 2, color: M.C.blanco });
      const t2 = M.texto(gg, idea, { tam: 33, peso: 750, max: ancho - 170, anchor: 'start', x: -ancho / 2 + 125, y: 0 });
      return { gg, h };
    });
    const tiempos = o.tiempos || [E.m('uno:'), E.m('dos:'), E.m('tres:')];
    return (t) => {
      M.ponAp(tit, { x, y: y0 - 70 }, M.aparicion(t, (o.tTitulo !== undefined ? o.tTitulo : tiempos[0] - 0.6), 0.5, 'sube'));
      let y = y0;
      tarjetas.forEach((c, i) => {
        const ap = M.aparicion(t, tiempos[i], 0.6, 'sube');
        M.ponAp(c.gg, { x: x + M.onda(t, 6, 3, i), y: y + c.h / 2 }, ap);
        y += c.h + 22;
      });
    };
  };
})();
