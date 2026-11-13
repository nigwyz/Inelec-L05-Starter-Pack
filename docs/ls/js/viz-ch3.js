/* ============================================================
   Chapter 3 — DT Fourier Series: DFS synthesizer
   ============================================================ */
(function () {
  "use strict";
  const { C, fmt, fmtC, setupCanvas, stems, el, $ } = window.LS;
  const COL = { main: "#10695c", alt: "#b4540c", base: "#9aa6bb" };

  const box = $("#viz-dfs .viz-body");
  if (!box) return;

  const PRESETS = {
    e2023: {
      label: "2023 control Ex 3 — N = 5, aₖ = jᵏ (−1≤k≤1), −1 (k=±2)",
      N: 5,
      a: [[1, 0], [0, 1], [-1, 0], [-1, 0], [0, -1]]
    },
    e2425: {
      label: "2024–25 control Ex 3 — N = 7, a₀=0, a±₁=1, a±₂=2, a±₃=1",
      N: 7,
      a: [[0, 0], [1, 0], [2, 0], [1, 0], [1, 0], [2, 0], [1, 0]]
    },
    makeup: {
      label: "make-up Ex 2 — N = 6, x = [1,0,0.5,1,0.5,0] (analysis)",
      N: 6,
      a: [[0.5, 0], [-1 / 12, 0], [0.25, 0], [1 / 6, 0], [0.25, 0], [-1 / 12, 0]]
    },
    cos: {
      label: "x[n] = cos(2πn/8) — a real signal with real coefficients",
      N: 8,
      a: [[0, 0], [0.5, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0.5, 0], [0, 0]]
    },
    cplx: {
      label: "x[n] = cos(2πn/8 + π/4) — real signal, COMPLEX coefficients",
      N: 8,
      a: [[0, 0], [0.35355, -0.35355], [0, 0], [0, 0], [0, 0], [0, 0], [0.35355, 0.35355], [0, 0]]
    }
  };

  const state = { N: 5, a: PRESETS.e2023.a.map((z) => z.slice()) };

  box.appendChild(el("div", { class: "controls" }, `
    <label>Example <select id="dfs-preset">${Object.keys(PRESETS).map((k) => `<option value="${k}">${PRESETS[k].label}</option>`).join("")}</select></label>
    <label>N <select id="dfs-n">${[4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => `<option value="${n}">${n}</option>`).join("")}</select></label>`));

  const tbl = el("div", { class: "table-wrap" });
  box.appendChild(tbl);

  const cX = el("canvas", { class: "signal-canvas" });
  const cA = el("canvas", { class: "signal-canvas" });
  box.appendChild(el("div", { class: "small", style: "font-weight:700;margin:10px 0 4px;color:var(--ink-2)"}, ">x[n] over one period (n = 0 … N−1) — synthesis</div>"));
  box.appendChild(cX);
  box.appendChild(el("div", { class: "small", style: "font-weight:700;margin:14px 0 4px;color:var(--ink-2)"}, ">the spectrum |aₖ| — analysis</div>"));
  box.appendChild(cA);

  const out = el("div", { class: "readouts" });
  box.appendChild(out);
  const verdict = el("div", { class: "note", style: "margin-top:12px" });
  box.appendChild(verdict);

  $("#dfs-n").value = state.N;
  $("#dfs-preset").addEventListener("change", (e) => {
    const p = PRESETS[e.target.value];
    state.N = p.N; state.a = p.a.map((z) => z.slice());
    $("#dfs-n").value = String(p.N);
    draw();
  });
  $("#dfs-n").addEventListener("change", (e) => {
    state.N = parseInt(e.target.value, 10);
    const old = state.a;
    state.a = [];
    for (let k = 0; k < state.N; k++) state.a.push(old[k] ? old[k].slice() : [0, 0]);
    draw();
  });

  function synthesize(a, N) {
    const x = [];
    for (let n = 0; n < N; n++) {
      let s = [0, 0];
      for (let k = 0; k < N; k++) {
        const w = 2 * Math.PI * k * n / N;
        s = C.add(s, C.mul(a[k], [Math.cos(w), Math.sin(w)]));
      }
      x.push(s);
    }
    return x;
  }
  function analyze(x, N) {
    const a = [];
    for (let k = 0; k < N; k++) {
      let s = [0, 0];
      for (let n = 0; n < N; n++) {
        const w = -2 * Math.PI * k * n / N;
        s = C.add(s, C.mul(x[n], [Math.cos(w), Math.sin(w)]));
      }
      a.push(C.scale(s, 1 / N));
    }
    return a;
  }

  function draw(skipTable) {
    const N = state.N;
    const x = synthesize(state.a, N);
    const aBack = analyze(x, N);

    // coefficient table (string concatenation: no nested templates)
    if (!skipTable) {
      let rows = '<table class="coef-table"><thead><tr><th>k</th><th>Re(a\u2096)</th><th>Im(a\u2096)</th><th>|a\u2096|</th><th>value</th></tr></thead><tbody>';
      for (let k = 0; k < N; k++) {
        const re = state.a[k][0], im = state.a[k][1];
        const show = im === 0
          ? ((re >= 0 ? "" : "\u2212") + Math.abs(re) + " (real)")
          : fmtC(state.a[k], 3);
        rows += '<tr><td>' + k + '</td>'
          + '<td><input type="number" step="0.5" value="' + re + '" data-k="' + k + '" data-c="0"></td>'
          + '<td><input type="number" step="0.5" value="' + im + '" data-k="' + k + '" data-c="1"></td>'
          + '<td class="mono">' + fmt(C.abs(state.a[k]), 3) + '</td>'
          + '<td class="mono" style="font-size:.78rem">' + show + '</td></tr>';
      }
      rows += "</tbody></table>";
      tbl.innerHTML = rows;
      tbl.querySelectorAll("input").forEach((inp) => {
        inp.addEventListener("input", () => {
          const kk = parseInt(inp.getAttribute("data-k"), 10);
          const cc = parseInt(inp.getAttribute("data-c"), 10);
          state.a[kk][cc] = parseFloat(inp.value) || 0;
          draw(true);
        });
      });
    }

    // plots
    const W = 760, H = 210;
    {
      const { ctx } = setupCanvas(cX, W, H);
      const vals = x.map((v) => v[1]);
      let m = 0.3;
      vals.forEach((v) => { m = Math.max(m, Math.abs(v)); });
      const yMax = Math.ceil(m * 1.25 * 2) / 2;
      const xt = []; for (let n = 0; n < N; n++) xt.push(n);
      stems(ctx, W, H, {
        xMin: 0, xMax: N - 1, yMin: -yMax, yMax, n0: 0, xTicks: xt,
        yTicks: [-yMax, 0, yMax], xlabel: "n", series: [{ values: vals, color: COL.main }]
      });
    }
    {
      const { ctx } = setupCanvas(cA, W, H);
      const vals = state.a.map((v) => C.abs(v));
      let m = 0.3;
      vals.forEach((v) => { m = Math.max(m, v); });
      const yMax = Math.ceil(m * 1.25 * 2) / 2;
      const xt = []; for (let k = 0; k < N; k++) xt.push(k);
      stems(ctx, W, H, {
        xMin: 0, xMax: N - 1, yMin: 0, yMax, n0: 0, xTicks: xt,
        yTicks: [0, yMax / 2, yMax], xlabel: "k", series: [{ values: vals, color: COL.alt }]
      });
    }

    // readouts
    const energy = x.reduce((s, v) => s + (v[0] * v[0] + v[1] * v[1]), 0);
    const coefEnergy = state.a.reduce((s, v) => s + C.abs(v) * C.abs(v), 0);
    const imagMax = Math.max.apply(null, x.map((v) => Math.abs(v[1])));
    let symErr = 0;
    for (let k = 0; k < N; k++) {
      const partner = state.a[(N - k) % N];
      symErr = Math.max(symErr, Math.abs(partner[0] - state.a[k][0]), Math.abs(partner[1] + state.a[k][1]));
    }
    let roundErr = 0;
    for (let k = 0; k < N; k++) {
      roundErr = Math.max(roundErr, Math.abs(aBack[k][0] - state.a[k][0]), Math.abs(aBack[k][1] - state.a[k][1]));
    }
    out.innerHTML = `
      <div class="readout"><span class="lab">x[0] = Σ aₖ</span><span class="val">${fmtC(x[0], 3)}</span></div>
      <div class="readout"><span class="lab">Σₙ |x[n]|²</span><span class="val">${fmt(energy, 3)}</span></div>
      <div class="readout"><span class="lab">N · Σₖ |aₖ|²</span><span class="val">${fmt(N * coefEnergy, 3)}</span><span class="done-meta">Parseval must agree</span></div>
      <div class="readout"><span class="lab">x[n] real?</span><span class="val ${imagMax < 1e-9 ? "result-good" : "result-bad"}">${imagMax < 1e-9 ? "yes" : "no (max |Im| = " + fmt(imagMax, 3) + ")"}</span></div>
      <div class="readout"><span class="lab">Conjugate symmetry error</span><span class="val ${symErr < 1e-9 ? "result-good" : ""}">${fmt(symErr, 4)}</span><span class="done-meta">aₖ* vs a₍N−ₖ₎</span></div>
      <div class="readout"><span class="lab">Analysis round-trip error</span><span class="val ${roundErr < 1e-9 ? "result-good" : "result-bad"}">${roundErr.toExponential(1)}</span></div>`;

    const notes = [];
    notes.push(`<strong>Parseval:</strong> Σₙ₌₀^{N−1}|x[n]|² = ${fmt(energy, 3)} and N·Σₖ₌₀^{N−1}|aₖ|² = ${fmt(N * coefEnergy, 3)} — ${Math.abs(energy - N * coefEnergy) < 1e-9 ? "they agree ✓" : "MISMATCH (bug!)"}.`);
    if (imagMax < 1e-9) notes.push("The signal is <strong>real</strong>, so the spectrum must satisfy a₍N−ₖ₎ = aₖ*.");
    else notes.push("The signal is <strong>complex</strong>: conjugate symmetry does not hold, so the coefficients are not paired.");
    if (symErr < 1e-9) notes.push("Conjugate symmetry <strong>holds</strong> ✓");
    else notes.push("Conjugate symmetry is <strong>violated</strong> — that is why x[n] came out complex.");
    verdict.innerHTML = notes.join("<br>");
  }
  draw();
})();
