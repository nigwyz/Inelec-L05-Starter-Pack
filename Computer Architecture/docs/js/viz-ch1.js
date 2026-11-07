/* ============================================================
   Chapter 1 visualizations
   ============================================================ */
(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function el(tag, attrs, html) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === "style") e.style.cssText = attrs[k];
      else if (k === "class") e.className = attrs[k];
      else if (k.startsWith("data-")) e.setAttribute(k, attrs[k]);
      else e[k] = attrs[k];
    }
    if (html != null) e.innerHTML = html;
    return e;
  }

  function box(label, value, extra) {
    return `<div class="readout"><span class="lab">${label}</span><span class="val">${value}</span>${extra ? `<span class="done-meta">${extra}</span>` : ""}</div>`;
  }

  function appendStyle(css) {
    const s = document.createElement("style");
    s.textContent = css;
    document.head.appendChild(s);
  }

  appendStyle(`
    .viz-svg { width:100%; height:auto; display:block; }
    .viz-svg text { font-family: var(--mono); }
    .wire { stroke:#8b97ad; stroke-width:2.5; fill:none; }
    .wire.on { stroke:#2c4b9b; stroke-width:3.5; }
    .node { fill:#fff; stroke:#8b97ad; stroke-width:2; }
    .node.on { fill:#e7edfb; stroke:#2c4b9b; }
    .gate-label { font-family:var(--sans); font-size:11px; font-weight:700; fill:#46536b; }
    .gate-value { font-family:var(--mono); font-size:13px; font-weight:800; fill:#172033; }
    .flag { display:flex; gap:6px; flex-wrap:wrap; margin-top:10px; }
    .flag span { border:1px solid var(--line); border-radius:8px; padding:6px 10px; font-size:.82rem; font-weight:700; background:#fff; }
    .flag span.on { background:var(--good-soft); border-color:#8fcfae; color:var(--good); }
    .flag span.off { color:var(--ink-3); }
    .busbar { height:10px; border-radius:99px; background:#dbe2ee; margin:14px 0; position:relative; }
    .busbar i { position:absolute; inset:0; border-radius:99px; background:linear-gradient(90deg,#2c4b9b,#5e8bff); width:0; transition:width .25s; }
    .wave { font-family:var(--mono); font-size:12px; }
    .cmp-table td { font-family:var(--mono); text-align:center; }
    .cmp-table td:first-child { text-align:left; font-family:var(--sans); }
    .chip { border:1px solid var(--line); border-radius:10px; padding:10px 14px; background:#fff; }
    .chip.on { background:var(--brand-soft); border-color:#b9caf7; }
    .flow { display:flex; align-items:center; gap:8px; flex-wrap:wrap; font-size:.86rem; font-weight:650; }
    .flow .a { background:var(--surface-2); border-radius:8px; padding:6px 10px; }
    .flow .arrow { color:var(--ink-3); }
  `);

  /* ============ 1. BIT LAB ============ */
  const bitlab = $("#viz-bitlab .viz-body");
  if (bitlab) {
    let bits = [0, 1, 0, 1, 0, 0, 1, 1]; // 0x53
    const weights = [128, 64, 32, 16, 8, 4, 2, 1];
    const wrap = el("div");
    const row = el("div", { class: "bits" });
    const out = el("div", { class: "readouts" });
    wrap.append(row, out);
    bitlab.append(wrap);

    function render() {
      row.innerHTML = "";
      bits.forEach((b, i) => {
        const pos = 7 - i;
        const cell = el("div", { class: "bit" + (pos === 7 ? " msb" : "") + (pos === 0 ? " lsb" : "") });
        const btn = el("button", { type: "button", "aria-label": "Toggle bit " + pos }, String(b));
        btn.addEventListener("click", () => { bits[i] ^= 1; render(); });
        cell.append(btn, el("span", { class: "p" }, "bit " + pos), el("span", { class: "w" }, String(weights[i])));
        row.append(cell);
      });
      const u = bits.reduce((t, b, i) => t + b * weights[i], 0);
      const s = bits[0] ? u - 256 : u;
      const terms = bits.map((b, i) => b ? weights[i] : null).filter(Boolean);
      out.innerHTML =
        box("Binary", bits.join("")) +
        box("Hex", "0x" + u.toString(16).toUpperCase().padStart(2, "0")) +
        box("Unsigned", String(u)) +
        box("Two’s complement", String(s)) +
        box("Sum", terms.length ? terms.join(" + ") + " = " + u : "0");
    }
    render();

    const presets = el("div", { class: "controls" });
    [["53H", 0x53], ["E2H", 0xE2], ["FFH", 0xFF], ["00H", 0]].forEach(([name, val]) => {
      const b = el("button", { class: "btn btn-outline btn-sm", type: "button" }, name);
      b.addEventListener("click", () => {
        bits = [7, 6, 5, 4, 3, 2, 1, 0].map((p) => (val >> p) & 1);
        render();
      });
      presets.append(b);
    });
    bitlab.prepend(presets);
  }

  /* ============ 2. FLAGS LAB ============ */
  const flags = $("#viz-flags .viz-body");
  if (flags) {
    const wrap = el("div");
    const ctr = el("div", { class: "controls" });
    const aIn = el("input", { type: "number", min: 0, max: 255, value: 0x53, "aria-label": "Operand A" });
    const bIn = el("input", { type: "number", min: 0, max: 255, value: 0x35, "aria-label": "Operand B" });
    const op = el("select", { "aria-label": "Operation" });
    op.innerHTML = '<option value="add">A + B</option><option value="sub">A − B</option>';
    ctr.append(el("label", {}, "A (decimal 0–255)"), aIn, el("label", {}, "B"), bIn, el("label", {}, "Operation"), op);
    const out = el("div");
    wrap.append(ctr, out);
    flags.append(wrap);

    function compute() {
      const a = Math.max(0, Math.min(255, parseInt(aIn.value || "0", 10)));
      const b = Math.max(0, Math.min(255, parseInt(bIn.value || "0", 10)));
      aIn.value = a; bIn.value = b;
      const isSub = op.value === "sub";
      const bb = isSub ? ((b ^ 0xFF) + 1) & 0xFF : b;
      let sum = a + bb;
      const carry = sum > 0xFF;
      let res = sum & 0xFF;

      // overflow for signed add/sub
      const sa = a >= 128 ? a - 256 : a;
      const sb0 = b >= 128 ? b - 256 : b;
      const sb = isSub ? -sb0 : sb0;
      const signedRes = isSub ? sa - sb0 : sa + sb0;
      const overflow = signedRes < -128 || signedRes > 127;

      const zero = res === 0;
      const sign = (res & 0x80) !== 0;
      const hex = (n) => n.toString(16).toUpperCase().padStart(2, "0");

      const carryExplain = isSub
        ? "For subtraction, the adder computes A + B̄ + 1. Carry = 1 means no borrow was needed."
        : "Carry = 1 means the unsigned sum exceeded 255.";

      out.innerHTML =
        `<div class="readouts">
          ${box("Result (hex)", hex(res) + "H")}
          ${box("Result (binary)", res.toString(2).padStart(8, "0"))}
          ${box("Result unsigned", String(res))}
          ${box("Result signed", String(res >= 128 ? res - 256 : res))}
          ${box("True arithmetic", String(isSub ? a - b : a + b))}
        </div>
        <div class="flag">
          <span class="${carry ? "on" : "off"}">Carry ${carry ? 1 : 0}</span>
          <span class="${overflow ? "on" : "off"}">Overflow ${overflow ? 1 : 0}</span>
          <span class="${zero ? "on" : "off"}">Zero ${zero ? 1 : 0}</span>
          <span class="${sign ? "on" : "off"}">Sign ${sign ? 1 : 0}</span>
        </div>
        <p class="small muted" style="margin-top:10px">${carryExplain} Overflow is about <em>signed</em> range: adding two same-sign numbers and getting the opposite sign. Its mathematical cause is carry-in ≠ carry-out of the MSB.</p>`;
    }
    aIn.addEventListener("input", compute);
    bIn.addEventListener("input", compute);
    op.addEventListener("change", compute);
    compute();
  }

  /* ============ 3. TWO'S COMPLEMENT ============ */
  const tc = $("#viz-2c .viz-body");
  if (tc) {
    const wrap = el("div");
    const ctr = el("div", { class: "controls" });
    const width = el("select");
    width.innerHTML = '<option value="4">4 bits</option><option value="8" selected>8 bits</option><option value="12">12 bits</option><option value="16">16 bits</option>';
    const val = el("input", { type: "number", value: -30, step: 1, "aria-label": "Signed value" });
    const sign = el("span", { class: "small muted" }, "range updates with width");
    ctr.append(el("label", {}, "Width"), width, el("label", {}, "Signed value"), val, sign);
    const out = el("div");
    wrap.append(ctr, out);
    tc.append(wrap);

    function render() {
      const n = parseInt(width.value, 10);
      const min = -(2 ** (n - 1));
      const max = 2 ** (n - 1) - 1;
      let v = parseInt(val.value || "0", 10);
      if (v < min) { v = min; val.value = v; }
      if (v > max) { v = max; val.value = v; }
      sign.textContent = `range ${min} … ${max}`;
      const mask = 2 ** n - 1;
      const raw = v & mask;
      const bin = raw.toString(2).padStart(n, "0");
      const hex = raw.toString(16).toUpperCase().padStart(n / 4, "0");
      const groups = bin.replace(/(.{4})(?=.)/g, "$1 ");

      // show inversion steps for negative numbers
      let steps = "";
      if (v < 0) {
        const pos = (-v) & mask;
        const inv = (~pos & mask);
        steps = `<pre><code>Step 1  +${-v} in ${n} bits : ${pos.toString(2).padStart(n, "0")}
Step 2  invert           : ${inv.toString(2).padStart(n, "0")}
Step 3  add 1            : ${raw.toString(2).padStart(n, "0")}  = ${hex}H</code></pre>`;
      } else {
        steps = `<pre><code>Positive values use ordinary binary.
${n} bits, value ${v} = ${bin} = ${hex}H</code></pre>`;
      }

      out.innerHTML =
        `<div class="readouts">
          ${box("Binary", groups)}
          ${box("Hex", hex + "H")}
          ${box("Unsigned reading", String(raw))}
          ${box("Signed reading", String(v))}
        </div>${steps}`;
    }
    width.addEventListener("change", render);
    val.addEventListener("input", render);
    render();
  }

  /* ============ 4. NOISE MARGIN ============ */
  const noise = $("#viz-noise .viz-body");
  if (noise) {
    const wrap = el("div");
    const ctr = el("div", { class: "controls" });
    const mk = (label, id, val, min, max, step) => {
      const l = el("label", {}, label);
      const i = el("input", { type: "number", id, value: val, min, max, step, style: "width:82px" });
      return { l, i };
    };
    const vol = mk("V_OL", "n-vol", 0.26, 0, 5, 0.01);
    const voh = mk("V_OH", "n-voh", 4.48, 0, 5, 0.01);
    const vil = mk("V_IL", "n-vil", 1.0, 0, 5, 0.01);
    const vih = mk("V_IH", "n-vih", 3.5, 0, 5, 0.01);
    ctr.append(vol.l, vol.i, voh.l, voh.i, vil.l, vil.i, vih.l, vih.i);
    const svgWrap = el("div");
    const out = el("div");
    wrap.append(ctr, svgWrap, out);
    noise.append(wrap);

    function render() {
      const VOL = +vol.i.value, VOH = +voh.i.value, VIL = +vil.i.value, VIH = +vih.i.value;
      const nmL = VIL - VOL;
      const nmH = VOH - VIH;
      const W = 700, H = 280, top = 24, bottom = 230;
      const y = (v) => bottom - (v / 5) * (bottom - top);
      const bar = (x, w, y1, y2, fill) => `<rect x="${x}" y="${Math.min(y1,y2)}" width="${w}" height="${Math.abs(y2-y1)}" fill="${fill}" rx="4"/>`;
      const level = (v, color, label) =>
        `<line x1="175" y1="${y(v)}" x2="545" y2="${y(v)}" stroke="${color}" stroke-dasharray="5 4"/>
         <text x="555" y="${y(v) + 4}" font-size="11" fill="${color}" font-weight="700">${label} ${v.toFixed(2)}V</text>`;
      svgWrap.innerHTML = `
        <svg class="viz-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Voltage levels and noise margins">
          <!-- axis -->
          <line x1="34" y1="${top}" x2="34" y2="${bottom}" stroke="#c9d2e2"/>
          ${[0,1,2,3,4,5].map((v) => `<line x1="30" y1="${y(v)}" x2="38" y2="${y(v)}" stroke="#c9d2e2"/><text x="8" y="${y(v)+4}" font-size="10" fill="#6b7891">${v}V</text>`).join("")}

          <!-- forbidden band -->
          <rect x="175" y="${y(VIH)}" width="370" height="${Math.abs(y(VIL)-y(VIH))}" fill="#f3c3bf" opacity=".28" rx="4"/>
          <text x="360" y="${(y(VIH)+y(VIL))/2 + 4}" font-size="10" fill="#b3261e" text-anchor="middle">forbidden region — receiver need not decide</text>

          <!-- output column -->
          ${bar(55, 44, y(0), y(VOL), "#b7dcc7")}
          ${bar(55, 44, y(VOH), y(5), "#c3d3f7")}
          <text x="77" y="${bottom + 26}" font-size="10" fill="#46536b" text-anchor="middle">output</text>

          <!-- input column -->
          ${bar(110, 44, y(0), y(VIL), "#d6edde")}
          ${bar(110, 44, y(VIH), y(5), "#dbe5fb")}
          <text x="132" y="${bottom + 26}" font-size="10" fill="#46536b" text-anchor="middle">input</text>

          <!-- levels -->
          ${level(VOL, "#1f7a4d", "V_OL")}
          ${level(VIL, "#1f7a4d", "V_IL")}
          ${level(VIH, "#2c4b9b", "V_IH")}
          ${level(VOH, "#2c4b9b", "V_OH")}

          <!-- margin arrows -->
          <line x1="175" y1="${y(VOL)}" x2="175" y2="${y(VIL)}" stroke="#1f7a4d" stroke-width="2"/>
          <line x1="171" y1="${y(VOL)}" x2="179" y2="${y(VOL)}" stroke="#1f7a4d" stroke-width="2"/>
          <line x1="171" y1="${y(VIL)}" x2="179" y2="${y(VIL)}" stroke="#1f7a4d" stroke-width="2"/>
          <line x1="175" y1="${y(VIH)}" x2="175" y2="${y(VOH)}" stroke="#2c4b9b" stroke-width="2"/>
          <line x1="171" y1="${y(VIH)}" x2="179" y2="${y(VIH)}" stroke="#2c4b9b" stroke-width="2"/>
          <line x1="171" y1="${y(VOH)}" x2="179" y2="${y(VOH)}" stroke="#2c4b9b" stroke-width="2"/>
        </svg>`;
      out.innerHTML =
        `<div class="readouts">
          ${box("NM_L = V_IL − V_OL", nmL.toFixed(2) + " V")}
          ${box("NM_H = V_OH − V_IH", nmH.toFixed(2) + " V")}
          ${box("Noise margin (min)", Math.min(nmL, nmH).toFixed(2) + " V")}
        </div>`;
    }
    [vol.i, voh.i, vil.i, vih.i].forEach((i) => i.addEventListener("input", render));
    render();
  }

  /* ============ 5. GATES ============ */
  const gates = $("#viz-gates .viz-body");
  if (gates) {
    const wrap = el("div");
    const ctr = el("div", { class: "controls" });
    const sel = el("select");
    ["AND", "OR", "NAND", "NOR", "XOR", "NOT"].forEach((g) => {
      const o = el("option", { value: g }, g);
      sel.append(o);
    });
    const aBtn = el("button", { class: "btn btn-outline btn-sm", type: "button" }, "A = 0");
    const bBtn = el("button", { class: "btn btn-outline btn-sm", type: "button" }, "B = 0");
    ctr.append(el("label", {}, "Gate"), sel, aBtn, bBtn);
    const out = el("div");
    wrap.append(ctr, out);
    gates.append(wrap);
    let a = 0, b = 0;

    function calc(g, a, b) {
      switch (g) {
        case "AND": return a & b;
        case "OR": return a | b;
        case "NAND": return (a & b) ^ 1;
        case "NOR": return (a | b) ^ 1;
        case "XOR": return a ^ b;
        case "NOT": return a ^ 1;
      }
    }
    function render() {
      const g = sel.value;
      aBtn.textContent = "A = " + a;
      bBtn.textContent = "B = " + b;
      const y = calc(g, a, b);
      let table = "";
      if (g === "NOT") {
        table = `<table class="cmp-table"><thead><tr><th>A</th><th>Y</th></tr></thead><tbody>
          ${[0,1].map((x) => `<tr style="${x === a ? "background:var(--brand-soft);font-weight:700" : ""}"><td>${x}</td><td>${calc(g,x,0)}</td></tr>`).join("")}
        </tbody></table>`;
      } else {
        table = `<table class="cmp-table"><thead><tr><th>A</th><th>B</th><th>Y</th></tr></thead><tbody>
          ${[[0,0],[0,1],[1,0],[1,1]].map(([x,z]) => `<tr style="${x === a && z === b ? "background:var(--brand-soft);font-weight:700" : ""}"><td>${x}</td><td>${z}</td><td>${calc(g,x,z)}</td></tr>`).join("")}
        </tbody></table>`;
      }
      out.innerHTML = `
        <div class="readouts">
          ${box(g + "(A,B)", String(y))}
          ${box("A", String(a))}
          ${box("B", String(b))}
        </div>
        <div class="table-wrap" style="max-width:280px">${table}</div>`;
    }
    sel.addEventListener("change", render);
    aBtn.addEventListener("click", () => { a ^= 1; render(); });
    bBtn.addEventListener("click", () => { b ^= 1; render(); });
    render();
  }

  /* ============ 6. MUX ============ */
  const mux = $("#viz-mux .viz-body");
  if (mux) {
    const wrap = el("div");
    const ctr = el("div", { class: "controls" });
    const inputs = [1, 0, 1, 1];
    const btns = inputs.map((v, i) => {
      const b = el("button", { class: "btn btn-outline btn-sm", type: "button" }, `I${i} = ${v}`);
      b.addEventListener("click", () => {
        inputs[i] ^= 1;
        b.textContent = `I${i} = ${inputs[i]}`;
        render();
      });
      ctr.append(b);
      return b;
    });
    const s0 = el("button", { class: "btn btn-outline btn-sm", type: "button" }, "S0 = 0");
    const s1 = el("button", { class: "btn btn-outline btn-sm", type: "button" }, "S1 = 0");
    ctr.append(s0, s1);
    const out = el("div");
    wrap.append(ctr, out);
    mux.append(wrap);
    let sel0 = 0, sel1 = 0;

    function render() {
      s0.textContent = "S0 = " + sel0;
      s1.textContent = "S1 = " + sel1;
      const idx = (sel1 << 1) | sel0;
      out.innerHTML = `
        <div class="readouts">
          ${box("Select bits (S1 S0)", sel1 + "" + sel0)}
          ${box("Selected input", "I" + idx)}
          ${box("Y", String(inputs[idx]))}
        </div>
        <p class="small muted">Y = S1̅·S0̅·I0 + S1̅·S0·I1 + S1·S0̅·I2 + S1·S0·I3</p>`;
    }
    s0.addEventListener("click", () => { sel0 ^= 1; render(); });
    s1.addEventListener("click", () => { sel1 ^= 1; render(); });
    render();
  }

  /* ============ 7. TRI-STATE ============ */
  const tri = $("#viz-tristate .viz-body");
  if (tri) {
    const wrap = el("div");
    const ctr = el("div", { class: "controls" });
    const en = el("button", { class: "btn btn-outline btn-sm", type: "button" }, "Enable = 0");
    const din = el("button", { class: "btn btn-outline btn-sm", type: "button" }, "Input = 0");
    ctr.append(en, din);
    const out = el("div");
    wrap.append(ctr, out);
    tri.append(wrap);
    let e = 0, d = 0;
    let timeline = [];

    function render() {
      en.textContent = "Enable = " + e;
      din.textContent = "Input = " + d;
      const o = e ? "Z" : String(d);
      timeline.push(o);
      if (timeline.length > 14) timeline.shift();
      out.innerHTML = `
        <div class="flow">
          <span class="a">input ${d}</span><span class="arrow">→</span>
          <span class="a" style="border:1px solid var(--line)">tri-state</span><span class="arrow">→</span>
          <span class="a" style="background:${o === "Z" ? "#fdf3e0" : "#e5f5ec"}">bus: ${o}</span>
        </div>
        <div class="busbar"><i style="width:${o === "Z" ? 0 : 100}%"></i></div>
        <div class="readouts">
          ${box("Enable", String(e))}
          ${box("Input", String(d))}
          ${box("Output", o)}
        </div>
        <p class="small muted">Output history: ${timeline.join(" · ")}</p>
        ${o === "Z" ? '<div class="note" style="margin-top:10px"><strong>Z = high impedance.</strong> The buffer is electrically disconnected, so another device may drive the bus.</div>' : ""}`;
    }
    en.addEventListener("click", () => { e ^= 1; render(); });
    din.addEventListener("click", () => { d ^= 1; render(); });
    render();
  }

  /* ============ 8. FULL ADDER ============ */
  const adder = $("#viz-adder .viz-body");
  if (adder) {
    const wrap = el("div");
    const ctr = el("div", { class: "controls" });
    let A = 1, B = 1, C = 0;
    const ab = el("button", { class: "btn btn-outline btn-sm", type: "button" }, "A = 1");
    const bb = el("button", { class: "btn btn-outline btn-sm", type: "button" }, "B = 1");
    const cb = el("button", { class: "btn btn-outline btn-sm", type: "button" }, "Cin = 0");
    ctr.append(ab, bb, cb);
    const out = el("div");
    wrap.append(ctr, out);
    adder.append(wrap);

    function render() {
      ab.textContent = "A = " + A;
      bb.textContent = "B = " + B;
      cb.textContent = "Cin = " + C;
      const S = A ^ B ^ C;
      const Cout = (A & B) | (C & (A ^ B));
      out.innerHTML = `
        <div class="readouts">
          ${box("Sum S", String(S))}
          ${box("Carry out", String(Cout))}
          ${box("A + B + Cin", String(A + B + C))}
          ${box("Binary result", Cout.toString() + S.toString())}
        </div>
        <p class="small muted">S = A ⊕ B ⊕ Cin &nbsp;·&nbsp; Cout = A·B + Cin·(A ⊕ B)</p>`;
    }
    ab.addEventListener("click", () => { A ^= 1; render(); });
    bb.addEventListener("click", () => { B ^= 1; render(); });
    cb.addEventListener("click", () => { C ^= 1; render(); });
    render();
  }

  /* ============ 9. D FLIP-FLOP ============ */
  const dff = $("#viz-dff .viz-body");
  if (dff) {
    const wrap = el("div");
    const ctr = el("div", { class: "controls" });
    const dbtn = el("button", { class: "btn btn-outline btn-sm", type: "button" }, "D = 0");
    const clk = el("button", { class: "btn btn-primary btn-sm", type: "button" }, "Clock edge ↑");
    const rst = el("button", { class: "btn btn-outline btn-sm", type: "button" }, "Reset");
    ctr.append(dbtn, clk, rst);
    const out = el("div");
    wrap.append(ctr, out);
    dff.append(wrap);
    let D = 0, Q = 0;
    // each entry is an event; edge=true only when a rising clock edge occurred
    const history = [{ d: 0, q: 0, edge: false }];

    function wave(row, values, y, color) {
      const stepW = 46, x0 = 74, hi = y, lo = y + 22;
      let d = `M ${x0} ${values[0] ? hi : lo}`;
      values.forEach((v, i) => {
        const x = x0 + i * stepW;
        if (i === 0) d = `M ${x} ${v ? hi : lo}`;
        else d += ` L ${x} ${v ? hi : lo}`;
        d += ` L ${x + stepW} ${v ? hi : lo}`;
      });
      return `<path d="${d}" fill="none" stroke="${color}" stroke-width="2.4"/>`;
    }

    function render() {
      dbtn.textContent = "D = " + D;
      const ds = history.map((h) => h.d);
      const qs = history.map((h) => h.q);
      const W = 90 + history.length * 46;
      const rows = [
        ["CLK", ds, "#6b7891"],
        ["D", ds, "#c47a12"],
        ["Q", qs, "#2c4b9b"]
      ];
      let svg = `<svg class="viz-svg" viewBox="0 0 ${W} 150" role="img" aria-label="DFF timing diagram" style="max-height:190px">`;
      rows.forEach(([name, vals, color], ri) => {
        const y = 20 + ri * 44;
        svg += `<text x="12" y="${y + 16}" font-size="11" font-weight="700" fill="#46536b">${name}</text>`;
        if (name !== "CLK") svg += wave(name, vals, y, color);
        if (name === "CLK") {
          // baseline low across all events, with a pulse only where an edge occurred
          const x0 = 74;
          svg += `<line x1="${x0}" y1="${y + 22}" x2="${x0 + history.length * 46}" y2="${y + 22}" stroke="#6b7891" stroke-width="2.4"/>`;
          history.forEach((h, i) => {
            const x = x0 + i * 46;
            if (!h.edge) return;
            svg += `<line x1="${x}" y1="${y + 22}" x2="${x + 12}" y2="${y + 22}" stroke="#6b7891" stroke-width="2.4"/>`;
            svg += `<line x1="${x + 12}" y1="${y + 22}" x2="${x + 12}" y2="${y}" stroke="#6b7891" stroke-width="2.4"/>`;
            svg += `<line x1="${x + 12}" y1="${y}" x2="${x + 28}" y2="${y}" stroke="#6b7891" stroke-width="2.4"/>`;
            svg += `<line x1="${x + 28}" y1="${y}" x2="${x + 28}" y2="${y + 22}" stroke="#6b7891" stroke-width="2.4"/>`;
            svg += `<line x1="${x + 28}" y1="${y + 22}" x2="${x + 46}" y2="${y + 22}" stroke="#6b7891" stroke-width="2.4"/>`;
            svg += `<text x="${x + 20}" y="${y - 4}" font-size="8" fill="#b3261e" text-anchor="middle">↑</text>`;
          });
        }
      });
      svg += `</svg>`;
      out.innerHTML = `
        <div class="readouts">
          ${box("D input", String(D))}
          ${box("Q output", String(Q))}
          ${box("Q̄", String(Q ^ 1))}
        </div>
        ${svg}
        <p class="small muted">Each arrow is a rising clock edge. Q takes the value of D <em>at that instant</em>; between edges, Q holds. The old Q is replaced.</p>`;
    }
    dbtn.addEventListener("click", () => {
      D ^= 1;
      history.push({ d: D, q: Q, edge: false });
      if (history.length > 8) history.shift();
      render();
    });
    clk.addEventListener("click", () => {
      Q = D;
      history.push({ d: D, q: Q, edge: true });
      if (history.length > 8) history.shift();
      render();
    });
    rst.addEventListener("click", () => {
      Q = 0;
      history.length = 0;
      history.push({ d: D, q: Q, edge: false });
      render();
    });
    render();
  }

  /* ============ 10. CMOS ============ */
  const cmos = $("#viz-cmos .viz-body");
  if (cmos) {
    const wrap = el("div");
    const ctr = el("div", { class: "controls" });
    const sel = el("select");
    sel.innerHTML = '<option value="inv">Inverter</option><option value="nand">NAND</option><option value="nor">NOR</option>';
    const aBtn = el("button", { class: "btn btn-outline btn-sm", type: "button" }, "A = 0");
    const bBtn = el("button", { class: "btn btn-outline btn-sm", type: "button" }, "B = 0");
    ctr.append(el("label", {}, "Gate"), sel, aBtn, bBtn);
    const out = el("div");
    wrap.append(ctr, out);
    cmos.append(wrap);
    let a = 0, b = 0;

    function tbox(x, y, type, on, label) {
      const fill = on ? (type === "P" ? "#dbe5fb" : "#d6edde") : "#f6f7fb";
      const stroke = on ? (type === "P" ? "#3f6ad1" : "#1f7a4d") : "#c9d2e2";
      const name = type === "P" ? "PMOS" : "NMOS";
      return `<rect x="${x}" y="${y}" width="70" height="30" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="1.8"/>
        <text x="${x + 28}" y="${y + 19}" text-anchor="middle" font-size="9.5" font-weight="800" fill="${on ? (type === "P" ? "#2c4b9b" : "#1f7a4d") : "#6b7891"}">${name}</text>
        ${label ? `<text x="${x + 58}" y="${y + 19}" text-anchor="middle" font-size="9" font-weight="700" fill="#6b7891">${label}</text>` : ""}`;
    }
    function rail(x1, y1, x2, y2, color) {
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color || "#8b97ad"}" stroke-width="2.5"/>`;
    }

    function render() {
      const g = sel.value;
      aBtn.textContent = "A = " + a;
      bBtn.textContent = "B = " + b;
      bBtn.style.opacity = g === "inv" ? .35 : 1;

      let Y, pOn = [], nOn = [], note;
      if (g === "inv") {
        Y = a ^ 1;
        pOn = [a === 0]; nOn = [a === 1];
        note = a === 0 ? "A = 0 → PMOS ON, NMOS OFF → output pulled to VDD = 1." : "A = 1 → PMOS OFF, NMOS ON → output pulled to ground = 0.";
      } else if (g === "nand") {
        Y = (a & b) ^ 1;
        pOn = [a === 0, b === 0];     // either PMOS can pull up
        nOn = [a === 1 && b === 1, a === 1 && b === 1]; // series: both must conduct
        note = Y === 1 ? "At least one input is 0 → one PMOS conducts → output high." : "Both inputs are 1 → both series NMOS conduct → output low.";
      } else {
        Y = (a | b) ^ 1;
        pOn = [a === 0 && b === 0, a === 0 && b === 0]; // series: both must conduct
        nOn = [a === 1, b === 1];                        // parallel: either can pull down
        note = Y === 1 ? "Both inputs are 0 → both series PMOS conduct → output high." : "At least one input is 1 → a parallel NMOS conducts → output low.";
      }

      let s = `<svg class="viz-svg" viewBox="0 0 560 310" role="img" aria-label="CMOS ${g} schematic" style="max-height:330px">
        <text x="12" y="26" font-size="10" font-weight="700" fill="#6b7891">VDD</text>
        ${rail(40, 32, 400, 32, "#2c4b9b")}
        ${rail(40, 286, 400, 286, "#6b7891")}
        <text x="12" y="290" font-size="10" font-weight="700" fill="#6b7891">GND</text>`;

      if (g === "inv") {
        s += tbox(120, 55, "P", pOn[0], "");
        s += tbox(120, 190, "N", nOn[0], "");
        s += rail(155, 32, 155, 55);
        s += rail(155, 85, 155, 190);
        s += rail(155, 220, 155, 286);
        s += rail(155, 137, 330, 137);
        s += `<circle cx="155" cy="137" r="3.2" fill="#8b97ad"/>`;
        s += `<text x="338" y="141" font-size="12" font-weight="800" fill="#172033">Y</text>`;
        s += rail(90, 70, 120, 70);
        s += rail(90, 205, 120, 205);
        s += rail(70, 70, 70, 205);
        s += `<text x="56" y="141" font-size="12" font-weight="800" fill="#172033">A</text>`;
      } else if (g === "nand") {
        s += tbox(90, 55, "P", pOn[0], "1");
        s += tbox(200, 55, "P", pOn[1], "2");
        s += tbox(145, 160, "N", nOn[0], "1");
        s += tbox(145, 215, "N", nOn[1], "2");
        s += rail(125, 32, 125, 55); s += rail(235, 32, 235, 55);
        s += rail(125, 85, 125, 130); s += rail(235, 85, 235, 130); s += rail(125, 130, 235, 130);
        s += rail(180, 130, 180, 160);
        s += rail(180, 190, 180, 215);
        s += rail(180, 245, 180, 286);
        s += rail(235, 130, 320, 130);
        s += `<text x="328" y="134" font-size="12" font-weight="800" fill="#172033">Y</text>`;
        // gate A
        s += rail(55, 70, 90, 70); s += rail(55, 175, 145, 175); s += rail(55, 70, 55, 175);
        s += `<text x="40" y="128" font-size="12" font-weight="800" fill="#172033">A</text>`;
        // gate B
        s += rail(270, 70, 340, 70); s += rail(340, 70, 340, 230); s += rail(215, 230, 340, 230);
        s += `<text x="348" y="154" font-size="12" font-weight="800" fill="#172033">B</text>`;
      } else {
        s += tbox(145, 55, "P", pOn[0], "1");
        s += tbox(145, 110, "P", pOn[1], "2");
        s += tbox(90, 200, "N", nOn[0], "1");
        s += tbox(200, 200, "N", nOn[1], "2");
        s += rail(180, 32, 180, 55);
        s += rail(180, 85, 180, 110);
        s += rail(180, 140, 180, 170);
        s += rail(125, 170, 235, 170);
        s += rail(125, 170, 125, 200);
        s += rail(235, 170, 235, 200);
        s += rail(125, 230, 125, 286); s += rail(235, 230, 235, 286);
        s += rail(235, 170, 320, 170);
        s += `<text x="328" y="174" font-size="12" font-weight="800" fill="#172033">Y</text>`;
        // gate A
        s += rail(50, 70, 145, 70); s += rail(50, 215, 90, 215); s += rail(50, 70, 50, 215);
        s += `<text x="36" y="146" font-size="12" font-weight="800" fill="#172033">A</text>`;
        // gate B (route outside the output line)
        s += rail(215, 125, 400, 125); s += rail(400, 125, 400, 215); s += rail(270, 215, 400, 215);
        s += `<text x="408" y="160" font-size="12" font-weight="800" fill="#172033">B</text>`;
      }

      s += `</svg>`;
      out.innerHTML = `
        <div class="readouts">
          ${box("A", String(a))}
          ${box("B", g === "inv" ? "—" : String(b))}
          ${box("Gate", g.toUpperCase())}
          ${box("Output Y", String(Y))}
        </div>
        ${s}
        <p class="small muted">${note} Blue = PMOS (conducts when its gate is 0); green = NMOS (conducts when its gate is 1). On a real schematic the PMOS network is the dual of the NMOS network.</p>`;
    }
    sel.addEventListener("change", render);
    aBtn.addEventListener("click", () => { a ^= 1; render(); });
    bBtn.addEventListener("click", () => { if (sel.value === "inv") return; b ^= 1; render(); });
    render();
  }
})();
