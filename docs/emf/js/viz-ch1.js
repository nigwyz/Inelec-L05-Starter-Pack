/* ============================================================
   EE361 EMF — Chapter 1 visuals
   Vector addition · dot product · cross product
   coordinate conversion · unit-vector systems
   ============================================================ */
(function () {
  "use strict";

  const {
    el, svgEl, clear, fmt, deg, rad, arrow, label, controlRow,
    slider, seg, readouts, makeSvg, project3, clamp
  } = window.EMF;

  const C = {
    a: "#2c4b9b", b: "#c2410c", r: "#0f766e", n: "#7c3aed",
    mute: "#8a97ad", grid: "#e8edf6", bad: "#b91c1c", ink: "#46536b"
  };

  function line(s, x1, y1, x2, y2, o) {
    const n = svgEl("line", Object.assign({
      x1, y1, x2, y2, stroke: "#c3ccdc", "stroke-width": 1.2
    }, o || {}));
    s.appendChild(n);
    return n;
  }

  function path(s, d, o) {
    const n = svgEl("path", Object.assign({
      d, fill: "none", stroke: C.mute, "stroke-width": 1.2
    }, o || {}));
    s.appendChild(n);
    return n;
  }

  function poly(s, pts, o) {
    const n = svgEl("polygon", Object.assign({
      points: pts.map((p) => p[0] + "," + p[1]).join(" "),
      fill: "rgba(44,75,155,.07)", stroke: C.mute, "stroke-dasharray": "4 4"
    }, o || {}));
    s.appendChild(n);
    return n;
  }

  function explain(root, text) {
    const p = el("p", {
      class: "legend",
      style: { display: "block", margin: "10px 0 0", fontSize: ".82rem", lineHeight: "1.5" }
    });
    p.textContent = text;
    root.appendChild(p);
    return p;
  }

  function vizSvg(root, w, h, aria) {
    const s = makeSvg(root, w, h, aria);
    s.style.maxWidth = "560px";
    s.style.margin = "0 auto";
    return s;
  }

  /* ------------------------------------------------------------
     1. Vector addition, parallelogram, resultant
     ------------------------------------------------------------ */
  function vecAdd(root) {
    const row = controlRow(root);
    const s = vizSvg(root, 460, 440, "Vectors A and B, their parallelogram, and the resultant A plus B.");
    const ox = 230, oy = 220, k = 26;
    const sx = (x) => ox + x * k;
    const sy = (y) => oy - y * k;

    const out = readouts(root, [
      { label: "R = A + B", id: "r" },
      { label: "|R|", id: "mag" },
      { label: "angle of R", id: "ang" }
    ]);

    function draw() {
      const ax = Number(aX.input.value), ay = Number(aY.input.value);
      const bx = Number(bX.input.value), by = Number(bY.input.value);
      clear(s);

      for (let i = -4; i <= 4; i++) {
        line(s, sx(i), sy(-4), sx(i), sy(4), { stroke: C.grid });
        line(s, sx(-4), sy(i), sx(4), sy(i), { stroke: C.grid });
      }
      line(s, sx(-4.6), oy, sx(4.6), oy, { stroke: "#c9d3e3", "stroke-width": 1.4 });
      line(s, ox, sy(-4.4), ox, sy(4.4), { stroke: "#c9d3e3", "stroke-width": 1.4 });
      label(s, sx(4.45), oy + 15, "x", { anchor: "end" });
      label(s, ox + 13, sy(4.25), "y");

      const axp = sx(ax), ayp = sy(ay), bxp = sx(bx), byp = sy(by);
      const rxp = sx(ax + bx), ryp = sy(ay + by);

      poly(s, [[ox, oy], [axp, ayp], [rxp, ryp], [bxp, byp]]);
      arrow(s, axp, ayp, rxp, ryp, { color: C.b, width: 1.5, dash: "5 4", head: 7, opacity: 0.7 });
      arrow(s, ox, oy, axp, ayp, { color: C.a });
      arrow(s, ox, oy, bxp, byp, { color: C.b });
      arrow(s, ox, oy, rxp, ryp, { color: C.r, width: 2.6, head: 10 });

      label(s, axp + 12, ayp + 4, "A", { fill: C.a, weight: 700 });
      label(s, bxp + 12, byp + 4, "B", { fill: C.b, weight: 700 });
      const rdx = rxp - ox, rdy = ryp - oy, rlen = Math.hypot(rdx, rdy) || 1;
      label(s, (ox + rxp) / 2 - (rdy / rlen) * 14, (oy + ryp) / 2 + (rdx / rlen) * 14, "A + B", {
        fill: C.r, weight: 700, anchor: "middle"
      });

      out.r.textContent = "(" + fmt(ax + bx, 1) + ", " + fmt(ay + by, 1) + ")";
      const m = Math.hypot(ax + bx, ay + by);
      out.mag.textContent = fmt(m, 2);
      let th = deg(Math.atan2(ay + by, ax + bx));
      if (th < 0) th += 360;
      out.ang.textContent = m < 0.001 ? "—" : fmt(th, 1) + "°";
    }

    const aX = slider(row, { label: "A x", min: -4, max: 4, step: 0.5, value: 4, format: (v) => v.toFixed(1), onInput: draw });
    const aY = slider(row, { label: "A y", min: -4, max: 4, step: 0.5, value: 1, format: (v) => v.toFixed(1), onInput: draw });
    const bX = slider(row, { label: "B x", min: -4, max: 4, step: 0.5, value: 1, format: (v) => v.toFixed(1), onInput: draw });
    const bY = slider(row, { label: "B y", min: -4, max: 4, step: 0.5, value: 3, format: (v) => v.toFixed(1), onInput: draw });

    draw();
    explain(root, "The diagonal of the parallelogram is A + B. The dashed copy of B starts at A's tip, so the same diagonal is produced in either order. Move a slider: the readouts come from the components, not from measured lengths.");
  }

  /* ------------------------------------------------------------
     2. Dot product: projection, angle, sign
     ------------------------------------------------------------ */
  function dotProduct(root) {
    const row = controlRow(root);
    const s = vizSvg(root, 460, 330, "Dot product of A and B, with the projection of B on A and the sign of the result.");
    const ox = 200, oy = 235, k = 34;

    const out = readouts(root, [
      { label: "A · B", id: "dot" },
      { label: "cos θ", id: "cos" },
      { label: "θ", id: "ang" },
      { label: "B cos θ", id: "proj" }
    ]);
    const noteEl = explain(root, "");

    function draw() {
      const thd = Number(ang.input.value);
      const th = rad(thd);
      const b = Number(bm.input.value);
      const a = 4;
      clear(s);

      line(s, 30, oy, 440, oy, { stroke: "#dfe6f2", "stroke-width": 2 });
      arrow(s, ox, oy, ox + a * k, oy, { color: C.a });
      label(s, ox + a * k - 4, oy + 18, "A", { fill: C.a, weight: 700 });

      const bx = ox + b * Math.cos(th) * k;
      const by = oy - b * Math.sin(th) * k;
      arrow(s, ox, oy, bx, by, { color: C.b });
      label(s, bx + 10, by - 8, "B", { fill: C.b, weight: 700 });

      const proj = b * Math.cos(th);
      const px = ox + proj * k;
      const neg = proj < -1e-9;
      line(s, ox, oy, px, oy, {
        stroke: neg ? C.bad : C.r, "stroke-width": 6, opacity: 0.28, "stroke-linecap": "round"
      });
      line(s, bx, by, px, oy, { stroke: C.mute, "stroke-dasharray": "4 4" });
      label(s, (ox + px) / 2, oy + 20, "B cos θ", { fill: neg ? C.bad : C.r, size: 10 });

      const ar = 44;
      let d = "";
      const steps = Math.max(2, Math.round(thd / 4));
      for (let i = 0; i <= steps; i++) {
        const t = (th * i) / steps;
        d += (i === 0 ? "M " : "L ") + (ox + ar * Math.cos(t)) + " " + (oy - ar * Math.sin(t)) + " ";
      }
      path(s, d, { stroke: C.mute });
      label(s, ox + (ar + 14) * Math.cos(th / 2), oy - (ar + 14) * Math.sin(th / 2), "θ", { size: 12 });

      const dot = a * b * Math.cos(th);
      out.dot.textContent = fmt(dot, 2);
      out.dot.style.color = dot < -0.005 ? C.bad : (dot > 0.005 ? C.r : C.ink);
      out.cos.textContent = fmt(Math.cos(th), 3);
      out.ang.textContent = fmt(thd, 0) + "°";
      out.proj.textContent = fmt(proj, 2);

      let msg;
      if (Math.abs(Math.cos(th)) < 0.005) {
        msg = "θ = 90°: B has no component along A, so A · B = 0 and the projection collapses to a point.";
      } else if (proj < 0) {
        msg = "θ > 90°: B leans back against A, the projection falls behind O, and A · B is negative.";
      } else {
        msg = "θ < 90°: B leans along A, the projection lies on A, and A · B is positive.";
      }
      noteEl.textContent = "A · B = |A||B| cos θ = " + fmt(a, 1) + " × " + fmt(b, 2) +
        " × " + fmt(Math.cos(th), 3) + " = " + fmt(dot, 2) + ". " + msg;
    }

    const ang = slider(row, { label: "θ", min: 0, max: 180, step: 1, value: 60, format: (v) => v + "°", onInput: draw });
    const bm = slider(row, { label: "|B|", min: 1, max: 4, step: 0.1, value: 3, format: (v) => v.toFixed(1), onInput: draw });

    draw();
  }

  /* ------------------------------------------------------------
     3. Cross product: area, normal, right-hand rule
     ------------------------------------------------------------ */
  function crossProduct(root) {
    const row = controlRow(root);
    const s = vizSvg(root, 460, 380, "Cross product: A and B span a parallelogram, and A cross B is normal to it.");
    const sc = 30, cx = 235, cy = 215;
    const P = (x, y, z) => project3(x, y, z, { scale: sc, cx, cy });

    const out = readouts(root, [
      { label: "|A × B|", id: "mag" },
      { label: "angle α", id: "ang" },
      { label: "direction", id: "dir" }
    ]);
    const noteEl = explain(root, "");

    function draw() {
      const al = rad(Number(ang.input.value));
      const a = Number(am.input.value);
      const b = Number(bm.input.value);
      clear(s);

      const O = P(0, 0, 0);
      const xa = P(5, 0, 0), ya = P(0, 5, 0), za = P(0, 0, 4.2);
      arrow(s, O.x, O.y, xa.x, xa.y, { color: "#b9c4d8", width: 1.3, head: 7 });
      arrow(s, O.x, O.y, ya.x, ya.y, { color: "#b9c4d8", width: 1.3, head: 7 });
      arrow(s, O.x, O.y, za.x, za.y, { color: "#b9c4d8", width: 1.3, head: 7 });
      label(s, xa.x + 4, xa.y + 14, "x", { fill: C.mute });
      label(s, ya.x + 12, ya.y + 4, "y", { fill: C.mute });
      label(s, za.x, za.y - 7, "z", { fill: C.mute });

      const A = { x: a, y: 0 };
      const B = { x: b * Math.cos(al), y: b * Math.sin(al) };
      const pa = P(A.x, A.y, 0), pb = P(B.x, B.y, 0), pr = P(A.x + B.x, A.y + B.y, 0);

      poly(s, [[O.x, O.y], [pa.x, pa.y], [pr.x, pr.y], [pb.x, pb.y]], {
        fill: "rgba(44,75,155,.10)", stroke: "#b9c4d8"
      });
      line(s, pa.x, pa.y, pr.x, pr.y, { stroke: C.b, "stroke-dasharray": "4 4", opacity: 0.55 });
      line(s, pb.x, pb.y, pr.x, pr.y, { stroke: C.a, "stroke-dasharray": "4 4", opacity: 0.55 });

      arrow(s, O.x, O.y, pa.x, pa.y, { color: C.a });
      arrow(s, O.x, O.y, pb.x, pb.y, { color: C.b });
      label(s, pa.x + 10, pa.y + 4, "A", { fill: C.a, weight: 700 });
      label(s, pb.x + 10, pb.y + 4, "B", { fill: C.b, weight: 700 });

      const ccx = (O.x + pa.x + pr.x + pb.x) / 4;
      const ccy = (O.y + pa.y + pr.y + pb.y) / 4;
      arrow(s, ccx, ccy, ccx, ccy - 72, { color: C.n, width: 2.4 });
      label(s, ccx + 6, ccy - 82, "A × B", { fill: C.n, weight: 700, anchor: "start" });

      const steps = Math.max(3, Math.round(deg(al) / 3));
      const arcR = Math.min(a, b) * 0.55;
      let d = "";
      for (let i = 0; i <= steps; i++) {
        const t = (al * i) / steps;
        const p = P(arcR * Math.cos(t), arcR * Math.sin(t), 0);
        d += (i === 0 ? "M " : "L ") + p.x + " " + p.y + " ";
      }
      path(s, d, { stroke: C.mute });
      const pm = P(arcR * 1.28 * Math.cos(al / 2), arcR * 1.28 * Math.sin(al / 2), 0);
      label(s, pm.x, pm.y, "α", { size: 12 });

      const mag = a * b * Math.sin(al);
      out.mag.textContent = fmt(mag, 2);
      out.ang.textContent = fmt(deg(al), 0) + "°";
      out.dir.textContent = "+ẑ (up in this view)";
      noteEl.textContent = "With A = " + fmt(a, 1) + " x̂ and B = " + fmt(b, 1) +
        "(cos α x̂ + sin α ŷ), A × B = " + fmt(mag, 2) +
        " ẑ. Curl the fingers of the right hand from A to B; the thumb points along +ẑ. The parallelogram area equals |A × B|.";
    }

    const ang = slider(row, { label: "α", min: 15, max: 165, step: 1, value: 55, format: (v) => v + "°", onInput: draw });
    const am = slider(row, { label: "|A|", min: 1, max: 4, step: 0.5, value: 3, format: (v) => v.toFixed(1), onInput: draw });
    const bm = slider(row, { label: "|B|", min: 1, max: 4, step: 0.5, value: 2.5, format: (v) => v.toFixed(1), onInput: draw });

    draw();
  }

  /* ------------------------------------------------------------
     4. Coordinate conversion with the three surfaces hinted
     ------------------------------------------------------------ */
  function coordConvert(root) {
    const row = controlRow(root);
    const s = vizSvg(root, 460, 400, "A point with its Cartesian, cylindrical and spherical coordinates and coordinate surfaces.");
    const sc = 22, cx = 230, cy = 250;
    const P = (x, y, z) => project3(x, y, z, { scale: sc, cx, cy });

    const out = readouts(root, [
      { label: "Cartesian", id: "cart" },
      { label: "Cylindrical", id: "cyl" },
      { label: "Spherical", id: "sph" }
    ]);
    const noteEl = explain(root, "");

    function circlePath(rho, z) {
      let d = "";
      for (let i = 0; i <= 72; i++) {
        const t = (i / 72) * Math.PI * 2;
        const p = P(rho * Math.cos(t), rho * Math.sin(t), z);
        d += (i === 0 ? "M " : "L ") + p.x + " " + p.y + " ";
      }
      return d;
    }

    function draw() {
      const x = Number(xs.input.value), y = Number(ys.input.value), z = Number(zs.input.value);
      const rho = Math.hypot(x, y);
      const r = Math.hypot(rho, z);
      const phi = Math.atan2(y, x);
      const theta = r > 1e-9 ? Math.acos(clamp(z / r, -1, 1)) : 0;
      const pd = ((deg(phi) % 360) + 360) % 360;
      const td = deg(theta);
      clear(s);

      const O = P(0, 0, 0);
      line(s, P(-6.4, 0, 0).x, P(-6.4, 0, 0).y, O.x, O.y, { stroke: "#e2e8f2" });
      line(s, P(0, -6.4, 0).x, P(0, -6.4, 0).y, O.x, O.y, { stroke: "#e2e8f2" });
      line(s, O.x, O.y, P(0, 0, -6.4).x, P(0, 0, -6.4).y, { stroke: "#e2e8f2" });
      const xa = P(6.4, 0, 0), ya = P(0, 6.4, 0), za = P(0, 0, 6.4);
      arrow(s, O.x, O.y, xa.x, xa.y, { color: "#b9c4d8", width: 1.2, head: 6 });
      arrow(s, O.x, O.y, ya.x, ya.y, { color: "#b9c4d8", width: 1.2, head: 6 });
      arrow(s, O.x, O.y, za.x, za.y, { color: "#b9c4d8", width: 1.2, head: 6 });
      label(s, xa.x + 3, xa.y + 14, "x", { fill: C.mute });
      label(s, ya.x + 12, ya.y + 2, "y", { fill: C.mute });
      label(s, za.x, za.y - 7, "z", { fill: C.mute });

      if (rho > 0.05) {
        path(s, circlePath(rho, 0), { stroke: C.r, "stroke-dasharray": "4 4", opacity: 0.45 });
        if (Math.abs(z) > 0.05) {
          path(s, circlePath(rho, z), { stroke: C.r, "stroke-dasharray": "2 6", opacity: 0.22 });
        }

        const wedge = [[O.x, O.y]];
        const start = P(rho, 0, 0);
        wedge.push([start.x, start.y]);
        const sgn = phi < 0 ? -1 : 1;
        const n = Math.max(4, Math.round(Math.abs(deg(phi)) / 3));
        for (let i = 1; i <= n; i++) {
          const t = (Math.abs(phi) * i / n) * sgn;
          const p = P(rho * Math.cos(t), rho * Math.sin(t), 0);
          wedge.push([p.x, p.y]);
        }
        poly(s, wedge, {
          fill: "rgba(193,65,12,.10)", stroke: "rgba(193,65,12,.35)", "stroke-dasharray": "3 3"
        });
        const pl = P(rho * 0.58 * Math.cos(phi / 2), rho * 0.58 * Math.sin(phi / 2), 0);
        label(s, pl.x, pl.y + 4, "φ", { fill: C.b, size: 11 });
      }

      if (r > 0.05) {
        let d = "";
        const n = 44;
        for (let i = 0; i <= n; i++) {
          const t = (theta * i) / n;
          const p = P(r * Math.sin(t) * Math.cos(phi), r * Math.sin(t) * Math.sin(phi), r * Math.cos(t));
          d += (i === 0 ? "M " : "L ") + p.x + " " + p.y + " ";
        }
        path(s, d, { stroke: C.n, "stroke-dasharray": "5 5", opacity: 0.5 });
      }

      const pp = P(x, y, z), pq = P(x, y, 0);
      const flat = Math.abs(z) < 0.05;
      const axial = rho < 0.05;

      if (!flat && !axial) {
        line(s, pq.x, pq.y, pp.x, pp.y, { stroke: C.mute, "stroke-dasharray": "4 4" });
        line(s, O.x, O.y, pq.x, pq.y, { stroke: C.a, "stroke-width": 1.6 });
        s.appendChild(svgEl("circle", { cx: pq.x, cy: pq.y, r: 3, fill: C.a, opacity: 0.7 }));
        label(s, pq.x + 9, pq.y + 13, "P′", { fill: C.a, size: 10 });
        const qdx = pq.x - O.x, qdy = pq.y - O.y, qlen = Math.hypot(qdx, qdy) || 1;
        label(s, (O.x + pq.x) / 2 - (qdy / qlen) * 12, (O.y + pq.y) / 2 + (qdx / qlen) * 12, "ρ", {
          fill: C.a, weight: 700
        });
      }

      line(s, O.x, O.y, pp.x, pp.y, { stroke: C.r, "stroke-width": 1.8 });
      s.appendChild(svgEl("circle", { cx: pp.x, cy: pp.y, r: 4.5, fill: C.b }));
      label(s, pp.x + 10, pp.y - 7, "P", { fill: C.b, weight: 700 });

      const rdx = pp.x - O.x, rdy = pp.y - O.y, rlen = Math.hypot(rdx, rdy) || 1;
      label(s, (O.x + pp.x) / 2 - (rdy / rlen) * 12, (O.y + pp.y) / 2 + (rdx / rlen) * 12,
        flat && !axial ? "r = ρ" : "r", { fill: C.r, weight: 700 });

      out.cart.textContent = "(" + fmt(x, 0) + ", " + fmt(y, 0) + ", " + fmt(z, 0) + ")";
      out.cyl.textContent = rho < 1e-9
        ? "ρ = 0, φ undefined, z = " + fmt(z, 0)
        : "ρ = " + fmt(rho, 2) + ", φ = " + fmt(pd, 1) + "°, z = " + fmt(z, 0);
      out.sph.textContent = r < 1e-9
        ? "r = 0, θ and φ undefined"
        : "r = " + fmt(r, 2) + ", θ = " + fmt(td, 1) + "°, φ = " + fmt(pd, 1) + "°";

      if (r < 1e-9) {
        noteEl.textContent = "The point is the origin. All three systems agree on its location, but θ and φ are undefined there.";
      } else if (axial) {
        noteEl.textContent = "The point lies on the z-axis: ρ = 0 and φ is undefined, while r = |z| = " + fmt(r, 2) + ". The violet meridian is the sphere r = " + fmt(r, 2) + ".";
      } else if (flat) {
        noteEl.textContent = "P lies in the xy-plane, so the cylinder radius and the sphere radius coincide: ρ = r = " + fmt(r, 2) + ". The teal circle is the cylinder; the violet meridian is the sphere.";
      } else {
        noteEl.textContent = "The teal circle is the cylinder ρ = " + fmt(rho, 2) +
          ", the orange wedge is the half-plane φ = " + fmt(pd, 1) +
          "°, and the violet meridian is the sphere r = " + fmt(r, 2) +
          ". All three descriptions name the same point P.";
      }
    }

    const xs = slider(row, { label: "x", min: -6, max: 6, step: 1, value: 3, format: (v) => v.toFixed(0), onInput: draw });
    const ys = slider(row, { label: "y", min: -6, max: 6, step: 1, value: 4, format: (v) => v.toFixed(0), onInput: draw });
    const zs = slider(row, { label: "z", min: -6, max: 6, step: 1, value: 5, format: (v) => v.toFixed(0), onInput: draw });

    draw();
  }

  /* ------------------------------------------------------------
     5. Unit vectors in the three systems
     ------------------------------------------------------------ */
  function unitVectors(root) {
    const row = controlRow(root);
    const s = vizSvg(root, 460, 460, "The three unit vectors of the selected coordinate system drawn at a point.");
    const sc = 40, cx = 230, cy = 235;
    const P = (x, y, z) => project3(x, y, z, { scale: sc, cx, cy });
    let system = "cartesian";
    let ready = false;

    const grid = el("div", { class: "readouts" });
    const cells = [0, 1, 2].map(() => {
      const box = el("div", { class: "readout" });
      const lab = el("span", { class: "lab" });
      const val = el("span", { class: "val" });
      box.appendChild(lab);
      box.appendChild(val);
      grid.appendChild(box);
      return { lab, val };
    });
    root.appendChild(grid);
    const noteEl = explain(root, "");

    function draw() {
      const ph = rad(Number(phi.input.value));
      const th = rad(Number(theta.input.value));
      clear(s);

      const r = 3.3;
      const pw = [r * Math.sin(th) * Math.cos(ph), r * Math.sin(th) * Math.sin(ph), r * Math.cos(th)];
      const O = P(0, 0, 0);
      const xa = P(3.8, 0, 0), ya = P(0, 3.8, 0), za = P(0, 0, 3.8);
      arrow(s, O.x, O.y, xa.x, xa.y, { color: "#c3ccdc", width: 1.2, head: 6 });
      arrow(s, O.x, O.y, ya.x, ya.y, { color: "#c3ccdc", width: 1.2, head: 6 });
      arrow(s, O.x, O.y, za.x, za.y, { color: "#c3ccdc", width: 1.2, head: 6 });
      label(s, xa.x + 3, xa.y + 14, "x", { fill: C.mute });
      label(s, ya.x + 12, ya.y + 2, "y", { fill: C.mute });
      label(s, za.x, za.y - 7, "z", { fill: C.mute });

      const pp = P(pw[0], pw[1], pw[2]);
      line(s, O.x, O.y, pp.x, pp.y, { stroke: "#b9c4d8", "stroke-dasharray": "4 4" });
      s.appendChild(svgEl("circle", { cx: pp.x, cy: pp.y, r: 4, fill: C.ink }));
      label(s, pp.x + 10, pp.y - 10, "P", { size: 11, weight: 700 });

      let vecs, names, text;
      if (system === "cartesian") {
        vecs = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        names = ["x̂", "ŷ", "ẑ"];
        text = "Cartesian: x̂, ŷ and ẑ point along the fixed axes. They are the same vectors at every point, so θ and φ do not change them.";
      } else if (system === "cylindrical") {
        vecs = [
          [Math.cos(ph), Math.sin(ph), 0],
          [-Math.sin(ph), Math.cos(ph), 0],
          [0, 0, 1]
        ];
        names = ["ρ̂", "φ̂", "ẑ"];
        text = "Cylindrical: ρ̂ points away from the z-axis and φ̂ points the way φ increases. Both rotate with φ; ẑ never moves.";
      } else {
        vecs = [
          [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)],
          [Math.cos(th) * Math.cos(ph), Math.cos(th) * Math.sin(ph), -Math.sin(th)],
          [-Math.sin(ph), Math.cos(ph), 0]
        ];
        names = ["r̂", "θ̂", "φ̂"];
        text = "Spherical: r̂ points radially outward, θ̂ points toward increasing θ, and φ̂ points east. All three depend on θ and φ.";
      }

      vecs.forEach((v, i) => {
        const tip = P(pw[0] + 1.35 * v[0], pw[1] + 1.35 * v[1], pw[2] + 1.35 * v[2]);
        const color = [C.a, C.b, C.r][i];
        arrow(s, pp.x, pp.y, tip.x, tip.y, { color, width: 2.2, head: 8 });
        const dx = tip.x - pp.x, dy = tip.y - pp.y, len = Math.hypot(dx, dy) || 1;
        label(s, tip.x + (dx / len) * 12, tip.y + (dy / len) * 12 + 3, names[i], {
          fill: color, weight: 700, size: 12
        });
        cells[i].lab.textContent = names[i];
        cells[i].val.textContent = "(" + fmt(v[0], 2) + ", " + fmt(v[1], 2) + ", " + fmt(v[2], 2) + ")";
      });
      noteEl.textContent = text;
    }

    seg(row, [
      { value: "cartesian", label: "Cartesian" },
      { value: "cylindrical", label: "Cylindrical" },
      { value: "spherical", label: "Spherical" }
    ], "cartesian", (v) => { system = v; if (ready) draw(); });
    const phi = slider(row, { label: "φ", min: 0, max: 360, step: 1, value: 15, format: (v) => v + "°", onInput: () => { if (ready) draw(); } });
    const theta = slider(row, { label: "θ", min: 10, max: 170, step: 1, value: 55, format: (v) => v + "°", onInput: () => { if (ready) draw(); } });

    ready = true;
    draw();
  }

  document.querySelectorAll('[data-viz="vec-add"]').forEach(vecAdd);
  document.querySelectorAll('[data-viz="dot-product"]').forEach(dotProduct);
  document.querySelectorAll('[data-viz="cross-product"]').forEach(crossProduct);
  document.querySelectorAll('[data-viz="coord-convert"]').forEach(coordConvert);
  document.querySelectorAll('[data-viz="unit-vectors"]').forEach(unitVectors);
})();
