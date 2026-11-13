/* ============================================================
   EE361 EMF — Chapter 6 visuals
   Uniform plane waves: animation, medium calculator, impedance,
   skin depth.
   ============================================================ */
(function () {
  "use strict";

  const { el, svgEl, clear, fmt, arrow, label, slider, seg, readouts, makeSvg } = window.EMF;

  const C = {
    e: "#2c4b9b", b: "#c2410c", eta: "#0f766e", alt: "#7c3aed",
    ink: "#46536b", dim: "#8794aa", axis: "#c3ccdc", grid: "#e6ebf4",
    good: "#15803d", warn: "#b45309"
  };
  const LIGHT = 3e8; // teaching value used throughout the site

  function sig(x, d) {
    if (!isFinite(x)) return "—";
    if (x === 0) return "0";
    const a = Math.abs(x);
    if (a >= 1e5 || a < 1e-3) return x.toExponential(2);
    return String(Number(x.toPrecision(d || 3)));
  }

  function len(m) {
    if (!isFinite(m)) return "—";
    if (m >= 1) return fmt(m, 2) + " m";
    if (m >= 0.01) return fmt(m * 100, 2) + " cm";
    if (m >= 1e-4) return fmt(m * 1000, 2) + " mm";
    return fmt(m * 1e6, 1) + " µm";
  }

  function freqLabel(f) {
    if (f >= 1e9) return fmt(f / 1e9, 2) + " GHz";
    if (f >= 1e6) return fmt(f / 1e6, 2) + " MHz";
    if (f >= 1e3) return fmt(f / 1e3, 2) + " kHz";
    return fmt(f, 0) + " Hz";
  }

  function actionButton(parent, text, onClick) {
    const b = el("button", {
      type: "button", text: text,
      style: {
        font: "650 .82rem system-ui, sans-serif", padding: "7px 15px",
        borderRadius: "9px", border: "1px solid #c9d7f6",
        background: "#eef3fd", color: "#2c4b9b", cursor: "pointer"
      }
    });
    b.addEventListener("click", onClick);
    parent.appendChild(b);
    return b;
  }

  function legendLine(parent, x, y, color, text, dash) {
    parent.appendChild(svgEl("line", {
      x1: x, y1: y, x2: x + 22, y2: y, stroke: color,
      "stroke-width": 2.6, "stroke-dasharray": dash || null
    }));
    label(parent, x + 28, y + 4, text, { anchor: "start", size: 11, fill: C.ink });
  }

  /* ------------------------------------------------------------
     1 · wave-anim — E vertical, B into the page, both travelling.
     ------------------------------------------------------------ */
  function waveAnim(root) {
    let f = 300, amp = 5, phase = 0, raf = null, last = 0, playing = false;

    const controls = el("div", { class: "controls" });
    root.appendChild(controls);

    const s = makeSvg(root, 760, 330,
      "Animated electric and magnetic fields of a uniform plane wave travelling along z");

    const readoutHost = el("div");
    root.appendChild(readoutHost);
    const out = readouts(readoutHost, [
      { label: "Wavelength", id: "lam" },
      { label: "Period", id: "T" },
      { label: "Speed (m/s)", id: "v" },
      { label: "Frequency", id: "f" }
    ]);

    const x0 = 70, x1 = 718, cy = 172, zMax = 4, span = x1 - x0;
    const xOf = (z) => x0 + (z / zMax) * span;

    // static frame
    const grid = svgEl("g", { opacity: 0.8 });
    for (let z = 0; z <= 4; z++) {
      grid.appendChild(svgEl("line", {
        x1: xOf(z), y1: cy - 4, x2: xOf(z), y2: cy + 4,
        stroke: C.axis, "stroke-width": 1
      }));
      label(s, xOf(z), cy + 44, String(z), { size: 10, fill: C.dim });
    }
    s.appendChild(grid);
    arrow(s, x0 - 6, cy, x1 + 8, cy, { color: C.axis, width: 1.3, head: 7 });
    label(s, x1 + 8, cy + 20, "z (m)", { anchor: "end", size: 11, fill: C.ink });
    arrow(s, x0, cy, x0, cy - 92, { color: C.e, width: 1.4, head: 7 });
    label(s, x0 - 14, cy - 82, "E", { anchor: "end", size: 12, weight: 700, fill: C.e });
    arrow(s, x0, cy, x0 + 82, cy + 52, { color: C.b, width: 1.4, head: 7 });
    label(s, x0 + 92, cy + 60, "B", { anchor: "start", size: 12, weight: 700, fill: C.b });
    label(s, x0 + 92, cy + 74, "(scaled)", { anchor: "start", size: 9, fill: C.dim });
    legendLine(s, 82, 26, C.e, "E (V/m)");
    legendLine(s, 226, 26, C.b, "B (scaled)");

    // stems, curves, dots
    const stemsE = [], stemsB = [], dotsE = [], dotsB = [];
    for (let i = 0; i < 17; i++) {
      const x = xOf((i / 16) * zMax);
      stemsE.push(svgEl("line", {
        x1: x, y1: cy, x2: x, y2: cy, stroke: C.e, "stroke-width": 1, opacity: 0.35
      }));
      stemsB.push(svgEl("line", {
        x1: x, y1: cy, x2: x, y2: cy, stroke: C.b, "stroke-width": 1, opacity: 0.3
      }));
      dotsE.push(svgEl("circle", { cx: x, cy: cy, r: 2.2, fill: C.e }));
      dotsB.push(svgEl("circle", { cx: x, cy: cy, r: 2.2, fill: C.b }));
    }
    stemsE.forEach((n) => s.appendChild(n));
    stemsB.forEach((n) => s.appendChild(n));

    const pathB = svgEl("path", {
      fill: "none", stroke: C.b, "stroke-width": 2.4, "stroke-linejoin": "round", opacity: 0.9
    });
    const pathE = svgEl("path", {
      fill: "none", stroke: C.e, "stroke-width": 2.6, "stroke-linejoin": "round"
    });
    s.appendChild(pathB);
    s.appendChild(pathE);
    dotsE.forEach((n) => s.appendChild(n));
    dotsB.forEach((n) => s.appendChild(n));

    function draw() {
      const lam = LIGHT / (f * 1e6);
      const k = (2 * Math.PI) / lam;
      const A = amp / 10;
      let dE = "", dB = "";
      const N = 190;
      for (let i = 0; i <= N; i++) {
        const z = (i / N) * zMax;
        const x = xOf(z);
        const sn = Math.sin(phase - k * z);
        const ye = cy - sn * A * 58;
        const bx = x + sn * A * 50 * 0.848;
        const by = cy + sn * A * 50 * 0.53;
        dE += (i ? " L " : "M ") + x.toFixed(2) + " " + ye.toFixed(2);
        dB += (i ? " L " : "M ") + bx.toFixed(2) + " " + by.toFixed(2);
      }
      pathE.setAttribute("d", dE);
      pathB.setAttribute("d", dB);

      for (let i = 0; i < 17; i++) {
        const z = (i / 16) * zMax;
        const x = xOf(z);
        const sn = Math.sin(phase - k * z);
        const ye = cy - sn * A * 58;
        const bx = x + sn * A * 50 * 0.848;
        const by = cy + sn * A * 50 * 0.53;
        stemsE[i].setAttribute("y2", ye.toFixed(2));
        stemsE[i].setAttribute("opacity", (0.15 + 0.4 * Math.abs(sn)).toFixed(2));
        stemsB[i].setAttribute("x2", bx.toFixed(2));
        stemsB[i].setAttribute("y2", by.toFixed(2));
        stemsB[i].setAttribute("opacity", (0.12 + 0.35 * Math.abs(sn)).toFixed(2));
        dotsE[i].setAttribute("cy", ye.toFixed(2));
        dotsB[i].setAttribute("cx", bx.toFixed(2));
        dotsB[i].setAttribute("cy", by.toFixed(2));
      }
    }

    function meta() {
      const fHz = f * 1e6;
      out.lam.textContent = len(LIGHT / fHz);
      out.T.textContent = fmt(1e9 / fHz, 2) + " ns";
      out.v.textContent = "3.00 × 10⁸";
      out.f.textContent = f + " MHz";
    }

    const btn = actionButton(controls, "Pause", () => (playing ? pause() : play()));
    btn.setAttribute("aria-pressed", "true");

    const fS = slider(controls, {
      label: "f", min: 100, max: 600, step: 10, value: 300, width: 165,
      format: (v) => v + " MHz",
      onInput: (v) => { f = v; meta(); draw(); }
    });
    fS.input.setAttribute("aria-label", "frequency in megahertz");

    slider(controls, {
      label: "E₀", min: 1, max: 10, step: 0.5, value: 5, width: 130,
      format: (v) => fmt(v, 1) + " V/m",
      onInput: (v) => { amp = v; draw(); }
    });

    function tick(ts) {
      if (!playing) return;
      if (!last) last = ts;
      let dt = (ts - last) / 1000;
      last = ts;
      if (dt > 0.05) dt = 0.05;
      phase = (phase + 2 * Math.PI * f * 0.015 * dt) % (2 * Math.PI * 1000);
      draw();
      raf = requestAnimationFrame(tick);
    }
    function play() {
      if (playing) return;
      playing = true;
      last = 0;
      btn.textContent = "Pause";
      btn.setAttribute("aria-pressed", "true");
      raf = requestAnimationFrame(tick);
    }
    function pause() {
      playing = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      btn.textContent = "Play";
      btn.setAttribute("aria-pressed", "false");
      draw();
    }

    const reduce = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    meta();
    draw();
    if (reduce) pause(); else play();
  }

  /* ------------------------------------------------------------
     2 · wave-params — f, εr, μr → λ, v, η, k.
     ------------------------------------------------------------ */
  function waveParams(root) {
    let f = 300, er = 1, mr = 1;

    const controls = el("div", { class: "controls" });
    root.appendChild(controls);
    const s = makeSvg(root, 740, 240,
      "Two travelling waves compared: one in vacuum and one in a medium with a larger refractive index");
    const readoutHost = el("div");
    root.appendChild(readoutHost);
    const out = readouts(readoutHost, [
      { label: "Wavelength", id: "lam" },
      { label: "Speed (10⁸ m/s)", id: "vp" },
      { label: "Impedance (Ω)", id: "eta" },
      { label: "Phase const. (rad/m)", id: "k" },
      { label: "Index n", id: "n" }
    ]);

    const x0 = 64, x1 = 712, y1 = 88, y2 = 176, amp = 28;

    s.appendChild(svgEl("line", {
      x1: x0, y1: y1, x2: x1, y2: y1, stroke: C.grid, "stroke-width": 1
    }));
    s.appendChild(svgEl("line", {
      x1: x0, y1: y2, x2: x1, y2: y2, stroke: C.grid, "stroke-width": 1
    }));
    arrow(s, x0 - 6, 214, x1 + 6, 214, { color: C.axis, width: 1.3, head: 7 });
    label(s, x0, 230, "0", { anchor: "middle", size: 10, fill: C.dim });
    label(s, x1, 230, "2λ₀", { anchor: "end", size: 10, fill: C.dim });
    label(s, (x0 + x1) / 2, 234, "distance (in vacuum wavelengths)", { size: 10, fill: C.dim });

    const path0 = svgEl("path", {
      fill: "none", stroke: C.e, "stroke-width": 2.4, opacity: 0.55
    });
    const pathM = svgEl("path", {
      fill: "none", stroke: C.eta, "stroke-width": 2.8
    });
    s.appendChild(path0);
    s.appendChild(pathM);
    legendLine(s, 450, 20, C.e, "vacuum, n = 1", "5 4");
    legendLine(s, 570, 20, C.eta, "medium", null);

    function draw(n, lam) {
      let d0 = "", dM = "";
      const N = 420;
      for (let i = 0; i <= N; i++) {
        const z = (i / N) * 2 * (LIGHT / (f * 1e6));
        const x = x0 + (i / N) * (x1 - x0);
        const yA = y1 - amp * Math.cos((2 * Math.PI * z) / (LIGHT / (f * 1e6)));
        const yB = y2 - amp * Math.cos((2 * Math.PI * z) / lam);
        d0 += (i ? " L " : "M ") + x.toFixed(2) + " " + yA.toFixed(2);
        dM += (i ? " L " : "M ") + x.toFixed(2) + " " + yB.toFixed(2);
      }
      path0.setAttribute("d", d0);
      pathM.setAttribute("d", dM);
      s.setAttribute("aria-label",
        "Vacuum wave with two cycles above a medium wave with " + fmt(2 * n, 2) + " cycles");
    }

    function update() {
      const n = Math.sqrt(er * mr);
      const fHz = f * 1e6;
      const lam0 = LIGHT / fHz;
      const lam = lam0 / n;
      out.lam.textContent = len(lam);
      out.vp.textContent = fmt(LIGHT / n / 1e8, 3);
      out.eta.textContent = fmt(377 * Math.sqrt(mr / er), 1);
      out.k.textContent = sig((2 * Math.PI) / lam, 4);
      out.n.textContent = fmt(n, 3);
      draw(n, lam);
    }

    slider(controls, {
      label: "f", min: 10, max: 1000, step: 10, value: 300, width: 145,
      format: (v) => v + " MHz",
      onInput: (v) => { f = v; update(); }
    });
    const erS = slider(controls, {
      label: "εᵣ", min: 1, max: 100, step: 0.5, value: 1, width: 145,
      format: (v) => fmt(v, 2),
      onInput: (v) => { er = v; update(); }
    });
    const mrS = slider(controls, {
      label: "μᵣ", min: 1, max: 5, step: 0.05, value: 1, width: 120,
      format: (v) => fmt(v, 2),
      onInput: (v) => { mr = v; update(); }
    });

    const PRESETS = {
      vacuum: { er: 1, mr: 1 },
      air: { er: 1.0006, mr: 1 },
      glass: { er: 4, mr: 1 },
      water: { er: 81, mr: 1 }
    };
    seg(controls, [
      { value: "vacuum", label: "Vacuum" },
      { value: "air", label: "Air" },
      { value: "glass", label: "Glass" },
      { value: "water", label: "Water" }
    ], "vacuum", (name) => {
      const p = PRESETS[name];
      er = p.er;
      mr = p.mr;
      erS.set(p.er);
      mrS.set(p.mr);
      update();
    });

    update();
  }

  /* ------------------------------------------------------------
     3 · impedance — η vs εr, with η0 and the match condition.
     ------------------------------------------------------------ */
  function impedance(root) {
    let er = 4, mr = 1;
    const ETA0 = 377, YMAX = 800;

    const controls = el("div", { class: "controls" });
    root.appendChild(controls);
    const s = makeSvg(root, 740, 315,
      "Graph of intrinsic impedance versus relative permittivity for three relative permeabilities");
    const readoutHost = el("div");
    root.appendChild(readoutHost);
    const out = readouts(readoutHost, [
      { label: "Impedance", id: "eta" },
      { label: "Normalised impedance", id: "ratio" },
      { label: "Free-space Γ", id: "gamma" }
    ]);
    const status = el("div", { class: "note", style: { marginTop: "12px" } });
    root.appendChild(status);

    const x0 = 74, x1 = 704, yB = 270, yT = 44;
    const xOf = (e) => x0 + (Math.log10(e) / 2) * (x1 - x0);
    const yOf = (v) => yB - (v / YMAX) * (yB - yT);

    // grid + axes
    for (let v = 0; v <= 800; v += 200) {
      s.appendChild(svgEl("line", {
        x1: x0, y1: yOf(v), x2: x1, y2: yOf(v), stroke: C.grid, "stroke-width": 1
      }));
      label(s, x0 - 8, yOf(v) + 4, String(v), { anchor: "end", size: 10, fill: C.dim });
    }
    [1, 2, 4, 10, 20, 40, 100].forEach((e) => {
      s.appendChild(svgEl("line", {
        x1: xOf(e), y1: yB, x2: xOf(e), y2: yB + 5, stroke: C.axis, "stroke-width": 1
      }));
      label(s, xOf(e), yB + 19, String(e), { size: 10, fill: C.dim });
    });
    arrow(s, x0 - 6, yB, x1 + 6, yB, { color: C.axis, width: 1.3, head: 7 });
    label(s, (x0 + x1) / 2, 303, "εᵣ (log scale)", { size: 10.5, fill: C.ink });
    label(s, x0 - 8, 34, "η (Ω)", { anchor: "end", size: 10.5, fill: C.ink, weight: 700 });

    const etaLine = svgEl("line", {
      x1: x0, y1: yOf(ETA0), x2: x1, y2: yOf(ETA0),
      stroke: C.b, "stroke-width": 1.4, "stroke-dasharray": "6 5", opacity: 0.8
    });
    s.appendChild(etaLine);
    label(s, x1 - 4, yOf(ETA0) - 8, "η₀ = 377 Ω", { anchor: "end", size: 11, fill: C.b, weight: 700 });
    label(s, x1 - 4, yOf(ETA0) + 16, "η = η₀ when εᵣ = μᵣ", { anchor: "end", size: 10, fill: C.dim });

    const dyn = svgEl("g");
    s.appendChild(dyn);
    const legend = svgEl("g");
    s.appendChild(legend);
    const mrColors = { 1: C.e, 2: C.eta, 4: C.alt };

    slider(controls, {
      label: "εᵣ", min: 1, max: 100, step: 0.5, value: 4, width: 200,
      format: (v) => fmt(v, 1),
      onInput: (v) => { er = v; update(); }
    });
    seg(controls, [
      { value: "1", label: "μᵣ = 1" },
      { value: "2", label: "μᵣ = 2" },
      { value: "4", label: "μᵣ = 4" }
    ], "1", (v) => { mr = Number(v); update(); });

    function update() {
      clear(dyn);
      clear(legend);

      // curves
      Object.keys(mrColors).forEach((key) => {
        const m = Number(key);
        const selected = m === mr;
        let d = "";
        for (let i = 0; i <= 140; i++) {
          const e = Math.pow(10, (i / 140) * 2);
          const eta = ETA0 * Math.sqrt(m / e);
          const x = xOf(e), y = yOf(eta);
          d += (i ? " L " : "M ") + x.toFixed(2) + " " + y.toFixed(2);
        }
        dyn.appendChild(svgEl("path", {
          d: d, fill: "none", stroke: mrColors[key],
          "stroke-width": selected ? 3 : 1.4,
          opacity: selected ? 1 : 0.38
        }));
        // match marker at εr = μr
        dyn.appendChild(svgEl("circle", {
          cx: xOf(m), cy: yOf(ETA0), r: selected ? 5.5 : 3.5,
          fill: "#fff", stroke: selected ? C.good : C.dim,
          "stroke-width": selected ? 2.4 : 1.4
        }));
      });

      const eta = ETA0 * Math.sqrt(mr / er);
      const gamma = (eta - ETA0) / (eta + ETA0);
      const px = xOf(er), py = yOf(eta);

      dyn.appendChild(svgEl("line", {
        x1: px, y1: py, x2: px, y2: yB,
        stroke: C.dim, "stroke-width": 1, "stroke-dasharray": "4 4"
      }));
      dyn.appendChild(svgEl("line", {
        x1: x0, y1: py, x2: px, y2: py,
        stroke: C.dim, "stroke-width": 1, "stroke-dasharray": "4 4"
      }));
      dyn.appendChild(svgEl("circle", { cx: px, cy: py, r: 6, fill: mrColors[mr], stroke: "#fff", "stroke-width": 2 }));
      label(dyn, px + 10, py - 10, fmt(eta, 1) + " Ω",
        { anchor: "start", size: 11.5, weight: 700, fill: mrColors[mr] });

      Object.keys(mrColors).forEach((key, i) => {
        const y = 24 + i * 0;
        legendLine(legend, 84 + i * 100, y, mrColors[key], "μᵣ = " + key, null);
      });

      out.eta.textContent = fmt(eta, 1) + " Ω";
      out.ratio.textContent = fmt(eta / ETA0, 3);
      out.gamma.textContent = fmt(gamma, 3);

      const matched = Math.abs(gamma) < 0.005;
      status.className = matched ? "tip" : "note";
      status.textContent = matched
        ? "Matched to free space: η = η₀ = 377 Ω, so Γ = 0. This happens exactly when εᵣ = μᵣ."
        : "Mismatch: Γ = " + fmt(gamma, 3) + ". A wave crossing into free space reflects unless η = 377 Ω (εᵣ = μᵣ).";
    }

    update();
  }

  /* ------------------------------------------------------------
     4 · skin-depth — δ, α and the e^{-z/δ} profile.
     ------------------------------------------------------------ */
  function skinDepth(root) {
    const MATS = {
      copper: { sigma: 5.8e7, er: 1, mr: 1 },
      sea: { sigma: 4, er: 80, mr: 1 },
      alu: { sigma: 3.5e7, er: 1, mr: 1 }
    };
    let mat = MATS.copper, logf = 6;

    const controls = el("div", { class: "controls" });
    root.appendChild(controls);
    const s = makeSvg(root, 740, 330,
      "Exponential attenuation of a wave in a conductor with markers at one, three and five skin depths");
    const readoutHost = el("div");
    root.appendChild(readoutHost);
    const out = readouts(readoutHost, [
      { label: "Skin depth", id: "delta" },
      { label: "Attenuation (Np/m)", id: "alpha" },
      { label: "Depth for 1%", id: "depth" },
      { label: "Loss tangent", id: "tand" },
      { label: "Per skin depth", id: "per" }
    ]);
    const status = el("div", { class: "note", style: { marginTop: "12px" } });
    root.appendChild(status);

    const x0 = 72, x1 = 708, yB = 262, yT = 56;
    const xOf = (t) => x0 + (t / 5) * (x1 - x0);
    const yOf = (u) => yB - u * (yB - yT);

    for (let u = 0; u <= 1; u += 0.25) {
      s.appendChild(svgEl("line", {
        x1: x0, y1: yOf(u), x2: x1, y2: yOf(u), stroke: C.grid, "stroke-width": 1
      }));
      label(s, x0 - 8, yOf(u) + 4, u.toFixed(2), { anchor: "end", size: 10, fill: C.dim });
    }
    for (let t = 0; t <= 5; t++) {
      s.appendChild(svgEl("line", {
        x1: xOf(t), y1: yB, x2: xOf(t), y2: yB + 5, stroke: C.axis, "stroke-width": 1
      }));
      label(s, xOf(t), yB + 17, String(t), { size: 10, fill: C.dim });
    }
    arrow(s, x0 - 6, yB, x1 + 6, yB, { color: C.axis, width: 1.3, head: 7 });
    label(s, x0 + 4, yB + 34, "depth z (in skin depths δ)", { anchor: "start", size: 10.5, fill: C.ink });
    label(s, x0 - 8, 44, "|E| / |E₀|", { anchor: "end", size: 10.5, fill: C.ink, weight: 700 });
    label(s, x1, 44, "each δ = 8.686 dB", { anchor: "end", size: 10, fill: C.dim });

    // curve and shaded area (normalised, so it never changes shape)
    let d = "M " + x0 + " " + yB;
    for (let i = 0; i <= 240; i++) {
      const t = (i / 240) * 5;
      d += " L " + xOf(t).toFixed(2) + " " + yOf(Math.exp(-t)).toFixed(2);
    }
    s.appendChild(svgEl("path", {
      d: d + " L " + x1 + " " + yB + " Z", fill: C.b, opacity: 0.08
    }));
    s.appendChild(svgEl("path", {
      d: d, fill: "none", stroke: C.b, "stroke-width": 2.8
    }));

    [[1, "37%"], [3, "5%"], [5, "<1%"]].forEach(([t, txt]) => {
      const x = xOf(t), y = yOf(Math.exp(-t));
      s.appendChild(svgEl("line", {
        x1: x, y1: yB, x2: x, y2: y,
        stroke: C.b, "stroke-width": 1.2, "stroke-dasharray": "4 4", opacity: 0.8
      }));
      s.appendChild(svgEl("circle", { cx: x, cy: y, r: 3.5, fill: C.b }));
      label(s, x, y - 10, txt, { size: 11, weight: 700, fill: C.b });
    });

    const deltaNote = label(s, x1, yB + 34, "", { anchor: "end", size: 10, fill: C.dim });

    const fS = slider(controls, {
      label: "f", min: 0, max: 9, step: 0.01, value: 6, width: 230,
      format: (v) => freqLabel(Math.pow(10, v)),
      onInput: (v) => { logf = v; update(); }
    });
    fS.input.setAttribute("aria-label", "frequency, logarithmic from 1 hertz to 1 gigahertz");

    seg(controls, [
      { value: "copper", label: "Copper" },
      { value: "sea", label: "Sea water" },
      { value: "alu", label: "Aluminum" }
    ], "copper", (name) => { mat = MATS[name]; update(); });

    function update() {
      const f = Math.pow(10, logf);
      const mu = 4e-7 * Math.PI * (mat.mr || 1);
      const delta = 1 / Math.sqrt(Math.PI * f * mu * mat.sigma);
      const alpha = 1 / delta;
      const eps = 8.854e-12 * mat.er;
      const tand = mat.sigma / (2 * Math.PI * f * eps);

      out.delta.textContent = len(delta);
      out.alpha.textContent = sig(alpha, 3);
      out.depth.textContent = len(4.605 * delta);
      out.tand.textContent = sig(tand, 2);
      out.per.textContent = "8.69 dB";
      deltaNote.textContent = "1δ = " + len(delta) + " at " + freqLabel(f);

      if (tand > 100) {
        status.className = "note";
        status.textContent = "Good conductor: σ/(ωε) = " + sig(tand, 3) +
          " ≫ 1. α = β = 1/δ is accurate, and δ does not depend on εᵣ.";
      } else if (tand > 10) {
        status.className = "note";
        status.textContent = "Borderline: σ/(ωε) = " + sig(tand, 2) +
          ". The good-conductor form is approximate; use it for an estimate only.";
      } else {
        status.className = "warn";
        status.textContent = "Not a good conductor here: σ/(ωε) = " + sig(tand, 2) +
          ". The √(πfμσ) formula is indicative; use the exact complex-k expressions.";
      }
    }

    update();
  }

  document.querySelectorAll('[data-viz="wave-anim"]').forEach(waveAnim);
  document.querySelectorAll('[data-viz="wave-params"]').forEach(waveParams);
  document.querySelectorAll('[data-viz="impedance"]').forEach(impedance);
  document.querySelectorAll('[data-viz="skin-depth"]').forEach(skinDepth);
})();
