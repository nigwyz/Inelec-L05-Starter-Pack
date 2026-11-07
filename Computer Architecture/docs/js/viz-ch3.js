/* ============================================================
   Chapter 3 visualizations
   ============================================================ */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);

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
  const box = (l, v, s) => `<div class="readout"><span class="lab">${l}</span><span class="val">${v}</span>${s ? `<span class="done-meta">${s}</span>` : ""}</div>`;

  function style(css) {
    const s = document.createElement("style");
    s.textContent = css;
    document.head.appendChild(s);
  }
  style(`
    .cpu-svg { width:100%; height:auto; display:block; }
    .cpu-svg text { font-family: var(--sans); }
    .cblk { fill:#fff; stroke:#c9d2e2; stroke-width:1.6; rx:9; cursor:pointer; }
    .cblk:hover { stroke:#2c4b9b; }
    .cblk.sel { fill:#e7edfb; stroke:#2c4b9b; stroke-width:2.4; }
    .clbl { font-size:11px; font-weight:750; fill:#172033; pointer-events:none; }
    .csub { font-size:8.5px; fill:#6b7891; pointer-events:none; }
    .clink { stroke:#8b97ad; stroke-width:3; fill:none; }
    .clink.hot { stroke:#2c4b9b; }
    .state { cursor:pointer; }
    .state circle { fill:#fff; stroke:#c9d2e2; stroke-width:1.8; }
    .state.on circle { fill:#e7edfb; stroke:#2c4b9b; stroke-width:2.6; }
    .state.dim { opacity:.3; }
    .state text { font-family:var(--sans); font-size:9.5px; font-weight:750; fill:#172033; pointer-events:none; }
    .state .sub { font-size:7.4px; font-weight:500; fill:#6b7891; }
    .st-arrow { stroke:#c9d2e2; stroke-width:1.6; fill:none; marker-end:url(#arrow); }
    .timeline-wrap { border:1px solid var(--line); border-radius:12px; overflow:hidden; }
    .tl-row { display:grid; grid-template-columns:110px 1fr; border-bottom:1px solid var(--line); }
    .tl-row:last-child { border-bottom:0; }
    .tl-name { padding:9px 12px; font-size:.82rem; font-weight:700; background:var(--surface-2); }
    .tl-track { position:relative; height:34px; background:repeating-linear-gradient(90deg,#f4f6fa 0 9.9%,#e9edf5 9.9% 10%); }
    .tl-bar { position:absolute; top:7px; height:20px; border-radius:5px; font-size:.68rem; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; }
    .tl-cursor { position:absolute; top:0; bottom:0; width:2px; background:#b3261e; }
  `);

  /* ============ CPU ORGANIZATION ============ */
  const org = $("#viz-cpuorg .viz-body");
  if (org) {
    const wrap = el("div");
    const svg = el("div");
    const info = el("div", { class: "note", style: "margin-top:12px" });
    wrap.append(svg, info);
    org.append(wrap);
    let sel = "reg";
    const desc = {
      reg: ["Registers", "Fast internal storage: PC, IR, MAR, MBR, AC, SP, flags, and general-purpose registers. They hold the state the CPU is working on."],
      alu: ["ALU", "Performs arithmetic and logic. Its result goes to a destination register or memory, and its condition outputs update the flags."],
      cu: ["Control unit", "Fetches and decodes instructions and asserts the internal control signals that move data and select ALU operations."],
      bus: ["Internal bus", "Connects the registers, ALU, and control unit inside the CPU. Only one source drives it at a time."],
      ext: ["System bus", "Connects the CPU to memory and I/O. Address, data, and control lines leave the chip here."]
    };

    function draw() {
      const s = (k) => (sel === k ? " sel" : "");
      svg.innerHTML = `
        <svg class="cpu-svg" viewBox="0 0 620 330" role="img" aria-label="CPU internal structure">
          <rect x="18" y="18" width="584" height="252" rx="14" fill="#fbfcfe" stroke="#dde3ed"/>
          <text x="34" y="40" font-size="10" fill="#6b7891" font-weight="700">CPU</text>

          <rect class="cblk${s("reg")}" data-k="reg" x="40" y="58" width="180" height="86" rx="9"/>
          <text class="clbl" x="130" y="84" text-anchor="middle">Registers</text>
          <text class="csub" x="130" y="100" text-anchor="middle">PC · IR · MAR · MBR</text>
          <text class="csub" x="130" y="114" text-anchor="middle">AC · SP · flags · GPRs</text>

          <rect class="cblk${s("cu")}" data-k="cu" x="40" y="170" width="180" height="76" rx="9"/>
          <text class="clbl" x="130" y="196" text-anchor="middle">Control unit</text>
          <text class="csub" x="130" y="212" text-anchor="middle">decode · sequence · control</text>
          <text class="csub" x="130" y="226" text-anchor="middle">signals</text>

          <rect class="cblk${s("alu")}" data-k="alu" x="290" y="58" width="150" height="86" rx="9"/>
          <text class="clbl" x="365" y="86" text-anchor="middle">ALU</text>
          <text class="csub" x="365" y="104" text-anchor="middle">arithmetic · logic</text>
          <text class="csub" x="365" y="118" text-anchor="middle">flags out</text>

          <rect class="cblk${s("bus")}" data-k="bus" x="250" y="170" width="230" height="42" rx="8"/>
          <text class="clbl" x="365" y="196" text-anchor="middle">Internal bus</text>

          <rect class="cblk${s("ext")}" data-k="ext" x="500" y="58" width="84" height="154" rx="9"/>
          <text class="clbl" x="542" y="126" text-anchor="middle" transform="rotate(90 542 126)">System bus</text>

          <line class="clink" x1="220" y1="100" x2="290" y2="100"/>
          <line class="clink" x1="220" y1="208" x2="250" y2="196"/>
          <line class="clink" x1="310" y1="144" x2="330" y2="170"/>
          <line class="clink" x1="480" y1="191" x2="500" y2="180"/>
          <line class="clink" x1="220" y1="120" x2="250" y2="182"/>

          <text x="34" y="296" font-size="9" fill="#6b7891">The control unit tells every other block what to do; data flows along the internal bus.</text>
        </svg>`;
      svg.querySelectorAll(".cblk").forEach((b) => {
        b.addEventListener("click", () => { sel = b.dataset.k; draw(); });
      });
      const d = desc[sel];
      info.innerHTML = `<strong>${d[0]}. </strong>${d[1]}`;
    }
    draw();
  }

  /* ============ INSTRUCTION CYCLE STATES ============ */
  const states = $("#viz-states .viz-body");
  if (states) {
    const wrap = el("div");
    const ctr = el("div", { class: "controls" });
    const sel = el("select");
    const options = [
      ["load", "LOAD A,30H  (direct memory read)"],
      ["addImm", "ADD A,30H  (immediate)"],
      ["jump", "JUMP 200H  (control flow)"],
      ["store", "STORE 30H,A  (memory write)"],
      ["incMem", "INC (HL)  (read-modify-write)"],
      ["indirect", "LOAD A,(30H)  (indirect)"]
    ];
    options.forEach(([v, t]) => sel.append(el("option", { value: v }, t)));
    ctr.append(el("label", {}, "Instruction"), sel);
    const svg = el("div");
    const info = el("div", { class: "note", style: "margin-top:10px" });
    wrap.append(ctr, svg, info);
    states.append(wrap);

    const paths = {
      load: ["IAC", "IF", "IOD", "OAC", "OF"],
      addImm: ["IAC", "IF", "IOD", "DO"],
      jump: ["IAC", "IF", "IOD"],
      store: ["IAC", "IF", "IOD", "OAC", "DO", "OS"],
      incMem: ["IAC", "IF", "IOD", "OAC", "OF", "DO", "OS"],
      indirect: ["IAC", "IF", "IOD", "OAC", "OF", "OF"]
    };
    const names = {
      IAC: "Instruction address calculation",
      IF: "Instruction fetch",
      IOD: "Instruction operation decoding",
      OAC: "Operand address calculation",
      OF: "Operand fetch",
      DO: "Data operation",
      OS: "Operand store"
    };
    const order = ["IAC", "IF", "IOD", "OAC", "OF", "DO", "OS"];
    // positions on an arc
    const pos = {
      IAC: [80, 70], IF: [200, 40], IOD: [330, 70], OAC: [450, 130],
      OF: [390, 200], DO: [240, 220], OS: [100, 180]
    };

    function draw() {
      const active = paths[sel.value];
      const counts = {};
      active.forEach((k) => { counts[k] = (counts[k] || 0) + 1; });

      let arrows = "";
      // generic cycle arrows
      const seq = ["IAC", "IF", "IOD", "OAC", "OF", "DO", "OS"];
      for (let i = 0; i < seq.length - 1; i++) {
        const a = pos[seq[i]], b = pos[seq[i + 1]];
        arrows += `<line class="st-arrow" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`;
      }
      arrows += `<line class="st-arrow" x1="${pos.OS[0]}" y1="${pos.OS[1]}" x2="${pos.IAC[0]}" y2="${pos.IAC[1]}"/>`;

      let nodes = "";
      order.forEach((k) => {
        const [x, y] = pos[k];
        const on = counts[k] ? " on" : " dim";
        nodes += `<g class="state${on}" data-k="${k}">
          <circle cx="${x}" cy="${y}" r="34"/>
          <text x="${x}" y="${y - 2}" text-anchor="middle">${k}</text>
          <text class="sub" x="${x}" y="${y + 10}" text-anchor="middle">${counts[k] > 1 ? "×" + counts[k] : ""}</text>
        </g>`;
      });

      svg.innerHTML = `<svg class="cpu-svg" viewBox="0 0 540 270" role="img" aria-label="Instruction cycle states">
        <defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#c9d2e2"/>
        </marker></defs>
        ${arrows}${nodes}
      </svg>`;

      const p = paths[sel.value];
      const countsText = Object.entries(counts).map(([k, v]) => v > 1 ? `${k}×${v}` : k).join(" → ");
      info.innerHTML = `<strong>${p.join(" → ")}</strong><br><span class="small">${p.map((k) => `${k} = ${names[k]}`).join(" · ")}</span>${Object.values(counts).some((v) => v > 1) ? "<br><span class='small muted'>A repeated state means an extra memory access—this is the indirect cycle.</span>" : ""}`;
    }
    sel.addEventListener("change", draw);
    draw();
  }

  /* ============ INTERRUPT CYCLE ============ */
  const intr = $("#viz-interrupt .viz-body");
  if (intr) {
    const wrap = el("div");
    const bar = el("div", { class: "steps" });
    const panel = el("div");
    const note = el("p", { class: "small muted" });
    wrap.append(bar, panel, note);
    intr.append(wrap);
    const steps = [
      ["1. Check", "At the end of the current instruction, the CPU samples the interrupt request line. It never interrupts mid-instruction."],
      ["2. Save", "Push the return address (PC) onto the stack. The stack pointer decreases by 2. Many CPUs also save flags and registers."],
      ["3. Vector", "Load PC with the ISR start address. Vectored: fixed by hardware. Non-vectored: supplied by the device or calculated."],
      ["4. ISR", "Execute the interrupt service routine. The main program is suspended but its state is safe on the stack."],
      ["5. Return", "Restore the context (pop PC and flags). The interrupted program continues as if nothing happened."]
    ];
    let i = 0;
    function render() {
      bar.innerHTML = "";
      steps.forEach((s, k) => {
        const b = el("button", { type: "button", class: k === i ? "on" : "" }, s[0]);
        b.addEventListener("click", () => { i = k; render(); });
        bar.append(b);
      });
      panel.innerHTML = `<div class="step-panel"><div class="ph">${steps[i][0]}</div><div class="pb" style="display:block"><p style="margin:0">${steps[i][1]}</p></div></div>`;
      note.textContent = i === 2 ? "In Z80 IM2, the vector is a pointer: PC = [I×256 + device_data]." : "";
    }
    render();
  }

  /* ============ NESTED INTERRUPTS ============ */
  const nested = $("#viz-nested .viz-body");
  if (nested) {
    const wrap = el("div");
    const ctr = el("div", { class: "controls" });
    const play = el("button", { class: "btn btn-primary btn-sm", type: "button" }, "Play sequence");
    const reset = el("button", { class: "btn btn-outline btn-sm", type: "button" }, "Reset");
    ctr.append(play, reset);
    const out = el("div");
    wrap.append(ctr, out);
    nested.append(wrap);
    let t = 0;
    let timer = null;

    // Correct priority schedule for: printer 2 at t=10, comms 5 at t=15, disk 4 at t=20.
    // Higher-priority arrival preempts; when an ISR finishes, the highest-priority
    // pending routine (including the preempted one) runs next.
    const schedule = {
      user:    [[0, 10], [40, 50]],
      printer: [[10, 15], [35, 40]],
      comms:   [[15, 25]],
      disk:    [[25, 35]]
    };
    const max = 50;
    const colors = { user: "#94a3b8", printer: "#2c4b9b", comms: "#b3261e", disk: "#1f7a4d" };
    const labels = { user: "user", printer: "printer", comms: "comms", disk: "disk" };
    const rowDefs = [
      ["User program", "user"],
      ["Printer (prio 2)", "printer"],
      ["Comms (prio 5)", "comms"],
      ["Disk (prio 4)", "disk"]
    ];

    function render() {
      let html = '<div class="timeline-wrap">';
      rowDefs.forEach(([name, key]) => {
        html += `<div class="tl-row"><div class="tl-name">${name}</div><div class="tl-track">`;
        schedule[key].forEach(([a, b]) => {
          const left = (a / max) * 100, width = ((b - a) / max) * 100;
          html += `<div class="tl-bar" style="left:${left}%;width:${width}%;background:${colors[key]}">${width > 6 ? labels[key] : ""}</div>`;
        });
        html += `<div class="tl-cursor" style="left:${(Math.min(t, max) / max) * 100}%"></div>`;
        html += `</div></div>`;
      });
      html += `</div>
        <div class="readouts" style="margin-top:12px">
          ${box("Time", String(Math.min(t, max)))}
          ${box("Highest pending", t < 10 ? "—" : t < 15 ? "printer (2)" : t < 20 ? "comms (5)" : t < 25 ? "comms (5)" : t < 35 ? "disk (4)" : t < 40 ? "printer (2)" : "—")}
          ${box("Running", (function () {
            for (const k of ["user", "printer", "comms", "disk"]) {
              for (const [a, b] of schedule[k]) if (t >= a && t < b) return k;
            }
            return "—";
          })())}
        </div>
        <p class="small muted" style="margin-top:8px">Printer starts at 10 and is preempted at 15 by communications (priority 5). Disk (4) arrives at 20 but waits for comms. At 25 the highest-priority pending work is the disk, so it runs 25–35; the printer resumes 35–40.</p>`;
      out.innerHTML = html;
    }

    play.addEventListener("click", () => {
      if (timer) clearInterval(timer);
      t = 0; render();
      timer = setInterval(() => {
        t++;
        render();
        if (t >= max) { clearInterval(timer); timer = null; }
      }, 110);
    });
    reset.addEventListener("click", () => { if (timer) clearInterval(timer); t = 0; render(); });
    render();
  }

  /* ============ Z80 ENCODER ============ */
  const enc = $("#viz-encoder .viz-body");
  if (enc) {
    const wrap = el("div");
    const ctr = el("div", { class: "controls" });
    const sel = el("select");
    const opts = [
      ["ldrs", "LD R,S (register to register)"],
      ["ldrn", "LD R,(IX+n)"],
      ["ldnr", "LD (IX+n),R"],
      ["ldixnn", "LD IX,nn"],
      ["ldixmm", "LD IX,(nn)"],
      ["jr", "JR n"],
      ["jrz", "JR Z,n"],
      ["addn", "ADD A,n"],
      ["addhl", "ADD A,(HL)"],
      ["adds", "ADD A,S"],
      ["incmem", "INC (HL)"],
      ["pop", "POP HL"]
    ];
    opts.forEach(([v, t]) => sel.append(el("option", { value: v }, t)));
    ctr.append(el("label", {}, "Instruction"), sel);
    const extra = el("span");
    ctr.append(extra);
    const out = el("div");
    wrap.append(ctr, out);
    enc.append(wrap);

    const codes = { A: 7, B: 0, C: 1, D: 2, E: 3, H: 4, L: 5 };

    function compute() {
      const k = sel.value;
      const hex2 = (n) => n.toString(16).toUpperCase().padStart(2, "0");
      let bytes = [], desc = "", size = 0, bin = "";

      if (k === "ldrs") {
        bytes = [0x40 | (codes.A << 3) | codes.B];
        desc = "01 RRR SSS — A = 111, B = 000 → 01 111 000 = 78H";
        size = 1; bin = "01 111 000";
      } else if (k === "ldrn") {
        bytes = [0xDD, 0x46, 0x05];
        desc = "DD 01 RRR 110 + n. For R = B (000), n = 5: DD 46 05H";
        size = 3; bin = "11011101 01000110 00000101";
      } else if (k === "ldnr") {
        bytes = [0xDD, 0x70, 0x05];
        desc = "DD 01110 SSS + n. For S = B (000), n = 5: DD 70 05H";
        size = 3; bin = "11011101 01110000 00000101";
      } else if (k === "ldixnn") {
        bytes = [0xDD, 0x21, 0x00, 0x30];
        desc = "DD 21 + nn little-endian. For nn = 3000H: DD 21 00 30H";
        size = 4; bin = "11011101 00100001 00000000 00110000";
      } else if (k === "ldixmm") {
        bytes = [0xDD, 0x2A, 0x48, 0x23];
        desc = "DD 2A + nn little-endian. For nn = 2348H: DD 2A 48 23H";
        size = 4; bin = "11011101 00101010 01001000 00100011";
      } else if (k === "jr") {
        bytes = [0x18, 0xFB];
        desc = "18 + n. For n = −5: 18 FBH (FB = two's complement of −5)";
        size = 2; bin = "00011000 11111011";
      } else if (k === "jrz") {
        bytes = [0x28, 0xFB];
        desc = "28 + n. For n = −5: 28 FBH";
        size = 2; bin = "00101000 11111011";
      } else if (k === "addn") {
        bytes = [0xC6, 0xFF];
        desc = "C6 + n. For n = −1: C6 FFH";
        size = 2; bin = "11000110 11111111";
      } else if (k === "addhl") {
        bytes = [0x86];
        desc = "86H = ADD A,(HL)";
        size = 1; bin = "10000110";
      } else if (k === "adds") {
        bytes = [0x84];
        desc = "10000 SSS. For S = H (100): 10000100 = 84H";
        size = 1; bin = "10000100";
      } else if (k === "incmem") {
        bytes = [0x34];
        desc = "34H = INC (HL)";
        size = 1; bin = "00110100";
      } else if (k === "pop") {
        bytes = [0xE1];
        desc = "E1H = POP HL";
        size = 1; bin = "11100001";
      }

      const hex = bytes.map(hex2).join(" ") + "H";
      out.innerHTML = `
        <div class="readouts">
          ${box("Size", size + " byte" + (size > 1 ? "s" : ""))}
          ${box("Hex", hex)}
        </div>
        <p class="small muted" style="margin-top:10px">${desc}</p>
        <pre><code>${bin}
= ${hex}</code></pre>`;
    }
    sel.addEventListener("change", compute);
    compute();
  }

  /* ============ Z80 TRACE ============ */
  const trace = $("#viz-z80trace .viz-body");
  if (trace) {
    const wrap = el("div");
    const bar = el("div", { class: "steps" });
    const panel = el("div");
    const note = el("p", { class: "small muted" });
    wrap.append(bar, panel, note);
    trace.append(wrap);

    const steps = [
      { n: "1. Fetch DD", pc: 0x2001, mar: 0x2000, mbr: 0xDD, ir: 0xDD, ix: 0x0000, text: "MAR ← PC = 2000H. MBR ← [2000H] = DDH. IR ← DD. PC ← 2001H." },
      { n: "2. Fetch 21", pc: 0x2002, mar: 0x2001, mbr: 0x21, ir: 0xDD21, ix: 0x0000, text: "MAR ← 2001H. MBR ← [2001H] = 21H. IR ← DD21H. PC ← 2002H." },
      { n: "3. Operand 00", pc: 0x2003, mar: 0x2002, mbr: 0x00, ir: 0xDD21, ix: 0x0000, text: "MAR ← 2002H. MBR ← [2002H] = 00H. This is the low byte of nn. PC ← 2003H." },
      { n: "4. Operand 30", pc: 0x2004, mar: 0x2003, mbr: 0x30, ir: 0xDD21, ix: 0x0000, text: "MAR ← 2003H. MBR ← [2003H] = 30H. The 16-bit operand is 3000H (little-endian). PC ← 2004H." },
      { n: "5. Execute", pc: 0x2004, mar: 0x2003, mbr: 0x30, ir: 0xDD21, ix: 0x3000, text: "Decode DD21H = LD IX,nn. IX ← 3000H. The instruction is 4 bytes and consumed four fetch cycles." }
    ];
    let i = 0;
    function render() {
      bar.innerHTML = "";
      steps.forEach((s, k) => {
        const b = el("button", { type: "button", class: k === i ? "on" : "" }, s.n);
        b.addEventListener("click", () => { i = k; render(); });
        bar.append(b);
      });
      const s = steps[i];
      const fmt = (v, w) => v.toString(16).toUpperCase().padStart(w, "0") + "H";
      panel.innerHTML = `<div class="step-panel"><div class="ph">${s.n}</div><div class="pb">
        <div class="reg"><span class="n">PC</span><span class="v">${fmt(s.pc, 4)}</span><span class="done-meta">next instruction</span></div>
        <div class="reg"><span class="n">MAR</span><span class="v">${fmt(s.mar, 4)}</span><span class="done-meta">address</span></div>
        <div class="reg"><span class="n">MBR</span><span class="v">${fmt(s.mbr, 2)}</span><span class="done-meta">last byte read</span></div>
        <div class="reg"><span class="n">IR</span><span class="v">${fmt(s.ir, 4)}</span><span class="done-meta">instruction</span></div>
        <div class="reg"><span class="n">IX</span><span class="v">${fmt(s.ix, 4)}</span><span class="done-meta">index register</span></div>
      </div></div>`;
      note.textContent = s.text;
    }
    render();
  }
})();
