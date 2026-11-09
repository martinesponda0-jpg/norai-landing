// Revisa las animaciones de la página: saltos al repetir, cortes bruscos (steps) y fluidez.
(async () => {
  const issues = [];
  const anims = document.getAnimations();
  const seen = new Set();
  for (const a of anims) {
    const eff = a.effect;
    if (!eff || !eff.getKeyframes) continue;
    const name = a.animationName || a.transitionProperty || 'anim';
    const el = eff.target;
    const key = name + '|' + (el?.className?.baseVal ?? el?.className ?? '');
    if (seen.has(key)) continue;
    seen.add(key);
    const t = eff.getTiming();
    const kfs = eff.getKeyframes();
    const easing = t.easing + ' ' + kfs.map((k) => k.easing).join(',');
    if (/steps|step-start|step-end/.test(easing)) issues.push(`${name}: cambia de golpe (steps)`);
    if (t.iterations === Infinity && t.direction !== 'alternate' && kfs.length > 1) {
      const first = kfs[0], last = kfs[kfs.length - 1];
      for (const prop of ['opacity', 'transform', 'strokeDashoffset']) {
        if (first[prop] !== undefined && last[prop] !== undefined && String(first[prop]) !== String(last[prop])) {
          // hidden by its parent at the jump (hero scenes fade out before their parts reset)
          if (el && el.closest && el.closest('.scene')) continue;
          // a loop that jumps is only visible if the element is visible at the jump
          if (prop === 'opacity') {
            const a0 = parseFloat(first.opacity), a1 = parseFloat(last.opacity);
            if (Math.min(a0, a1) === 0 && Math.max(a0, a1) > 0.1) issues.push(`${name}: aparece de golpe al repetir (opacity ${a1} → ${a0})`);
            if (Math.min(a0, a1) === 0) continue;
          }
          if (prop !== 'opacity' && (parseFloat(first.opacity ?? 1) === 0 || parseFloat(last.opacity ?? 1) === 0)) continue;
          // seamless by design: a full turn, or a marquee whose content is duplicated
          if (/rotate\(360deg\)|translateX\(-50%\)/.test(String(last[prop])) && /none|rotate\(0|translateX\(0/.test(String(first[prop]))) continue;
          issues.push(`${name}: salta al repetir (${prop} ${first[prop]} → ${last[prop]})`);
        }
      }
    }
  }
  // fluidez: cuadros por segundo durante 3 s
  let frames = 0, worst = 0, last = performance.now();
  const t0 = last;
  await new Promise((done) => {
    const tick = (now) => { frames++; worst = Math.max(worst, now - last); last = now; if (now - t0 < 3000) requestAnimationFrame(tick); else done(); };
    requestAnimationFrame(tick);
  });
  const fps = Math.round(frames / ((last - t0) / 1000));
  return { animations: seen.size, fps, worstFrameMs: Math.round(worst), issues };
})();
