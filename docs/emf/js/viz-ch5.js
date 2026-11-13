/* ============================================================
   EE361 EMF — Chapter 5 visuals
   Maxwell map · Faraday · displacement current · continuity
   Vanilla JS, no dependencies.
   ============================================================ */
(function () {
  "use strict";

  const {
    el, svgEl, clear, fmt, clamp, arrow, label,
    slider, seg, readouts, makeSvg, dot
  } = window.EMF;

  const BLUE = "#2c4b9b", RED = "#b3261e", GREEN = "#1f7a4d";
  const AMBER = "#c47a12", INK = "#46536b", LINE = "#c3ccdc";

  function path(s, d, color, width, dash, opacity) {
    s.appendChild(svgEl("path", {
      d, fill: "none", stroke: color || LINE, "stroke-width": width || 1.5,
      "stroke-dasharray": dash || null, "stroke-linecap": "round",
      opacity: opacity === undefined ? 1 : opacity
    }));
  }

  function caption(root, text) {
    const p = el("p", {
      style: { margin: "10px 0 0", fontSize: ".83rem", color: INK, lineHeight: "1.5" }
    });
    p.textContent = text;
    root.appendChild(p);
    return p;
  }

  /* ============================================================
     1. maxwell-map — four clickable cards, one diagram
     ============================================================ */
  function maxwellMap(root) {
    clear(root);
    const LAWS = [
      {
        name: "Gauss for E", integral: "∮ D·dS = Q", diff: "∇·D = ρv",
        text: "Free electric charge is the source of D. The net D-flux out of any closed surface equals the charge enclosed. It is a calculating tool only when symmetry lets you pull D out of the surface integral."
      },
      {
        name: "Gauss for B", integral: "∮ B·dS = 0", diff: "∇·B = 0",
        text: "There is no magnetic charge. Every field line that enters a closed surface must leave it, so the net magnetic flux is always zero. B lines close on themselves; they never start or stop."
      },
      {
        name: "Faraday", integral: "∮ E·dl = −dΦB/dt", diff: "∇×E = −∂B/∂t",
        text: "A changing magnetic flux drives a circulating electric field. The minus sign is Lenz: the induced field opposes the change in flux. This law is the reason a transformer works."
      },
      {
        name: "Ampère–Maxwell", integral: "∮ H·dl = I + dΦD/dt", diff: "∇×H = Jc + ∂D/∂t",
        text: "Conduction current and changing electric flux both create a circulating H field. Maxwell's displacement term is what keeps the law consistent across a capacitor gap and makes electromagnetic waves possible."
      }
    ];

    const cards = el("div", {
      style: {
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "8px", marginBottom: "14px"
      }
    });
    const buttons = LAWS.map((law, i) => {
      const b = el("button", {
        type: "button", "aria-pressed": i === 0 ? "true" : "false",
        style: {
          textAlign: "left", padding: "10px 12px", borderRadius: "10px",
          border: "1px solid #dde3ed", background: "#fff", cursor: "pointer",
          font: "inherit"
        }
      },
        el("span", {
          text: law.name,
          style: {
            display: "block", fontWeight: "750", fontSize: ".82rem", color: "#172033"
          }
        }),
        el("span", {
          text: law.integral,
          style: {
            display: "block", marginTop: "3px", color: INK,
            fontFamily: "\"DejaVu Sans\", system-ui, sans-serif", fontSize: ".7rem",
            lineHeight: "1.35", overflowWrap: "anywhere"
          }
        })
      );
      b.addEventListener("click", () => show(i));
      cards.appendChild(b);
      return b;
    });
    root.appendChild(cards);

    const s = makeSvg(root, 560, 270, "Diagram of the selected Maxwell equation");
    const box = el("div", {
      style: {
        marginTop: "12px", padding: "12px 14px", background: "#eef1f7",
        borderRadius: "10px"
      }
    });
    const title = el("strong", {
      style: { display: "block", color: BLUE, marginBottom: "3px", fontSize: ".9rem" }
    });
    const text = el("span", {
      style: { fontSize: ".86rem", color: INK, lineHeight: "1.5" }
    });
    box.appendChild(title);
    box.appendChild(text);
    root.appendChild(box);

    function draw(i) {
      clear(s);
      const cx = 280, cy = 136;
      if (i === 0) {
        const r = 70;
        for (let k = 0; k < 8; k++) {
          const a = (k * Math.PI) / 4;
          arrow(s,
            cx + 16 * Math.cos(a), cy + 16 * Math.sin(a),
            cx + (r + 30) * Math.cos(a), cy + (r + 30) * Math.sin(a),
            { color: AMBER, width: 1.5, head: 6, opacity: 0.85 });
        }
        s.appendChild(svgEl("circle", {
          cx, cy, r, fill: "none", stroke: BLUE, "stroke-width": 2,
          "stroke-dasharray": "7 5"
        }));
        dot(s, cx, cy, 8, RED);
        label(s, cx, cy + 4, "+", { size: 14, weight: 800, fill: "#fff" });
        label(s, cx, 22, "Gaussian surface S", { size: 11, fill: BLUE });
        label(s, cx, 258, "∮S D · dS = Q inside", { size: 12, fill: INK, mono: true });
      } else if (i === 1) {
        [[150, 84], [122, 63], [95, 44]].forEach(([rx, ry]) => {
          s.appendChild(svgEl("ellipse", {
            cx, cy, rx, ry, fill: "none", stroke: AMBER,
            "stroke-width": 1.4, opacity: 0.7
          }));
        });
        s.appendChild(svgEl("ellipse", {
          cx, cy, rx: 168, ry: 100, fill: "none", stroke: BLUE,
          "stroke-width": 2, "stroke-dasharray": "7 5"
        }));
        s.appendChild(svgEl("rect", {
          x: 235, y: 119, width: 45, height: 34,
          fill: "#dbe5fb", stroke: BLUE
        }));
        s.appendChild(svgEl("rect", {
          x: 280, y: 119, width: 45, height: 34,
          fill: "#f6d7d4", stroke: RED
        }));
        label(s, 257, 142, "S", { size: 14, weight: 800, fill: BLUE });
        label(s, 302, 142, "N", { size: 14, weight: 800, fill: RED });
        arrow(s, 350, 112, 408, 76, { color: AMBER, width: 2, head: 7 });
        arrow(s, 210, 160, 152, 196, { color: AMBER, width: 2, head: 7 });
        label(s, 414, 70, "flux out", { size: 10, fill: AMBER, anchor: "start" });
        label(s, 146, 208, "flux in", { size: 10, fill: AMBER, anchor: "end" });
        label(s, cx, 22, "no magnetic charge", { size: 11, fill: BLUE });
        label(s, cx, 258, "∮S B · dS = 0", { size: 12, fill: INK, mono: true });
      } else if (i === 2) {
        for (let ix = 0; ix < 5; ix++) {
          for (let iy = 0; iy < 3; iy++) {
            const x = cx - 64 + ix * 32, y = cy - 34 + iy * 34;
            path(s, `M ${x - 5} ${y - 5} L ${x + 5} ${y + 5} M ${x + 5} ${y - 5} L ${x - 5} ${y + 5}`,
              AMBER, 1.4);
          }
        }
        s.appendChild(svgEl("ellipse", {
          cx, cy, rx: 95, ry: 66, fill: "none", stroke: BLUE, "stroke-width": 2.5
        }));
        arrow(s, cx + 95, cy - 20, cx + 95, cy + 20, { color: GREEN, width: 2.5, head: 7 });
        arrow(s, cx - 20, cy - 66, cx + 20, cy - 66, { color: GREEN, width: 2.5, head: 7 });
        arrow(s, cx - 95, cy + 20, cx - 95, cy - 20, { color: GREEN, width: 2.5, head: 7 });
        arrow(s, cx + 20, cy + 66, cx - 20, cy + 66, { color: GREEN, width: 2.5, head: 7 });
        label(s, cx, 40, "B into the page, decreasing", { size: 11, fill: AMBER });
        label(s, cx, 238, "induced E (clockwise)", { size: 10, fill: GREEN });
        label(s, cx, 258, "emf = −dΦB/dt", { size: 12, fill: INK, mono: true });
      } else {
        s.appendChild(svgEl("circle", {
          cx, cy, r: 78, fill: "none", stroke: BLUE,
          "stroke-width": 2, "stroke-dasharray": "7 5"
        }));
        s.appendChild(svgEl("circle", {
          cx, cy, r: 9, fill: RED, stroke: RED
        }));
        dot(s, cx, cy, 2.5, "#fff");
        label(s, cx, cy + 30, "I out of page", { size: 10, fill: RED });
        arrow(s, cx + 78, cy + 18, cx + 78, cy - 18, { color: GREEN, width: 2.5, head: 7 });
        arrow(s, cx + 18, cy - 78, cx - 18, cy - 78, { color: GREEN, width: 2.5, head: 7 });
        arrow(s, cx - 78, cy - 18, cx - 78, cy + 18, { color: GREEN, width: 2.5, head: 7 });
        arrow(s, cx - 18, cy + 78, cx + 18, cy + 78, { color: GREEN, width: 2.5, head: 7 });
        label(s, cx + 86, cy - 30, "H", { size: 11, fill: GREEN, anchor: "start" });
        label(s, cx, 40, "Amperian loop C", { size: 11, fill: BLUE });
        label(s, cx, 246, "∮C H · dl = I + dΦD/dt", { size: 12, fill: INK, mono: true });
      }
    }

    function show(i) {
      buttons.forEach((b, j) => {
        const on = j === i;
        b.style.borderColor = on ? BLUE : "#dde3ed";
        b.style.background = on ? "#e7edfb" : "#fff";
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      title.textContent = LAWS[i].name + " · " + LAWS[i].diff;
      text.textContent = LAWS[i].text;
      draw(i);
    }
    show(0);
  }

  /* ============================================================
     2. faraday — magnet on the axis of a coil
     ============================================================ */
  function faradayViz(root) {
    clear(root);
    const MU0 = 4 * Math.PI * 1e-7, TURNS = 500, MOMENT = 8;
    const RAD = 0.03, Z0 = 0.05;
    const PHI0 = (MU0 * MOMENT * RAD * RAD) /
      (2 * Math.pow(RAD * RAD + Z0 * Z0, 1.5));
    const DPHIDZ = (-3 * Z0 * PHI0) / (RAD * RAD + Z0 * Z0);

    const ctrl = el("div", { class: "controls" });
    root.appendChild(ctrl);
    const speed = slider(ctrl, {
      label: "velocity (− toward, + away)", min: -20, max: 20, step: 1, value: -10,
      format: (v) => (v > 0 ? "+" : "") + fmt(v, 0) + " cm/s",
      width: 170, onInput: () => update()
    });

    const s = makeSvg(root, 560, 260, "A magnet moving toward or away from a coil, with induced current");
    const wrap = el("div");
    root.appendChild(wrap);
    const r = readouts(wrap, [
      { label: "Flux Φ", id: "flux" },
      { label: "|emf|", id: "emf" },
      { label: "Near-side current", id: "cur" },
      { label: "Coil face to magnet", id: "face" }
    ]);
    const verdict = el("p", {
      style: { margin: "12px 0 0", fontWeight: "650", fontSize: ".9rem", color: GREEN }
    });
    root.appendChild(verdict);
    caption(root,
      "Snapshot at z = 5.0 cm; coil has N = 500 turns, radius 3.0 cm, magnet moment 8 A·m². " +
      "The sign of emf is ε = −N dΦ/dt; the arrows show the current on the side facing you.");

    let poleValue = "N";
    seg(ctrl, [
      { value: "N", label: "N pole → coil" },
      { value: "S", label: "S pole → coil" }
    ], "N", (v) => { poleValue = v; update(); });

    function draw(v, pole, up) {
      clear(s);
      const cx = 365, cy = 135;
      // magnet
      const nRight = pole === "N";
      s.appendChild(svgEl("rect", {
        x: 130, y: 117, width: 35, height: 36,
        fill: nRight ? "#dbe5fb" : "#f6d7d4", stroke: nRight ? BLUE : RED
      }));
      s.appendChild(svgEl("rect", {
        x: 165, y: 117, width: 35, height: 36,
        fill: nRight ? "#f6d7d4" : "#dbe5fb", stroke: nRight ? RED : BLUE
      }));
      label(s, 147, 141, nRight ? "S" : "N",
        { size: 14, weight: 800, fill: nRight ? BLUE : RED });
      label(s, 182, 141, nRight ? "N" : "S",
        { size: 14, weight: 800, fill: nRight ? RED : BLUE });
      // axis
      s.appendChild(svgEl("line", {
        x1: 200, y1: cy, x2: 330, y2: cy, stroke: LINE,
        "stroke-width": 1.2, "stroke-dasharray": "5 5"
      }));
      // motion arrow
      if (v < 0) arrow(s, 120, 92, 195, 92, { color: GREEN, width: 2.5, head: 8 });
      else if (v > 0) arrow(s, 195, 92, 120, 92, { color: GREEN, width: 2.5, head: 8 });
      label(s, 157, 80, v === 0 ? "at rest" : v < 0 ? "toward" : "away",
        { size: 10, fill: GREEN });
      // coil
      for (let k = 0; k < 5; k++) {
        s.appendChild(svgEl("ellipse", {
          cx: 335 + k * 15, cy, rx: 7, ry: 52,
          fill: "none", stroke: BLUE, "stroke-width": 2
        }));
      }
      label(s, cx, 64, "N-turn coil", { size: 11, fill: BLUE });
      // flux arrows
      const dir = pole === "N" ? 1 : -1;
      [119, 135, 151].forEach((y) => {
        if (dir > 0) arrow(s, 305, y, 432, y, { color: AMBER, width: 1.8, head: 6, opacity: 0.8 });
        else arrow(s, 432, y, 305, y, { color: AMBER, width: 1.8, head: 6, opacity: 0.8 });
      });
      label(s, dir > 0 ? 442 : 292, 135, "Φ", { size: 12, fill: AMBER, anchor: dir > 0 ? "start" : "end" });
      // current on the near side of each turn
      if (v !== 0) {
        for (let k = 0; k < 5; k++) {
          const x = 342 + k * 15;
          if (up) arrow(s, x, cy + 15, x, cy - 15, { color: GREEN, width: 2.5, head: 6 });
          else arrow(s, x, cy - 15, x, cy + 15, { color: GREEN, width: 2.5, head: 6 });
        }
      }
      label(s, cx, 215, v === 0 ? "no current" : up ? "current on near side: up" : "current on near side: down",
        { size: 10, fill: GREEN });
      label(s, cx, 244, "ε = −N dΦ/dt", { size: 12, fill: INK, mono: true });
    }

    function update() {
      if (!r) return;
      const v = Number(speed.input.value) / 100;
      const pole = poleValue;
      const dPhidt = (pole === "N" ? 1 : -1) * DPHIDZ * v;
      const emf = -TURNS * dPhidt;
      const up = emf < -1e-9;
      const face = v === 0 ? "—" : (v < 0 ? pole : (pole === "N" ? "S" : "N"));

      r.flux.textContent = fmt((pole === "N" ? 1 : -1) * PHI0 * 1e6, 1) + " µWb";
      r.emf.textContent = fmt(Math.abs(emf) * 1e3, 1) + " mV";
      r.cur.textContent = v === 0 ? "—" : up ? "↑ up" : "↓ down";
      r.face.textContent = face;

      if (v === 0) {
        verdict.style.color = INK;
        verdict.textContent = "No motion: the flux is constant, so emf = 0 and no current flows.";
      } else if (v < 0) {
        verdict.style.color = GREEN;
        verdict.textContent = "Lenz: the coil repels the approaching magnet — its face is " + face + ".";
      } else {
        verdict.style.color = GREEN;
        verdict.textContent = "Lenz: the coil pulls the receding magnet back — its face is " + face + ".";
      }
      draw(v, pole, up);
    }
    update();
  }

  /* ============================================================
     3. displacement-current — charging capacitor
     ============================================================ */
  function displacementViz(root) {
    clear(root);
    const EPS0 = 8.854187817e-12;
    const AREA = Math.PI * 0.1 * 0.1;
    const GAP = 0.002;
    const CAP = (EPS0 * AREA) / GAP;

    const ctrl = el("div", { class: "controls" });
    root.appendChild(ctrl);
    const dv = slider(ctrl, {
      label: "dV/dt", min: -1, max: 1, step: 0.05, value: 0.5,
      format: (v) => fmt(v, 2) + " MV/s", width: 150, onInput: () => update()
    });
    const vv = slider(ctrl, {
      label: "V", min: 0, max: 200, step: 5, value: 100,
      format: (v) => fmt(v, 0) + " V", width: 120, onInput: () => update()
    });

    const s = makeSvg(root, 560, 300, "Charging capacitor with conduction and displacement current");
    const wrap = el("div");
    root.appendChild(wrap);
    const r = readouts(wrap, [
      { label: "Capacitance", id: "cap" },
      { label: "Displacement current", id: "id" },
      { label: "J_d", id: "jd" },
      { label: "E", id: "e" }
    ]);
    const status = el("p", {
      style: { margin: "12px 0 0", fontWeight: "650", fontSize: ".9rem", color: GREEN }
    });
    root.appendChild(status);
    caption(root,
      "I_d = ε0 dΦ_E/dt = C dV/dt, with A = π(0.10)² m² and d = 2.0 mm. " +
      "V sets the field strength; dV/dt sets the current. At dV/dt = 0 the displacement current is zero even when V is maximum.");

    function draw(V, dVdt) {
      clear(s);
      const charging = dVdt > 1e-9, discharging = dVdt < -1e-9;
      // circuit
      path(s, "M 90 80 L 250 80 L 250 105", INK, 2);
      path(s, "M 310 105 L 310 80 L 470 80", INK, 2);
      path(s, "M 90 80 L 90 230 L 255 230", INK, 2);
      path(s, "M 305 230 L 470 230 L 470 80", INK, 2);
      s.appendChild(svgEl("circle", {
        cx: 280, cy: 230, r: 18, fill: "#fff", stroke: INK, "stroke-width": 2
      }));
      label(s, 280, 235, "~", { size: 16, fill: INK });
      label(s, 280, 264, "V(t)", { size: 10, fill: INK });
      // plates
      s.appendChild(svgEl("line", {
        x1: 250, y1: 105, x2: 250, y2: 185,
        stroke: RED, "stroke-width": 5, "stroke-linecap": "round"
      }));
      s.appendChild(svgEl("line", {
        x1: 310, y1: 105, x2: 310, y2: 185,
        stroke: BLUE, "stroke-width": 5, "stroke-linecap": "round"
      }));
      // charge signs
      const qo = 0.15 + 0.85 * (V / 200);
      [120, 140, 160].forEach((y) => {
        label(s, 242, y, "+", { size: 13, weight: 800, fill: RED, opacity: qo });
        label(s, 318, y, "−", { size: 13, weight: 800, fill: BLUE, opacity: qo });
      });
      // E field
      const eo = 0.18 + 0.82 * (V / 200);
      [115, 130, 145].forEach((y) => {
        arrow(s, 258, y, 302, y, { color: AMBER, width: 1.5, head: 6, opacity: eo });
      });
      label(s, 280, 201, "E = V/d", { size: 10, fill: AMBER });
      // currents
      if (charging || discharging) {
        const sign = charging ? 1 : -1;
        arrow(s, sign > 0 ? 140 : 190, 80, sign > 0 ? 190 : 140, 80,
          { color: GREEN, width: 3, head: 7 });
        arrow(s, sign > 0 ? 380 : 430, 80, sign > 0 ? 430 : 380, 80,
          { color: GREEN, width: 3, head: 7 });
        arrow(s, sign > 0 ? 225 : 150, 230, sign > 0 ? 150 : 225, 230,
          { color: GREEN, width: 3, head: 7 });
        label(s, 165, 68, "I_c", { size: 10, fill: GREEN });
        // displacement current in the gap
        arrow(s, sign > 0 ? 255 : 305, 168, sign > 0 ? 305 : 255, 168,
          { color: GREEN, width: 4, head: 8 });
        label(s, 280, 158, "J_d", { size: 10, fill: GREEN });
      }
      label(s, 280, 44, charging ? "charging: E growing →" :
        discharging ? "discharging: E shrinking ←" : "steady: E not changing",
        { size: 11, fill: charging || discharging ? GREEN : INK });
      label(s, 280, 286, "∮C H·dl = I_c + I_d", { size: 12, fill: INK, mono: true });
    }

    function amp(v) {
      const a = Math.abs(v);
      if (a < 1e-9) return "0 A";
      if (a < 1e-6) return fmt(v * 1e9, 1) + " nA";
      if (a < 1e-3) return fmt(v * 1e6, 1) + " µA";
      return fmt(v * 1e3, 2) + " mA";
    }

    function update() {
      if (!r) return;
      const V = Number(vv.input.value);
      const dVdt = Number(dv.input.value) * 1e6;
      const Id = CAP * dVdt;
      const Jd = Id / AREA;
      const E = V / GAP;

      r.cap.textContent = fmt(CAP * 1e12, 1) + " pF";
      r.id.textContent = amp(Id);
      r.jd.textContent = fmt(Jd * 1e3, 2) + " mA/m²";
      r.e.textContent = fmt(E / 1000, 1) + " kV/m";

      if (dVdt > 0) {
        status.style.color = GREEN;
        status.textContent = "Charging: D grows from the + plate to the − plate, so J_d points with the wire current.";
      } else if (dVdt < 0) {
        status.style.color = RED;
        status.textContent = "Discharging: D still points from + to −, but it is shrinking — J_d reverses.";
      } else {
        status.style.color = INK;
        status.textContent = "Steady voltage: dV/dt = 0, so I_d = 0 even though the field is strong.";
      }
      draw(V, dVdt);
    }
    update();
  }

  /* ============================================================
     4. continuity — current in, current out, charge accumulating
     ============================================================ */
  function continuityViz(root) {
    clear(root);
    const IMAX = 5;
    const ctrl = el("div", { class: "controls" });
    root.appendChild(ctrl);
    const inS = slider(ctrl, {
      label: "I in", min: 0, max: IMAX, step: 0.1, value: 4,
      format: (v) => fmt(v, 1) + " A", width: 140, onInput: () => update()
    });
    const outS = slider(ctrl, {
      label: "I out", min: 0, max: IMAX, step: 0.1, value: 2.5,
      format: (v) => fmt(v, 1) + " A", width: 140, onInput: () => update()
    });

    const s = makeSvg(root, 560, 290, "A volume with current entering and leaving, and charge accumulating");
    const wrap = el("div");
    root.appendChild(wrap);
    const r = readouts(wrap, [
      { label: "I in", id: "in" },
      { label: "I out", id: "out" },
      { label: "Net outward current", id: "flux" },
      { label: "Charge rate", id: "dq" }
    ]);
    const status = el("p", {
      style: { margin: "12px 0 0", fontWeight: "650", fontSize: ".9rem", color: GREEN }
    });
    root.appendChild(status);
    caption(root,
      "Outward normal convention: ∮J·dS = I_out − I_in = −dQ/dt. " +
      "A positive dQ/dt means more charge is arriving than leaving, so Q rises.");

    function draw(iin, iout) {
      clear(s);
      const dQ = iin - iout;
      const x = 220, y = 95, w = 130, h = 95, ox = 28, oy = -22;
      // volume: front and back faces
      path(s, `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`,
        LINE, 2, "6 4");
      path(s, `M ${x + ox} ${y + oy} L ${x + w + ox} ${y + oy} ` +
        `L ${x + w + ox} ${y + h + oy} L ${x + ox} ${y + h + oy} Z`, LINE, 2, "6 4");
      [[x, y], [x + w, y], [x + w, y + h], [x, y + h]].forEach(([px, py]) => {
        s.appendChild(svgEl("line", {
          x1: px, y1: py, x2: px + ox, y2: py + oy,
          stroke: LINE, "stroke-width": 1.3, "stroke-dasharray": "4 4"
        }));
      });
      label(s, x + w / 2 + ox / 2, y + h / 2 + oy / 2, "V",
        { size: 16, fill: BLUE, weight: 700 });
      label(s, x + w / 2 + ox / 2, y + h + 16, "closed surface S", { size: 10, fill: INK });
      // currents
      arrow(s, 55, 120, 214, 120,
        { color: BLUE, width: 1.5 + 2.2 * iin, head: 12 + 2.2 * iin });
      label(s, 130, 106, "I in = " + fmt(iin, 1) + " A", { size: 10, fill: BLUE });
      arrow(s, 380, 165, 500, 165,
        { color: AMBER, width: 1.5 + 2.2 * iout, head: 12 + 2.2 * iout });
      label(s, 442, 151, "I out = " + fmt(iout, 1) + " A", { size: 10, fill: AMBER });
      // charge dots inside the volume
      const color = dQ > 0.001 ? RED : dQ < -0.001 ? BLUE : INK;
      const op = 0.22 + 0.78 * Math.min(1, Math.abs(dQ) / 3);
      for (let ix = 0; ix < 3; ix++) {
        for (let iy = 0; iy < 3; iy++) {
          dot(s, 245 + ix * 38, 122 + iy * 24, 4, color).setAttribute("opacity", op);
        }
      }
      label(s, 285, 88, "charge Q", { size: 10, fill: INK });
      // rate meter
      const mx = 285, my = 235, half = 65;
      s.appendChild(svgEl("line", {
        x1: mx - half, y1: my, x2: mx + half, y2: my, stroke: LINE, "stroke-width": 2
      }));
      s.appendChild(svgEl("line", {
        x1: mx, y1: my - 8, x2: mx, y2: my + 8, stroke: INK, "stroke-width": 1.5
      }));
      const len = (clamp(dQ, -IMAX, IMAX) / IMAX) * half;
      s.appendChild(svgEl("rect", {
        x: len >= 0 ? mx : mx + len, y: my - 6,
        width: Math.abs(len), height: 12, rx: 3,
        fill: dQ > 0.001 ? GREEN : dQ < -0.001 ? RED : LINE
      }));
      label(s, mx, my + 28, "dQ/dt = " + (dQ > 0.001 ? "+" : dQ < -0.001 ? "−" : "") +
        fmt(Math.abs(dQ), 1) + " C/s", { size: 11, fill: INK, mono: true });
      label(s, mx, 280, "∮S J · dS = −dQ/dt", { size: 12, fill: INK, mono: true });
    }

    function update() {
      if (!r) return;
      const iin = Number(inS.input.value);
      const iout = Number(outS.input.value);
      const dQ = iin - iout;
      r.in.textContent = fmt(iin, 1) + " A";
      r.out.textContent = fmt(iout, 1) + " A";
      r.flux.textContent = fmt(iout - iin, 1) + " A";
      r.dq.textContent = (dQ > 0.001 ? "+" : dQ < -0.001 ? "−" : "") +
        fmt(Math.abs(dQ), 1) + " C/s";

      if (dQ > 0.001) {
        status.style.color = GREEN;
        status.textContent = "Q is increasing: I_in > I_out, so the net outward current is negative.";
      } else if (dQ < -0.001) {
        status.style.color = RED;
        status.textContent = "Q is decreasing: I_out > I_in, so charge leaves faster than it arrives.";
      } else {
        status.style.color = INK;
        status.textContent = "Steady state: I_in = I_out, dQ/dt = 0, and the net outward current is zero.";
      }
      draw(iin, iout);
    }
    update();
  }

  document.querySelectorAll('[data-viz="maxwell-map"]').forEach(maxwellMap);
  document.querySelectorAll('[data-viz="faraday"]').forEach(faradayViz);
  document.querySelectorAll('[data-viz="displacement-current"]').forEach(displacementViz);
  document.querySelectorAll('[data-viz="continuity"]').forEach(continuityViz);
})();
