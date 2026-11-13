/* ============================================================
   EE361 EMF — Chapter 3 visuals
   Coulomb · field · ring · Gauss · potential · densities
   Vanilla JS, no dependencies.
   ============================================================ */
(function () {
  "use strict";

  const { el, svgEl, clear, fmt, arrow, label, slider, seg, readouts, makeSvg, dot } = window.EMF;
  const K = 9e9;
  const TAU = Math.PI * 2;

  function line(parent, x1, y1, x2, y2, color, width, dash) {
    parent.appendChild(svgEl("line", {
      x1, y1, x2, y2, stroke: color || "#c3ccdc",
      "stroke-width": width === undefined ? 1.2 : width,
      "stroke-dasharray": dash || null
    }));
  }

  function path(parent, d, color, width, fill) {
    parent.appendChild(svgEl("path", {
      d, fill: fill || "none", stroke: color || "#2c4b9b",
      "stroke-width": width === undefined ? 2 : width,
      "stroke-linejoin": "round", "stroke-linecap": "round"
    }));
  }

  function circle(parent, cx, cy, r, fill, stroke, dash, sw) {
    parent.appendChild(svgEl("circle", {
      cx, cy, r, fill: fill || "none", stroke: stroke || "#2c4b9b",
      "stroke-width": sw === undefined ? 1.2 : sw,
      "stroke-dasharray": dash || null
    }));
  }

  const sgn = (v) => (v > 0 ? "+" : "") + v;

  /* ------------------------------------------------------------
     1. Coulomb — two charges with force arrows
     ------------------------------------------------------------ */
  function coulomb(root) {
    const row = el("div", { class: "controls" });
    root.appendChild(row);
    const svg = makeSvg(root, 640, 300, "Two point charges on a line with force arrows");
    const out = readouts(root, [
      { label: "Force |F|", value: "—", id: "f" },
      { label: "Interaction", value: "—", id: "kind" },
      { label: "Charge product", value: "—", id: "prod" }
    ]);
    let q1 = 5, q2 = -5, d = 2;
    slider(row, {
      label: "q₁", min: -10, max: 10, step: 1, value: q1, width: 120,
      format: (v) => sgn(v) + " nC", onInput: (v) => { q1 = v; draw(); }
    });
    slider(row, {
      label: "q₂", min: -10, max: 10, step: 1, value: q2, width: 120,
      format: (v) => sgn(v) + " nC", onInput: (v) => { q2 = v; draw(); }
    });
    slider(row, {
      label: "d", min: 0.5, max: 4, step: 0.1, value: d, width: 120,
      format: (v) => fmt(v, 1) + " m", onInput: (v) => { d = v; draw(); }
    });
    function draw() {
      clear(svg);
      const cx = 320, cy = 150;
      const half = Math.min(248, d * 62);
      const x1 = cx - half, x2 = cx + half;
      label(svg, 320, 28, "F = (1/4πε₀)|q₁q₂|/d²", { size: 12, fill: "#6b7a99" });
      line(svg, 30, cy, 610, cy, "#e1e7f2", 2);
      // distance bracket
      line(svg, x1, cy + 62, x2, cy + 62, "#c3ccdc", 1, "4 4");
      line(svg, x1, cy + 56, x1, cy + 68, "#c3ccdc", 1);
      line(svg, x2, cy + 56, x2, cy + 68, "#c3ccdc", 1);
      label(svg, cx, cy + 82, "d = " + fmt(d, 1) + " m", { size: 12 });
      // charges
      const p1 = q1 >= 0, p2 = q2 >= 0;
      circle(svg, x1, cy, 16, p1 ? "#fdeceb" : "#e8eefb", p1 ? "#c0392b" : "#2c4b9b", null, 2);
      label(svg, x1, cy + 5, p1 ? "+" : "−", { size: 18, fill: p1 ? "#c0392b" : "#2c4b9b", weight: 800 });
      label(svg, x1, cy - 30, "q₁ = " + sgn(q1) + " nC", { size: 12 });
      circle(svg, x2, cy, 16, p2 ? "#fdeceb" : "#e8eefb", p2 ? "#c0392b" : "#2c4b9b", null, 2);
      label(svg, x2, cy + 5, p2 ? "+" : "−", { size: 18, fill: p2 ? "#c0392b" : "#2c4b9b", weight: 800 });
      label(svg, x2, cy - 30, "q₂ = " + sgn(q2) + " nC", { size: 12 });
      // force
      const prod = q1 * q2;
      const F = K * Math.abs(prod) * 1e-18 / (d * d);
      const attract = prod < 0;
      const room = attract ? half - 40 : Math.min(x1 - 30, 610 - x2);
      const len = F === 0 || room < 8 ? 0
        : Math.min(130, room, 20 + 100 * Math.pow(F / 3.6e-6, 0.28));
      if (len > 0) {
        if (attract) {
          arrow(svg, x1 + 20, cy, x1 + 20 + len, cy, { color: "#c0392b", width: 3, head: 9 });
          arrow(svg, x2 - 20, cy, x2 - 20 - len, cy, { color: "#c0392b", width: 3, head: 9 });
        } else {
          arrow(svg, x1 - 20, cy, x1 - 20 - len, cy, { color: "#2c4b9b", width: 3, head: 9 });
          arrow(svg, x2 + 20, cy, x2 + 20 + len, cy, { color: "#2c4b9b", width: 3, head: 9 });
        }
      }
      out.f.textContent = F === 0 ? "0" : F < 1e-6
        ? fmt(F * 1e9, 1) + " nN" : fmt(F * 1e6, 2) + " µN";
      out.kind.textContent = F === 0 ? "no force" : attract ? "attractive" : "repulsive";
      out.prod.textContent = sgn(prod) + " nC²";
    }
    draw();
  }

  /* ------------------------------------------------------------
     2. Field of three charges + movable probe + field lines
     ------------------------------------------------------------ */
  function efield(root) {
    const row = el("div", { class: "controls" });
    root.appendChild(row);
    const svg = makeSvg(root, 640, 380, "Field of three charges with a movable probe point");
    const out = readouts(root, [
      { label: "E along x", value: "—", id: "ex" },
      { label: "E along y", value: "—", id: "ey" },
      { label: "|E|", value: "—", id: "em" },
      { label: "Direction", value: "—", id: "ang" }
    ]);
    const CH = [
      { q: 10e-9, x: -1, y: 0 },
      { q: 10e-9, x: 1, y: 0 },
      { q: -10e-9, x: 0, y: 1 }
    ];
    let px = 0.3, py = 0.2;
    slider(row, { label: "x", min: -2, max: 2, step: 0.1, value: px, width: 110, onInput: (v) => { px = v; draw(); } });
    slider(row, { label: "y", min: -1.6, max: 1.6, step: 0.1, value: py, width: 110, onInput: (v) => { py = v; draw(); } });
    const S = 100, CX = 320, CY = 205;
    const X = (x) => CX + S * x;
    const Y = (y) => CY - S * y;
    function fieldAt(x, y) {
      let ex = 0, ey = 0;
      for (const c of CH) {
        const dx = x - c.x, dy = y - c.y;
        const r2 = dx * dx + dy * dy;
        if (r2 < 4e-4) continue;
        const k = K * c.q / (r2 * Math.sqrt(r2));
        ex += k * dx; ey += k * dy;
      }
      return { x: ex, y: ey };
    }
    function trace(x, y) {
      const pts = [[x, y]];
      const h = 0.04;
      for (let i = 0; i < 420; i++) {
        const e1 = fieldAt(x, y);
        const m1 = Math.hypot(e1.x, e1.y);
        if (m1 < 1e-6) break;
        const mx = x + h * e1.x / m1, my = y + h * e1.y / m1;
        const e2 = fieldAt(mx, my);
        const m2 = Math.hypot(e2.x, e2.y) || 1;
        x += h * (e1.x / m1 + e2.x / m2) / 2;
        y += h * (e1.y / m1 + e2.y / m2) / 2;
        pts.push([x, y]);
        if (x < -2.8 || x > 2.8 || y < -1.8 || y > 1.8) break;
        if (CH.some((c) => c.q < 0 && Math.hypot(x - c.x, y - c.y) < 0.08)) break;
      }
      return pts;
    }
    function draw() {
      clear(svg);
      for (let gx = -3; gx <= 3; gx++) line(svg, X(gx), 10, X(gx), 370, "#eef2f8", 1);
      for (let gy = -1; gy <= 2; gy++) line(svg, 0, Y(gy), 640, Y(gy), "#eef2f8", 1);
      line(svg, X(0), 10, X(0), 370, "#dbe2ef", 1.2);
      line(svg, 0, Y(0), 640, Y(0), "#dbe2ef", 1.2);
      label(svg, 12, 22, "orange: E along x, teal: E along y", { size: 10, anchor: "start", fill: "#6b7a99" });
      label(svg, 620, Y(0) + 16, "x", { size: 12, anchor: "end" });
      label(svg, X(0) + 8, 22, "y", { size: 12, anchor: "start" });
      // field lines from the two positive charges
      CH.forEach((c, ci) => {
        if (c.q <= 0) return;
        for (let k = 0; k < 12; k++) {
          const a = (k / 12) * TAU + ci * 0.13;
          const pts = trace(c.x + 0.13 * Math.cos(a), c.y + 0.13 * Math.sin(a));
          if (pts.length < 3) continue;
          let d = "M " + X(pts[0][0]).toFixed(1) + " " + Y(pts[0][1]).toFixed(1);
          for (let i = 1; i < pts.length; i++) d += " L " + X(pts[i][0]).toFixed(1) + " " + Y(pts[i][1]).toFixed(1);
          path(svg, d, "#a9bbd8", 1.1);
          const m = Math.floor(pts.length * 0.35);
          if (m > 2 && m < pts.length - 2) {
            const p0 = pts[m], p1 = pts[m + 2];
            arrow(svg, X(p0[0]), Y(p0[1]), X(p1[0]), Y(p1[1]), { color: "#a9bbd8", width: 1.2, head: 5 });
          }
        }
      });
      // charges
      CH.forEach((c) => {
        const pos = c.q > 0;
        circle(svg, X(c.x), Y(c.y), 12, pos ? "#fdeceb" : "#e8eefb", pos ? "#c0392b" : "#2c4b9b", null, 2);
        label(svg, X(c.x), Y(c.y) + 4, pos ? "+" : "−", { size: 15, fill: pos ? "#c0392b" : "#2c4b9b", weight: 800 });
        label(svg, X(c.x), Y(c.y) - 20, (pos ? "+10" : "−10") + " nC", { size: 10.5 });
      });
      // probe and its vector sum
      const e = fieldAt(px, py);
      const mag = Math.hypot(e.x, e.y);
      const sc = mag < 1e-9 ? 0 : 60 * Math.tanh(mag / 130) / mag;
      const ex = e.x * sc, ey = e.y * sc;
      if (mag > 0) {
        arrow(svg, X(px), Y(py), X(px) + ex, Y(py), { color: "#d97706", width: 1.6, head: 6, dash: "4 3" });
        arrow(svg, X(px), Y(py), X(px), Y(py) - ey, { color: "#0f766e", width: 1.6, head: 6, dash: "4 3" });
        line(svg, X(px) + ex, Y(py), X(px) + ex, Y(py) - ey, "#d97706", 1, "3 3");
        line(svg, X(px), Y(py) - ey, X(px) + ex, Y(py) - ey, "#0f766e", 1, "3 3");
        arrow(svg, X(px), Y(py), X(px) + ex, Y(py) - ey, { color: "#1d2b4f", width: 2.6, head: 9 });
      }
      circle(svg, X(px), Y(py), 5, "#fff", "#1d2b4f", null, 2);
      label(svg, X(px), Y(py) + 22, "P", { size: 11, weight: 700 });
      out.ex.textContent = fmt(e.x, 1) + " V/m";
      out.ey.textContent = fmt(e.y, 1) + " V/m";
      out.em.textContent = fmt(mag, 1) + " V/m";
      out.ang.textContent = mag < 1e-9 ? "—" : fmt((Math.atan2(e.y, e.x) * 180) / Math.PI, 0) + "°";
    }
    draw();
  }

  /* ------------------------------------------------------------
     3. Ring on its axis — E(z) graph and marker
     ------------------------------------------------------------ */
  function ringField(root) {
    const row = el("div", { class: "controls" });
    root.appendChild(row);
    const svg = makeSvg(root, 640, 340, "Axial electric field of a charged ring versus z");
    const out = readouts(root, [
      { label: "E along z", value: "—", id: "e" },
      { label: "V at marker", value: "—", id: "v" },
      { label: "Extremum", value: "—", id: "p" }
    ]);
    let a = 0.5, Q = 10, z = 1.2;
    slider(row, { label: "a", min: 0.2, max: 1.5, step: 0.05, value: a, width: 110, format: (v) => fmt(v, 2) + " m", onInput: (v) => { a = v; draw(); } });
    slider(row, { label: "Q", min: -20, max: 20, step: 1, value: Q, width: 110, format: (v) => sgn(v) + " nC", onInput: (v) => { Q = v; draw(); } });
    slider(row, { label: "z", min: -3, max: 3, step: 0.05, value: z, width: 110, format: (v) => fmt(v, 2) + " m", onInput: (v) => { z = v; draw(); } });
    const X = (v) => 70 + ((v + 3) / 6) * 540;
    const Y = (e, ymax) => 190 - (e / ymax) * 110;
    const Ez = (v) => (K * Q * 1e-9 * v) / Math.pow(a * a + v * v, 1.5);
    const V = (v) => (K * Q * 1e-9) / Math.sqrt(a * a + v * v);
    function draw() {
      clear(svg);
      let emax = 0;
      for (let i = 0; i <= 120; i++) emax = Math.max(emax, Math.abs(Ez(-3 + (6 * i) / 120)));
      const ymax = Math.max(5, emax * 1.15);
      for (let k = -2; k <= 2; k++) line(svg, 70, 190 - k * 55, 610, 190 - k * 55, "#eef2f8", 1);
      line(svg, 70, 190, 610, 190, "#c3ccdc", 1.4);
      line(svg, 70, 55, 70, 300, "#c3ccdc", 1.2);
      label(svg, 44, 52, "E along z (V/m)", { size: 11, anchor: "start" });
      label(svg, 610, 232, "z (m)", { size: 11, anchor: "end" });
      for (let zz = -3; zz <= 3; zz++) {
        line(svg, X(zz), 186, X(zz), 194, "#c3ccdc", 1);
        if (zz !== 0) label(svg, X(zz), 210, String(zz), { size: 10 });
      }
      label(svg, X(0) + 6, 210, "0", { size: 10, anchor: "start" });
      label(svg, 80, 182, "+", { size: 11, anchor: "end" });
      let d = "";
      for (let i = 0; i <= 240; i++) {
        const zz = -3 + (6 * i) / 240;
        d += (i ? " L " : "M ") + X(zz).toFixed(1) + " " + Y(Ez(zz), ymax).toFixed(1);
      }
      path(svg, d, "#2c4b9b", 2.2);
      const ev = Ez(z), vv = V(z);
      line(svg, X(z), Y(ev, ymax), X(z), 190, "#d97706", 1, "4 4");
      circle(svg, X(z), Y(ev, ymax), 5, "#d97706", "#fff", null, 1.5);
      label(svg, X(z), Y(ev, ymax) - 12, "z = " + fmt(z, 1), { size: 10, fill: "#b45309" });
      const zp = a / Math.SQRT2;
      if (Q !== 0) {
        circle(svg, X(zp), Y(Ez(zp), ymax), 3.5, "none", "#0f766e", null, 1.6);
        label(svg, X(zp), Y(Ez(zp), ymax) + 17, "extremum a/√2", { size: 9.5, fill: "#0f766e" });
      }
      label(svg, X(0) + 30, 252, "E = 0 at the centre", { size: 10, anchor: "start", fill: "#6b7a99" });
      out.e.textContent = fmt(ev, 1) + " V/m";
      out.v.textContent = fmt(vv, 1) + " V";
      out.p.textContent = "z = " + fmt(zp, 2) + " m";
    }
    draw();
  }

  /* ------------------------------------------------------------
     4. Gauss — sphere / cylinder / pillbox, inside or outside
     ------------------------------------------------------------ */
  function gauss(root) {
    const row = el("div", { class: "controls" });
    root.appendChild(row);
    const svg = makeSvg(root, 640, 360, "Flux through a chosen closed surface");
    const out = readouts(root, [
      { label: "Q enclosed", value: "—", id: "q" },
      { label: "Net flux ψ", value: "—", id: "psi" },
      { label: "D normal at surface", value: "—", id: "d" }
    ]);
    const cap = el("p", { class: "small muted", style: { margin: "10px 0 0" } });
    root.appendChild(cap);
    let surface = "sphere", place = "inside", q0 = 10;
    seg(row, ["sphere", "cylinder", "pillbox"], surface, (v) => { surface = v; draw(); });
    seg(row, [
      { value: "inside", label: "charge inside" },
      { value: "outside", label: "charge outside" }
    ], place, (v) => { place = v; draw(); });
    slider(row, { label: "strength", min: 2, max: 10, step: 1, value: q0, width: 100, format: (v) => String(v), onInput: (v) => { q0 = v; draw(); } });
    function draw() {
      clear(svg);
      const inside = place === "inside";
      let qenc, dn;
      if (surface === "sphere") {
        qenc = inside ? q0 : 0;
        dn = inside ? q0 / (4 * Math.PI) : null;
      } else if (surface === "cylinder") {
        qenc = inside ? 2 * q0 : 0;
        dn = inside ? q0 / (2 * Math.PI * 0.6) : null;
      } else {
        qenc = inside ? q0 : 0;
        dn = inside ? q0 / 2 : null;
      }
      if (surface === "sphere") {
        circle(svg, 300, 180, 100, "rgba(44,75,155,.05)", "#2c4b9b", "6 5", 1.8);
        label(svg, 300, 66, "closed surface S — sphere, R = 1 m", { size: 11 });
        if (inside) {
          for (let k = 0; k < 10; k++) {
            const ang = (k / 10) * TAU;
            arrow(svg, 300 + 20 * Math.cos(ang), 180 + 20 * Math.sin(ang),
              300 + 100 * Math.cos(ang), 180 + 100 * Math.sin(ang),
              { color: "#c0392b", width: 1.6, head: 6 });
          }
          dot(svg, 300, 180, 9, "#c0392b");
          label(svg, 300, 184, "+", { size: 14, fill: "#fff", weight: 800 });
          label(svg, 300, 306, "Q = " + q0 + " nC enclosed", { size: 10.5 });
        } else {
          dot(svg, 552, 180, 9, "#c0392b");
          label(svg, 552, 184, "+", { size: 14, fill: "#fff", weight: 800 });
          label(svg, 552, 208, "Q outside", { size: 10.5 });
          for (let k = 0; k < 3; k++) {
            const yy = 140 + 40 * k;
            arrow(svg, 540, yy, 430, yy, { color: "#c0392b", width: 1.4, head: 6 });
            line(svg, 430, yy, 200, yy, "#c0392b", 1.4);
            arrow(svg, 280, yy, 180, yy, { color: "#c0392b", width: 1.4, head: 6 });
          }
          label(svg, 300, 318, "in = out: net flux zero", { size: 11, fill: "#c0392b" });
        }
      } else if (surface === "cylinder") {
        line(svg, 230, 80, 230, 280, "#2c4b9b", 1.6, "6 5");
        line(svg, 390, 80, 390, 280, "#2c4b9b", 1.6, "6 5");
        svg.appendChild(svgEl("ellipse", { cx: 310, cy: 80, rx: 80, ry: 14, fill: "none", stroke: "#2c4b9b", "stroke-width": 1.4, "stroke-dasharray": "6 5" }));
        svg.appendChild(svgEl("ellipse", { cx: 310, cy: 280, rx: 80, ry: 14, fill: "none", stroke: "#2c4b9b", "stroke-width": 1.4, "stroke-dasharray": "6 5" }));
        label(svg, 310, 52, "closed surface S — coaxial cylinder", { size: 11 });
        if (inside) {
          line(svg, 310, 100, 310, 260, "#c0392b", 4);
          label(svg, 310, 322, "line charge λ = " + q0 + " nC/m, L = 2 m", { size: 10.5 });
          for (let k = 0; k < 5; k++) {
            const yy = 112 + 34 * k;
            arrow(svg, 310, yy, 230, yy, { color: "#c0392b", width: 1.5, head: 6 });
            arrow(svg, 310, yy, 390, yy, { color: "#c0392b", width: 1.5, head: 6 });
          }
        } else {
          line(svg, 530, 100, 530, 260, "#c0392b", 4);
          label(svg, 530, 298, "λ outside", { size: 10.5 });
          for (let k = 0; k < 4; k++) {
            const yy = 120 + 40 * k;
            arrow(svg, 515, yy, 410, yy, { color: "#c0392b", width: 1.4, head: 6 });
            line(svg, 410, yy, 210, yy, "#c0392b", 1.4);
            arrow(svg, 270, yy, 150, yy, { color: "#c0392b", width: 1.4, head: 6 });
          }
          label(svg, 310, 330, "in = out: net flux zero", { size: 11, fill: "#c0392b" });
        }
      } else {
        line(svg, 200, 120, 420, 120, "#2c4b9b", 1.6, "6 5");
        line(svg, 200, 240, 420, 240, "#2c4b9b", 1.6, "6 5");
        line(svg, 200, 120, 200, 240, "#2c4b9b", 1.6, "6 5");
        line(svg, 420, 120, 420, 240, "#2c4b9b", 1.6, "6 5");
        label(svg, 200, 44, "S: pillbox, face area A = 1 m²", { size: 11, anchor: "start" });
        const sx = inside ? 310 : 530;
        line(svg, sx, 60, sx, 300, "#c0392b", 4);
        for (let yy = 80; yy <= 280; yy += 40) label(svg, sx + 11, yy + 4, "+", { size: 12, fill: "#c0392b" });
        label(svg, sx, 322, "sheet ρₛ = " + q0 + " nC/m²", { size: 10.5 });
        if (inside) {
          for (let k = 0; k < 4; k++) {
            const yy = 138 + 28 * k;
            arrow(svg, sx, yy, 200, yy, { color: "#c0392b", width: 1.5, head: 6 });
            arrow(svg, sx, yy, 420, yy, { color: "#c0392b", width: 1.5, head: 6 });
          }
        } else {
          for (let k = 0; k < 3; k++) {
            const yy = 150 + 30 * k;
            arrow(svg, 515, yy, 430, yy, { color: "#c0392b", width: 1.4, head: 6 });
            line(svg, 430, yy, 210, yy, "#c0392b", 1.4);
            arrow(svg, 280, yy, 190, yy, { color: "#c0392b", width: 1.4, head: 6 });
          }
          label(svg, 310, 330, "in = out: net flux zero", { size: 11, fill: "#c0392b" });
        }
      }
      out.q.textContent = fmt(qenc, 1) + " nC";
      out.psi.textContent = fmt(qenc, 1) + " nC";
      out.d.textContent = dn === null ? "in = out" : fmt(dn, 2) + " nC/m²";
      cap.textContent = "ψ = ∮D·dS = Q enclosed. Only charge inside the surface counts; D normal is evaluated on the surface when the source is enclosed.";
    }
    draw();
  }

  /* ------------------------------------------------------------
     5. Potential — equipotentials, E arrows, downhill probe
     ------------------------------------------------------------ */
  function potential(root) {
    const row = el("div", { class: "controls" });
    root.appendChild(row);
    const svg = makeSvg(root, 640, 380, "Equipotential contours and electric field of a point charge");
    const out = readouts(root, [
      { label: "V at probe", value: "—", id: "v" },
      { label: "|E| at probe", value: "—", id: "e" },
      { label: "r", value: "—", id: "r" },
      { label: "V 0.25 m downhill", value: "—", id: "d" }
    ]);
    let sign = 1, Q = 5, px = 1.2, py = 0.8;
    const S = 92, CX = 320, CY = 195;
    const X = (x) => CX + S * x;
    const Y = (y) => CY - S * y;
    const q = () => sign * Q * 1e-9;
    const V = (x, y) => (K * q()) / Math.max(0.05, Math.hypot(x, y));
    const E = (x, y) => {
      const r = Math.max(0.05, Math.hypot(x, y));
      return { m: (K * Q * 1e-9) / (r * r), ux: (sign * x) / r, uy: (sign * y) / r };
    };
    const qs = slider(row, {
      label: "Q", min: 1, max: 10, step: 1, value: Q, width: 100,
      format: (v) => sgn(sign * v) + " nC", onInput: (v) => { Q = v; draw(); }
    });
    seg(row, [{ value: "+", label: "+ charge" }, { value: "−", label: "− charge" }], "+", (v) => {
      sign = v === "+" ? 1 : -1; qs.set(Q); draw();
    });
    slider(row, { label: "x", min: -2.6, max: 2.6, step: 0.1, value: px, width: 100, onInput: (v) => { px = v; draw(); } });
    slider(row, { label: "y", min: -1.8, max: 1.8, step: 0.1, value: py, width: 100, onInput: (v) => { py = v; draw(); } });
    function draw() {
      clear(svg);
      for (let gx = -3; gx <= 3; gx++) line(svg, X(gx), 10, X(gx), 370, "#eef2f8", 1);
      for (let gy = -2; gy <= 2; gy++) line(svg, 0, Y(gy), 640, Y(gy), "#eef2f8", 1);
      line(svg, X(0), 10, X(0), 370, "#dbe2ef", 1.2);
      line(svg, 0, Y(0), 640, Y(0), "#dbe2ef", 1.2);
      // equipotential contours
      [0.5, 1, 1.5, 2].forEach((r, i) => {
        circle(svg, X(0), Y(0), r * S, "none", "#b9c8e6", "5 5", 1.2);
        if (i % 2 === 0 && r <= 2.5) label(svg, X(0), Y(r) - 4, fmt(K * q() / r, 1) + " V", { size: 9.5, fill: "#6b7a99" });
      });
      // E arrows
      [0.7, 1.4, 2.0].forEach((r) => {
        for (let k = 0; k < 8; k++) {
          const ang = (k * Math.PI) / 4 + Math.PI / 8;
          const x = r * Math.cos(ang), y = r * Math.sin(ang);
          const e = E(x, y);
          const L = Math.min(34, (2 + 16 / (r * r)) * (Q / 5));
          arrow(svg, X(x), Y(y), X(x) + L * e.ux, Y(y) - L * e.uy,
            { color: "#8fa2c7", width: 1.3, head: 6 });
        }
      });
      dot(svg, X(0), Y(0), 7, sign > 0 ? "#c0392b" : "#2c4b9b");
      label(svg, X(0), Y(0) + 4, sign > 0 ? "+" : "−", { size: 13, fill: "#fff", weight: 800 });
      label(svg, X(0) + 10, Y(0) + 18, "Q = " + sgn(sign * Q) + " nC", { size: 10.5, anchor: "start" });
      // probe
      const rp = Math.hypot(px, py);
      const ok = rp > 0.12;
      const vp = ok ? V(px, py) : 0;
      const ep = ok ? E(px, py) : { m: 0, ux: 0, uy: 0 };
      if (ok) {
        const sc = 55 * Math.tanh(ep.m / 25) / ep.m;
        arrow(svg, X(px), Y(py), X(px) + ep.ux * ep.m * sc, Y(py) - ep.uy * ep.m * sc,
          { color: "#1d2b4f", width: 2.6, head: 9 });
        const x2 = px + 0.25 * ep.ux, y2 = py + 0.25 * ep.uy;
        line(svg, X(px), Y(py), X(x2), Y(y2), "#0f766e", 1.5, "4 3");
        circle(svg, X(x2), Y(y2), 3, "#0f766e");
        out.d.textContent = fmt(V(x2, y2), 2) + " V";
      } else {
        out.d.textContent = "—";
      }
      circle(svg, X(px), Y(py), 5, "#fff", "#1d2b4f", null, 2);
      label(svg, X(px), Y(py) + 22, "P", { size: 11, weight: 700 });
      out.v.textContent = ok ? fmt(vp, 2) + " V" : "—";
      out.e.textContent = ok ? fmt(ep.m, 2) + " V/m" : "—";
      out.r.textContent = fmt(rp, 2) + " m";
    }
    draw();
  }

  /* ------------------------------------------------------------
     6. Densities — line, surface, volume with elements
     ------------------------------------------------------------ */
  function density(root) {
    const row = el("div", { class: "controls" });
    root.appendChild(row);
    const svg = makeSvg(root, 640, 300, "Line, surface and volume charge elements");
    const out = readouts(root, [
      { label: "Density", value: "—", id: "rho" },
      { label: "Element", value: "—", id: "el" },
      { label: "Charge in element", value: "—", id: "dq" }
    ]);
    const cap = el("p", { class: "small muted", style: { margin: "10px 0 0" } });
    root.appendChild(cap);
    let mode = "line", rho = 5;
    seg(row, ["line", "surface", "volume"], mode, (v) => { mode = v; draw(); });
    slider(row, { label: "density", min: 1, max: 10, step: 1, value: rho, width: 120, format: (v) => v, onInput: (v) => { rho = v; draw(); } });
    function draw() {
      clear(svg);
      if (mode === "line") {
        line(svg, 80, 160, 560, 160, "#2c4b9b", 5);
        for (let x = 100; x < 560; x += 40) line(svg, x, 152, x, 168, "#8fa2c7", 1);
        line(svg, 300, 160, 380, 160, "#f0b429", 13);
        label(svg, 320, 84, "line charge", { size: 13, weight: 700 });
        label(svg, 320, 106, "ρₗ = " + rho + " nC/m", { size: 12 });
        line(svg, 300, 184, 300, 176, "#b45309", 1);
        line(svg, 380, 184, 380, 176, "#b45309", 1);
        line(svg, 300, 180, 380, 180, "#b45309", 1);
        label(svg, 340, 202, "dl′ = 0.1 m", { size: 11 });
        out.rho.textContent = "ρₗ = " + rho + " nC/m";
        out.el.textContent = "dl′ = 0.1 m";
        out.dq.textContent = fmt(rho * 0.1, 3) + " nC";
        cap.textContent = "E = (1/4πε₀) ∫ ρₗ dl′ (r − r′)/|r − r′|³,  V = (1/4πε₀) ∫ ρₗ dl′/|r − r′|";
      } else if (mode === "surface") {
        path(svg, "M 180 110 L 420 110 L 480 230 L 240 230 Z", "#8fa2c7", 1.6, "rgba(94,139,255,.10)");
        path(svg, "M 300 158 L 380 158 L 403 198 L 323 198 Z", "#f0b429", 1.5, "rgba(240,180,41,.35)");
        arrow(svg, 352, 178, 352, 98, { color: "#0f766e", width: 2, head: 7, dash: "5 4" });
        label(svg, 362, 106, "n", { size: 11, fill: "#0f766e", anchor: "start" });
        label(svg, 160, 76, "surface charge", { size: 13, weight: 700, anchor: "start" });
        label(svg, 160, 98, "ρₛ = " + rho + " nC/m²", { size: 12, anchor: "start" });
        label(svg, 430, 252, "dS′ = 0.01 m²", { size: 11 });
        out.rho.textContent = "ρₛ = " + rho + " nC/m²";
        out.el.textContent = "dS′ = 0.01 m²";
        out.dq.textContent = fmt(rho * 0.01, 3) + " nC";
        cap.textContent = "E = (1/4πε₀) ∫ ρₛ dS′ (r − r′)/|r − r′|³,  V = (1/4πε₀) ∫ ρₛ dS′/|r − r′|";
      } else {
        path(svg, "M 270 80 L 450 80 L 450 220 L 270 220 Z", "#8fa2c7", 1.4, "none");
        path(svg, "M 220 120 L 400 120 L 400 260 L 220 260 Z", "#2c4b9b", 1.6, "rgba(94,139,255,.06)");
        line(svg, 220, 120, 270, 80, "#8fa2c7", 1.2);
        line(svg, 400, 120, 450, 80, "#8fa2c7", 1.2);
        line(svg, 400, 260, 450, 220, "#8fa2c7", 1.2);
        line(svg, 220, 260, 270, 220, "#8fa2c7", 1.2);
        path(svg, "M 300 180 L 350 180 L 350 220 L 300 220 Z", "#f0b429", 1.4, "rgba(240,180,41,.35)");
        path(svg, "M 320 165 L 370 165 L 370 205 L 320 205 Z", "#f0b429", 1.2, "none");
        line(svg, 300, 180, 320, 165, "#f0b429", 1.2);
        line(svg, 350, 180, 370, 165, "#f0b429", 1.2);
        line(svg, 350, 220, 370, 205, "#f0b429", 1.2);
        line(svg, 300, 220, 320, 205, "#f0b429", 1.2);
        label(svg, 150, 84, "volume charge", { size: 13, weight: 700, anchor: "start" });
        label(svg, 150, 106, "ρᵥ = " + rho + " nC/m³", { size: 12, anchor: "start" });
        label(svg, 455, 270, "dv′ = 0.001 m³", { size: 11 });
        out.rho.textContent = "ρᵥ = " + rho + " nC/m³";
        out.el.textContent = "dv′ = 0.001 m³";
        out.dq.textContent = fmt(rho * 0.001, 3) + " nC";
        cap.textContent = "E = (1/4πε₀) ∫ ρᵥ dv′ (r − r′)/|r − r′|³,  V = (1/4πε₀) ∫ ρᵥ dv′/|r − r′|";
      }
    }
    draw();
  }

  document.querySelectorAll('[data-viz="coulomb"]').forEach(coulomb);
  document.querySelectorAll('[data-viz="efield"]').forEach(efield);
  document.querySelectorAll('[data-viz="ring-field"]').forEach(ringField);
  document.querySelectorAll('[data-viz="gauss"]').forEach(gauss);
  document.querySelectorAll('[data-viz="potential"]').forEach(potential);
  document.querySelectorAll('[data-viz="density"]').forEach(density);
})();
