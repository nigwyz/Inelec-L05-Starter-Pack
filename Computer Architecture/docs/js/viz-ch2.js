/* ============================================================
   Chapter 2 visualizations
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
    .arch-svg { width:100%; height:auto; display:block; }
    .arch-svg text { font-family: var(--sans); }
    .blk { fill:#fff; stroke:#c9d2e2; stroke-width:1.6; rx:10; cursor:pointer; }
    .blk:hover { stroke:#2c4b9b; }
    .blk.sel { fill:#e7edfb; stroke:#2c4b9b; stroke-width:2.4; }
    .blbl { font-size:11.5px; font-weight:700; fill:#172033; pointer-events:none; }
    .bsub { font-size:9px; fill:#6b7891; pointer-events:none; }
    .busline { stroke:#8b97ad; stroke-width:5; stroke-linecap:round; }
    .busline.hot { stroke:#2c4b9b; }
    .addr-line { stroke:#c47a12; stroke-width:2; stroke-dasharray:5 4; }
    .regchips { display:flex; flex-wrap:wrap; gap:8px; }
    .regchip { border:1px solid var(--line); border-radius:9px; padding:8px 12px; background:#fff; cursor:pointer; font-weight:700; font-size:.88rem; }
    .regchip:hover, .regchip.sel { border-color:var(--brand); background:var(--brand-soft); }
    .memgrid { display:grid; grid-template-columns:repeat(auto-fill,minmax(82px,1fr)); gap:6px; }
    .memcell { border:1px solid var(--line); border-radius:7px; padding:5px 6px; background:#fff; font-family:var(--mono); font-size:.76rem; text-align:center; }
    .memcell .a { display:block; color:var(--ink-3); font-size:.64rem; }
    .memcell.hot { border-color:var(--brand); background:var(--brand-soft); }
    .memcell.warm { border-color:#e0b76a; background:var(--accent-soft); }
    .devrow { display:flex; flex-wrap:wrap; gap:8px; }
    .dev { border:1px solid var(--line); border-radius:10px; padding:10px 14px; background:#fff; cursor:pointer; font-weight:650; font-size:.86rem; }
    .dev.sel { border-color:var(--brand); background:var(--brand-soft); }
    .dev.off { opacity:.45; }
  `);

  /* ============ VON NEUMANN ============ */
  const vn = $("#viz-vn .viz-body");
  if (vn) {
    const wrap = el("div");
    const ctr = el("div", { class: "controls" });
    const seg = el("div", { class: "seg" });
    const bVN = el("button", { type: "button", class: "on" }, "Von Neumann");
    const bHV = el("button", { type: "button" }, "Harvard");
    seg.append(bVN, bHV);
    ctr.append(seg);
    const svg = el("div");
    const info = el("div", { class: "note", style: "margin-top:12px" });
    wrap.append(ctr, svg, info);
    vn.append(wrap);
    let mode = "vn";
    let selected = "cpu";

    const desc = {
      cpu: ["CPU", "Executes instructions: fetch, decode, operate, write back. Contains registers, ALU, control unit, and the internal bus."],
      mem: ["Memory", "In Von Neumann, one memory holds both instructions and data. The CPU reads an instruction and reads/writes data through the same address and data buses."],
      io: ["I/O", "Peripherals are addressed like memory locations (ports). The CPU reads or writes them with the same bus machinery."],
      bus: ["System bus", "Shared data, address, and control lines. Only one device drives the bus at a time; the rest are in high impedance."],
      pmem: ["Program memory", "Harvard's separate instruction memory. It can be fetched at the same time as a data access."],
      dmem: ["Data memory", "Harvard's separate data memory. Separate buses remove the instruction-fetch vs. data-access conflict."]
    };

    function draw() {
      const isVN = mode === "vn";
      const sel = (k) => (selected === k ? " sel" : "");
      let h = `<svg class="arch-svg" viewBox="0 0 660 370" role="img" aria-label="Architecture diagram">`;

      // CPU (always)
      h += `<rect class="blk${sel("cpu")}" data-k="cpu" x="40" y="70" width="170" height="100" rx="10"/>`;
      h += `<text class="blbl" x="125" y="102" text-anchor="middle">CPU</text>`;
      h += `<text class="bsub" x="125" y="122" text-anchor="middle">registers · ALU · control</text>`;
      h += `<text class="bsub" x="125" y="138" text-anchor="middle">internal bus</text>`;

      if (isVN) {
        // one memory
        h += `<rect class="blk${sel("mem")}" data-k="mem" x="330" y="50" width="250" height="90" rx="10"/>`;
        h += `<text class="blbl" x="455" y="82" text-anchor="middle">Memory</text>`;
        h += `<text class="bsub" x="455" y="100" text-anchor="middle">instructions + data</text>`;
        h += `<text class="bsub" x="455" y="116" text-anchor="middle">one address space</text>`;
        // I/O
        h += `<rect class="blk${sel("io")}" data-k="io" x="420" y="190" width="180" height="70" rx="10"/>`;
        h += `<text class="blbl" x="510" y="218" text-anchor="middle">I/O peripherals</text>`;
        h += `<text class="bsub" x="510" y="236" text-anchor="middle">ports / device addresses</text>`;
        // connectors
        h += `<line class="busline" x1="125" y1="170" x2="125" y2="318"/>`;
        h += `<line class="busline" x1="380" y1="140" x2="380" y2="318"/>`;
        h += `<line class="busline" x1="510" y1="260" x2="510" y2="318"/>`;
      } else {
        // two memories
        h += `<rect class="blk${sel("pmem")}" data-k="pmem" x="300" y="34" width="190" height="76" rx="10"/>`;
        h += `<text class="blbl" x="395" y="62" text-anchor="middle">Program memory</text>`;
        h += `<text class="bsub" x="395" y="80" text-anchor="middle">instructions only</text>`;
        h += `<rect class="blk${sel("dmem")}" data-k="dmem" x="300" y="128" width="190" height="76" rx="10"/>`;
        h += `<text class="blbl" x="395" y="156" text-anchor="middle">Data memory</text>`;
        h += `<text class="bsub" x="395" y="174" text-anchor="middle">data only</text>`;
        // I/O
        h += `<rect class="blk${sel("io")}" data-k="io" x="520" y="128" width="120" height="76" rx="10"/>`;
        h += `<text class="blbl" x="580" y="160" text-anchor="middle">I/O</text>`;
        h += `<text class="bsub" x="580" y="178" text-anchor="middle">ports</text>`;
        // connectors
        h += `<line class="busline" x1="125" y1="170" x2="125" y2="318"/>`;
        h += `<line class="busline" x1="345" y1="110" x2="345" y2="318"/>`;
        h += `<line class="busline" x1="445" y1="204" x2="445" y2="318"/>`;
        h += `<line class="busline" x1="580" y1="204" x2="580" y2="318"/>`;
        // separate buses hint
        h += `<line class="busline" x1="270" y1="72" x2="300" y2="72" stroke-dasharray="3 3"/>`;
        h += `<line class="busline" x1="270" y1="166" x2="300" y2="166" stroke-dasharray="3 3"/>`;
      }

      // bus
      h += `<rect class="blk${sel("bus")}" data-k="bus" x="40" y="318" width="600" height="40" rx="8"/>`;
      h += `<text class="blbl" x="340" y="343" text-anchor="middle">System bus — data · address · control</text>`;

      h += `</svg>`;
      svg.innerHTML = h;
      svg.querySelectorAll(".blk").forEach((b) => {
        b.addEventListener("click", () => { selected = b.dataset.k; draw(); });
      });
      const d = desc[selected] || desc.cpu;
      info.innerHTML = `<strong>${d[0]}. </strong>${d[1]}${!isVN && (selected === "pmem" || selected === "dmem") ? " Harvard splits instruction and data memory, so the CPU can fetch an instruction and access data in the same cycle." : ""}`;
    }

    bVN.addEventListener("click", () => {
      mode = "vn"; bVN.classList.add("on"); bHV.classList.remove("on"); selected = "cpu"; draw();
    });
    bHV.addEventListener("click", () => {
      mode = "hv"; bHV.classList.add("on"); bVN.classList.remove("on"); selected = "cpu"; draw();
    });
    draw();
  }

  /* ============ REGISTER EXPLORER ============ */
  const reg = $("#viz-registers .viz-body");
  if (reg) {
    const wrap = el("div");
    const chips = el("div", { class: "regchips" });
    const info = el("div", { class: "note", style: "margin-top:12px" });
    const list = [
      ["PC", "Program Counter", "Holds the address of the next instruction to fetch. After a fetch, PC already points to the following instruction."],
      ["MAR", "Memory Address Register", "Holds the address presented to memory for the current read or write. PC is copied into MAR at the start of a fetch."],
      ["MBR", "Memory Buffer Register (MDR)", "Holds the data moving between the CPU and memory. After a read, MBR contains the word that was read."],
      ["IR", "Instruction Register", "Holds the instruction currently being decoded and executed. Its width must hold the largest instruction."],
      ["AC", "Accumulator", "Holds an ALU operand and/or the ALU result. Many 8-bit CPUs have an implicit accumulator operand."],
      ["SP", "Stack Pointer", "Holds the address of the top of the stack. PUSH decrements it and POP increments it (on a downward-growing stack)."],
      ["GPR", "General Purpose Registers", "Registers the programmer can use for any data or address. More GPRs mean fewer memory accesses but more instruction bits to name them."],
      ["PSW/F", "Program Status Word / Flags", "Condition codes from the last operation: sign, zero, carry, overflow, plus control bits such as interrupt enable."]
    ];
    list.forEach(([k, name, text], i) => {
      const c = el("div", { class: "regchip" + (i === 0 ? " sel" : "") }, `${k} <span class="small muted">${name}</span>`);
      c.addEventListener("click", () => {
        chips.querySelectorAll(".regchip").forEach((x) => x.classList.remove("sel"));
        c.classList.add("sel");
        info.innerHTML = `<strong>${k} — ${name}. </strong>${text}`;
      });
      chips.append(c);
    });
    info.innerHTML = `<strong>PC — Program Counter. </strong>${list[0][2]}`;
    wrap.append(chips, info);
    reg.append(wrap);
  }

  /* ============ ENDIAN ============ */
  const endian = $("#viz-endian .viz-body");
  if (endian) {
    const wrap = el("div");
    const ctr = el("div", { class: "controls" });
    const inp = el("input", { type: "text", value: "12345678", style: "width:130px", "aria-label": "32-bit hex value" });
    const seg = el("div", { class: "seg" });
    const bLE = el("button", { type: "button", class: "on" }, "Little-endian");
    const bBE = el("button", { type: "button" }, "Big-endian");
    seg.append(bLE, bBE);
    ctr.append(el("label", {}, "32-bit value (hex)"), inp, seg);
    const out = el("div");
    wrap.append(ctr, out);
    endian.append(wrap);
    let mode = "le";

    function render() {
      let v = (inp.value || "0").replace(/[^0-9a-fA-F]/g, "").slice(0, 8).padStart(8, "0");
      inp.value = v.toUpperCase();
      const bytes = v.match(/../g).map((x) => x.toUpperCase());
      // bytes[] index 0 = most significant
      const little = [bytes[3], bytes[2], bytes[1], bytes[0]];
      const big = [bytes[0], bytes[1], bytes[2], bytes[3]];
      const order = mode === "le" ? little : big;
      const base = 0x10;
      let grid = "";
      for (let i = 0; i < 4; i++) {
        const addr = (base + i).toString(16).toUpperCase().padStart(2, "0") + "H";
        grid += `<div class="memcell ${i === 0 ? "hot" : ""}"><span class="a">${addr}</span>${order[i]}</div>`;
      }
      out.innerHTML = `
        <div class="readouts">
          ${box("Mode", mode === "le" ? "Little-endian" : "Big-endian")}
          ${box("Lowest address (10H)", order[0] + "H", mode === "le" ? "least-significant byte" : "most-significant byte")}
          ${box("32-bit value", "0x" + v.toUpperCase())}
        </div>
        <div class="memgrid" style="grid-template-columns:repeat(4,1fr);max-width:430px;margin-top:12px">${grid}</div>
        <p class="small muted" style="margin-top:10px">${mode === "le" ? "Little-endian stores the least-significant byte first. Reading a 16-bit word at 10H gives [11H][10H], i.e. the high byte comes from the higher address." : "Big-endian stores the most-significant byte first. Reading a 16-bit word at 10H gives [10H][11H] in the natural left-to-right order."}</p>`;
    }
    inp.addEventListener("input", render);
    bLE.addEventListener("click", () => { mode = "le"; bLE.classList.add("on"); bBE.classList.remove("on"); render(); });
    bBE.addEventListener("click", () => { mode = "be"; bBE.classList.add("on"); bLE.classList.remove("on"); render(); });
    render();
  }

  /* ============ STACK ============ */
  const stack = $("#viz-stack .viz-body");
  if (stack) {
    const wrap = el("div");
    const ctr = el("div", { class: "controls" });
    const val = el("input", { type: "number", value: 0xAB, min: 0, max: 255, style: "width:90px", "aria-label": "Value for PUSH (0-255)" });
    const push = el("button", { class: "btn btn-primary btn-sm", type: "button" }, "PUSH");
    const pop = el("button", { class: "btn btn-outline btn-sm", type: "button" }, "POP");
    const reset = el("button", { class: "btn btn-outline btn-sm", type: "button" }, "Reset");
    ctr.append(el("label", {}, "Value (decimal)"), val, push, pop, reset);
    const out = el("div");
    const log = el("p", { class: "small muted" });
    wrap.append(ctr, out, log);
    stack.append(wrap);

    let mem = {};
    for (let i = 0; i < 16; i++) mem[0xF0 + i] = 0;
    let sp = 0xFF; // empty stack: SP points one above the top (downward-growing)
    let items = []; // stack contents in push order
    const low = 0xF0, high = 0xFF;

    function render() {
      const cells = [];
      for (let a = low; a <= high; a++) {
        const v = mem[a];
        const isSP = a === sp && items.length > 0;
        const cellClass = isSP ? "hot" : (mem[a] !== 0 ? "warm" : "");
        cells.push(`<div class="memcell ${cellClass}"><span class="a">${a.toString(16).toUpperCase()}H</span>${v.toString(16).toUpperCase().padStart(2, "0")}</div>`);
      }
      out.innerHTML = `
        <div class="readouts">
          ${box("SP", sp.toString(16).toUpperCase() + "H", items.length ? "top of stack" : "empty stack")}
          ${box("[SP]", items.length ? mem[sp].toString(16).toUpperCase().padStart(2, "0") + "H" : "—")}
          ${box("Items", String(items.length))}
        </div>
        <div class="memgrid" style="grid-template-columns:repeat(8,1fr);margin-top:12px">${cells.join("")}</div>
        <div class="table-wrap" style="max-width:360px;margin-top:12px"><table><thead><tr><th>Address</th><th>Content</th><th>Role</th></tr></thead><tbody>
          ${items.slice().reverse().map((it) => `<tr><td>${it.addr.toString(16).toUpperCase()}H</td><td>${it.val.toString(16).toUpperCase().padStart(2, "0")}H</td><td>${it.addr === sp ? "top (SP)" : "saved"}</td></tr>`).join("") || '<tr><td colspan="3" class="muted">empty</td></tr>'}
        </tbody></table></div>`;
    }

    push.addEventListener("click", () => {
      if (sp <= low) { log.textContent = "Stack full in this 16-cell demo."; return; }
      const v = Math.max(0, Math.min(255, parseInt(val.value || "0", 10)));
      sp--;
      mem[sp] = v;
      items.push({ addr: sp, val: v });
      log.textContent = `PUSH ${v.toString(16).toUpperCase().padStart(2, "0")}H: SP decrements first (${sp.toString(16).toUpperCase()}H), then the value is written at [SP].`;
      render();
    });
    pop.addEventListener("click", () => {
      if (!items.length) { log.textContent = "Stack empty — nothing to POP."; return; }
      const it = items.pop();
      log.textContent = `POP: read [${it.addr.toString(16).toUpperCase()}H] = ${it.val.toString(16).toUpperCase().padStart(2, "0")}H, then SP increments.`;
      mem[it.addr] = 0;
      sp = items.length ? items[items.length - 1].addr : high;
      render();
    });
    reset.addEventListener("click", () => {
      mem = {}; for (let i = 0; i < 16; i++) mem[0xF0 + i] = 0;
      sp = 0xFF; items = []; log.textContent = "Reset."; render();
    });
    render();
  }

  /* ============ BUS ============ */
  const bus = $("#viz-bus .viz-body");
  if (bus) {
    const wrap = el("div");
    const out = el("div");
    wrap.append(out);
    bus.append(wrap);
    let owner = "cpu";
    const devices = [
      ["cpu", "CPU", "drives an address and a read/write request"],
      ["mem", "Memory", "responds with data on a read, or accepts data on a write"],
      ["io", "I/O device", "responds like memory, through its own port address"],
      ["dma", "DMA controller", "takes the bus and moves data without the CPU"]
    ];

    function render() {
      out.innerHTML = `
        <div class="devrow">
          ${devices.map(([k, n]) => `<div class="dev ${owner === k ? "sel" : "off"}" data-k="${k}">${n}</div>`).join("")}
        </div>
        <div class="readouts" style="margin-top:14px">
          ${box("Bus owner", devices.find((d) => d[0] === owner)[1])}
          ${box("Others", "high-Z (disconnected)")}
        </div>
        <p class="small muted" style="margin-top:8px">${devices.find((d) => d[0] === owner)[2]}. Because the bus is shared, every other output must be in Z.</p>
        <div class="busbar"><i style="width:${owner === "dma" ? 60 : 100}%"></i></div>`;
      out.querySelectorAll(".dev").forEach((d) => {
        d.addEventListener("click", () => { owner = d.dataset.k; render(); });
      });
    }
    render();
  }

  /* ============ FETCH/EXECUTE STEPPER ============ */
  const fetch = $("#viz-fetch .viz-body");
  if (fetch) {
    const wrap = el("div");
    const stepsBar = el("div", { class: "steps" });
    const panel = el("div");
    const note = el("p", { class: "small muted" });
    wrap.append(stepsBar, panel, note);
    fetch.append(wrap);

    const steps = [
      { name: "1. Fetch #1", pc: 0x301, mar: 0x300, mbr: 0x1940, ir: 0x1940, ac: null, text: "MAR ← PC = 300H. Memory read: MBR ← [300H] = 1940H. IR ← 1940H. PC ← 301H." },
      { name: "2. Execute #1", pc: 0x301, mar: 0x300, mbr: 0x1940, ir: 0x1940, ac: 0x0003, text: "Decode IR: opcode 1H = LOAD, address 940H. AC ← [940H] = 0003H." },
      { name: "3. Fetch #2", pc: 0x302, mar: 0x301, mbr: 0x5941, ir: 0x5941, ac: 0x0003, text: "MAR ← 301H. MBR ← [301H] = 5941H. IR ← 5941H. PC ← 302H." },
      { name: "4. Execute #2", pc: 0x302, mar: 0x301, mbr: 0x5941, ir: 0x5941, ac: 0x0005, text: "Decode: opcode 5H = ADD, address 941H. AC ← AC + [941H] = 0003H + 0002H = 0005H." },
      { name: "5. Fetch #3", pc: 0x303, mar: 0x302, mbr: 0x2941, ir: 0x2941, ac: 0x0005, text: "MAR ← 302H. MBR ← [302H] = 2941H. IR ← 2941H. PC ← 303H." },
      { name: "6. Execute #3", pc: 0x303, mar: 0x302, mbr: 0x2941, ir: 0x2941, ac: 0x0005, text: "Decode: opcode 2H = STORE, address 941H. [941H] ← AC = 0005H. Memory location 941H is now 0005H." },
      { name: "7. Fetch #4", pc: 0x304, mar: 0x303, mbr: 0x7940, ir: 0x7940, ac: 0x0005, text: "MAR ← 303H. MBR ← [303H] = 7940H. IR ← 7940H. PC ← 304H." },
      { name: "8. Execute #4", pc: 0x304, mar: 0x303, mbr: 0x7940, ir: 0x7940, ac: 0x0005, text: "Decode: opcode 7H = HALT. Execution stops. Final AC = 0005H, and [941H] = 0005H." }
    ];
    let idx = 0;

    function render() {
      stepsBar.innerHTML = "";
      steps.forEach((s, i) => {
        const b = el("button", { type: "button", class: i === idx ? "on" : "" }, s.name);
        b.addEventListener("click", () => { idx = i; render(); });
        stepsBar.append(b);
      });
      const s = steps[idx];
      const regs = [
        ["PC", s.pc, "Program Counter"],
        ["MAR", s.mar, "memory address"],
        ["MBR", s.mbr, "memory data"],
        ["IR", s.ir, "instruction"],
        ["AC", s.ac === null ? "—" : s.ac, "accumulator"]
      ];
      panel.innerHTML = `<div class="step-panel"><div class="ph">${s.name}</div><div class="pb">
        ${regs.map(([n, v, sub]) => `<div class="reg"><span class="n">${n}</span><span class="v">${v === "—" ? "—" : v.toString(16).toUpperCase().padStart(n === "MAR" || n === "PC" ? 3 : 4, "0") + "H"}</span><span class="done-meta">${sub}</span></div>`).join("")}
      </div></div>`;
      note.textContent = s.text;
    }
    render();
  }

  /* ============ MIPS CALCULATOR ============ */
  const mips = $("#viz-mips .viz-body");
  if (mips) {
    const wrap = el("div");
    const freq = el("input", { type: "number", value: 2, step: 0.1, style: "width:90px", "aria-label": "Clock frequency in GHz" });
    const rows = el("div");
    const out = el("div");
    const add = el("button", { class: "btn btn-outline btn-sm", type: "button" }, "+ add instruction class");
    const head = el("div", { class: "controls" });
    head.append(el("label", {}, "Clock (GHz)"), freq);
    wrap.append(head, rows, add, out);
    mips.append(wrap);

    let classes = [
      { count: 100, cpi: 4 },
      { count: 60, cpi: 7 },
      { count: 40, cpi: 10 }
    ];

    function render() {
      rows.innerHTML = "";
      classes.forEach((c, i) => {
        const r = el("div", { class: "controls" });
        const ci = el("input", { type: "number", value: c.count, min: 0, style: "width:100px", "aria-label": "Instruction count" });
        const pi = el("input", { type: "number", value: c.cpi, min: 0, step: 0.1, style: "width:80px", "aria-label": "CPI" });
        const del = el("button", { class: "btn btn-outline btn-sm", type: "button" }, "×");
        ci.addEventListener("input", () => { c.count = +ci.value || 0; calc(); });
        pi.addEventListener("input", () => { c.cpi = +pi.value || 0; calc(); });
        del.addEventListener("click", () => { classes.splice(i, 1); render(); });
        r.append(el("label", {}, "instructions"), ci, el("label", {}, "CPI"), pi, del);
        rows.append(r);
      });
      calc();
    }
    function calc() {
      const total = classes.reduce((t, c) => t + c.count, 0);
      const cycles = classes.reduce((t, c) => t + c.count * c.cpi, 0);
      const cpi = total ? cycles / total : 0;
      const ghz = +freq.value || 0;
      const mipsVal = cpi ? (ghz * 1000) / cpi : 0; // GHz*1e9 / (CPI*1e6) = GHz*1000/CPI
      out.innerHTML = `
        <div class="readouts">
          ${box("Total instructions", String(total))}
          ${box("Total cycles", String(cycles))}
          ${box("CPI average", cpi.toFixed(3))}
          ${box("MIPS", mipsVal.toFixed(1), "at " + ghz + " GHz")}
        </div>
        <pre><code>CPI = ${classes.map((c) => `(${c.count}/${total || 1})×${c.cpi}`).join(" + ")} = ${cpi.toFixed(3)}
MIPS = ${ghz}×10^9 / (${cpi.toFixed(3)}×10^6) = ${mipsVal.toFixed(1)}</code></pre>`;
    }
    freq.addEventListener("input", calc);
    add.addEventListener("click", () => { classes.push({ count: 0, cpi: 1 }); render(); });
    render();
  }
})();
