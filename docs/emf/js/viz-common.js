/* ============================================================
   EE361 EMF — shared visual helpers
   Vanilla JS. No dependencies.
   ============================================================ */
(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";

  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v === null || v === undefined || v === false) continue;
        if (k === "text") node.textContent = v;
        else if (k === "html") node.innerHTML = v;
        else if (k === "class") node.className = v;
        else if (k === "style" && typeof v === "object") Object.assign(node.style, v);
        else if (k === "on" && typeof v === "object") {
          for (const [ev, fn] of Object.entries(v)) node.addEventListener(ev, fn);
        } else if (k === "dataset" && typeof v === "object") Object.assign(node.dataset, v);
        else node.setAttribute(k, v);
      }
    }
    for (const c of children.flat()) {
      if (c === null || c === undefined || c === false) continue;
      node.appendChild(typeof c === "string" || typeof c === "number"
        ? document.createTextNode(String(c)) : c);
    }
    return node;
  }

  function svgEl(tag, attrs) {
    const node = document.createElementNS(NS, tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v === null || v === undefined || v === false) continue;
        if (k === "text") node.textContent = v;
        else node.setAttribute(k, v);
      }
    }
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
    return node;
  }

  function fmt(n, digits) {
    if (!isFinite(n)) return "—";
    const d = digits === undefined ? 2 : digits;
    let s = n.toFixed(d);
    if (s === "-0" || s === "-0.0" || s === "-0.00") s = s.slice(1);
    return s;
  }

  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  const deg = (r) => (r * 180) / Math.PI;
  const rad = (d) => (d * Math.PI) / 180;

  /** Arrow with a manually drawn head (no marker id collisions). */
  function arrow(parent, x1, y1, x2, y2, opts) {
    const o = Object.assign({
      color: "#2c4b9b", width: 2, head: 9, dash: null, opacity: 1, class: ""
    }, opts || {});
    const g = svgEl("g", { class: o.class, opacity: o.opacity });
    const line = svgEl("line", {
      x1, y1, x2, y2, stroke: o.color, "stroke-width": o.width,
      "stroke-linecap": "round",
      "stroke-dasharray": o.dash || null
    });
    g.appendChild(line);
    const a = Math.atan2(y2 - y1, x2 - x1);
    const h = o.head;
    const bx = x2 - h * Math.cos(a);
    const by = y2 - h * Math.sin(a);
    const nx = -Math.sin(a) * h * 0.42;
    const ny = Math.cos(a) * h * 0.42;
    g.appendChild(svgEl("path", {
      d: `M ${x2} ${y2} L ${bx + nx} ${by + ny} L ${bx - nx} ${by - ny} Z`,
      fill: o.color
    }));
    parent.appendChild(g);
    return g;
  }

  function label(parent, x, y, text, opts) {
    const o = Object.assign({
      size: 11, fill: "#46536b", anchor: "middle", weight: 500, mono: false, class: ""
    }, opts || {});
    const t = svgEl("text", {
      x, y, "text-anchor": o.anchor, "font-size": o.size, fill: o.fill,
      "font-weight": o.weight, class: o.class,
      "font-family": o.mono ? "\"DejaVu Sans\", ui-monospace, monospace" : "system-ui, sans-serif"
    });
    t.textContent = text;
    parent.appendChild(t);
    return t;
  }

  function controlRow(parent) {
    const row = el("div", { class: "controls" });
    parent.appendChild(row);
    return row;
  }

  /**
   * slider(row, {label, min, max, step, value, format, onInput})
   * Returns { input, valueEl, set }.
   */
  function slider(parent, opts) {
    const o = Object.assign({
      label: "value", min: 0, max: 10, step: 1, value: 0,
      format: (v) => String(v), onInput: null, width: 150
    }, opts || {});
    const wrap = el("label", { style: { display: "inline-flex", gap: "8px", alignItems: "center" } });
    wrap.appendChild(document.createTextNode(o.label + " "));
    const input = el("input", {
      type: "range", min: o.min, max: o.max, step: o.step, value: o.value,
      style: { width: o.width + "px", accentColor: "#2c4b9b" },
      "aria-label": o.label
    });
    const out = el("span", { class: "mono", style: { minWidth: "58px", fontSize: ".82rem", color: "#46536b" } });
    out.textContent = o.format(Number(o.value));
    input.addEventListener("input", () => {
      const v = Number(input.value);
      out.textContent = o.format(v);
      if (o.onInput) o.onInput(v);
    });
    wrap.appendChild(input);
    wrap.appendChild(out);
    parent.appendChild(wrap);
    return { input, valueEl: out, set(v) { input.value = v; out.textContent = o.format(v); } };
  }

  /** Segmented control. options: [{value,label}] or ["a","b"]. */
  function seg(parent, options, initial, onChange) {
    const group = el("div", { class: "seg", role: "group" });
    const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
    const buttons = [];
    let current = initial === undefined ? (opts[0] && opts[0].value) : initial;
    function show(v) {
      current = v;
      buttons.forEach((b) => b.classList.toggle("on", b.dataset.value === v));
      if (onChange) onChange(v);
    }
    opts.forEach((o) => {
      const b = el("button", {
        type: "button", dataset: { value: o.value }, text: o.label,
        on: { click: () => show(o.value) }
      });
      buttons.push(b);
      group.appendChild(b);
    });
    parent.appendChild(group);
    show(current);
    return { group, show, get value() { return current; } };
  }

  /** Readout grid. items: [{label, value, id}] -> returns map of value spans. */
  function readouts(parent, items) {
    const grid = el("div", { class: "readouts" });
    const out = {};
    items.forEach((it) => {
      const box = el("div", { class: "readout" });
      box.appendChild(el("span", { class: "lab", text: it.label }));
      const val = el("span", { class: "val", text: it.value === undefined ? "—" : it.value });
      box.appendChild(val);
      if (it.id) out[it.id] = val;
      grid.appendChild(box);
    });
    parent.appendChild(grid);
    return out;
  }

  function readout(parent, label, value) {
    const box = el("div", { class: "readout" });
    box.appendChild(el("span", { class: "lab", text: label }));
    const val = el("span", { class: "val", text: value === undefined ? "—" : value });
    box.appendChild(val);
    parent.appendChild(box);
    return val;
  }

  function note(parent, text, cls) {
    const box = el("div", { class: cls || "note" });
    box.innerHTML = text;
    parent.appendChild(box);
    return box;
  }

  /** Project 3D (x,y,z) to 2D isometric-ish screen coordinates. */
  function project3(x, y, z, opts) {
    const o = Object.assign({ scale: 1, cx: 0, cy: 0 }, opts || {});
    // x to the right-down, y to the right-up, z up
    const sx = (x - y) * 0.86;
    const sy = (x + y) * 0.42 - z;
    return { x: o.cx + sx * o.scale, y: o.cy + sy * o.scale };
  }

  function makeSvg(root, w, h, aria) {
    const s = svgEl("svg", {
      class: "viz-svg", viewBox: `0 0 ${w} ${h}`, role: "img",
      "aria-label": aria || "interactive diagram"
    });
    root.appendChild(s);
    return s;
  }

  function axis(s, x1, y1, x2, y2, color) {
    const g = svgEl("g");
    g.appendChild(svgEl("line", {
      x1, y1, x2, y2, stroke: color || "#c3ccdc", "stroke-width": 1.2
    }));
    s.appendChild(g);
    return g;
  }

  function dot(parent, x, y, r, color) {
    const c = svgEl("circle", { cx: x, cy: y, r: r || 3, fill: color || "#2c4b9b" });
    parent.appendChild(c);
    return c;
  }

  function grid(s, w, h, step, color) {
    const g = svgEl("g", { opacity: 0.55 });
    for (let x = step; x < w; x += step) {
      g.appendChild(svgEl("line", { x1: x, y1: 0, x2: x, y2: h, stroke: color || "#e6ebf4", "stroke-width": 1 }));
    }
    for (let y = step; y < h; y += step) {
      g.appendChild(svgEl("line", { x1: 0, y1: y, x2: w, y2: y, stroke: color || "#e6ebf4", "stroke-width": 1 }));
    }
    s.appendChild(g);
    return g;
  }

  window.EMF = {
    NS, el, svgEl, clear, fmt, clamp, deg, rad, arrow, label,
    controlRow, slider, seg, readouts, readout, note, project3, makeSvg,
    axis, dot, grid
  };
})();
