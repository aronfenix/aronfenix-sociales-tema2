/*
 * App · Sociales 5.º · Tema 2 «Un voto de confianza»
 * Portada (index.html), lecciones (leccion.html?v=N) y repaso (repaso.html).
 * Depende de assets/js/motor.js (window.Motor), que se carga antes. ES5, sin dependencias.
 */
(function () {
  'use strict';

  var M = window.Motor || null;
  var CLAVE = 'sociales5-tema2-progreso';
  var SLUGS = { 1: 'v1-quien-decide', 2: 'v2-munecas-rusas', 3: 'v3-tres-poderes', 4: 'v4-como-se-vota', 5: 'v5-union-europea' };
  var COLORES = { 1: ['#2B2D42', '#FFFFFF'], 2: ['#F4B942', '#2B2D42'], 3: ['#3D8B85', '#FFFFFF'], 4: ['#5C6784', '#FFFFFF'], 5: ['#3B5BA9', '#FFFFFF'] };

  var SVG = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.8v14.4a1 1 0 0 0 1.5.86l12-7.2a1 1 0 0 0 0-1.72l-12-7.2A1 1 0 0 0 7 4.8z" fill="currentColor"/></svg>',
    flecha: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    atras: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H6M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    ok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.6l4.4 4.4L19.2 7.4" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    ojo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>',
    abajo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v13M6 13l6 6 6-6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    preguntas: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="7" y="5" width="34" height="38" rx="6" fill="#FFFFFF" stroke="#2B2D42" stroke-width="3"/><circle cx="15" cy="16" r="3.2" fill="#2A9D8F"/><circle cx="15" cy="26" r="3.2" fill="#F4B942"/><circle cx="15" cy="36" r="3.2" fill="#D9DEE6"/><path d="M22 16h12M22 26h12M22 36h8" stroke="#8D99AE" stroke-width="3" stroke-linecap="round"/></svg>',
    reloj: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="25" r="17" fill="#FBF6EC" stroke="#2B2D42" stroke-width="3.5"/><path d="M24 15v10l7 5" fill="none" stroke="#2B2D42" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><rect x="19" y="3" width="10" height="5" rx="2.5" fill="#F4B942"/></svg>',
    chev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  // ───────── utilidades ─────────
  function $(id) { return document.getElementById(id); }
  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) n.className = clase;
    if (texto != null) n.textContent = texto;
    return n;
  }
  function icono(nombre) { return (M && M.iconos && M.iconos[nombre]) || ''; }
  function minuto(s) {
    if (M && M.formatoMinuto) return M.formatoMinuto(s);
    s = Math.max(0, Math.floor(s || 0));
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }
  function parametro(nombre) {
    try { return new URLSearchParams(location.search).get(nombre); }
    catch (e) { var m = new RegExp('[?&]' + nombre + '=([^&]*)').exec(location.search); return m ? decodeURIComponent(m[1]) : null; }
  }
  function leerJSON(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('No se pudo cargar ' + url);
      return r.json();
    });
  }
  function desplazar(nodo) {
    try { nodo.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) { nodo.scrollIntoView(true); }
  }

  // ───────── progreso (a través del motor; si falta, lectura directa) ─────────
  function leerProgreso() {
    try { var d = JSON.parse(localStorage.getItem(CLAVE)); return d && typeof d === 'object' && d.videos ? d : { videos: {} }; }
    catch (e) { return { videos: {} }; }
  }
  function estado(n) {
    try { if (M && M.progreso) return M.progreso.estado(n); } catch (e) { /* sigue */ }
    var v = leerProgreso().videos[n] || {};
    return { visto: !!v.visto, superadas: (v.superadas || []).length, total: v.total || 5, completado: !!v.completado, mejor: v.mejor == null ? null : v.mejor };
  }
  function marcarVisto(n) {
    try {
      if (M && M.progreso) { M.progreso.marcarVisto(n); return; }
      var d = leerProgreso(); d.videos[n] = d.videos[n] || { visto: false, superadas: [] }; d.videos[n].visto = true;
      localStorage.setItem(CLAVE, JSON.stringify(d));
    } catch (e) { /* modo privado */ }
  }
  function borrarProgreso() {
    try { if (M && M.progreso) M.progreso.borrar(); else localStorage.removeItem(CLAVE); } catch (e) { /* nada */ }
  }
  // Chip de estado (mismas clases que el índice de actividades)
  function chipEstado(n) {
    var e = estado(n);
    var chip = el('span', 'estado-actividad');
    var ic = el('span', 'icono-redondo');
    chip.appendChild(ic);
    var texto;
    if (e.completado) { chip.className += ' completa'; ic.innerHTML = SVG.ok; texto = 'Preguntas superadas · ' + (e.mejor != null ? e.mejor : e.superadas) + '/' + (e.total || 5) + ' a la primera'; }
    else if (e.superadas) { chip.className += ' empezada'; texto = 'Preguntas superadas · ' + e.superadas + '/' + (e.total || 5); }
    else if (e.visto) { chip.className += ' visto'; ic.innerHTML = SVG.ok; texto = 'Vídeo visto'; }
    else texto = 'Sin empezar';
    chip.appendChild(document.createTextNode(texto));
    return chip;
  }

  // ───────── datos ─────────
  function cargar() {
    var base = M && M.cargarDatos ? M.cargarDatos() : Promise.all([leerJSON('data/preguntas.json').catch(function () { return null; }), leerJSON('data/guiones.json'), leerJSON('data/tiempos.json').catch(function () { return null; })])
      .then(function (r) { return { preguntas: r[0], guiones: r[1], tiempos: r[2] }; });
    return Promise.all([base, leerJSON('data/capitulos.json').catch(function () { return null; })]).then(function (r) {
      var d = r[0] || {};
      d.capitulos = r[1];
      return d;
    });
  }
  function videos(d) {
    var lista = d && d.guiones && d.guiones.videos;
    if (lista && lista.length) return lista;
    return [1, 2, 3, 4, 5].map(function (i) { return { id: i, slug: SLUGS[i], titulo: 'Vídeo ' + i, subtitulo: '', ideas: [], escenas: [] }; });
  }
  function inicios(d, n) {
    var t = d && d.tiempos && d.tiempos[String(n)];
    return Array.isArray(t) ? t : [];
  }
  function palabras(s) { return (String(s || '').match(/\S+/g) || []).length; }
  function duracion(d, g) {
    var info = d && d.tiempos && d.tiempos._info && d.tiempos._info[String(g.id)];
    if (info && info.duracion) return info.duracion;
    var t = inicios(d, g.id), ult = g.escenas && g.escenas[g.escenas.length - 1];
    if (!t.length || !ult) return null;
    return t[t.length - 1] + palabras(ult.voz) / 2.45 + 3.6;
  }
  function textoDuracion(seg) { return seg ? Math.max(1, Math.round(seg / 60)) + ' min' : ''; }
  function tituloCapitulo(d, g, i) {
    var c = d && d.capitulos && d.capitulos[String(g.id)];
    if (c && c[i]) return c[i];
    var e = g.escenas && g.escenas[i];
    if (!e) return 'Parte ' + (i + 1);
    var frase = String(e.voz || e.pantalla || '').split(/[.:?!¿¡]/).filter(function (x) { return x.trim(); })[0] || '';
    var w = frase.trim().split(/\s+/).slice(0, 4).join(' ');
    return w.charAt(0).toUpperCase() + w.slice(1);
  }

  // Póster: imagen videos/poster/vN.jpg o, si no existe, un dibujo de reserva con la misma estética.
  function posterDibujo(g) {
    var p = el('div', 'poster-dibujo');
    p.setAttribute('aria-hidden', 'true');
    p.appendChild(el('span', 'pastilla', 'Vídeo ' + g.id + ' de 5'));
    p.appendChild(el('span', 't', g.titulo));
    var ic = el('span', 'icono'); ic.innerHTML = icono('video' + g.id); p.appendChild(ic);
    return p;
  }
  function posterEn(caja, g) {
    var img = new Image();
    img.alt = '';
    img.decoding = 'async';
    img.addEventListener('error', function () { if (img.parentNode) img.parentNode.replaceChild(posterDibujo(g), img); });
    img.src = 'videos/poster/v' + g.id + '.jpg';
    caja.appendChild(img);
  }

  // ───────── service worker (opcional; nunca rompe la app) ─────────
  function registrarSW() {
    try {
      if (!('serviceWorker' in navigator)) return;
      var seguro = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
      if (!seguro) return;
      window.addEventListener('load', function () {
        try { navigator.serviceWorker.register('sw.js').catch(function () { /* sin caché, no pasa nada */ }); } catch (e) { /* nada */ }
      });
    } catch (e) { /* nada */ }
  }

  function pieBorrar() {
    var b = $('borrar-progreso');
    if (!b) return;
    b.addEventListener('click', function () {
      var ok = true;
      try { ok = window.confirm('¿Borrar el progreso guardado en esta tablet? (Vídeos vistos y preguntas superadas)'); } catch (e) { /* nada */ }
      if (ok) { borrarProgreso(); location.reload(); }
    });
  }

  // ═════════ PORTADA ═════════
  function portada() {
    pieBorrar();
    var lista = $('lecciones');
    cargar().then(function (d) {
      var vs = videos(d);
      // siguiente lección: la primera sin completar
      var siguiente = null, hechas = 0, empezado = false;
      vs.forEach(function (g) {
        var e = estado(g.id);
        if (e.completado) hechas++;
        if (e.visto || e.superadas || e.completado) empezado = true;
        if (!siguiente && !e.completado) siguiente = g;
      });
      // botón principal
      var cta = $('cta');
      if (cta) {
        var destino = siguiente || vs[0];
        cta.href = siguiente ? 'leccion.html?v=' + destino.id : 'repaso.html';
        var txt = el('span', 'textos-boton');
        txt.appendChild(document.createTextNode(!empezado ? 'Empezar' : siguiente ? 'Seguir' : '¡Todo hecho! Repasar'));
        if (siguiente) txt.appendChild(el('small', '', 'Vídeo ' + destino.id + ': ' + destino.titulo));
        cta.innerHTML = '';
        cta.appendChild(txt);
        cta.insertAdjacentHTML('beforeend', siguiente ? SVG.play : SVG.flecha);
      }
      var av = $('avance');
      if (av) {
        var ol = el('ol');
        vs.forEach(function (g) { var e = estado(g.id); ol.appendChild(el('li', e.completado ? 'hecho' : (e.visto || e.superadas) ? 'visto' : '')); });
        av.innerHTML = '';
        av.appendChild(ol);
        av.appendChild(el('span', '', hechas + ' de ' + vs.length + ' terminados'));
      }
      // tarjetas
      lista.innerHTML = '';
      vs.forEach(function (g) {
        var e = estado(g.id);
        var li = el('li');
        var a = el('a', 'tarjeta-leccion' + (siguiente && empezado && g.id === siguiente.id ? ' siguiente' : ''));
        a.href = 'leccion.html?v=' + g.id;
        a.setAttribute('aria-label', 'Vídeo ' + g.id + ': ' + g.titulo);
        var port = el('div', 'portada');
        posterEn(port, g);
        var play = el('span', 'boton-play'); play.innerHTML = SVG.play; port.appendChild(play);
        var dur = textoDuracion(duracion(d, g));
        if (dur) port.appendChild(el('span', 'duracion', dur));
        a.appendChild(port);
        var cuerpo = el('div', 'cuerpo');
        cuerpo.appendChild(el('p', 'antetitulo', 'Vídeo ' + g.id));
        cuerpo.appendChild(el('h3', '', g.titulo));
        cuerpo.appendChild(el('p', 'subtitulo', g.subtitulo));
        var fila = el('div', 'fila-estado');
        fila.appendChild(chipEstado(g.id));
        var ir = el('span', 'ir');
        ir.appendChild(document.createTextNode(e.completado ? 'Repetir' : (e.visto || e.superadas) ? 'Seguir' : 'Empezar'));
        ir.insertAdjacentHTML('beforeend', SVG.flecha);
        fila.appendChild(ir);
        cuerpo.appendChild(fila);
        a.appendChild(cuerpo);
        li.appendChild(a);
        lista.appendChild(li);
      });
    }).catch(function (err) {
      lista.innerHTML = '';
      lista.appendChild(el('li', 'motor-error', 'No se ha podido cargar la lista de vídeos. Comprueba la conexión y recarga la página.'));
      if (window.console) console.warn(err);
    });
  }

  // ═════════ LECCIÓN ═════════
  function leccion() {
    var n = parseInt(parametro('v'), 10);
    if (!(n >= 1 && n <= 5)) n = 1;
    var tInicial = parseFloat(parametro('t'));
    var marco = $('marco-video'), capCaja = $('capitulos'), bloque = $('bloque-preguntas'), cont = $('preguntas');
    var botonIr = $('ir-preguntas');
    var video = null, hayVideo = true, montado = false, botonesCap = [], tiempos = [], actual = -1;

    $('insignia').innerHTML = icono('video' + n);
    $('antetitulo').textContent = 'Vídeo ' + n + ' de 5';

    // ── preguntas ──
    function montarPreguntas(bajar) {
      var bajarAlMontar = !montado && bajar;
      if (!montado) {
        montado = true;
        cont.innerHTML = '';
        if (!M || !M.montar) {
          cont.appendChild(el('p', 'motor-error', 'No se han podido cargar las preguntas. Recarga la página.'));
        } else {
          M.montar(cont, n, {
            alPedirRepaso: function (seg) { saltar(seg); },
            alSiguienteVideo: function (k) { location.href = 'leccion.html?v=' + k; },
            alInicio: function () { location.href = 'index.html'; },
            textoSiguiente: 'Siguiente vídeo'
          }).then(function () {
            // ya con las preguntas dentro, la página es más alta: ahora sí se puede bajar del todo
            if (bajarAlMontar) desplazar(bloque);
          }).catch(function (e) { if (window.console) console.warn(e); });
        }
        botonIr.innerHTML = SVG.abajo + '<span>' + (hayVideo ? 'Volver a las preguntas' : 'Ir a las preguntas') + '</span>';
        var ay = $('ayuda-video');
        if (ay && hayVideo) ay.lastChild.textContent = 'Las preguntas están aquí debajo.';
      }
      if (bajar) desplazar(bloque);
    }
    botonIr.addEventListener('click', function () {
      if (video && !video.paused) { try { video.pause(); } catch (e) { /* nada */ } }
      montarPreguntas(true);
    });
    var botonEspera = $('empezar-preguntas');
    if (botonEspera) botonEspera.addEventListener('click', function () {
      if (video && !video.paused) { try { video.pause(); } catch (e) { /* nada */ } }
      montarPreguntas(true);
    });

    // ── vídeo ──
    var avisoSalto = null, temporizador = null;
    function aviso(texto) {
      if (!avisoSalto) { avisoSalto = el('div', 'aviso-salto'); avisoSalto.setAttribute('role', 'status'); }
      avisoSalto.textContent = texto;
      if (!avisoSalto.parentNode) marco.appendChild(avisoSalto);
      clearTimeout(temporizador);
      temporizador = setTimeout(function () { if (avisoSalto.parentNode) avisoSalto.parentNode.removeChild(avisoSalto); }, 2200);
    }
    function saltar(seg, sinDesplazar) {
      if (!sinDesplazar) desplazar(marco);
      if (!hayVideo || !video) return;
      seg = Math.max(0, +seg || 0);
      var poner = function () {
        try { video.currentTime = seg; } catch (e) { /* nada */ }
        var p = video.play();
        if (p && p.catch) p.catch(function () { /* el navegador pide un toque: el niño pulsa play */ });
      };
      if (video.readyState >= 1) poner();
      else video.addEventListener('loadedmetadata', poner, { once: true });
      aviso('Minuto ' + minuto(seg));
    }
    function marcarCapitulo(t) {
      var i = -1;
      for (var k = 0; k < tiempos.length; k++) if (t + 0.25 >= tiempos[k]) i = k;
      if (i === actual) return;
      actual = i;
      botonesCap.forEach(function (b, k) {
        b.classList.toggle('actual', k === i);
        b.classList.toggle('pasado', k < i);
        if (k === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      });
      // mantener visible el capítulo actual dentro de su lista (sin mover la página)
      var b = botonesCap[i], ol = b && b.parentNode && b.parentNode.parentNode;
      if (b && ol && ol.scrollHeight > ol.clientHeight + 4) {
        var top = b.parentNode.getBoundingClientRect().top - ol.getBoundingClientRect().top + ol.scrollTop;
        if (top < ol.scrollTop || top + b.offsetHeight > ol.scrollTop + ol.clientHeight) ol.scrollTop = Math.max(0, top - 8);
      }
    }
    function sinVideo() {
      if (!hayVideo) return;
      hayVideo = false;
      var g = guion || { id: n, titulo: 'Vídeo ' + n };
      marco.innerHTML = '';
      var sv = el('div', 'sin-video');
      posterEn(sv, g);
      sv.appendChild(el('div', 'velo'));
      var caja = el('div', 'aviso-pronto');
      caja.setAttribute('role', 'status');
      caja.insertAdjacentHTML('beforeend', '<span class="reloj">' + SVG.reloj + '</span>');
      var offline = navigator.onLine === false;
      caja.appendChild(el('h2', '', offline ? 'Sin conexión' : 'El vídeo estará pronto'));
      caja.appendChild(el('p', '', offline ? 'El vídeo necesita internet. Mientras tanto, puedes hacer las preguntas.' : 'Todavía lo estamos preparando. Mientras tanto, puedes hacer las preguntas.'));
      var b = el('button', 'boton boton-principal');
      b.type = 'button';
      b.innerHTML = '<span>Ir a las preguntas</span>' + SVG.abajo;
      b.addEventListener('click', function () { montarPreguntas(true); });
      caja.appendChild(b);
      sv.appendChild(caja);
      marco.appendChild(sv);
      capCaja.classList.add('sin-video');
      botonesCap.forEach(function (x) { x.disabled = true; x.removeAttribute('title'); });
      var ayuda = $('ayuda-video');
      if (ayuda) ayuda.lastChild.textContent = 'Las preguntas ya están listas aquí debajo.';
      montarPreguntas(false);
    }

    var guion = null;
    function crearVideo(g) {
      var slug = (g && g.slug) || SLUGS[n];
      video = document.createElement('video');
      video.setAttribute('controls', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.setAttribute('preload', 'metadata');
      video.setAttribute('controlslist', 'nodownload noremoteplayback');
      video.setAttribute('disablepictureinpicture', '');
      video.setAttribute('aria-label', 'Vídeo ' + n + ': ' + ((g && g.titulo) || ''));
      // póster solo si existe (evita un recuadro roto)
      var pi = new Image();
      pi.onload = function () { if (video) video.poster = pi.src; };
      pi.src = 'videos/poster/v' + n + '.jpg';
      video.addEventListener('error', sinVideo);
      video.addEventListener('timeupdate', function () {
        marcarCapitulo(video.currentTime);
        if (video.duration && video.currentTime > video.duration - 6) marcarVisto(n);
      });
      video.addEventListener('ended', function () {
        marcarVisto(n);
        montarPreguntas(true);
      });
      video.src = 'videos/' + slug + '.mp4';
      marco.innerHTML = '';
      marco.appendChild(video);
      if (tInicial >= 0) {
        video.addEventListener('loadedmetadata', function () {
          try { video.currentTime = tInicial; } catch (e) { /* nada */ }
          marcarCapitulo(tInicial);
        }, { once: true });
        aviso('Minuto ' + minuto(tInicial));
      }
    }

    function pintarCapitulos(d, g) {
      tiempos = inicios(d, n);
      var ol = $('lista-capitulos');
      ol.innerHTML = '';
      botonesCap = [];
      var total = (g.escenas && g.escenas.length) || tiempos.length;
      $('cuenta-capitulos').textContent = total + ' partes';
      for (var i = 0; i < total; i++) {
        (function (i) {
          var li = el('li');
          var b = el('button', 'capitulo');
          b.type = 'button';
          var seg = tiempos[i];
          b.appendChild(el('span', 'n', String(i + 1)));
          b.appendChild(el('span', 'tit', tituloCapitulo(d, g, i)));
          if (typeof seg === 'number') {
            b.appendChild(el('span', 't', minuto(seg)));
            b.title = 'Ver desde el minuto ' + minuto(seg);
            b.addEventListener('click', function () { if (hayVideo) saltar(seg, true); });
          }
          if (!hayVideo) b.disabled = true;
          li.appendChild(b);
          ol.appendChild(li);
          botonesCap.push(b);
        })(i);
      }
      if (!hayVideo) capCaja.classList.add('sin-video');
      // en móvil, la lista de partes empieza plegada
      try { if (window.matchMedia('(max-width: 600px)').matches) capCaja.querySelector('details').removeAttribute('open'); } catch (e) { /* nada */ }
    }

    function pintarNav(vs) {
      var nav = $('nav-lecciones');
      if (!nav) return;
      nav.innerHTML = '';
      var ant = vs.filter(function (x) { return x.id === n - 1; })[0];
      var sig = vs.filter(function (x) { return x.id === n + 1; })[0];
      if (ant) {
        var a = el('a', 'ant'); a.href = 'leccion.html?v=' + ant.id;
        a.innerHTML = SVG.atras;
        var t = el('span', 't'); t.appendChild(el('small', '', 'Vídeo anterior')); t.appendChild(document.createTextNode(ant.titulo)); a.appendChild(t);
        nav.appendChild(a);
      }
      var ini = el('a', 'ini', 'Volver al inicio'); ini.href = 'index.html'; nav.appendChild(ini);
      if (sig) {
        var s = el('a', 'sig'); s.href = 'leccion.html?v=' + sig.id;
        var ts = el('span', 't'); ts.appendChild(el('small', '', 'Siguiente vídeo')); ts.appendChild(document.createTextNode(sig.titulo)); s.appendChild(ts);
        s.insertAdjacentHTML('beforeend', SVG.flecha);
        nav.appendChild(s);
      }
    }

    // El vídeo se crea en cuanto se conoce el slug; si los datos fallan, se usa el slug de reserva.
    cargar().then(function (d) {
      var vs = videos(d);
      guion = vs.filter(function (x) { return x.id === n; })[0] || vs[0];
      $('titulo').textContent = guion.titulo;
      $('subtitulo').textContent = guion.subtitulo || '';
      document.title = guion.titulo + ' · Vídeo ' + n + ' · Sociales 5.º';
      crearVideo(guion);
      pintarCapitulos(d, guion);
      pintarNav(vs);
    }).catch(function (e) {
      if (window.console) console.warn(e);
      crearVideo(null);
      capCaja.hidden = true;
      pintarNav([1, 2, 3, 4, 5].map(function (i) { return { id: i, titulo: 'Vídeo ' + i }; }));
    });
  }

  // ═════════ REPASO ═════════
  function repaso() {
    pieBorrar();
    var lista = $('lista-repaso');
    var imp = $('imprimir');
    if (imp) imp.addEventListener('click', function () { try { window.print(); } catch (e) { /* nada */ } });
    cargar().then(function (d) {
      lista.innerHTML = '';
      videos(d).forEach(function (g) {
        var c = COLORES[g.id] || COLORES[1];
        var li = el('li');
        var art = el('article', 'tarjeta-repaso');
        art.style.setProperty('--c', c[0]);
        art.style.setProperty('--cc', c[1]);
        var cima = el('div', 'cima');
        var ins = el('div', 'insignia-video'); ins.innerHTML = icono('video' + g.id); cima.appendChild(ins);
        var tx = el('div');
        tx.appendChild(el('p', 'antetitulo', 'Vídeo ' + g.id));
        tx.appendChild(el('h2', '', g.titulo));
        tx.appendChild(el('p', 'subtitulo', g.subtitulo));
        cima.appendChild(tx);
        art.appendChild(cima);
        var ul = el('ol', 'ideas');
        (g.ideas || []).forEach(function (idea) { ul.appendChild(el('li', '', idea)); });
        art.appendChild(ul);
        var pie = el('div', 'pie');
        var a = el('a', 'boton boton-secundario'); a.href = 'leccion.html?v=' + g.id; a.innerHTML = SVG.play + '<span>Ver el vídeo</span>';
        var b = el('a', 'boton boton-secundario'); b.href = 'actividades/actividad.html?v=' + g.id; b.innerHTML = SVG.ok + '<span>Hacer las preguntas</span>';
        pie.appendChild(a); pie.appendChild(b);
        art.appendChild(pie);
        li.appendChild(art);
        lista.appendChild(li);
      });
    }).catch(function () {
      lista.innerHTML = '';
      lista.appendChild(el('li', 'motor-error', 'No se ha podido cargar el repaso. Recarga la página.'));
    });
  }

  // ───────── arranque ─────────
  registrarSW();
  var pagina = document.body.getAttribute('data-pagina');
  if (pagina === 'portada') portada();
  else if (pagina === 'leccion') leccion();
  else if (pagina === 'repaso') repaso();

  window.App = { estado: estado, minuto: minuto };
})();
