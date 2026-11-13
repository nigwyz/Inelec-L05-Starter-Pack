/* ============================================================
   EE361 EMF — Chapter 4 visuals: magnetostatics
   Vanilla JS. No dependencies.
   ============================================================ */
(function () {
  "use strict";

  const { el, svgEl, clear, fmt, clamp, deg, rad, arrow, label,
    slider, seg, readouts, makeSvg, project3 } = window.EMF;

  const C = {
    ink: "#24315c",
    blue: "#2c4b9b",
    green: "#1f7a4d",
    red: "#c0392b",
    amber: "#b26a00",
    gray: "#8794aa",
    pale: "#eef3ff",
    line: "#c9d7f6"
  };

  /* ---------- helpers ---------- */
  function line(parent, x1, y1, x2, y2, opts) {
    const o = Object.assign({ stroke: C.line, width: 1.4, dash: null }, opts || {});
    parent.appendChild(svgEl("line", {
      x1, y1, x2, y2, stroke: o.stroke, "stroke-width": o.width,
      "stroke-dasharray": o.dash || null, "stroke-linecap": "round"
    }));
  }

  function circle(parent, cx, cy, r, opts) {
    const o = Object.assign({ stroke: C.green, width: 1.4, fill: "none", dash: null, opacity: 1 }, opts || {});
    parent.appendChild(svgEl("circle", {
      cx, cy, r, fill: o.fill, stroke: o.stroke, "stroke-width": o.width,
      "stroke-dasharray": o.dash || null, opacity: o.opacity
    }));
  }

  function poly(parent, pts, opts) {
    const o = Object.assign({ fill: C.pale, stroke: C.line, width: 1, opacity: 1 }, opts || {});
    parent.appendChild(svgEl("polygon", {
      points: pts.map((p) => p.x + "," + p.y).join(" "),
      fill: o.fill, stroke: o.stroke, "stroke-width": o.width, opacity: o.opacity
    }));
  }

  function polyline(parent, pts, opts) {
    const o = Object.assign({ stroke: C.gray, width: 1.2, fill: "none" }, opts || {});
    parent.appendChild(svgEl("polyline", {
      points: pts.map((p) => p.x + "," + p.y).join(" "),
      fill: o.fill, stroke: o.stroke, "stroke-width": o.width,
      "stroke-linecap": "round"
    }));
  }

  function arrowHeadOnCircle(parent, cx, cy, r, a, ccw, color) {
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    const tx = ccw ? Math.sin(a) : -Math.sin(a);
    const ty = ccw ? -Math.cos(a) : Math.cos(a);
    arrow(parent, x - tx * 6, y - ty * 6, x + tx * 6, y + ty * 6,
      { color: color || C.green, width: 1.3, head: 6 });
  }

  function dot(parent, x, y, r, color) {
    parent.appendChild(svgEl("circle", { cx: x, cy: y, r: r || 4, fill: color || C.blue }));
  }

  function legendText(parent, text) {
    parent.appendChild(el("p", {
      style: { fontSize: ".8rem", color: "#8794aa", margin: "10px 0 0", lineHeight: "1.5" },
      text: text
    }));
  }

  /* ============================================================
     1. Biot–Savart: one current element
     ============================================================ */
  function biotSavart(root) {
    const state = { theta: 60, dist: 5 };
    const controls = el("div", { class: "controls" });
    root.appendChild(controls);
    const svg = makeSvg(root, 560, 320,
      "Current element I dℓ, field point P, separation R and the resulting dB vector");
    const vals = readouts(root, [
      { label: "|dB|", value: "—", id: "db" },
      { label: "sin θ", value: "—", id: "sin" },
      { label: "R", value: "—", id: "dist" },
      { label: "dB direction", value: "—", id: "dir" }
    ]);

    slider(controls, {
      label: "θ (dℓ to R)", min: 0, max: 180, step: 1, value: state.theta,
      format: (v) => v + "°",
      onInput: (v) => { state.theta = v; draw(); }
    });
    slider(controls, {
      label: "R", min: 2, max: 10, step: 0.5, value: state.dist,
      format: (v) => v.toFixed(1) + " cm",
      onInput: (v) => { state.dist = v; draw(); }
    });

    const I = 5;
    const dl = 0.01;

    function draw() {
      clear(svg);
      const Qx = 255;
      const Qy = 160;
      const th = rad(state.theta);
      const R = state.dist / 100;
      /* draw R at a readable screen length; the readout gives the true distance */
      const rPix = 55 + ((state.dist - 2) / 8) * 55;
      const sc = 1000;
      const P = project3((rPix / sc) * Math.sin(th), 0, (rPix / sc) * Math.cos(th),
        { scale: sc, cx: Qx, cy: Qy });
      const planeH = clamp(rPix * 0.45, 35, 50);

      /* plane containing dℓ and R */
      poly(svg, [
        { x: Qx, y: Qy },
        { x: Qx, y: Qy - planeH },
        { x: P.x, y: P.y - planeH },
        { x: P.x, y: P.y }
      ], { opacity: 0.75 });

      /* wire and highlighted element */
      line(svg, Qx, Qy + 82, Qx, Qy - 100, { stroke: "#9aa8c0", width: 5 });
      line(svg, Qx, Qy + 30, Qx, Qy - 30, { stroke: C.amber, width: 9 });
      arrow(svg, Qx - 24, Qy + 70, Qx - 24, Qy - 96,
        { color: C.blue, width: 2.4, head: 9 });
      label(svg, Qx - 34, Qy - 80, "I", { fill: C.blue, anchor: "end", weight: 700 });
      label(svg, Qx + 12, Qy - 40, "I dℓ", { fill: C.amber, anchor: "start", weight: 700 });

      /* R vector */
      arrow(svg, Qx, Qy, P.x, P.y, { color: C.blue, width: 2, dash: "6 5" });
      const mx = (Qx + P.x) / 2;
      const my = (Qy + P.y) / 2;
      label(svg, mx + 14, my - 6, "R", { fill: C.blue, weight: 700 });

      /* dB, normal to the dℓ–R plane: projected +y direction */
      const dB = 1e-7 * I * dl * Math.sin(th) / (R * R);
      const ux = 0.86 / Math.hypot(0.86, 0.42);
      const uy = 0.42 / Math.hypot(0.86, 0.42);
      if (dB > 1e-10) {
        const len = 26 + 92 * Math.sqrt(Math.min(dB / 1.25e-5, 1));
        const ex = Qx + ux * len;
        const ey = Qy + uy * len;
        arrow(svg, Qx, Qy, ex, ey, { color: C.red, width: 3.2, head: 10 });
        label(svg, ex + 8, ey + 13, "dB", { fill: C.red, weight: 800, anchor: "start" });
      } else {
        label(svg, Qx + 42, Qy + 4, "dB = 0", { fill: C.red, weight: 700, anchor: "start" });
      }

      /* points and notes */
      dot(svg, Qx, Qy, 4.5, C.blue);
      dot(svg, P.x, P.y, 5.5, C.red);
      label(svg, P.x + 12, P.y - 8, "P", { fill: C.red, anchor: "start", weight: 800 });

      vals.db.textContent = fmt(dB * 1e6, 2) + " µT";
      vals.sin.textContent = fmt(Math.sin(th), 3);
      vals.dist.textContent = fmt(state.dist, 1) + " cm";
      vals.dir.textContent = Math.sin(th) < 0.02
        ? "zero (dℓ ∥ R)" : "∥ dℓ × R (+ŷ here)";
    }

    legendText(root, "Fixed values: I = 5 A and dℓ = 1 cm (the element is exaggerated). The arrow for R is drawn at a readable length; the readout gives the true distance. dB is normal to the plane of dℓ and R, and vanishes when dℓ points at P.");

    draw();
  }

  /* ============================================================
     2. Field of an infinite straight wire
     ============================================================ */
  function wireField(root) {
    const state = { I: 10, rho: 4, dir: "up" };
    const controls = el("div", { class: "controls" });
    root.appendChild(controls);
    const svg = makeSvg(root, 560, 380,
      "Infinite straight wire and a top view of its concentric magnetic field lines");
    const vals = readouts(root, [
      { label: "B at P", value: "—", id: "B" },
      { label: "H at P", value: "—", id: "H" },
      { label: "Distance ρ", value: "—", id: "rho" },
      { label: "Sense of B", value: "—", id: "sense" }
    ]);

    slider(controls, {
      label: "I", min: 1, max: 20, step: 1, value: state.I,
      format: (v) => v + " A",
      onInput: (v) => { state.I = v; draw(); }
    });
    slider(controls, {
      label: "ρ", min: 1, max: 10, step: 0.5, value: state.rho,
      format: (v) => v.toFixed(1) + " cm",
      onInput: (v) => { state.rho = v; draw(); }
    });
    seg(controls, [
      { value: "up", label: "I ↑" },
      { value: "down", label: "I ↓" }
    ], state.dir, (v) => { state.dir = v; draw(); });

    function draw() {
      clear(svg);
      const out = state.dir === "up";
      const cx = 390;
      const cy = 190;
      const rP = 55 + (state.rho / 10) * 85;

      /* side view of the wire */
      line(svg, 120, 48, 120, 332, { stroke: "#9aa8c0", width: 5 });
      if (out) arrow(svg, 120, 285, 120, 95, { color: C.blue, width: 2.4, head: 9 });
      else arrow(svg, 120, 95, 120, 285, { color: C.blue, width: 2.4, head: 9 });
      label(svg, 120, 32, out ? "I ↑" : "I ↓", { fill: C.blue, weight: 800, size: 14 });
      label(svg, 120, 356, "side view", { fill: C.gray, size: 10 });
      line(svg, 232, 34, 232, 348, { stroke: C.line, width: 1, dash: "3 6" });

      /* concentric field lines, seen from above */
      const radii = [rP * 0.55, rP, Math.min(rP * 1.28, 150)];
      radii.forEach((r) => {
        circle(svg, cx, cy, r, { stroke: C.green, opacity: 0.62 });
        [0, 2 * Math.PI / 3, 4 * Math.PI / 3].forEach((a) => {
          arrowHeadOnCircle(svg, cx, cy, r, a, out, C.green);
        });
      });

      /* the field point P */
      const a = -Math.PI / 6;
      const px = cx + rP * Math.cos(a);
      const py = cy + rP * Math.sin(a);
      line(svg, cx, cy, px, py, { stroke: C.gray, width: 1.3, dash: "5 4" });
      label(svg, (cx + px) / 2 - 4, (cy + py) / 2 - 8, "ρ",
        { fill: C.gray, weight: 700 });
      dot(svg, px, py, 5, C.red);
      label(svg, px + 10, py - 9, "P", { fill: C.red, anchor: "start", weight: 800 });

      /* B is tangent to the circle */
      const tx = out ? Math.sin(a) : -Math.sin(a);
      const ty = out ? -Math.cos(a) : Math.cos(a);
      arrow(svg, px, py, px + tx * 58, py + ty * 58,
        { color: C.green, width: 3.2, head: 10 });
      label(svg, px + tx * 70, py + ty * 70, "B",
        { fill: C.green, weight: 800 });

      /* wire end-on */
      circle(svg, cx, cy, 11, { stroke: C.blue, width: 2, fill: "#fff" });
      if (out) {
        dot(svg, cx, cy, 4, C.blue);
      } else {
        line(svg, cx - 5, cy - 5, cx + 5, cy + 5, { stroke: C.blue, width: 2 });
        line(svg, cx - 5, cy + 5, cx + 5, cy - 5, { stroke: C.blue, width: 2 });
      }
      label(svg, cx, 358, "view from above", { fill: C.gray, size: 10 });

      const B = 2e-7 * state.I / (state.rho / 100);
      const H = state.I / (2 * Math.PI * (state.rho / 100));
      vals.B.textContent = fmt(B * 1e6, 1) + " µT";
      vals.H.textContent = fmt(H, 1) + " A/m";
      vals.rho.textContent = fmt(state.rho, 1) + " cm";
      vals.sense.textContent = out ? "CCW" : "CW";
    }

    legendText(root, "CCW = counter-clockwise seen from above; CW = clockwise. ⊙ = current out of the page, ⊗ = into the page. The side view sets the current; the top view shows B circling the wire.");

    draw();
  }

  /* ============================================================
     3. Ampère's circuital law on a circular loop
     ============================================================ */
  function ampereLoop(root) {
    const state = { I: 10, rho: 3 };
    const controls = el("div", { class: "controls" });
    root.appendChild(controls);
    const svg = makeSvg(root, 520, 410,
      "Circular Amperian loop around a long wire, with H tangent to the loop");
    const vals = readouts(root, [
      { label: "H = I/2πρ", value: "—", id: "H" },
      { label: "B = μ0H", value: "—", id: "B" },
      { label: "∮H·dℓ", value: "—", id: "circ" },
      { label: "I enclosed", value: "—", id: "enc" }
    ]);

    slider(controls, {
      label: "I", min: 2, max: 20, step: 1, value: state.I,
      format: (v) => v + " A",
      onInput: (v) => { state.I = v; draw(); }
    });
    slider(controls, {
      label: "loop radius ρ", min: 1, max: 8, step: 0.5, value: state.rho,
      format: (v) => v.toFixed(1) + " cm",
      onInput: (v) => { state.rho = v; draw(); }
    });

    function draw() {
      clear(svg);
      const cx = 260;
      const cy = 205;
      const rP = 50 + (state.rho / 8) * 115;
      const I = state.I;

      label(svg, cx, 34, "∮ H·dℓ = H(2πρ) = I enclosed",
        { size: 15, weight: 800, fill: C.ink });
      label(svg, cx, 54, "B = μ0H = μ0I/(2πρ)",
        { size: 12, weight: 600, fill: C.gray });

      /* Amperian loop */
      circle(svg, cx, cy, rP, { stroke: C.blue, width: 2.2, dash: "7 4" });
      [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4].forEach((a) => {
        arrowHeadOnCircle(svg, cx, cy, rP, a, true, C.blue);
      });
      label(svg, cx, cy + rP + 16, "Amperian loop C", { fill: C.blue, size: 11, weight: 700 });

      /* radial distance */
      const a = -Math.PI / 4;
      const px = cx + rP * Math.cos(a);
      const py = cy + rP * Math.sin(a);
      line(svg, cx, cy, px, py, { stroke: C.gray, width: 1.2, dash: "5 4" });
      label(svg, (cx + px) / 2, (cy + py) / 2 - 10, "ρ",
        { fill: C.gray, weight: 700 });

      /* H and dℓ at P */
      const tx = Math.sin(a);
      const ty = -Math.cos(a);
      const hx = px + tx * 48;
      const hy = py + ty * 48;
      line(svg, px - tx * 12, py - ty * 12, px + tx * 12, py + ty * 12,
        { stroke: C.amber, width: 7 });
      arrow(svg, px + tx * 15, py + ty * 15, hx, hy, { color: C.green, width: 3.2, head: 10 });
      label(svg, hx + 8, hy + 2, "H", { fill: C.green, weight: 800, anchor: "start" });
      label(svg, px - tx * 28, py - ty * 28 + 4, "dℓ",
        { fill: C.amber, weight: 800, anchor: "end" });
      label(svg, px + 11, py - 10, "P", { fill: C.red, anchor: "start", weight: 800 });
      dot(svg, px, py, 5, C.red);

      /* wire end-on */
      circle(svg, cx, cy, 11, { stroke: C.blue, width: 2, fill: "#fff" });
      dot(svg, cx, cy, 4, C.blue);
      label(svg, cx, cy + 31, "I out of page ⊙", { fill: C.blue, size: 11, weight: 700 });

      const H = I / (2 * Math.PI * (state.rho / 100));
      const B = 4 * Math.PI * 1e-7 * H;
      const circ = H * 2 * Math.PI * (state.rho / 100);
      vals.H.textContent = fmt(H, 1) + " A/m";
      vals.B.textContent = fmt(B * 1e6, 1) + " µT";
      vals.circ.textContent = fmt(circ, 2) + " A";
      vals.enc.textContent = fmt(I, 0) + " A";
    }

    legendText(root, "H is tangent to the dashed circle, so H·dℓ = H dℓ at every point; the integral collapses to H × 2πρ = I.");

    draw();
  }

  /* ============================================================
     4. Magnetic force F = q v × B
     ============================================================ */
  function magneticForce(root) {
    const state = { v: 2, B: 5, delta: 90, sign: 1 };
    const controls = el("div", { class: "controls" });
    root.appendChild(controls);
    const svg = makeSvg(root, 560, 300,
      "Three-dimensional view of velocity v, magnetic field B, and force F on a charge");
    const vals = readouts(root, [
      { label: "|F|", value: "—", id: "F" },
      { label: "F direction", value: "—", id: "dir" },
      { label: "Δ between v and B", value: "—", id: "ang" },
      { label: "q", value: "—", id: "q" }
    ]);

    slider(controls, {
      label: "speed v", min: 0.5, max: 5, step: 0.1, value: state.v,
      format: (v) => v.toFixed(1) + "×10⁶ m/s",
      onInput: (v) => { state.v = v; draw(); }
    });
    slider(controls, {
      label: "|B|", min: 1, max: 10, step: 0.1, value: state.B,
      format: (v) => v.toFixed(1) + " mT",
      onInput: (v) => { state.B = v; draw(); }
    });
    slider(controls, {
      label: "Δ(v,B)", min: 0, max: 180, step: 1, value: state.delta,
      format: (v) => v + "°",
      onInput: (v) => { state.delta = v; draw(); }
    });
    seg(controls, [
      { value: "+", label: "q > 0" },
      { value: "-", label: "q < 0" }
    ], "+", (v) => { state.sign = v === "+" ? 1 : -1; draw(); });

    function draw() {
      clear(svg);
      const O = { x: 280, y: 120 };
      const sc = 92;
      const proj = (x, y, z) => project3(x, y, z, { scale: sc, cx: O.x, cy: O.y });
      const alpha = rad(-25);
      const delta = rad(state.delta);
      const beta = alpha + delta;

      /* isometric plane */
      poly(svg, [
        proj(-1.45, -1.45, 0), proj(1.45, -1.45, 0),
        proj(1.45, 1.45, 0), proj(-1.45, 1.45, 0)
      ], { fill: "#f8faff", stroke: "#dbe3f3" });
      for (let k = -1; k <= 1; k++) {
        const gx = k * 0.72;
        polyline(svg, [proj(gx, -1.4, 0), proj(gx, 1.4, 0)],
          { stroke: "#edf1fa", width: 1 });
        polyline(svg, [proj(-1.4, gx, 0), proj(1.4, gx, 0)],
          { stroke: "#edf1fa", width: 1 });
      }
      label(svg, proj(1.58, 0, 0).x, proj(1.58, 0, 0).y + 4, "x",
        { fill: C.gray, size: 10 });
      label(svg, proj(0, 1.58, 0).x, proj(0, 1.58, 0).y + 4, "y",
        { fill: C.gray, size: 10 });

      /* v and B in the plane */
      const lv = 0.78 + 0.09 * state.v;
      const lb = 0.72 + 0.055 * state.B;
      const V = proj(lv * Math.cos(alpha), lv * Math.sin(alpha), 0);
      const Bp = proj(lb * Math.cos(beta), lb * Math.sin(beta), 0);
      arrow(svg, O.x, O.y, V.x, V.y, { color: C.blue, width: 3, head: 10 });
      label(svg, V.x + 8, V.y + 4, "v", { fill: C.blue, weight: 800, anchor: "start" });
      arrow(svg, O.x, O.y, Bp.x, Bp.y, { color: C.green, width: 3, head: 10 });
      label(svg, Bp.x + 8, Bp.y + 4, "B", { fill: C.green, weight: 800, anchor: "start" });

      /* angle arc */
      const arc = [];
      for (let i = 0; i <= 24; i++) {
        const aa = alpha + (delta * i) / 24;
        arc.push(proj(0.48 * Math.cos(aa), 0.48 * Math.sin(aa), 0));
      }
      polyline(svg, arc, { stroke: C.amber, width: 1.4 });
      const mid = alpha + delta / 2;
      const ml = proj(0.62 * Math.cos(mid), 0.62 * Math.sin(mid), 0);
      label(svg, ml.x, ml.y, "Δ", { fill: C.amber, weight: 800 });

      /* force along ±z */
      const F = 30e-9 * (state.v * 1e6) * (state.B * 1e-3) * Math.sin(delta);
      const sgn = state.sign * Math.sin(delta) >= 0 ? 1 : -1;
      const lenF = 30 + 70 * Math.min(F / 1.5e-3, 1);
      if (F > 1e-9) {
        arrow(svg, O.x, O.y, O.x, O.y - sgn * lenF,
          { color: C.red, width: 3.6, head: 11 });
        label(svg, O.x + 12, O.y - sgn * lenF - 6,
          sgn > 0 ? "F (out of plane)" : "F (into plane)",
          { fill: C.red, weight: 800, anchor: "start" });
      } else {
        label(svg, O.x + 12, O.y - 18, "F = 0", { fill: C.red, weight: 800, anchor: "start" });
      }

      circle(svg, O.x, O.y, 7, { stroke: C.ink, width: 1.5, fill: "#fff" });
      label(svg, O.x - 14, O.y - 12,
        state.sign > 0 ? "q = +30 nC" : "q = −30 nC",
        { fill: C.ink, size: 11, weight: 700, anchor: "end" });

      vals.F.textContent = fmt(F * 1e6, 1) + " µN";
      vals.dir.textContent = F < 1e-9 ? "zero" : (sgn > 0 ? "+ẑ" : "−ẑ");
      vals.ang.textContent = fmt(state.delta, 0) + "°";
      vals.q.textContent = (state.sign > 0 ? "+" : "−") + "30 nC";
    }

    legendText(root, "The plane is xy, so +ẑ points out of the page and −ẑ into it. F is normal to the plane of v and B; the magnitude is maximum at Δ = 90° and zero when v is parallel or anti-parallel to B.");

    draw();
  }

  /* ============================================================
     5. Force between two parallel wires
     ============================================================ */
  function parallelWires(root) {
    const state = { I: 10, d: 4, mode: "same" };
    const controls = el("div", { class: "controls" });
    root.appendChild(controls);
    const svg = makeSvg(root, 560, 380,
      "Two parallel wires with current direction and force arrows");
    const vals = readouts(root, [
      { label: "F/L", value: "—", id: "f" },
      { label: "B1 at wire 2", value: "—", id: "B" },
      { label: "Verdict", value: "—", id: "verdict" },
      { label: "Separation", value: "—", id: "d" }
    ]);

    slider(controls, {
      label: "I in each wire", min: 2, max: 20, step: 1, value: state.I,
      format: (v) => v + " A",
      onInput: (v) => { state.I = v; draw(); }
    });
    slider(controls, {
      label: "separation d", min: 1, max: 10, step: 0.5, value: state.d,
      format: (v) => v.toFixed(1) + " cm",
      onInput: (v) => { state.d = v; draw(); }
    });
    seg(controls, [
      { value: "same", label: "same ↑↑" },
      { value: "opp", label: "opposite ↑↓" }
    ], state.mode, (v) => { state.mode = v; draw(); });

    function draw() {
      clear(svg);
      const I = state.I;
      const half = 55 + (state.d / 10) * 105;
      const x1 = 280 - half;
      const x2 = 280 + half;
      const same = state.mode === "same";

      label(svg, 280, 28, "F/L = μ0 I1 I2 / (2πd)",
        { size: 14, weight: 800, fill: C.ink });

      /* wires */
      line(svg, x1, 58, x1, 315, { stroke: "#9aa8c0", width: 5 });
      line(svg, x2, 58, x2, 315, { stroke: "#9aa8c0", width: 5 });
      arrow(svg, x1, 282, x1, 88, { color: C.blue, width: 2.4, head: 9 });
      if (same) arrow(svg, x2, 282, x2, 88, { color: C.blue, width: 2.4, head: 9 });
      else arrow(svg, x2, 88, x2, 282, { color: C.blue, width: 2.4, head: 9 });
      label(svg, x1 - 12, 78, "I₁", { fill: C.blue, anchor: "end", weight: 800 });
      label(svg, x2 + 12, 78, "I₂", { fill: C.blue, anchor: "start", weight: 800 });

      /* force per unit length */
      const B = 2e-7 * I / (state.d / 100);
      const f = B * I;
      const lenF = Math.min(30 + 70 * Math.min(f / 1e-3, 1), half * 0.82);
      if (same) {
        arrow(svg, x1 + 7, 185, x1 + 7 + lenF, 185, { color: C.red, width: 3, head: 10 });
        arrow(svg, x2 - 7, 185, x2 - 7 - lenF, 185, { color: C.red, width: 3, head: 10 });
      } else {
        arrow(svg, x1 - 7, 185, x1 - 7 - lenF, 185, { color: C.red, width: 3, head: 10 });
        arrow(svg, x2 + 7, 185, x2 + 7 + lenF, 185, { color: C.red, width: 3, head: 10 });
      }
      const f1 = same ? x1 + 7 + lenF / 2 : x1 - 7 - lenF / 2;
      const f2 = same ? x2 - 7 - lenF / 2 : x2 + 7 + lenF / 2;
      label(svg, f1, 175, "F", { fill: C.red, weight: 800 });
      label(svg, f2, 175, "F", { fill: C.red, weight: 800 });

      label(svg, 280, 232, same ? "same direction → attract" : "opposite direction → repel",
        { fill: same ? C.green : C.red, size: 13, weight: 800 });

      /* separation dimension */
      line(svg, x1, 338, x2, 338, { stroke: C.gray, width: 1.2 });
      line(svg, x1, 331, x1, 345, { stroke: C.gray, width: 1.2 });
      line(svg, x2, 331, x2, 345, { stroke: C.gray, width: 1.2 });
      label(svg, 280, 357, "d = " + fmt(state.d, 1) + " cm",
        { fill: C.gray, size: 11, weight: 700 });

      vals.f.textContent = fmt(f * 1e6, 0) + " µN/m";
      vals.B.textContent = fmt(B * 1e6, 1) + " µT";
      vals.verdict.textContent = same ? "attract" : "repel";
      vals.d.textContent = fmt(state.d, 1) + " cm";
    }

    legendText(root, "Same-direction currents attract; opposite-direction currents repel. Because f ∝ 1/d, doubling the separation halves the force per metre.");

    draw();
  }

  document.querySelectorAll('[data-viz="biot-savart"]').forEach(biotSavart);
  document.querySelectorAll('[data-viz="wire-field"]').forEach(wireField);
  document.querySelectorAll('[data-viz="ampere-loop"]').forEach(ampereLoop);
  document.querySelectorAll('[data-viz="magnetic-force"]').forEach(magneticForce);
  document.querySelectorAll('[data-viz="parallel-wires"]').forEach(parallelWires);
})();
