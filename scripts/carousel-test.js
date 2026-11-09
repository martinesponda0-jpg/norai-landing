// Prueba del carrusel: los puntitos deben coincidir con lo que las flechas y el arrastre pueden recorrer.
(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const settle = async () => { let last = -1; for (let i = 0; i < 40; i++) { await wait(60); if (Math.abs(car.scrollLeft - last) < 0.5) return; last = car.scrollLeft; } };
  const car = document.getElementById('carousel'), dots = document.getElementById('dots');
  const next = document.getElementById('next'), prev = document.getElementById('prev');
  const fails = [];
  const on = () => [...dots.children].findIndex((d) => d.classList.contains('on'));
  car.scrollIntoView({ block: 'center' }); car.scrollLeft = 0; await settle();
  const n = dots.hidden ? 1 : dots.children.length;
  if (on() !== 0 && n > 1) fails.push(`al inicio el punto activo es ${on()}`);
  if (!prev.disabled) fails.push('flecha izquierda prendida al inicio');
  // forward with the arrow
  let clicks = 0;
  while (!next.disabled && clicks < 20) { next.click(); clicks++; await settle(); if (n > 1 && on() !== Math.min(clicks, n - 1)) fails.push(`tras ${clicks} clics el punto activo es ${on()}`); }
  if (clicks !== n - 1) fails.push(`flecha derecha: ${clicks} clics pero ${n} puntos`);
  const end = car.scrollWidth - car.clientWidth;
  if (car.scrollLeft < end - 4) fails.push(`no llegó al final (${Math.round(car.scrollLeft)} de ${end})`);
  // back with the arrow
  let back = 0;
  while (!prev.disabled && back < 20) { prev.click(); back++; await settle(); }
  if (back !== n - 1) fails.push(`flecha izquierda: ${back} clics pero ${n} puntos`);
  // clicking a dot
  if (n > 2) { dots.children[n - 1].click(); await settle(); if (!next.disabled || on() !== n - 1) fails.push('clic en el último punto no lleva al final'); dots.children[1].click(); await settle(); if (on() !== 1) fails.push('clic en el segundo punto no lo activa'); }
  // drag almost to the end with the mouse: must end exactly at the end
  car.scrollLeft = 0; await settle();
  const r = car.getBoundingClientRect(), y = r.top + r.height / 2;
  const fire = (type, x, target = car) => target.dispatchEvent(new PointerEvent(type, { pointerType: 'mouse', button: 0, clientX: x, clientY: y, bubbles: true }));
  if (end > 0) {
    fire('pointerdown', r.right - 10); fire('pointermove', r.right - 30, window); fire('pointermove', r.right - 10 - (end - 30), window); fire('pointerup', 0, window);
    await settle(); await wait(400); await settle();
    if (car.scrollLeft < end - 4) fails.push(`al arrastrar casi al final regresa (${Math.round(car.scrollLeft)} de ${end})`);
    if (!next.disabled) fails.push('al arrastrar al final la flecha derecha sigue prendida');
  }
  car.scrollLeft = 0;
  return { vw: innerWidth, dots: n, clicks, fails };
})();
