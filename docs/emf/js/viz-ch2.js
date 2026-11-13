/* ============================================================
   EE361 EMF — Chapter 2 visuals
   Line integral · gradient · divergence · curl · divergence theorem · Stokes
   Vanilla JS, no dependencies. All controls use window.EMF.
   ============================================================ */
(function () {
  "use strict";

  const {
    el, svgEl, clear, fmt, clamp, arrow, label, slider, seg, readouts,
    makeSvg, project3
  } = window.EMF;

  const COL = {
    blue: "#2c4b9b",
    red: "#c0392b",
    green: "#1e8e5a",
    orange: "#b26a00",
    gray: "#8a97ad",
    ink: "#24315c",
    line: "#d8dfec",
    soft: "#eef3fc"
  };

  /* ---------- shared helpers ---------- */

  function controlRow(root) {
    const row = el("div", { class: "controls" });
    root.appendChild(row);
    return row;
  }

  function tip(root, text) {
    const p = el("p", { class: "small muted", style: { margin: "10px 0 0" } });
    p.textContent = text;
    root.appendChild(p);
    return p;
  }

  function mapping(w, h, pad, xmin, xmax, ymin, ymax) {
    const X = (x) => pad + ((x - xmin) / (xmax - xmin)) * (w - 2 * pad);
    const Y = (y) => h - pad - ((y - ymin) / (ymax - ymin)) * (h - 2 * pad);
    const invX = (sx) => xmin + ((sx - pad) / (w - 2 * pad)) * (xmax - xmin);
    const invY = (sy) => ymin + ((h - pad - sy) / (h - 2 * pad)) * (ymax - ymin);
    return { X, Y, invX, invY };
  }

  function axes(g, M, xmin, xmax, ymin, ymax) {
    if (ymin < 0 && ymax > 0) {
      g.appendChild(svgEl("line", {
        x1: M.X(xmin), y1: M.Y(0), x2: M.X(xmax), y2: M.Y(0),
        stroke: "#b9c4d6", "stroke-width": 1.2
      }));
    }
    if (xmin < 0 && xmax > 0) {
      g.appendChild(svgEl("line", {
        x1: M.X(0), y1: M.Y(ymin), x2: M.X(0), y2: M.Y(ymax),
        stroke: "#b9c4d6", "stroke-width": 1.2
      }));
    }
  }

  function fieldArrows(g, o) {
    for (let x = o.xmin; x <= o.xmax + 1e-9; x += o.step) {
      for (let y = o.ymin; y <= o.ymax + 1e-9; y += o.step) {
        const vx = o.fx(x, y);
        const vy = o.fy(x, y);
        const m = Math.hypot(vx, vy);
        if (!isFinite(m) || m < 1e-9) continue;
        const len = Math.min(o.maxLen || 18, m * (o.scale || 12));
        const sx = o.X(x);
        const sy = o.Y(y);
        const color = typeof o.color === "function" ? o.color(x, y) : o.color;
        arrow(g, sx, sy, sx + (vx / m) * len, sy - (vy / m) * len, {
          color: color, width: 1.1, head: 4.5,
          opacity: o.opacity === undefined ? 0.6 : o.opacity
        });
      }
    }
  }

  function bindDrag(s, w, h, cb) {
    let active = false;
    const point = (ev) => {
      const r = s.getBoundingClientRect();
      return {
        x: ((ev.clientX - r.left) / r.width) * w,
        y: ((ev.clientY - r.top) / r.height) * h
      };
    };
    s.style.touchAction = "none";
    s.style.cursor = "crosshair";
    s.addEventListener("pointerdown", (ev) => {
      active = true;
      if (s.setPointerCapture) s.setPointerCapture(ev.pointerId);
      const p = point(ev);
      cb(p.x, p.y);
    });
    s.addEventListener("pointermove", (ev) => {
      if (!active) return;
      const p = point(ev);
      cb(p.x, p.y);
    });
    const stop = () => { active = false; };
    s.addEventListener("pointerup", stop);
    s.addEventListener("pointercancel", stop);
  }

  /* ---------- 1. line integral ---------- */

  function lineIntegral(root) {
    const ctl = controlRow(root);
    const w = 560, h = 340, pad = 46;
    const s = makeSvg(root, w, h, "Vector field F = y x-hat + x y-hat with an L-shaped route and a straight route");
    const out = readouts(root, [
      { label: "Path progress", value: "0.65", id: "t" },
      { label: "∫ F·dl so far", value: "0.00", id: "acc" },
      { label: "Full path", value: "1.000", id: "full" },
      { label: "Verdict", value: "conservative", id: "verdict" }
    ]);

    const xmin = -0.18, xmax = 1.3, ymin = -0.18, ymax = 1.3;
    const M = mapping(w, h, pad, xmin, xmax, ymin, ymax);
    let mode = "L";
    let t = 0.65;

    const fx = (x, y) => y;
    const fy = (x, y) => x;

    function sample(v) {
      if (mode === "L") {
        if (v <= 0.5) {
          const u = v / 0.5;
          return { x: u, y: 0, acc: 0, tx: 1, ty: 0 };
        }
        const u = (v - 0.5) / 0.5;
        return { x: 1, y: u, acc: u, tx: 0, ty: 1 };
      }
      return { x: v, y: v, acc: v * v, tx: 1 / Math.SQRT2, ty: 1 / Math.SQRT2 };
    }

    function render() {
      clear(s);
      const g = svgEl("g");
      s.appendChild(g);

      for (let v = 0; v <= 1.0001; v += 0.25) {
        g.appendChild(svgEl("line", {
          x1: M.X(v), y1: M.Y(0), x2: M.X(v), y2: M.Y(1.25),
          stroke: "#eef2f8", "stroke-width": 1
        }));
        g.appendChild(svgEl("line", {
          x1: M.X(-0.1), y1: M.Y(v), x2: M.X(1.25), y2: M.Y(v),
          stroke: "#eef2f8", "stroke-width": 1
        }));
      }
      axes(g, M, xmin, xmax, ymin, ymax);
      label(g, M.X(1.24), M.Y(0) + 15, "x", { anchor: "end", size: 11, fill: COL.gray });
      label(g, M.X(0) - 13, M.Y(1.22), "y", { size: 11, fill: COL.gray });

      fieldArrows(g, {
        X: M.X, Y: M.Y, xmin: 0, xmax: 1.2, ymin: 0, ymax: 1.2, step: 0.15,
        fx: fx, fy: fy, color: "#8fa6d6", maxLen: 16, scale: 11, opacity: 0.55
      });

      const lPath = `M${M.X(0)} ${M.Y(0)}L${M.X(1)} ${M.Y(0)}L${M.X(1)} ${M.Y(1)}`;
      g.appendChild(svgEl("path", {
        d: lPath, fill: "none",
        stroke: mode === "L" ? COL.orange : "#c7d2e4",
        "stroke-width": mode === "L" ? 3.2 : 1.6,
        "stroke-dasharray": mode === "L" ? null : "5 5",
        "stroke-linecap": "round"
      }));
      const sPath = `M${M.X(0)} ${M.Y(0)}L${M.X(1)} ${M.Y(1)}`;
      g.appendChild(svgEl("path", {
        d: sPath, fill: "none",
        stroke: mode === "straight" ? COL.green : "#c7d2e4",
        "stroke-width": mode === "straight" ? 3.2 : 1.6,
        "stroke-dasharray": mode === "straight" ? null : "5 5",
        "stroke-linecap": "round"
      }));

      label(g, M.X(0.5), M.Y(-0.07), "L path", {
        size: 10, fill: mode === "L" ? COL.orange : "#9aa6ba"
      });
      label(g, M.X(0.63), M.Y(0.5), "straight", {
        size: 10, fill: mode === "straight" ? COL.green : "#9aa6ba", anchor: "start"
      });

      g.appendChild(svgEl("circle", { cx: M.X(0), cy: M.Y(0), r: 4, fill: COL.ink }));
      g.appendChild(svgEl("circle", { cx: M.X(1), cy: M.Y(1), r: 4, fill: COL.ink }));
      label(g, M.X(0) - 8, M.Y(0) + 17, "(0,0)", { anchor: "end", size: 10 });
      label(g, M.X(1) + 9, M.Y(1) - 8, "(1,1)", { anchor: "start", size: 10 });

      const p = sample(t);
      const sx = M.X(p.x), sy = M.Y(p.y);
      arrow(g, sx - p.tx * 20, sy + p.ty * 20, sx + p.tx * 26, sy - p.ty * 26, {
        color: COL.gray, width: 1.6, head: 7, dash: "4 3"
      });

      const vx = fx(p.x, p.y), vy = fy(p.x, p.y);
      const vm = Math.hypot(vx, vy);
      if (vm > 1e-9) {
        const len = Math.min(70, 30 * vm);
        arrow(g, sx, sy, sx + (vx / vm) * len, sy - (vy / vm) * len, {
          color: COL.blue, width: 2.4, head: 8
        });
        label(g, sx + 10, sy - 10, "F", { anchor: "start", size: 11, fill: COL.blue, weight: 700 });
      }
      g.appendChild(svgEl("circle", {
        cx: sx, cy: sy, r: 6, fill: "#fff", stroke: COL.orange, "stroke-width": 3
      }));

      out.t.textContent = fmt(t, 2);
      out.acc.textContent = fmt(p.acc, 3);
      out.full.textContent = "1.000";
      out.verdict.textContent = "conservative";
    }

    slider(ctl, {
      label: "path t", min: 0, max: 1, step: 0.01, value: t, width: 170,
      format: (v) => fmt(v, 2),
      onInput: (v) => { t = v; render(); }
    });
    seg(ctl, [
      { value: "L", label: "L-shaped" },
      { value: "straight", label: "straight" }
    ], "L", (v) => { mode = v; render(); });

    render();
    tip(root, "Both routes finish at 1.000. The moving ring is the sample point; the blue arrow is F there, the dashed grey arrow is the path tangent. On the first leg F is perpendicular to the path, so that leg adds nothing.");
  }

  /* ---------- 2. gradient ---------- */

  function contourD(f, level, xmin, xmax, ymin, ymax, n, M) {
    const dx = (xmax - xmin) / n;
    const dy = (ymax - ymin) / n;
    const at = (i, j) => f(xmin + i * dx, ymin + j * dy);
    let d = "";
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const x0 = xmin + i * dx;
        const y0 = ymin + j * dy;
        const v00 = at(i, j), v10 = at(i + 1, j);
        const v11 = at(i + 1, j + 1), v01 = at(i, j + 1);
        const pts = [];
        const edge = (va, vb, xa, ya, xb, yb) => {
          if ((va - level) * (vb - level) < 0) {
            const q = (level - va) / (vb - va);
            pts.push([M.X(xa + q * (xb - xa)), M.Y(ya + q * (yb - ya))]);
          }
        };
        edge(v00, v10, x0, y0, x0 + dx, y0);
        edge(v10, v11, x0 + dx, y0, x0 + dx, y0 + dy);
        edge(v11, v01, x0 + dx, y0 + dy, x0, y0 + dy);
        edge(v01, v00, x0, y0 + dy, x0, y0);
        if (pts.length >= 2) {
          d += `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
          d += `L${pts[1][0].toFixed(1)} ${pts[1][1].toFixed(1)}`;
        }
        if (pts.length === 4) {
          d += `M${pts[2][0].toFixed(1)} ${pts[2][1].toFixed(1)}`;
          d += `L${pts[3][0].toFixed(1)} ${pts[3][1].toFixed(1)}`;
        }
      }
    }
    return d;
  }

  function gradientViz(root) {
    const ctl = controlRow(root);
    const w = 560, h = 380, pad = 40;
    const s = makeSvg(root, w, h, "Contour map of a scalar function with a draggable probe and its gradient arrow");
    const out = readouts(root, [
      { label: "probe (x, y)", value: "—", id: "xy" },
      { label: "f at probe", value: "—", id: "f" },
      { label: "∇f", value: "—", id: "grad" },
      { label: "|∇f|", value: "—", id: "mag" },
      { label: "direction", value: "—", id: "dir" }
    ]);

    const xmin = -2.1, xmax = 2.1, ymin = -2.1, ymax = 2.1;
    const M = mapping(w, h, pad, xmin, xmax, ymin, ymax);
    const probe = { x: 0.9, y: 1.1 };
    let mode = "hill";

    const modes = {
      hill: {
        formula: "hill:  f = 4 − ½(x² + 2y²)",
        f: (x, y) => 4 - 0.5 * x * x - y * y,
        gx: (x, y) => -x,
        gy: (x, y) => -2 * y,
        levels: [0.4, 1, 1.8, 2.6, 3.2, 3.6, 3.85]
      },
      saddle: {
        formula: "saddle:  f = x²y − y³",
        f: (x, y) => x * x * y - y * y * y,
        gx: (x, y) => 2 * x * y,
        gy: (x, y) => x * x - 3 * y * y,
        levels: [-6, -4, -2, -1, 0.0001, 1, 2, 4, 6]
      }
    };

    function render() {
      clear(s);
      const g = svgEl("g");
      s.appendChild(g);
      const md = modes[mode];

      md.levels.forEach((lev) => {
        const zero = Math.abs(lev) < 1e-3;
        g.appendChild(svgEl("path", {
          d: contourD(md.f, lev, xmin, xmax, ymin, ymax, 46, M),
          fill: "none",
          stroke: zero ? "#5d6b82" : lev < 0 ? "#9fb4e2" : "#e0b49d",
          "stroke-width": zero ? 1.7 : 1,
          "stroke-dasharray": zero ? "5 4" : null,
          opacity: zero ? 0.9 : 0.75
        }));
      });

      axes(g, M, xmin, xmax, ymin, ymax);
      label(g, 16, 22, md.formula, { anchor: "start", size: 13, weight: 700, fill: COL.ink });
      label(g, 16, 39, "drag the probe; the arrow is ∇f", { anchor: "start", size: 10, fill: COL.gray });

      const px = probe.x, py = probe.y;
      const gx = md.gx(px, py), gy = md.gy(px, py);
      const gm = Math.hypot(gx, gy);
      const sx = M.X(px), sy = M.Y(py);

      if (gm > 1e-4) {
        const len = Math.min(105, gm * 28);
        arrow(g, sx, sy, sx + (gx / gm) * len, sy - (gy / gm) * len, {
          color: COL.orange, width: 3, head: 9
        });
        const tx = -gy / gm, ty = gx / gm, tl = 32;
        g.appendChild(svgEl("line", {
          x1: sx - tx * tl, y1: sy + ty * tl, x2: sx + tx * tl, y2: sy - ty * tl,
          stroke: "#5f6f88", "stroke-width": 1.4, "stroke-dasharray": "5 4"
        }));
      }
      g.appendChild(svgEl("circle", { cx: sx, cy: sy, r: 7, fill: "#fff", stroke: COL.orange, "stroke-width": 3 }));
      g.appendChild(svgEl("circle", { cx: sx, cy: sy, r: 2.5, fill: COL.orange }));

      out.xy.textContent = `(${fmt(px, 2)}, ${fmt(py, 2)})`;
      out.f.textContent = fmt(md.f(px, py), 2);
      out.grad.textContent = `(${fmt(gx, 2)}, ${fmt(gy, 2)})`;
      out.mag.textContent = fmt(gm, 2);
      out.dir.textContent = gm > 1e-4
        ? `${fmt(((Math.atan2(gy, gx) * 180 / Math.PI) + 360) % 360, 0)}°`
        : "—";
    }

    bindDrag(s, w, h, (sx, sy) => {
      probe.x = clamp(M.invX(sx), xmin + 0.08, xmax - 0.08);
      probe.y = clamp(M.invY(sy), ymin + 0.08, ymax - 0.08);
      render();
    });

    seg(ctl, [
      { value: "hill", label: "hill" },
      { value: "saddle", label: "saddle" }
    ], "hill", (v) => { mode = v; render(); });

    render();
    tip(root, "The orange arrow is ∇f, with components (∂f/∂x, ∂f/∂y). The dashed line is the tangent to the level curve; the two are perpendicular. On the hill the arrow shrinks toward the summit; on the saddle it vanishes at the crossing.");
  }

  /* ---------- 3. divergence ---------- */

  function divergenceViz(root) {
    const ctl = controlRow(root);
    const w = 560, h = 380, pad = 42;
    const s = makeSvg(root, w, h, "Vector field with a movable probe showing positive, negative and zero divergence");
    const out = readouts(root, [
      { label: "∇·F", value: "—", id: "div" },
      { label: "verdict", value: "—", id: "verdict" },
      { label: "flux out of Δv", value: "—", id: "flux" },
      { label: "F at probe", value: "—", id: "field" }
    ]);

    const xmin = -1.7, xmax = 1.7, ymin = -1.7, ymax = 1.7;
    const M = mapping(w, h, pad, xmin, xmax, ymin, ymax);
    const px = { x: 0.9, y: 0.9 };
    const side = 0.24;

    const fx = (x) => x * x;
    const fy = (x, y) => y * y;
    const div = (x, y) => 2 * x + 2 * y;

    function render() {
      clear(s);
      const g = svgEl("g");
      s.appendChild(g);

      const poly = (pts, fill) => g.appendChild(svgEl("polygon", {
        points: pts.map((p) => `${M.X(p[0])},${M.Y(p[1])}`).join(" "),
        fill: fill, opacity: 0.055
      }));
      poly([[-1.7, 1.7], [1.7, 1.7], [1.7, -1.7]], COL.blue);
      poly([[-1.7, 1.7], [-1.7, -1.7], [1.7, -1.7]], COL.red);

      g.appendChild(svgEl("line", {
        x1: M.X(-1.7), y1: M.Y(1.7), x2: M.X(1.7), y2: M.Y(-1.7),
        stroke: "#9aa6ba", "stroke-width": 1.4, "stroke-dasharray": "6 5"
      }));
      label(g, M.X(1.1), M.Y(-1.1) - 8, "∇·F = 0", { anchor: "start", size: 10, fill: COL.gray });

      axes(g, M, xmin, xmax, ymin, ymax);
      label(g, M.X(1.64), M.Y(0) + 15, "x", { anchor: "end", size: 11, fill: COL.gray });
      label(g, M.X(0) - 13, M.Y(1.6), "y", { size: 11, fill: COL.gray });

      fieldArrows(g, {
        X: M.X, Y: M.Y, xmin: -1.55, xmax: 1.55, ymin: -1.55, ymax: 1.55, step: 0.31,
        fx: fx, fy: fy, maxLen: 19, scale: 14,
        color: (x, y) => div(x, y) > 0.08 ? COL.blue : div(x, y) < -0.08 ? COL.red : COL.gray,
        opacity: 0.65
      });

      const bx = M.X(px.x - side / 2), by = M.Y(px.y + side / 2);
      const bw = M.X(px.x + side / 2) - bx, bh = M.Y(px.y - side / 2) - by;
      g.appendChild(svgEl("rect", {
        x: bx, y: by, width: bw, height: bh,
        fill: "rgba(178,106,0,.08)", stroke: COL.orange, "stroke-width": 2
      }));
      g.appendChild(svgEl("circle", { cx: M.X(px.x), cy: M.Y(px.y), r: 5, fill: COL.orange }));

      const d = div(px.x, px.y);
      out.div.textContent = fmt(d, 2);
      out.verdict.textContent = d > 0.06 ? "source" : d < -0.06 ? "sink" : "zero";
      out.flux.textContent = fmt(d * side * side, 3);
      out.field.textContent = `(${fmt(fx(px.x), 2)}, ${fmt(fy(px.x, px.y), 2)})`;
    }

    slider(ctl, {
      label: "x", min: -1.5, max: 1.5, step: 0.05, value: px.x, width: 140,
      format: (v) => fmt(v, 2),
      onInput: (v) => { px.x = v; render(); }
    });
    slider(ctl, {
      label: "y", min: -1.5, max: 1.5, step: 0.05, value: px.y, width: 140,
      format: (v) => fmt(v, 2),
      onInput: (v) => { px.y = v; render(); }
    });

    render();
    tip(root, "Blue side: ∇·F > 0, net outflow (source). Red side: ∇·F < 0, net inflow (sink). On the dashed line y = −x the two partial derivatives cancel and the divergence is zero.");
  }

  /* ---------- 4. curl ---------- */

  function curlViz(root) {
    const ctl = controlRow(root);
    const w = 560, h = 380, pad = 44;
    const s = makeSvg(root, w, h, "Vector field with a paddle wheel at a draggable probe showing the local curl");
    const out = readouts(root, [
      { label: "∇×A · ẑ", value: "—", id: "curl" },
      { label: "rotation", value: "—", id: "dir" },
      { label: "∂A_y/∂x", value: "—", id: "day" },
      { label: "∂A_x/∂y", value: "—", id: "dax" }
    ]);

    const xmin = -2.1, xmax = 2.1, ymin = -2.1, ymax = 2.1;
    const M = mapping(w, h, pad, xmin, xmax, ymin, ymax);
    const probe = { x: 1.1, y: 1.0 };
    let mode = "vortex";

    const modes = {
      vortex: {
        label: "vortex:  A = (−y x̂ + x ŷ)/(1 + 0.2r²)",
        fx: (x, y) => -y / (1 + 0.2 * (x * x + y * y)),
        fy: (x, y) => x / (1 + 0.2 * (x * x + y * y)),
        dAy: (x, y) => {
          const d = 1 + 0.2 * (x * x + y * y);
          return (d - 0.4 * x * x) / (d * d);
        },
        dAx: (x, y) => {
          const d = 1 + 0.2 * (x * x + y * y);
          return (-d + 0.4 * y * y) / (d * d);
        },
        scale: 17
      },
      shear: {
        label: "shear:  A = y x̂",
        fx: (x, y) => y,
        fy: () => 0,
        dAy: () => 0,
        dAx: () => 1,
        scale: 11
      },
      radial: {
        label: "radial:  A = x x̂ + y ŷ",
        fx: (x, y) => x,
        fy: (x, y) => y,
        dAy: () => 0,
        dAx: () => 0,
        scale: 9
      }
    };

    function arcArrow(g, cx, cy, r, ccw, color) {
      const a0 = ccw ? -0.15 * Math.PI : 0.15 * Math.PI;
      const a1 = ccw ? -1.45 * Math.PI : 1.45 * Math.PI;
      const pts = [];
      for (let i = 0; i <= 28; i++) {
        const a = a0 + (a1 - a0) * i / 28;
        pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
      }
      g.appendChild(svgEl("polyline", {
        points: pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" "),
        fill: "none", stroke: color, "stroke-width": 2, "stroke-linecap": "round"
      }));
      const last = pts[pts.length - 1], prev = pts[pts.length - 2];
      arrow(g, prev[0], prev[1], last[0], last[1], { color: color, width: 1.5, head: 8 });
    }

    function render() {
      clear(s);
      const g = svgEl("g");
      s.appendChild(g);
      const md = modes[mode];

      axes(g, M, xmin, xmax, ymin, ymax);
      fieldArrows(g, {
        X: M.X, Y: M.Y, xmin: -1.9, xmax: 1.9, ymin: -1.9, ymax: 1.9, step: 0.36,
        fx: md.fx, fy: md.fy, color: "#8fa6d6", maxLen: 19,
        scale: md.scale, opacity: 0.62
      });
      label(g, 16, 22, md.label, { anchor: "start", size: 12, weight: 700, fill: COL.ink });
      label(g, 16, 39, "drag the paddle wheel", { anchor: "start", size: 10, fill: COL.gray });

      const px = probe.x, py = probe.y;
      const dAy = md.dAy(px, py);
      const dAx = md.dAx(px, py);
      const cz = dAy - dAx;
      const cx = M.X(px), cy = M.Y(py), R = 16;

      g.appendChild(svgEl("circle", {
        cx: cx, cy: cy, r: R, fill: "#fff", stroke: COL.ink, "stroke-width": 2, opacity: 0.96
      }));
      for (let k = 0; k < 4; k++) {
        const a = Math.PI / 4 + k * Math.PI / 2;
        g.appendChild(svgEl("line", {
          x1: cx, y1: cy, x2: cx + R * Math.cos(a), y2: cy + R * Math.sin(a),
          stroke: COL.ink, "stroke-width": 2.4
        }));
      }
      g.appendChild(svgEl("circle", { cx: cx, cy: cy, r: 3, fill: COL.ink }));

      if (Math.abs(cz) > 0.05) {
        arcArrow(g, cx, cy, R + 11, cz > 0, cz > 0 ? COL.green : COL.red);
      }
      label(g, cx, cy + R + 30, Math.abs(cz) > 0.05 ? (cz > 0 ? "CCW" : "CW") : "no rotation", {
        size: 12, weight: 700, fill: Math.abs(cz) > 0.05 ? (cz > 0 ? COL.green : COL.red) : COL.gray
      });

      out.curl.textContent = fmt(cz, 2);
      out.dir.textContent = Math.abs(cz) > 0.05 ? (cz > 0 ? "counter-clockwise" : "clockwise") : "none";
      out.day.textContent = fmt(dAy, 2);
      out.dax.textContent = fmt(dAx, 2);
    }

    bindDrag(s, w, h, (sx, sy) => {
      probe.x = clamp(M.invX(sx), xmin + 0.12, xmax - 0.12);
      probe.y = clamp(M.invY(sy), ymin + 0.12, ymax - 0.12);
      render();
    });

    seg(ctl, [
      { value: "vortex", label: "vortex" },
      { value: "shear", label: "shear" },
      { value: "radial", label: "radial" }
    ], "vortex", (v) => { mode = v; render(); });

    render();
    tip(root, "The wheel turns about the axis of ∇×A. Vortex: positive curl, counter-clockwise. Shear A = y x̂: negative curl, clockwise. Radial A = x x̂ + y ŷ: zero curl, no rotation.");
  }

  /* ---------- 5. divergence theorem ---------- */

  function divTheoremViz(root) {
    const ctl = controlRow(root);
    const w = 560, h = 400;
    const s = makeSvg(root, w, h, "Spherical wedge cross-section for the 2024-25 control divergence theorem exercise");
    const out = readouts(root, [
      { label: "∮D·dS (closed)", value: "27π = 84.82", id: "surf" },
      { label: "∫∇·D dv to R", value: "0", id: "vol" },
      { label: "local ∇·D", value: "—", id: "div" },
      { label: "R", value: "2.00", id: "R" }
    ]);

    const cx = 95, cy = 360, scale = 160;
    const p1 = Math.PI / 4, p2 = Math.PI / 2;
    const pm = (p1 + p2) / 2;
    const P = (r, ph) => [cx + r * scale * Math.cos(ph), cy - r * scale * Math.sin(ph)];
    let R = 2;
    const volTo = (r) => 1.5 * Math.PI * (Math.pow(r, 4) - 1) + 1.5 * Math.PI * (r * r - 1);
    const divAt = (r) => 12 * r + 12 / (Math.PI * r);

    function arc(g, r, color, width, dash) {
      const pts = [];
      for (let i = 0; i <= 48; i++) pts.push(P(r, p1 + (p2 - p1) * i / 48));
      g.appendChild(svgEl("polyline", {
        points: pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" "),
        fill: "none", stroke: color, "stroke-width": width,
        "stroke-dasharray": dash || null, "stroke-linecap": "round"
      }));
    }

    function render() {
      clear(s);
      const g = svgEl("g");
      s.appendChild(g);

      const outer = [];
      for (let i = 0; i <= 48; i++) outer.push(P(2, p1 + (p2 - p1) * i / 48));
      const inner = [];
      for (let i = 48; i >= 0; i--) inner.push(P(1, p1 + (p2 - p1) * i / 48));
      g.appendChild(svgEl("polygon", {
        points: outer.concat(inner).map((p) => `${p[0]},${p[1]}`).join(" "),
        fill: "#eaf0fb", stroke: "none"
      }));

      // accumulated volume from r = 1 to R
      if (R > 1.001) {
        const sub = [];
        for (let i = 0; i <= 40; i++) sub.push(P(R, p1 + (p2 - p1) * i / 40));
        for (let i = 40; i >= 0; i--) sub.push(P(1, p1 + (p2 - p1) * i / 40));
        g.appendChild(svgEl("polygon", {
          points: sub.map((p) => `${p[0]},${p[1]}`).join(" "),
          fill: "rgba(178,106,0,.10)", stroke: "none"
        }));
      }

      arc(g, 2, COL.ink, 2.4);
      arc(g, 1, COL.ink, 2.4);
      const a1 = P(1, p1), a2 = P(2, p1), b1 = P(1, p2), b2 = P(2, p2);
      g.appendChild(svgEl("line", { x1: a1[0], y1: a1[1], x2: a2[0], y2: a2[1], stroke: COL.ink, "stroke-width": 2.4 }));
      g.appendChild(svgEl("line", { x1: b1[0], y1: b1[1], x2: b2[0], y2: b2[1], stroke: COL.ink, "stroke-width": 2.4 }));

      // outward normals
      const nLen = 36;
      const mid2 = P(2, pm);
      arrow(g, mid2[0], mid2[1], mid2[0] + Math.cos(pm) * nLen, mid2[1] - Math.sin(pm) * nLen, { color: COL.blue, width: 2.2, head: 7 });
      const mid1 = P(1, pm);
      arrow(g, mid1[0], mid1[1], mid1[0] - Math.cos(pm) * nLen, mid1[1] + Math.sin(pm) * nLen, { color: COL.green, width: 2.2, head: 7 });

      const m3 = P(1.5, p1);
      arrow(g, m3[0], m3[1], m3[0] + Math.sin(p1) * nLen, m3[1] + Math.cos(p1) * nLen, { color: COL.orange, width: 2.2, head: 7 });
      const m4 = P(1.5, p2);
      arrow(g, m4[0], m4[1], m4[0] - Math.sin(p2) * nLen, m4[1] - Math.cos(p2) * nLen, { color: COL.red, width: 2.2, head: 7 });

      label(g, mid2[0] + Math.cos(pm) * (nLen + 14), mid2[1] - Math.sin(pm) * (nLen + 14), "S₂", { size: 11, weight: 700, fill: COL.blue });
      label(g, mid1[0] - Math.cos(pm) * (nLen + 16), mid1[1] + Math.sin(pm) * (nLen + 16), "S₁", { size: 11, weight: 700, fill: COL.green });
      label(g, m3[0] + Math.sin(p1) * (nLen + 14), m3[1] + Math.cos(p1) * (nLen + 14), "S₃", { size: 11, weight: 700, fill: COL.orange });
      label(g, m4[0] - Math.sin(p2) * (nLen + 18), m4[1] - Math.cos(p2) * (nLen + 18), "S₄", { size: 11, weight: 700, fill: COL.red, anchor: "end" });

      // probe arc and dot
      arc(g, R, COL.orange, 1.6, "5 4");
      const pr = P(R, pm);
      g.appendChild(svgEl("circle", { cx: pr[0], cy: pr[1], r: 5, fill: COL.orange }));

      // legend
      const lx = 365, ly = 28;
      label(g, lx, ly, "S₁  r = 1   inward", { anchor: "start", size: 10, fill: COL.green });
      label(g, lx, ly + 16, "S₂  r = 2   outward", { anchor: "start", size: 10, fill: COL.blue });
      label(g, lx, ly + 32, "S₃  φ = π/4   inward", { anchor: "start", size: 10, fill: COL.orange });
      label(g, lx, ly + 48, "S₄  φ = π/2   outward", { anchor: "start", size: 10, fill: COL.red });
      label(g, lx, ly + 72, "θ faces collapse: sin θ = 0", { anchor: "start", size: 10, fill: COL.gray });
      label(g, 16, 22, "cross-section at θ = π/2", { anchor: "start", size: 11, weight: 700, fill: COL.ink });

      const vol = volTo(R);
      out.vol.textContent = `${fmt(vol, 2)} = ${fmt(vol / Math.PI, 2)}π`;
      out.div.textContent = fmt(divAt(R), 2);
      out.R.textContent = fmt(R, 2);
    }

    slider(ctl, {
      label: "radius R", min: 1, max: 2, step: 0.01, value: R, width: 220,
      format: (v) => fmt(v, 2),
      onInput: (v) => { R = v; render(); }
    });

    render();
    tip(root, "Slide R from 1 to 2. The orange arc is the growing volume; the probe sits at θ = π/2, φ = 3π/8. At R = 2 the volume integral reaches 27π, matching the four surface fluxes on the readout.");
  }

  /* ---------- 6. Stokes ---------- */

  function stokesViz(root) {
    const ctl = controlRow(root);
    const w = 560, h = 360;
    const s = makeSvg(root, w, h, "Rectangular surface patch with a boundary loop, normal arrow and curl vector for Stokes theorem");
    const out = readouts(root, [
      { label: "∮A·dl", value: "4.00", id: "line" },
      { label: "∬(∇×A)·dS", value: "4.00", id: "flux" },
      { label: "difference", value: "0.00", id: "diff" },
      { label: "normal", value: "+ẑ", id: "norm" }
    ]);

    const proj = (x, y, z) => project3(x, y, z, { scale: 100, cx: 270, cy: 95 });
    const O = proj(0, 0, 0);
    const U = proj(2, 0, 0);
    const UV = proj(2, 1, 0);
    const V = proj(0, 1, 0);
    let front = true;

    function render() {
      clear(s);
      const g = svgEl("g");
      s.appendChild(g);

      const corners = [O, U, UV, V];
      g.appendChild(svgEl("polygon", {
        points: corners.map((p) => `${p.x},${p.y}`).join(" "),
        fill: front ? "#e8effc" : "#f7ece4",
        stroke: COL.ink, "stroke-width": 2
      }));
      g.appendChild(svgEl("line", {
        x1: O.x, y1: O.y, x2: UV.x, y2: UV.y,
        stroke: "#c7d2e4", "stroke-width": 1, "stroke-dasharray": "4 4"
      }));
      g.appendChild(svgEl("line", {
        x1: U.x, y1: U.y, x2: V.x, y2: V.y,
        stroke: "#c7d2e4", "stroke-width": 1, "stroke-dasharray": "4 4"
      }));

      const order = front ? [O, U, UV, V] : [O, V, UV, U];
      for (let i = 0; i < 4; i++) {
        const a = order[i], b = order[(i + 1) % 4];
        g.appendChild(svgEl("line", {
          x1: a.x, y1: a.y, x2: b.x, y2: b.y,
          stroke: COL.orange, "stroke-width": 2.4
        }));
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const dx = b.x - a.x, dy = b.y - a.y, m = Math.hypot(dx, dy);
        arrow(g, mx - dx / m * 10, my - dy / m * 10, mx + dx / m * 10, my + dy / m * 10, {
          color: COL.orange, width: 2, head: 7
        });
      }

      const c = { x: (O.x + UV.x) / 2, y: (O.y + UV.y) / 2 };
      const n = front ? -1 : 1;
      arrow(g, c.x, c.y, c.x, c.y + n * 62, { color: COL.blue, width: 3, head: 10 });
      label(g, c.x, c.y + n * 76 + (front ? -4 : 14), front ? "n̂ = +ẑ" : "n̂ = −ẑ", {
        size: 12, weight: 700, fill: COL.blue
      });

      arrow(g, c.x + 58, c.y, c.x + 58, c.y - 52, { color: COL.green, width: 2.4, head: 8 });
      label(g, c.x + 65, c.y - 56, "∇×A = 2ẑ", { anchor: "start", size: 10, fill: COL.green });

      label(g, O.x - 8, O.y + 17, "(0,0)", { anchor: "end", size: 10 });
      label(g, U.x + 8, U.y + 4, "(2,0)", { anchor: "start", size: 10 });
      label(g, UV.x + 8, UV.y + 14, "(2,1)", { anchor: "start", size: 10 });
      label(g, V.x - 8, V.y + 14, "(0,1)", { anchor: "end", size: 10 });

      const sign = front ? 1 : -1;
      out.line.textContent = fmt(4 * sign, 2);
      out.flux.textContent = fmt(4 * sign, 2);
      out.diff.textContent = "0.00";
      out.norm.textContent = front ? "+ẑ" : "−ẑ";
    }

    seg(ctl, [
      { value: "front", label: "front (+ẑ)" },
      { value: "back", label: "back (−ẑ)" }
    ], "front", (v) => { front = v === "front"; render(); });

    render();
    tip(root, "Flip the normal. The boundary arrows reverse, so the line integral and the curl flux both change sign. The green curl vector stays +2ẑ; the flux picks up the sign of n̂.");
  }

  /* ---------- mount ---------- */

  document.querySelectorAll('[data-viz="line-integral"]').forEach(lineIntegral);
  document.querySelectorAll('[data-viz="gradient"]').forEach(gradientViz);
  document.querySelectorAll('[data-viz="divergence"]').forEach(divergenceViz);
  document.querySelectorAll('[data-viz="curl"]').forEach(curlViz);
  document.querySelectorAll('[data-viz="div-theorem"]').forEach(divTheoremViz);
  document.querySelectorAll('[data-viz="stokes"]').forEach(stokesViz);
})();
