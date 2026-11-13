/* ============================================================
   Chapter 2 — DT LTI Systems: visualizations
   ============================================================ */
(function () {
  "use strict";
  const { fmt, setupCanvas, stems, el, $ } = window.LS;
  const COL = { base: "#9aa6bb", main: "#10695c", alt: "#b4540c" };

  /* =========================================================
     1. DIFFERENCE-EQUATION SOLVER
     ========================================================= */
  const df = $("#viz-diff .viz-body");
  if (df) {
    const state = { a1: 0.5, a2: 0, b0: 1, b1: 0, N: 12 };

    df.appendChild(el("div", { class: "controls" }, `
      <label>y[n] = −(a₁/a₀)y[n−1] − (a₂/a₀)y[n−2] + (b₀/a₀)x[n] + (b₁/a₀)x[n−1]</label>`));
    const ctl = el("div", { class: "controls" });
    df.appendChild(ctl);

    function slider(label, key, min, max, stepv) {
      const row = el("div", { class: "range-row", style: "min-width:190px;flex:1" });
      row.innerHTML = `<label>${label} <span class="rv" id="df-v-${key}"></span></label>
        <input type="range" min="${min}" max="${max}" step="${stepv}" value="${state[key]}">`;
      ctl.appendChild(row);
      row.querySelector("input").addEventListener("input", (e) => {
        state[key] = parseFloat(e.target.value); draw();
      });
    }
    slider("a₁ =", "a1", -1.5, 1.5, 0.05);
    slider("a₂ =", "a2", -1.5, 1.5, 0.05);
    slider("b₀ =", "b0", -1.5, 1.5, 0.05);
    slider("b₁ =", "b1", -1.5, 1.5, 0.05);
    slider("N =", "N", 6, 25, 1);

    const presets = el("div", { class: "controls" }, `
      <label>Preset
        <select id="df-preset">
          <option value="first">y[n] = ½y[n−1] + x[n]  (stable, causal)</option>
          <option value="osc">y[n] = y[n−1] − y[n−2] + x[n]  (marginal)</option>
          <option value="unstable">y[n] = −1.2y[n−1] + x[n]  (unstable)</option>
          <option value="iir">y[n] = 0.5y[n−1] + x[n] − x[n−1]  (FIR + IIR)</option>
        </select>
      </label>`);
    df.appendChild(presets);

    const cImp = el("canvas", { class: "signal-canvas", id: "df-cimp" });
    const cStep = el("canvas", { class: "signal-canvas", id: "df-cstep" });
    df.appendChild(el("div", { class: "small", style: "font-weight:700;margin:8px 0 4px;color:var(--ink-2)"}, ">Impulse response h[n] (input δ[n])</div>"));
    df.appendChild(cImp);
    df.appendChild(el("div", { class: "small", style: "font-weight:700;margin:14px 0 4px;color:var(--ink-2)"}, ">Step response (input u[n])</div>"));
    df.appendChild(cStep);

    const table = el("div", { class: "table-wrap" });
    df.appendChild(table);
    const out = el("div", { class: "readouts" });
    df.appendChild(out);

    $("#df-preset").addEventListener("change", (e) => {
      const v = e.target.value;
      if (v === "first") Object.assign(state, { a1: 0.5, a2: 0, b0: 1, b1: 0 });
      if (v === "osc") Object.assign(state, { a1: -1, a2: 1, b0: 1, b1: 0 });
      if (v === "unstable") Object.assign(state, { a1: -1.2, a2: 0, b0: 1, b1: 0 });
      if (v === "iir") Object.assign(state, { a1: 0.5, a2: 0, b0: 1, b1: -1 });
      draw();
    });

    function simulate() {
      const N = state.N;
      const h = new Array(N).fill(0);
      for (let n = 0; n < N; n++) {
        let acc = 0;
        if (n === 0) acc += state.b0;
        if (n === 1) acc += state.b1;
        h[n] = -state.a1 * (n >= 1 ? h[n - 1] : 0) - state.a2 * (n >= 2 ? h[n - 2] : 0) + acc;
      }
      const y = new Array(N).fill(0);
      for (let n = 0; n < N; n++) {
        let acc = state.b0 + (n >= 1 ? state.b1 : 0);   // x[n] = u[n], x[n−1] = 1 for n ≥ 1
        y[n] = -state.a1 * (n >= 1 ? y[n - 1] : 0) - state.a2 * (n >= 2 ? y[n - 2] : 0) + acc;
      }
      return { h, y };
    }

    function draw() {
      const { h, y } = simulate();
      const N = state.N;
      const W = 760, H = 210;
      [[cImp, h], [cStep, y]].forEach(([cv, vals]) => {
        const { ctx } = setupCanvas(cv, W, H);
        let m = 0.3;
        vals.forEach((v) => { m = Math.max(m, Math.abs(v)); });
        const yMax = Math.ceil(m * 1.25 * 2) / 2;
        const xt = [];
        for (let n = 0; n <= N; n += 2) xt.push(n);
        stems(ctx, W, H, {
          xMin: 0, xMax: N, yMin: -yMax, yMax, n0: 0, xTicks: xt,
          yTicks: [-yMax, 0, yMax], xlabel: "n",
          series: [{ values: vals, color: COL.main }]
        });
      });

      let rows = "<thead><tr><th>n</th><th>h[n] recursion</th><th>h[n]</th><th>y[n] step</th></tr></thead><tbody>";
      for (let n = 0; n < Math.min(N, 10); n++) {
        const terms = [];
        if (n >= 1) terms.push(`−${state.a1}·h[${n - 1}]`);
        if (n >= 2) terms.push(`−${state.a2}·h[${n - 2}]`);
        if (n === 0) terms.push(`+${state.b0}·δ[0]`);
        if (n === 1) terms.push(`+${state.b1}·δ[0]`);
        rows += `<tr><td>${n}</td><td class="mono" style="font-size:.8rem">${terms.join(" ")}</td><td class="mono">${fmt(h[n], 4)}</td><td class="mono">${fmt(y[n], 4)}</td></tr>`;
      }
      rows += "</tbody>";
      table.innerHTML = `<table>${rows}</table>`;

      const sumH = h.reduce((s, v) => s + Math.abs(v), 0);
      const growing = h.length > 4 && Math.abs(h[N - 1]) > Math.abs(h[3]) + 1e-9 && Math.abs(h[N - 1]) > 1;
      out.innerHTML = `
        <div class="readout"><span class="lab">h[0]</span><span class="val">${fmt(h[0], 4)}</span></div>
        <div class="readout"><span class="lab">h[1]</span><span class="val">${fmt(h[1], 4)}</span></div>
        <div class="readout"><span class="lab">Σ|h[n]| (first N)</span><span class="val">${fmt(sumH, 3)}</span></div>
        <div class="readout"><span class="lab">Causal?</span><span class="val ${growing ? "result-bad" : "result-good"}">${growing ? "check: growing" : "yes (h[n]=0 for n<0)"}</span><span class="done-meta">${growing ? "the recursion grows ⇒ poles outside the unit circle ⇒ unstable" : "stability needs Σ|h[n]| &lt; ∞ — check the sum"}</span></div>`;

      ["a1", "a2", "b0", "b1", "N"].forEach((k) => {
        const elv = document.getElementById("df-v-" + k);
        if (elv) elv.textContent = state[k];
      });
      const sliders = ctl.querySelectorAll("input");
      sliders[0].value = state.a1; sliders[1].value = state.a2;
      sliders[2].value = state.b0; sliders[3].value = state.b1; sliders[4].value = state.N;
    }
    draw();
  }

  /* =========================================================
     2. CASCADE / DECONVOLUTION EXPLORER
     ========================================================= */
  const cc = $("#viz-cascade .viz-body");
  if (cc) {
    const state = { h1: [1, 0, -1], h: [1, 5, 10, 11, 8, 4, 1], len: 16 };
    const PRESETS = {
      rec2: { label: "Recitation 2 Ex 3 — h₁ = δ[n]−δ[n−2]", h1: [1, 0, -1], h: [1, 5, 10, 11, 8, 4, 1] },
      simple: { label: "h₁ = δ[n], h = [1,2,1]", h1: [1], h: [1, 2, 1] },
      expo: { label: "h₁ = (½)ⁿu[n] (first 6), h = h₁*h₂ with h₂ = u[n]", h1: [1, 0.5, 0.25, 0.125, 0.0625, 0.03125], h: [1, 1.5, 1.75, 1.875, 1.9375, 1.96875] }
    };
    cc.appendChild(el("div", { class: "controls" }, `
      <label>Example <select id="cc-preset">${Object.keys(PRESETS).map((k) => `<option value="${k}">${PRESETS[k].label}</option>`).join("")}</select></label>
      <label>Overall h[n] <input type="text" id="cc-h" value="1,5,10,11,8,4,1" style="min-width:190px"></label>`));
    const c1 = el("canvas", { class: "signal-canvas" });
    const c2 = el("canvas", { class: "signal-canvas" });
    cc.appendChild(el("div", { class: "small", style: "font-weight:700;margin:8px 0 4px;color:var(--ink-2)"}, ">h₁[n] (known factor) — grey, and h[n] = h₁*h₂ — green</div>"));
    cc.appendChild(c1);
    cc.appendChild(el("div", { class: "small", style: "font-weight:700;margin:14px 0 4px;color:var(--ink-2)"}, ">recovered h₂[n] — the answer</div>"));
    cc.appendChild(c2);
    const out = el("div", { class: "readouts" });
    cc.appendChild(out);
    cc.appendChild(el("div", { class: "note", style: "margin-top:12px" }, `
      <strong>How the recovery works.</strong> <code>h[n] = Σₖ h₁[k]h₂[n−k]</code>. With <code>h₁ = δ[n] − δ[n−2]</code> this becomes
      <code>h[n] = h₂[n] − h₂[n−2]</code>, so <code>h₂[n] = h[n] + h₂[n−2]</code> — a recursion with lag 2, starting from
      <code>h₂[n] = 0</code> for <code>n &lt; 0</code>. Change the numbers and watch it re-solve.`));

    $("#cc-preset").addEventListener("change", (e) => {
      const p = PRESETS[e.target.value];
      state.h1 = p.h1.slice(); state.h = p.h.slice();
      $("#cc-h").value = p.h.join(",");
      draw();
    });
    $("#cc-h").addEventListener("input", (e) => {
      state.h = e.target.value.split(",").map((v) => parseFloat(v.trim()) || 0);
      draw();
    });

    function deconvolve(h1, h, L) {
      const h2 = new Array(L).fill(0);
      for (let n = 0; n < L; n++) {
        let acc = h[n] || 0;
        for (let k = 1; k < h1.length; k++) acc -= (h1[k] || 0) * h2[n - k];
        h2[n] = acc / (h1[0] || 1);
      }
      return h2;
    }
    function convolve(a, b, L) {
      const c = new Array(L).fill(0);
      for (let i = 0; i < a.length; i++)
        for (let j = 0; j < b.length; j++)
          if (i + j < L) c[i + j] += a[i] * b[j];
      return c;
    }

    function draw() {
      const L = state.len;
      const h2 = deconvolve(state.h1, state.h, L);
      const back = convolve(state.h1, h2, L);
      const W = 760, H = 200;
      [[c1, [{ values: state.h, color: COL.main }, { values: state.h1, color: COL.base }]],
       [c2, [{ values: h2, color: COL.alt }]]].forEach(([cv, series]) => {
        const { ctx } = setupCanvas(cv, W, H);
        let m = 0.3;
        series.forEach((s) => s.values.forEach((v) => { m = Math.max(m, Math.abs(v)); }));
        const yMax = Math.ceil(m * 1.25 * 2) / 2;
        const xt = [];
        for (let n = 0; n <= L; n += 2) xt.push(n);
        stems(ctx, W, H, {
          xMin: 0, xMax: L, yMin: -yMax, yMax, n0: 0, xTicks: xt,
          yTicks: [-yMax, 0, yMax], xlabel: "n", series
        });
      });
      let maxErr = 0;
      for (let n = 0; n < L; n++) maxErr = Math.max(maxErr, Math.abs((back[n] || 0) - (state.h[n] || 0)));
      out.innerHTML = `
        <div class="readout"><span class="lab">h₂[0..4]</span><span class="val" style="font-size:.86rem">${h2.slice(0, 5).map((v) => fmt(v, 3)).join(", ")}</span></div>
        <div class="readout"><span class="lab">h₂[5..9]</span><span class="val" style="font-size:.86rem">${h2.slice(5, 10).map((v) => fmt(v, 3)).join(", ")}</span></div>
        <div class="readout"><span class="lab">Check: max |h₁*h₂ − h|</span><span class="val ${maxErr < 1e-9 ? "result-good" : "result-bad"}">${fmt(maxErr, 6)}</span></div>
        <div class="readout"><span class="lab">Rule</span><span class="val" style="font-size:.8rem">h₂[n] = h[n] − Σₖ₌₁ h₁[k]·h₂[n−k]</span></div>`;
    }
    draw();
  }
})();
