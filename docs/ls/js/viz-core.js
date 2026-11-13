/* ============================================================
   EE351 Linear Systems II — shared canvas / math helpers
   ============================================================ */
(function (global) {
  "use strict";

  /* ---------- complex helpers (a+bi as [re, im]) ---------- */
  const C = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
    mul: (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]],
    div: (a, b) => {
      const d = b[0] * b[0] + b[1] * b[1];
      if (d === 0) return [0, 0];
      return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d];
    },
    exp: (t) => [Math.cos(t), Math.sin(t)],
    expj: (t) => [Math.cos(t), Math.sin(t)],
    conj: (a) => [a[0], -a[1]],
    abs: (a) => Math.hypot(a[0], a[1]),
    scale: (a, k) => [a[0] * k, a[1] * k],
    from: (re, im) => [re, im || 0],
    toString: (a, d) => {
      const dd = d == null ? 3 : d;
      const re = round(a[0], dd), im = round(a[1], dd);
      if (Math.abs(im) < 1e-12) return String(re);
      return re + (im < 0 ? " - " : " + ") + Math.abs(im) + "j";
    }
  };

  function round(v, d) {
    const k = Math.pow(10, d == null ? 3 : d);
    const r = Math.round(v * k) / k;
    return Object.is(r, -0) ? 0 : r;
  }
  function fmt(v, d) {
    if (v == null || !isFinite(v)) return "—";
    const r = round(v, d == null ? 3 : d);
    return String(r);
  }
  function fmtC(a, d) { return C.toString(a, d == null ? 3 : d); }

  /* ---------- complex polynomial roots (Durand–Kerner) ---------- */
  /* coeff: array of real coefficients, highest order first: [a_n, ..., a_0] */
  function polyRoots(coeff) {
    const c = coeff.slice();
    while (c.length > 1 && Math.abs(c[0]) < 1e-12) c.shift();
    const n = c.length - 1;
    if (n < 1) return [];
    const lead = c[0];
    for (let i = 0; i < c.length; i++) c[i] /= lead;
    // derivative
    const d = [];
    for (let i = 0; i < n; i++) d.push((n - i) * c[i]);
    const evalC = (p, z) => {
      let r = [0, 0];
      for (let i = 0; i < p.length; i++) r = C.add(C.mul(r, z), [p[i], 0]);
      return r;
    };
    const evalD = (p, z) => {
      let r = [0, 0];
      for (let i = 0; i < p.length; i++) r = C.add(C.mul(r, z), [p[i], 0]);
      return r;
    };
    let roots = [];
    for (let i = 0; i < n; i++) {
      const th = (2 * Math.PI * i) / n + 0.4;
      roots.push([Math.cos(th), Math.sin(th)]);
    }
    for (let iter = 0; iter < 300; iter++) {
      let maxDelta = 0;
      for (let i = 0; i < n; i++) {
        const num = evalC(c, roots[i]);
        let den = [1, 0];
        for (let j = 0; j < n; j++) {
          if (j === i) continue;
          den = C.mul(den, C.sub(roots[i], roots[j]));
        }
        if (C.abs(den) < 1e-300) continue;
        const delta = C.div(num, den);
        roots[i] = C.sub(roots[i], delta);
        maxDelta = Math.max(maxDelta, C.abs(delta));
      }
      if (maxDelta < 1e-12) break;
    }
    return roots;
  }

  /* ---------- canvas setup ---------- */
  function setupCanvas(canvas, cssW, cssH) {
    const dpr = Math.min(global.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = "100%";
    canvas.style.height = "auto";
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.font = "11px ui-monospace, Menlo, Consolas, monospace";
    ctx.textBaseline = "middle";
    return { ctx, W: cssW, H: cssH };
  }

  /* ---------- axis frame ---------- */
  function frame(ctx, W, H, opts) {
    const o = opts || {};
    const m = Object.assign({ l: 46, r: 14, t: 14, b: 30 }, o.margin || {});
    const pw = W - m.l - m.r, ph = H - m.t - m.b;
    const xMin = o.xMin, xMax = o.xMax, yMin = o.yMin, yMax = o.yMax;
    const sx = (x) => m.l + ((x - xMin) / (xMax - xMin)) * pw;
    const sy = (y) => m.t + ph - ((y - yMin) / (yMax - yMin)) * ph;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    // grid
    ctx.strokeStyle = "#eef1f7"; ctx.lineWidth = 1;
    const xt = o.xTicks || [];
    const yt = o.yTicks || [];
    xt.forEach((v) => {
      ctx.beginPath(); ctx.moveTo(sx(v), m.t); ctx.lineTo(sx(v), m.t + ph); ctx.stroke();
    });
    yt.forEach((v) => {
      ctx.beginPath(); ctx.moveTo(m.l, sy(v)); ctx.lineTo(m.l + pw, sy(v)); ctx.stroke();
    });
    // axes
    ctx.strokeStyle = "#46536b"; ctx.lineWidth = 1.4;
    ctx.beginPath();
    if (yMin <= 0 && yMax >= 0) { ctx.moveTo(m.l, sy(0)); ctx.lineTo(m.l + pw, sy(0)); }
    else { ctx.moveTo(m.l, m.t + ph); ctx.lineTo(m.l + pw, m.t + ph); }
    ctx.stroke();
    ctx.beginPath();
    if (xMin <= 0 && xMax >= 0) { ctx.moveTo(sx(0), m.t); ctx.lineTo(sx(0), m.t + ph); }
    else { ctx.moveTo(m.l, m.t + ph); ctx.lineTo(m.l + pw, m.t + ph); }
    ctx.stroke();
    // ticks + labels
    ctx.fillStyle = "#6b7891"; ctx.textAlign = "center";
    xt.forEach((v) => { ctx.fillText(String(v), sx(v), m.t + ph + 12); });
    ctx.textAlign = "right";
    yt.forEach((v) => { ctx.fillText(String(v), m.l - 6, sy(v)); });
    if (o.xlabel) { ctx.textAlign = "center"; ctx.fillStyle = "#46536b"; ctx.fillText(o.xlabel, m.l + pw / 2, H - 4); }
    if (o.ylabel) {
      ctx.save(); ctx.translate(11, m.t + ph / 2); ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center"; ctx.fillText(o.ylabel, 0, 0); ctx.restore();
    }
    return { sx, sy, m, pw, ph };
  }

  /* ---------- stem plot of a discrete sequence ---------- */
  /* series: [{values:[...], color, label, filled}]  values indexed from n0 */
  function stems(ctx, W, H, opts) {
    const f = frame(ctx, W, H, opts);
    const n0 = opts.n0 == null ? opts.xMin : opts.n0;
    (opts.series || []).forEach((s) => {
      const color = s.color || "#10695c";
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2;
      s.values.forEach((v, i) => {
        const n = n0 + i;
        if (n < f.sx ? false : false) return;
        if (n < opts.xMin || n > opts.xMax) return;
        const x = f.sx(n);
        const y = f.sy(0), yv = f.sy(v);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, yv); ctx.stroke();
        if (s.filled !== false) {
          ctx.beginPath(); ctx.arc(x, yv, 3.4, 0, Math.PI * 2); ctx.fill();
        }
      });
    });
    return f;
  }

  /* ---------- smooth curve ---------- */
  function curve(ctx, W, H, opts, fn) {
    const f = frame(ctx, W, H, opts);
    ctx.strokeStyle = opts.color || "#10695c";
    ctx.lineWidth = opts.lineWidth || 2.4;
    ctx.beginPath();
    const N = opts.samples || 600;
    for (let i = 0; i <= N; i++) {
      const x = opts.xMin + ((opts.xMax - opts.xMin) * i) / N;
      const y = fn(x);
      const px = f.sx(x), py = f.sy(y);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    return f;
  }

  /* ---------- polar / z-plane plot ---------- */
  function zplane(ctx, W, H, opts) {
    const m = { l: 40, r: 14, t: 14, b: 34 };
    const pw = W - m.l - m.r, ph = H - m.t - m.b;
    const R = opts.radius || 1.6;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);
    const sx = (re) => m.l + ((re + R) / (2 * R)) * pw;
    const sy = (im) => m.t + ph - ((im + R) / (2 * R)) * ph;
    // unit circle
    ctx.strokeStyle = "#9aa6bb"; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(sx(0), sy(0), (R / (2 * R)) * pw, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    // axes
    ctx.strokeStyle = "#46536b"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(sx(-R), sy(0)); ctx.lineTo(sx(R), sy(0)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx(0), sy(-R)); ctx.lineTo(sx(0), sy(R)); ctx.stroke();
    ctx.fillStyle = "#6b7891"; ctx.textAlign = "center";
    ctx.fillText("Re", sx(R) - 6, sy(0) - 10);
    ctx.fillText("Im", sx(0) + 12, sy(R) + 8);
    // ROC shading
    if (opts.roc) {
      const roc = opts.roc;
      ctx.fillStyle = "rgba(31,138,120,.13)";
      if (roc.type === "outside") {
        ctx.beginPath(); ctx.arc(sx(0), sy(0), (R / (2 * R)) * pw, 0, Math.PI * 2);
        ctx.arc(sx(0), sy(0), (roc.r / (2 * R)) * pw, 0, Math.PI * 2, true);
        ctx.fill();
      } else if (roc.type === "inside") {
        ctx.beginPath(); ctx.arc(sx(0), sy(0), (roc.r / (2 * R)) * pw, 0, Math.PI * 2); ctx.fill();
      } else if (roc.type === "left") {
        ctx.fillRect(m.l, m.t, sx(-roc.r) - m.l, ph);
      } else if (roc.type === "right") {
        ctx.fillRect(sx(roc.r), m.t, m.l + pw - sx(roc.r), ph);
      }
    }
    // poles / zeros
    (opts.zeros || []).forEach((z) => {
      ctx.strokeStyle = "#b4540c"; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(sx(z[0]), sy(z[1]), 5.5, 0, Math.PI * 2); ctx.stroke();
    });
    (opts.poles || []).forEach((p) => {
      ctx.fillStyle = "#b3261e";
      ctx.beginPath();
      ctx.moveTo(sx(p[0]), sy(p[1]) - 6);
      ctx.lineTo(sx(p[0]) + 6, sy(p[1]) + 5);
      ctx.lineTo(sx(p[0]) - 6, sy(p[1]) + 5);
      ctx.closePath(); ctx.fill();
    });
    // labels
    ctx.fillStyle = "#46536b"; ctx.textAlign = "left";
    ctx.fillText("○ zero    ▲ pole", m.l + 4, H - 12);
    return { sx, sy };
  }

  /* ---------- misc ---------- */
  function debounce(fn, ms) {
    let t;
    return function () {
      const a = arguments, c = this;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(c, a), ms || 120);
    };
  }

  function el(tag, attrs, html) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === "style") e.style.cssText = attrs[k];
      else if (k === "class") e.className = attrs[k];
      else if (k.startsWith("data-") || k === "aria-label") e.setAttribute(k, attrs[k]);
      else e[k] = attrs[k];
    }
    if (html != null) e.innerHTML = html;
    return e;
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  global.LS = { C, round, fmt, fmtC, polyRoots, setupCanvas, frame, stems, curve, zplane, debounce, el, $, $$ };
})(window);
