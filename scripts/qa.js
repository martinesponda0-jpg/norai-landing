// Revisión automática de la página: pegar en la consola o correr desde una herramienta.
// Devuelve un resumen con desbordes, imágenes rotas, textos encimados y estado de componentes.
(async () => {
  const vw = document.documentElement.clientWidth;
  document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in'));
  await new Promise((r) => setTimeout(r, 300));
  const problems = [];
  // 1. horizontal overflow
  if (document.documentElement.scrollWidth > vw + 1) problems.push(`scroll horizontal: ${document.documentElement.scrollWidth} > ${vw}`);
  const allowed = '.rings, .marquee, .carousel, .track, .closing .rings, .glyph';
  [...document.querySelectorAll('body *')].forEach((el) => {
    if (el.closest(allowed)) return;
    const r = el.getBoundingClientRect();
    if (r.width && (r.right > vw + 1 || r.left < -1)) problems.push(`se sale: ${el.tagName}.${(el.className.baseVal ?? el.className).toString().slice(0, 40)} (${Math.round(r.left)}→${Math.round(r.right)})`);
  });
  // 2. images
  const imgs = [...document.images];
  imgs.forEach((i) => { if (!i.complete || i.naturalWidth === 0) problems.push('imagen rota: ' + i.getAttribute('src')); });
  // 3. text clipped inside fixed-size boxes (scrollWidth > clientWidth)
  document.querySelectorAll('.btn, .boxlink, .mini, .cell, .area h3, .area p, .stat b, .col h4, .nav-links > a').forEach((el) => {
    if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow !== 'visible') problems.push('texto cortado: ' + el.textContent.trim().slice(0, 30));
  });
  // 4. hero chips overlapping the title / buttons
  const textRects = (el) => { const r = document.createRange(); r.selectNodeContents(el); return [...r.getClientRects()]; };
  const busy = [...textRects(document.querySelector('.hero-title')), ...textRects(document.querySelector('.hero-sub')), ...[...document.querySelectorAll('.hero-cta .btn, .hero-meta span')].map((e) => e.getBoundingClientRect())];
  const hit = (a, b) => !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  document.querySelectorAll('.hero .chip, .hero .sc').forEach((c) => {
    const r = c.getBoundingClientRect();
    if (getComputedStyle(c.closest('.rings')).display === 'none' || getComputedStyle(c).display === 'none') return;
    if (busy.some((b) => hit(r, b))) problems.push('etiqueta encima del texto: ' + c.textContent.trim());
    if (r.right > vw - 4) problems.push('etiqueta cortada en el borde: ' + c.textContent.trim());
  });
  // 5. nav height & tap targets on touch sizes
  if (vw < 720) document.querySelectorAll('a.btn, button.arrow').forEach((b) => { const r = b.getBoundingClientRect(); if (r.height && r.height < 40) problems.push('botón chico para dedo: ' + b.textContent.trim().slice(0, 20)); });
  // 6. components
  const car = document.getElementById('carousel');
  const before = car.scrollLeft; document.getElementById('next').click(); await new Promise((r) => setTimeout(r, 700));
  const moved = car.scrollLeft > before; car.scrollTo({ left: 0 });
  if (!moved && car.scrollWidth > car.clientWidth) problems.push('el carrusel no avanza');
  const links = [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href')).filter((h) => h.length > 1 && !document.querySelector(h));
  if (links.length) problems.push('links internos sin destino: ' + links.join(', '));
  return { vw, height: document.documentElement.scrollHeight, problems: [...new Set(problems)].slice(0, 25) };
})();
