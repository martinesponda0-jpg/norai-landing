// Prueba de funcionamiento: hace lo que haría una persona y reporta lo que no funcione.
(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const fails = [], passes = [];
  const ok = (cond, label) => (cond ? passes : fails).push(label);
  const vw = document.documentElement.clientWidth, vh = innerHeight;
  const navH = document.getElementById('nav').getBoundingClientRect().height;
  const isTouch = matchMedia('(hover: none)').matches;

  // 1. bajar por toda la página: cada sección debe aparecer
  const total = document.querySelectorAll('.reveal').length;
  for (let y = 0; y <= document.documentElement.scrollHeight; y += Math.round(vh * 0.6)) { window.scrollTo(0, y); await wait(120); }
  await wait(600);
  const shown = document.querySelectorAll('.reveal.in').length;
  ok(shown === total, `secciones que aparecen al bajar: ${shown}/${total}`);

  // 2. contadores (si hay) llegan a su número final; la página de venta ya no tiene cifras
  const counts = [...document.querySelectorAll('[data-count]')];
  if (counts.length) ok(counts.every((c) => c.textContent.trim() === c.dataset.count), `contadores: ${counts.map((c) => c.textContent.trim()).join(', ')}`);
  else passes.push('sin contadores (correcto: no hay cifras inventadas)');

  // 3. links internos: llevan a su sección y no queda tapada por la barra
  const internal = [...new Set([...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href')))].filter((h) => h.length > 1);
  for (const h of internal) {
    const target = document.querySelector(h);
    if (!target) { ok(false, `link ${h} sin destino`); continue; }
    window.scrollTo(0, 0); await wait(80);
    document.documentElement.style.scrollBehavior = 'auto';
    document.querySelector(`a[href="${h}"]`).click(); await wait(250);
    document.documentElement.style.scrollBehavior = '';
    const top = target.getBoundingClientRect().top;
    const content = target.querySelector('h2, h1') || target;
    const ct = content.getBoundingClientRect().top;
    ok(Math.abs(top) < 4 || h === '#top', `link ${h} lleva a su sección (top ${Math.round(top)})`);
    ok(ct >= navH - 2 || h === '#top', `link ${h}: el título no queda debajo de la barra (${Math.round(ct)} ≥ ${Math.round(navH)})`);
  }

  // 4. links externos abren en otra pestaña de forma segura
  const ext = [...document.querySelectorAll('a[href^="http"]')];
  ok(ext.every((a) => a.target === '_blank' && /noopener/.test(a.rel)), `links externos seguros: ${ext.length}`);

  // 5. menú desplegable (solo donde se muestra)
  const dd = document.getElementById('dd');
  if (getComputedStyle(dd).display !== 'none') {
    window.scrollTo(0, 0); await wait(100);
    dd.querySelector('.dd-btn').click(); await wait(350);
    ok(dd.classList.contains('open') && getComputedStyle(dd.querySelector('.dd-panel')).visibility === 'visible', 'menú abre al tocar');
    dd.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await wait(350);
    ok(!dd.classList.contains('open'), 'menú cierra con Escape');
  } else passes.push('menú oculto en pantalla chica (correcto)');

  // 6. carrusel: flechas avanzan, regresan y se apagan en los extremos
  const car = document.getElementById('carousel'), next = document.getElementById('next'), prev = document.getElementById('prev');
  car.scrollIntoView({ block: 'center' }); car.scrollLeft = 0; await wait(400);
  ok(prev.disabled, 'flecha izquierda apagada al inicio');
  next.click(); await wait(700);
  const moved = car.scrollLeft;
  ok(moved > 10, `flecha derecha avanza (${Math.round(moved)}px)`);
  prev.click(); await wait(700);
  ok(car.scrollLeft < moved, 'flecha izquierda regresa');
  car.scrollLeft = car.scrollWidth; await wait(400);
  ok(next.disabled, 'flecha derecha apagada al final');
  car.scrollLeft = 0;

  // 7. grafo: cada punto, al quedar al centro de la pantalla, pone su escena en el grafo (data-scene)
  const items = [...document.querySelectorAll('.feat-item')], graph = document.getElementById('graph');
  let lit = 0;
  for (const it of items) {
    window.scrollTo(0, scrollY + it.getBoundingClientRect().top + it.getBoundingClientRect().height / 2 - vh / 2); await wait(450);
    if (it.classList.contains('on') && graph && graph.dataset.scene === it.dataset.seg) lit++;
  }
  ok(lit === items.length, `grafo pone la escena de cada punto: ${lit}/${items.length}`);
  const cnv = graph && graph.querySelector('canvas');
  ok(cnv && cnv.width > 0 && cnv.height > 0, `grafo dibujado (${cnv ? cnv.width + '×' + cnv.height : 'sin canvas'})`);

  // 8. ciclo de aprendizaje: los 3 pasos aparecen al verlo (sin números inventados)
  const log = document.getElementById('log');
  log.scrollIntoView({ block: 'center' }); await wait(2200);
  const shownSteps = [...log.children].filter((li) => li.classList.contains('in') && getComputedStyle(li).opacity > 0.9).length;
  ok(shownSteps === 3, `ciclo de aprendizaje visible: ${shownSteps}/3 pasos`);

  // 9. tamaños de letra legibles y botones del tamaño de un dedo en celular
  const tiny = [...document.querySelectorAll('body *')].filter((e) => e.childNodes.length && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 10 && e.getBoundingClientRect().width);
  ok(tiny.length === 0, `letra menor a 10px: ${tiny.length}`);
  if (isTouch || vw < 720) {
    const small = [...document.querySelectorAll('a.btn, button.arrow')].filter((b) => { const r = b.getBoundingClientRect(); return r.width && r.height < 40; });
    ok(small.length === 0, `botones chicos para dedo: ${small.length}`);
  }

  // 10. demo: con DEMO_VIDEO_URL vacío se ve el recorrido de 4 pasos; con link, el video arriba del recorrido
  const frame = document.getElementById('demo-frame'), walk = document.getElementById('walkthrough');
  ok(walk && walk.querySelectorAll('.card').length === 4, 'demo: recorrido de 4 pasos presente');
  ok(frame && (frame.hidden ? !frame.children.length : frame.querySelector('iframe, video')), `demo: espacio de video ${frame && frame.hidden ? 'vacío (se ve el recorrido)' : 'con video'}`);

  // 11. formulario: enviar vacío marca los campos y no sale de la página
  const form = document.getElementById('demo-form'), here = location.href;
  form.requestSubmit(); await wait(200);
  const invalid = form.querySelectorAll('[aria-invalid="true"]').length;
  ok(invalid === 4 && location.href === here && !document.getElementById('form-body').hidden, `formulario vacío: ${invalid}/4 campos marcados, sin enviar`);
  ok(document.activeElement && document.activeElement.getAttribute('aria-invalid') === 'true', 'formulario: el foco va al primer campo con error');
  form.reset(); form.querySelectorAll('[aria-invalid]').forEach((e) => e.removeAttribute('aria-invalid'));
  form.querySelectorAll('.err, #form-status').forEach((e) => (e.textContent = ''));
  const mail = document.querySelector('[data-email]');
  ok(mail && mail.href.startsWith('mailto:'), `correo de contacto: ${mail && mail.href}`);

  // 12. nada de la etapa de hackatón en el texto visible
  ok(!/hackat[oó]n|sequoia/i.test(document.body.innerText), 'sin "hackathon" ni "Sequoia" en el texto');

  window.scrollTo(0, 0);
  return { vw, touch: isTouch, ok: passes.length, fails };
})();
