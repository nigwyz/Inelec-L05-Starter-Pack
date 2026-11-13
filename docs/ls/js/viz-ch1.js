/* ============================================================
   Chapter 1 — DT Signals and Systems: visualizations
   ============================================================ */
(function () {
  "use strict";
  const { C, fmt, fmtC, setupCanvas, frame, stems, el, $, $$ } = window.LS;

  const COL = { base: "#9aa6bb", main: "#10695c", alt: "#b4540c", good: "#1f7a4d", bad: "#b3261e", grid: "#eef1f7" };

  /* =========================================================
     1. SIGNAL PLAYGROUND
     ========================================================= */
  const sp = $("#viz-signal .viz-body");
  if (sp) {
    const PRESETS = {
      delta: { label: "δ[n] (impulse)", build: (p) => ({ n0: 0, v: (n) => (n === p.n0 ? 1 : 0) }) },
      step: { label: "u[n] (unit step)", build: (p) => ({ n0: 0, v: (n) => (n >= p.n0 ? 1 : 0) }) },
      antistep: { label: "u[−n−1] (anti-causal step)", build: (p) => ({ n0: 0, v: (n) => (n <= -1 - p.n0 ? 1 : 0) }) },
      exp: { label: "aⁿu[n] (exponential)", build: (p) => ({ n0: 0, v: (n) => (n >= p.n0 ? p.a ** (n - p.n0) : 0) }) },
      cos: { label: "cos(ωn+φ) (sinusoid)", build: (p) => ({ n0: 0, v: (n) => Math.cos(p.w * (n - p.n0) + p.ph) }) },
      rect: { label: "u[n+2]−u[n−3] (rectangle)", build: (p) => ({ n0: 0, v: (n) => (n >= -2 ? 1 : 0) - (n >= 3 ? 1 : 0) }) }
    };
    const state = { preset: "rect", n0: 0, a: 0.8, w: 0.9, ph: 0, op: "x" };

    sp.appendChild(el("div", { class: "controls" }, `
      <label>Signal
        <select id="sp-preset">
          ${Object.keys(PRESETS).map((k) => `<option value="${k}">${PRESETS[k].label}</option>`).join("")}
        </select>
      </label>
      <label>Operation
        <select id="sp-op">
          <option value="x">x[n]</option>
          <option value="shift_r">x[n−n₀]  (delay)</option>
          <option value="shift_l">x[n+n₀]  (advance)</option>
          <option value="rev">x[−n]  (reverse)</option>
          <option value="dec">x[2n]  (decimate)</option>
        </select>
      </label>
    `));
    const sliders = el("div", { class: "controls" });
    sp.appendChild(sliders);
    const canvas = el("canvas", { class: "signal-canvas" });
    sp.appendChild(canvas);
    const out = el("div", { class: "readouts" });
    sp.appendChild(out);
    sp.appendChild(el("div", { class: "legend" },
      `<span><i style="background:${COL.base}"></i>original x[n]</span><span><i style="background:${COL.main}"></i>after the operation</span>`));

    function sliderRow(label, min, max, stepv, key) {
      const row = el("div", { class: "range-row", style: "min-width:210px;flex:1" });
      row.innerHTML = `<label>${label} <span class="rv" id="sp-v-${key}"></span></label>
        <input type="range" min="${min}" max="${max}" step="${stepv}" value="${state[key]}">`;
      sliders.appendChild(row);
      const inp = row.querySelector("input");
      inp.addEventListener("input", () => {
        state[key] = parseFloat(inp.value);
        draw();
      });
      return row;
    }
    sliderRow("n₀ =", -8, 8, 1, "n0");
    sliderRow("a =", 0.2, 1.8, 0.05, "a");
    sliderRow("ω =", 0.1, 3.0, 0.05, "w");
    sliderRow("φ =", 0, 3.14, 0.05, "ph");

    $("#sp-preset").value = state.preset;
    $("#sp-op").value = state.op;
    $("#sp-preset").addEventListener("change", (e) => { state.preset = e.target.value; draw(); });
    $("#sp-op").addEventListener("change", (e) => { state.op = e.target.value; draw(); });

    function values() {
      const p = state;
      const sig = PRESETS[p.preset].build(p);
      const NMIN = -14, NMAX = 14;
      const base = [], res = [];
      for (let n = NMIN; n <= NMAX; n++) {
        base.push(sig.v(n));
        let k = n;
        if (p.op === "shift_r") k = n - p.n0;
        else if (p.op === "shift_l") k = n + p.n0;
        else if (p.op === "rev") k = -n;
        else if (p.op === "dec") { if (n % 2 !== 0) { res.push(0); continue; } k = 2 * n; }
        res.push(sig.v(k));
      }
      return { base, res, NMIN, NMAX };
    }

    function draw() {
      const { base, res, NMIN, NMAX } = values();
      const W = 720, H = 280;
      const { ctx } = setupCanvas(canvas, W, H);
      let maxAbs = 0.2;
      base.concat(res).forEach((v) => { maxAbs = Math.max(maxAbs, Math.abs(v)); });
      const yMax = Math.ceil(maxAbs * 1.15 * 2) / 2;
      const xt = [];
      for (let n = NMIN; n <= NMAX; n += 2) xt.push(n);
      const yt = [-yMax, -yMax / 2, 0, yMax / 2, yMax].filter((v, i, a) => a.indexOf(v) === i);
      stems(ctx, W, H, {
        xMin: NMIN, xMax: NMAX, yMin: -yMax, yMax, n0: NMIN, xTicks: xt, yTicks: yt,
        xlabel: "n", ylabel: "amplitude",
        series: [
          { values: base, color: COL.base },
          { values: res, color: COL.main }
        ]
      });
      $("#sp-v-n0").textContent = state.n0;
      $("#sp-v-a").textContent = state.a.toFixed(2);
      $("#sp-v-w").textContent = state.w.toFixed(2);
      $("#sp-v-ph").textContent = state.ph.toFixed(2);

      const sup = (arr) => {
        const s = [];
        arr.forEach((v, i) => { if (Math.abs(v) > 1e-9) s.push(NMIN + i); });
        return s.length ? `${s[0]} … ${s[s.length - 1]}` : "—";
      };
      out.innerHTML = `
        <div class="readout"><span class="lab">Support of x[n]</span><span class="val">${sup(base)}</span></div>
        <div class="readout"><span class="lab">Support after op</span><span class="val">${sup(res)}</span></div>
        <div class="readout"><span class="lab">x[0]</span><span class="val">${fmt(base[0 - NMIN], 3)}</span></div>
        <div class="readout"><span class="lab">Result at n = 0</span><span class="val">${fmt(res[0 - NMIN], 3)}</span></div>`;
    }
    draw();
  }

  /* =========================================================
     2. SHIFT / REVERSE / DECIMATE (4 mini plots)
     ========================================================= */
  const tf = $("#viz-transform .viz-body");
  if (tf) {
    const state = { n0: 3, shape: "tri" };
    const SHAPES = {
      tri: { label: "triangle (1,2,3,4,3,2,1)", build: () => { const v = []; for (let n = -4; n <= 4; n++) v.push(4 - Math.abs(n)); return { base: -4, v }; } },
      sin: { label: "cos(πn/4)", build: () => { const v = []; for (let n = -8; n <= 8; n++) v.push(Math.cos(Math.PI * n / 4)); return { base: -8, v }; } },
      rect: { label: "rectangle u[n]−u[n−4]", build: () => { const v = []; for (let n = -4; n <= 4; n++) v.push((n >= 0 && n <= 3) ? 1 : 0); return { base: -4, v }; } }
    };
    tf.appendChild(el("div", { class: "controls" }, `
      <label>Base signal <select id="tf-shape">${Object.keys(SHAPES).map((k) => `<option value="${k}">${SHAPES[k].label}</option>`).join("")}</select></label>
      <label>n₀ <input type="number" id="tf-n0" value="3" min="-8" max="8" style="min-width:70px"></label>`));
    const grid = el("div", { class: "viz-grid-2" });
    tf.appendChild(grid);
    const OPS = [
      { key: "x", title: "x[n] — original" },
      { key: "shift", title: "x[n − n₀] — delay by n₀ (shifts RIGHT)" },
      { key: "rev", title: "x[−n] — reversal (reflects about n = 0)" },
      { key: "dec", title: "x[2n] — decimation (keeps every other sample)" }
    ];
    const panes = {};
    OPS.forEach((o) => {
      const box = el("div");
      box.innerHTML = `<div class="small" style="font-weight:700;margin-bottom:4px;color:var(--ink-2)"}, ">${o.title}</div>`;
      const cv = el("canvas", { class: "signal-canvas" });
      box.appendChild(cv);
      grid.appendChild(box);
      panes[o.key] = cv;
    });
    tf.appendChild(el("div", { class: "legend" },
      `<span><i style="background:${COL.main}"></i>the transformed sequence</span><span>Remember: <code>x[n−n₀]</code> moves to the <strong>right</strong>.</span>`));

    $("#tf-shape").addEventListener("change", (e) => { state.shape = e.target.value; draw(); });
    $("#tf-n0").addEventListener("input", (e) => { state.n0 = parseInt(e.target.value, 10) || 0; draw(); });

    function draw() {
      const sig = SHAPES[state.shape].build();
      const NMIN = -12, NMAX = 12;
      const get = (k) => {
        const i = k - sig.base;
        return (i >= 0 && i < sig.v.length) ? sig.v[i] : 0;
      };
      const W = 460, H = 190;
      OPS.forEach((o) => {
        const { ctx } = setupCanvas(panes[o.key], W, H);
        const vals = [];
        for (let n = NMIN; n <= NMAX; n++) {
          let k = n;
          if (o.key === "shift") k = n - state.n0;
          else if (o.key === "rev") k = -n;
          else if (o.key === "dec") { if (n % 2 !== 0) { vals.push(0); continue; } k = 2 * n; }
          vals.push(get(k));
        }
        let m = 0.3;
        vals.forEach((v) => { m = Math.max(m, Math.abs(v)); });
        const yMax = Math.ceil(m * 1.2 * 2) / 2;
        const xt = [];
        for (let n = NMIN; n <= NMAX; n += 3) xt.push(n);
        stems(ctx, W, H, {
          xMin: NMIN, xMax: NMAX, yMin: -yMax, yMax, n0: NMIN, xTicks: xt,
          yTicks: [-yMax, 0, yMax], series: [{ values: vals, color: COL.main }]
        });
      });
    }
    draw();
  }

  /* =========================================================
     3. CONVOLUTION EXPLORER
     ========================================================= */
  const cv = $("#viz-conv .viz-body");
  if (cv) {
    const PRESETS = {
      rect23: {
        label: "2023 Ex 4 — x[n]=h[n]=u[n+20]−u[n−21]",
        x: { base: -25, v: [] }, h: { base: -25, v: [] },
        note: "Two 41-wide rectangles. The convolution is a triangle of height 41 at n = 0."
      },
      geo2425: {
        label: "2024–25 Ex 4 — x[n]=h[n]=(1/3)ⁿu[n]",
        x: { base: 0, v: [] }, h: { base: 0, v: [] },
        note: "Two right-sided geometric sequences: the number of overlapping terms is n+1, so y[n] = (n+1)(1/3)ⁿ."
      },
      stepgeo: {
        label: "make-up Ex 3 — x[n]=u[n], h[n]=(1/5)ⁿu[n]",
        x: { base: 0, v: [] }, h: { base: 0, v: [] },
        note: "y[n] = (5/4)(1 − (1/5)ⁿ⁺¹)u[n] — the running sum of a geometric sequence."
      },
      impulses: {
        label: "Two impulses — x[n]=δ[n], h[n]=δ[n−2]",
        x: { base: -4, v: [] }, h: { base: -4, v: [] },
        note: "δ * δ[n−2] = δ[n−2]: convolution with an impulse is just a shift."
      }
    };
    /* build sample data */
    function fill() {
      let r;
      r = PRESETS.rect23;
      for (let n = -25; n <= 25; n++) { r.x.v.push((n >= -20 && n <= 20) ? 1 : 0); r.h.v.push((n >= -20 && n <= 20) ? 1 : 0); }
      r = PRESETS.geo2425;
      for (let n = 0; n <= 14; n++) { r.x.v.push(Math.pow(1 / 3, n)); r.h.v.push(Math.pow(1 / 3, n)); }
      r = PRESETS.stepgeo;
      for (let n = 0; n <= 14; n++) { r.x.v.push(1); r.h.v.push(Math.pow(1 / 5, n)); }
      r = PRESETS.impulses;
      for (let n = -4; n <= 4; n++) { r.x.v.push(n === 0 ? 1 : 0); r.h.v.push(n === 2 ? 1 : 0); }
    }
    fill();
    const state = { preset: "rect23", n: 0 };

    cv.appendChild(el("div", { class: "controls" }, `
      <label>Example <select id="cv-preset">${Object.keys(PRESETS).map((k) => `<option value="${k}">${PRESETS[k].label}</option>`).join("")}</select></label>`));
    const sliderBox = el("div", { class: "controls" });
    sliderBox.innerHTML = `<label style="flex:1;min-width:260px">Position n <span class="rv" id="cv-n"></span>
      <input type="range" id="cv-slider" min="-45" max="45" step="1" value="0"></label>`;
    cv.appendChild(sliderBox);
    const c1 = el("canvas", { class: "signal-canvas" });
    const c2 = el("canvas", { class: "signal-canvas" });
    cv.appendChild(el("div", { class: "small", style: "font-weight:700;margin:10px 0 4px;color:var(--ink-2)"}, ">1 · x[n] (grey) and the flipped, shifted h[n−k] (orange)</div>"));
    cv.appendChild(c1);
    cv.appendChild(el("div", { class: "small", style: "font-weight:700;margin:14px 0 4px;color:var(--ink-2)"}, ">2 · the products x[k]·h[n−k] (bars) and the running sum y[n]</div>"));
    cv.appendChild(c2);
    const out = el("div", { class: "readouts" });
    cv.appendChild(out);
    const note = el("div", { class: "note", style: "margin-top:12px" });
    cv.appendChild(note);
    cv.appendChild(el("div", { class: "legend" },
      `<span><i style="background:${COL.base}"></i>x[n]</span><span><i style="background:${COL.alt}"></i>h[n−k] at the current n</span><span><i style="background:${COL.main}"></i>products / y[n]</span>`));

    $("#cv-preset").addEventListener("change", (e) => {
      state.preset = e.target.value;
      state.n = 0;
      $("#cv-slider").value = 0;
      draw();
    });
    $("#cv-slider").addEventListener("input", (e) => { state.n = parseInt(e.target.value, 10); draw(); });

    function get(sig, k) {
      const i = k - sig.base;
      return (i >= 0 && i < sig.v.length) ? sig.v[i] : 0;
    }

    function draw() {
      const P = PRESETS[state.preset];
      const n = state.n;
      const W = 760, H = 250;
      const xSig = P.x, hSig = P.h;
      const nMin = Math.min(xSig.base, hSig.base - 40) - 4;
      const nMax = Math.max(xSig.base + xSig.v.length - 1, hSig.base + hSig.v.length - 1 + 40) + 4;

      // panel 1
      {
        const { ctx } = setupCanvas(c1, W, H);
        const xs = [], hs = [];
        for (let k = nMin; k <= nMax; k++) {
          xs.push(get(xSig, k));
          hs.push(get(hSig, n - k));
        }
        let m = 0.3;
        xs.concat(hs).forEach((v) => { m = Math.max(m, Math.abs(v)); });
        const yMax = Math.ceil(m * 1.2 * 2) / 2;
        const xt = [];
        for (let k = nMin; k <= nMax; k += Math.max(1, Math.round((nMax - nMin) / 12))) xt.push(k);
        const f = stems(ctx, W, H, {
          xMin: nMin, xMax: nMax, yMin: -yMax, yMax, n0: nMin, xTicks: xt,
          yTicks: [-yMax, 0, yMax], series: [{ values: xs, color: COL.base }, { values: hs, color: COL.alt }]
        });
        // marker at n
        ctx.strokeStyle = COL.main; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(f.sx(n), f.m.t); ctx.lineTo(f.sx(n), f.m.t + f.ph); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = COL.main; ctx.textAlign = "left";
        ctx.fillText("n = " + n, f.sx(n) + 4, f.m.t + 10);
      }

      // panel 2 — products
      let products = [], sum = 0, nz = 0;
      {
        const { ctx } = setupCanvas(c2, W, H);
        const lo = Math.max(xSig.base, n - (hSig.base + hSig.v.length - 1));
        const hi = Math.min(xSig.base + xSig.v.length - 1, n - hSig.base);
        for (let k = lo; k <= hi; k++) {
          const v = get(xSig, k) * get(hSig, n - k);
          products.push([k, v]);
          sum += v;
          if (Math.abs(v) > 1e-12) nz++;
        }
        const vals = [];
        const kmin = nMin, kmax = nMax;
        for (let k = kmin; k <= kmax; k++) {
          const p = products.find((q) => q[0] === k);
          vals.push(p ? p[1] : 0);
        }
        let m = 0.3;
        vals.forEach((v) => { m = Math.max(m, Math.abs(v)); });
        const yMax = Math.ceil(m * 1.25 * 2) / 2;
        const xt = [];
        for (let k = kmin; k <= kmax; k += Math.max(1, Math.round((kmax - kmin) / 12))) xt.push(k);
        stems(ctx, W, H, {
          xMin: kmin, xMax: kmax, yMin: -yMax, yMax, n0: kmin, xTicks: xt,
          yTicks: [-yMax, 0, yMax], series: [{ values: vals, color: COL.main }]
        });
        ctx.fillStyle = COL.main; ctx.textAlign = "left"; ctx.font = "12px ui-monospace, monospace";
        ctx.fillText("y[" + n + "] = Σ = " + fmt(sum, 5), 60, 20);
      }

      $("#cv-n").textContent = n;
      out.innerHTML = `
        <div class="readout"><span class="lab">Current n</span><span class="val">${n}</span></div>
        <div class="readout"><span class="lab">Overlapping terms</span><span class="val">${nz}</span></div>
        <div class="readout"><span class="lab">y[n] = Σ x[k]h[n−k]</span><span class="val">${fmt(sum, 5)}</span></div>
        <div class="readout"><span class="lab">Products</span><span class="val" style="font-size:.82rem">${products.length ? products.map((p) => p[0] + ":" + fmt(p[1], 4)).join("  ") : "—"}</span></div>`;
      note.innerHTML = "<strong>Note.</strong> " + P.note + (nz === 0 ? " <strong>At this position the two supports do not overlap at all, so y[n] = 0.</strong>" : "");
    }
    draw();
  }

  /* =========================================================
     4. SYSTEM PROPERTY CHECKER
     ========================================================= */
  const pc = $("#viz-props .viz-body");
  if (pc) {
    const SYS = [
      { id: "cshift", f: "y[n] = cos(π/10)·x[n−2]", src: "2024–25 control Ex 2.1",
        y: (x, n) => Math.cos(Math.PI / 10) * x.get(n - 2),
        why: { linear: "A constant multiple of a shifted input is still linear.", ti: "The shift by 2 is the same for every n₀, so shifting the input shifts the output by the same amount.", causal: "x[n−2] is a past sample.", stable: "|cos(π/10)|·|x[n−2]| ≤ 1·M for a bounded input." } },
      { id: "nplus1", f: "y[n] = (n+1)·x[n−1]", src: "2023 control Ex 2.1",
        y: (x, n) => (n + 1) * x.get(n - 1),
        why: { linear: "(n+1) is a coefficient that does not depend on the input, so the superposition test holds.", ti: "The factor (n+1) moves with n: y[n−n₀] = (n−n₀+1)x[n−n₀−1] ≠ (n+1)x[n−n₀−1].", causal: "x[n−1] is a past sample.", stable: "With the bounded input x[n]=e^{jn}, |y[n]| = |n+1| → ∞." } },
      { id: "sq", f: "y[n] = 2·x[n]²", src: "Recitation 1 Ex 3",
        y: (x, n) => 2 * x.get(n) * x.get(n),
        why: { linear: "T{ax₁+bx₂} = 2(ax₁+bx₂)² ≠ 2a x₁² + 2b x₂².", ti: "The operation itself does not involve n.", causal: "Only x[n] is used.", stable: "|2x[n]²| ≤ 2M² for a bounded input." } },
      { id: "abs", f: "y[n] = |x[n]|", src: "Recitation 1 Ex 3",
        y: (x, n) => Math.abs(x.get(n)),
        why: { linear: "|ax₁+bx₂| ≠ a|x₁|+b|x₂| in general.", ti: "The operation does not involve n.", causal: "Only x[n] is used.", stable: "|x[n]| ≤ M for a bounded input." } },
      { id: "sumfut", f: "y[n] = x[n] + x[n+1]", src: "Recitation 1 Ex 3",
        y: (x, n) => x.get(n) + x.get(n + 1),
        why: { linear: "Sum of two shifted inputs, scaled by 1.", ti: "Both shifts are fixed, so the shift property holds.", causal: "x[n+1] is a FUTURE sample ⇒ non-causal.", stable: "|y[n]| ≤ 2M." } },
      { id: "dec", f: "y[n] = 2·x[2n]", src: "Recitation 1 Ex 3",
        y: (x, n) => 2 * x.get(2 * n),
        why: { linear: "A fixed scalar times a re-indexed input.", ti: "Time scaling is NOT time-invariant: T{x[n−n₀]} = 2x[2n−n₀] while y[n−n₀] = 2x[2n−2n₀] — the shift comes out scaled by ½.", causal: "For n>0 the index 2n is in the future ⇒ non-causal.", stable: "|y[n]| ≤ 2M." } },
      { id: "cosn", f: "y[n] = cos(n)·x[n]", src: "Recitation 1 Ex 3",
        y: (x, n) => Math.cos(n) * x.get(n),
        why: { linear: "The coefficient does not depend on the input.", ti: "cos(n−n₀) ≠ cos(n) in general ⇒ not time-invariant.", causal: "Only x[n] is used.", stable: "|cos(n)| ≤ 1." } },
      { id: "plus2", f: "y[n] = x[n] + x[n+2]", src: "Recitation 1 Ex 3",
        y: (x, n) => x.get(n) + x.get(n + 2),
        why: { linear: "Sum of two shifted inputs.", ti: "Both shifts are fixed.", causal: "x[n+2] is a future sample ⇒ non-causal.", stable: "|y[n]| ≤ 2M." } },
      { id: "nx", f: "y[n] = n·x[n]", src: "Recitation 1",
        y: (x, n) => n * x.get(n),
        why: { linear: "n is a coefficient, not a function of the input.", ti: "n moves with the time shift ⇒ not time-invariant.", causal: "Only x[n] is used.", stable: "With x[n]=1, |y[n]| = |n| → ∞." } },
      { id: "diff2", f: "y[n] = x[n] − x[n−2]", src: "make-up exam Ex 1",
        y: (x, n) => x.get(n) - x.get(n - 2),
        why: { linear: "Difference of two shifted inputs.", ti: "Both shifts are fixed.", causal: "x[n−2] is a past sample.", stable: "h[n] = δ[n] − δ[n−2], Σ|h[n]| = 2." } },
      { id: "halfs", f: "y[n] = (1/2)ⁿ·x[n]", src: "Recitation 1",
        y: (x, n) => Math.pow(0.5, n) * x.get(n),
        why: { linear: "The coefficient does not depend on the input.", ti: "(1/2)ⁿ changes with the shift ⇒ not time-invariant.", causal: "Only x[n] is used.", stable: "|(1/2)ⁿ| ≤ 1." } },
      { id: "expn", f: "y[n] = cos(πn/4)·x[n]", src: "Chapter 2",
        y: (x, n) => Math.cos(Math.PI * n / 4) * x.get(n),
        why: { linear: "The coefficient does not depend on the input.", ti: "The factor changes with n ⇒ not time-invariant.", causal: "Only x[n] is used.", stable: "|cos(πn/4)| ≤ 1." } }
    ];

    const state = { id: "nplus1" };
    pc.appendChild(el("div", { class: "controls" }, `
      <label>System <select id="pc-sys">${SYS.map((s) => `<option value="${s.id}">${s.f}</option>`).join("")}</select></label>
      <span class="pill" id="pc-src"></span>`));
    const propBox = el("div", { class: "prop-grid" });
    pc.appendChild(propBox);
    const whyBox = el("div", { style: "margin-top:14px" });
    pc.appendChild(whyBox);
    const out = el("div", { class: "readouts" });
    pc.appendChild(out);

    $("#pc-sys").addEventListener("change", (e) => { state.id = e.target.value; draw(); });

    /* ---- generic numeric testers ---- */
    function mkSeq(arr, base) {
      return { base, get(k) { const i = k - base; return (i >= 0 && i < arr.length) ? arr[i] : 0; } };
    }
    function rnd(seed) {
      let s = seed;
      return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return (s / 0x7fffffff) * 2 - 1; };
    }
    function testLinear(sys) {
      const r = rnd(7);
      const N = 40, base = -20;
      const a1 = [], a2 = [];
      for (let i = 0; i < N; i++) { a1.push(r()); a2.push(r()); }
      const x1 = mkSeq(a1, base), x2 = mkSeq(a2, base);
      const A = 2, B = -3;
      const comb = mkSeq(a1.map((v, i) => A * v + B * a2[i]), base);
      let worst = 0;
      for (let n = -10; n <= 10; n++) {
        const lhs = sys.y(comb, n);
        const rhs = A * sys.y(x1, n) + B * sys.y(x2, n);
        worst = Math.max(worst, Math.abs(lhs - rhs));
      }
      return { ok: worst < 1e-9, worst };
    }
    function testTI(sys) {
      const r = rnd(11);
      const N = 60, base = -25;
      const arr = []; for (let i = 0; i < N; i++) arr.push(r());
      const x = mkSeq(arr, base);
      const n0 = 3;
      const xs = mkSeq(arr, base);
      const shifted = { get(k) { return x.get(k - n0); } };
      let worst = 0;
      for (let n = -8; n <= 8; n++) {
        worst = Math.max(worst, Math.abs(sys.y(shifted, n) - sys.y(x, n - n0)));
      }
      return { ok: worst < 1e-9, worst };
    }
    function testCausal(sys) {
      const base = -20, N = 80;
      const arr = []; const r = rnd(23);
      for (let i = 0; i < N; i++) arr.push(r());
      const x = mkSeq(arr, base);
      const n = 10;
      const pert = [];
      for (let i = 0; i < N; i++) {
        const k = base + i;
        pert.push((k > n) ? arr[i] + 0.9 : arr[i]);
      }
      const xp = mkSeq(pert, base);
      const d = Math.abs(sys.y(x, n) - sys.y(xp, n));
      return { ok: d < 1e-9, d };
    }
    function testMemoryless(sys) {
      const base = -20, N = 80;
      const arr = []; const r = rnd(31);
      for (let i = 0; i < N; i++) arr.push(r());
      const x = mkSeq(arr, base);
      const n = 10;
      const pert = arr.map((v, i) => (base + i === n) ? v : v + 0.7);
      const xp = mkSeq(pert, base);
      const d = Math.abs(sys.y(x, n) - sys.y(xp, n));
      return { ok: d < 1e-9, d };
    }
    function testStable(sys) {
      const base = -200, N = 700;
      const inputs = [];
      const ones = [], alt = [], cosw = [], expw = [], rand = [];
      const r = rnd(47);
      for (let i = 0; i < N; i++) {
        ones.push(1); alt.push(i % 2 ? -1 : 1);
        cosw.push(Math.cos(0.7 * (base + i)));
        expw.push(0.6 * Math.cos(0.31 * (base + i)) + 0.4 * Math.sin(1.7 * (base + i)));
        rand.push(r() > 0 ? 1 : -1);
      }
      inputs.push(mkSeq(ones, base), mkSeq(alt, base), mkSeq(cosw, base), mkSeq(expw, base), mkSeq(rand, base));
      function peak(from, to) {
        let m = 0;
        inputs.forEach((x) => {
          for (let n = from; n <= to; n++) {
            const v = Math.abs(sys.y(x, n));
            if (v > m) m = v;
          }
        });
        return m;
      }
      const m1 = peak(20, 40), m2 = peak(300, 340);
      const ratio = m2 / Math.max(m1, 1e-9);
      return { ok: ratio < 3, ratio, m1, m2 };
    }

    function draw() {
      const sys = SYS.find((s) => s.id === state.id);
      const lin = testLinear(sys), ti = testTI(sys), cau = testCausal(sys), mem = testMemoryless(sys), sta = testStable(sys);
      const props = [
        { k: "linear", n: "Linear", r: lin.ok },
        { k: "ti", n: "Time-invariant", r: ti.ok },
        { k: "causal", n: "Causal", r: cau.ok },
        { k: "stable", n: "Stable", r: sta.ok },
        { k: "mem", n: "Memoryless", r: mem.ok }
      ];
      propBox.innerHTML = props.map((p) =>
        `<div class="prop ${p.r ? "yes" : "no"}"><span class="pn">${p.n}</span><span class="pv">${p.r ? "YES" : "NO"}</span></div>`
      ).join("");
      whyBox.innerHTML = props.map((p) =>
        `<details class="work"><summary>${p.n}: ${p.r ? "yes" : "no"} — why</summary><p>${sys.why[p.k]}</p></details>`
      ).join("");
      $("#pc-src").textContent = sys.src;
      out.innerHTML = `
        <div class="readout"><span class="lab">Superposition error</span><span class="val">${lin.worst.toExponential(2)}</span><span class="done-meta">0 ⇒ linear</span></div>
        <div class="readout"><span class="lab">Shift mismatch</span><span class="val">${ti.worst.toExponential(2)}</span><span class="done-meta">0 ⇒ time-invariant</span></div>
        <div class="readout"><span class="lab">Future-sample effect</span><span class="val">${cau.d.toExponential(2)}</span><span class="done-meta">0 ⇒ causal</span></div>
        <div class="readout"><span class="lab">Output growth |y|</span><span class="val">${fmt(sta.m1, 2)} → ${fmt(sta.m2, 2)}</span><span class="done-meta">ratio ${fmt(sta.ratio, 2)}; >3 ⇒ unstable</span></div>`;
    }
    draw();
  }
})();
