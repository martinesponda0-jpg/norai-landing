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

  // 2. contadores llegan a su número final
  const counts = [...document.querySelectorAll('[data-count]')];
  ok(counts.every((c) => c.textContent.trim() === c.dataset.count), `contadores: ${counts.map((c) => c.textContent.trim()).join(', ')}`);

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

  // 7. diagrama: cada punto ilumina su parte
  const items = [...document.querySelectorAll('.feat-item')];
  let lit = 0;
  for (const it of items) {
    window.scrollTo(0, scrollY + it.getBoundingClientRect().top + it.getBoundingClientRect().height / 2 - vh / 2); await wait(450);
    if (document.querySelector(`.seg.on[data-seg="${it.dataset.seg}"]`)) lit++;
  }
  ok(lit === items.length, `diagrama se ilumina con cada punto: ${lit}/${items.length}`);

  // 8. registro de cambios del auto-aprendizaje se actualiza
  const log = document.getElementById('log'); const before = log.textContent;
  await wait(2000);
  ok(log.textContent !== before, 'registro de cambios se actualiza solo');

  // 9. tamaños de letra legibles y botones del tamaño de un dedo en celular
  const tiny = [...document.querySelectorAll('body *')].filter((e) => e.childNodes.length && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 10 && e.getBoundingClientRect().width);
  ok(tiny.length === 0, `letra menor a 10px: ${tiny.length}`);
  if (isTouch || vw < 720) {
    const small = [...document.querySelectorAll('a.btn, button.arrow')].filter((b) => { const r = b.getBoundingClientRect(); return r.width && r.height < 40; });
    ok(small.length === 0, `botones chicos para dedo: ${small.length}`);
  }
  window.scrollTo(0, 0);
  return { vw, touch: isTouch, ok: passes.length, fails };
})();
