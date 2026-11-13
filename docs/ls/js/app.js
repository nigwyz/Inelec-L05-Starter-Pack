/* ============================================================
   EE351 Linear Systems II — shared behaviour
   ============================================================ */
(function () {
  "use strict";

  /* ---- mobile navigation ---- */
  const bar = document.querySelector(".mobile-bar");
  if (bar) {
    const btn = bar.querySelector("button");
    if (btn) {
      btn.addEventListener("click", () => document.body.classList.toggle("nav-open"));
    }
    document.addEventListener("click", (e) => {
      if (document.body.classList.contains("nav-open") &&
          !e.target.closest(".sidebar") && !e.target.closest(".mobile-bar")) {
        document.body.classList.remove("nav-open");
      }
    });
  }

  /* ---- highlight current nav item ---- */
  const here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".sidebar nav a").forEach((a) => {
    const href = a.getAttribute("href") || "";
    if (href === here || (here === "" && href === "index.html")) a.classList.add("active");
  });

  /* ---- progress checkboxes ---- */
  const KEY = "ee351.progress.v1";
  let store = {};
  try { store = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (_) { store = {}; }

  const boxes = Array.from(document.querySelectorAll("input[data-progress]"));
  boxes.forEach((box) => {
    const id = box.getAttribute("data-progress");
    if (store[id]) box.checked = true;
    box.addEventListener("change", () => {
      if (box.checked) store[id] = 1; else delete store[id];
      try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (_) {}
      updateBar();
    });
  });

  function updateBar() {
    const all = boxes.length;
    if (!all) return;
    const done = boxes.filter((b) => b.checked).length;
    const pct = Math.round((done / all) * 100);
    document.querySelectorAll(".js-progress-bar").forEach((el) => { el.style.width = pct + "%"; });
    document.querySelectorAll(".js-progress-text").forEach((el) => { el.textContent = done + " / " + all; });
    document.querySelectorAll(".js-progress-pct").forEach((el) => { el.textContent = pct + "%"; });
  }
  updateBar();

  /* ---- copy code buttons ---- */
  document.querySelectorAll("pre").forEach((pre) => {
    if (pre.querySelector(".copy-btn")) return;
    const b = document.createElement("button");
    b.className = "copy-btn";
    b.textContent = "copy";
    b.style.cssText = "position:absolute;top:8px;right:8px;font:600 11px system-ui;padding:4px 8px;border-radius:6px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#dce4f5;cursor:pointer;";
    pre.style.position = "relative";
    b.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(pre.innerText.replace(/^copy\n/, ""));
        b.textContent = "copied";
        setTimeout(() => (b.textContent = "copy"), 1200);
      } catch (_) {}
    });
  });

  /* ---- quiz option buttons (generic) ---- */
  document.querySelectorAll("[data-quiz]").forEach((quiz) => {
    const answer = quiz.getAttribute("data-answer");
    quiz.querySelectorAll("button[data-opt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        quiz.querySelectorAll("button[data-opt]").forEach((x) => x.classList.remove("correct", "wrong"));
        if (btn.getAttribute("data-opt") === answer) btn.classList.add("correct");
        else {
          btn.classList.add("wrong");
          const right = quiz.querySelector('button[data-opt="' + answer + '"]');
          if (right) right.classList.add("correct");
        }
        const sol = quiz.querySelector("details");
        if (sol) sol.open = true;
      });
    });
  });

  /* ---- tabs ---- */
  document.querySelectorAll("[data-tabs]").forEach((group) => {
    const buttons = Array.from(group.querySelectorAll("[data-tab]"));
    const panels = Array.from(group.querySelectorAll("[data-panel]"));
    function show(name) {
      buttons.forEach((b) => b.classList.toggle("on", b.getAttribute("data-tab") === name));
      panels.forEach((p) => { p.hidden = p.getAttribute("data-panel") !== name; });
    }
    buttons.forEach((b) => b.addEventListener("click", () => show(b.getAttribute("data-tab"))));
    if (buttons[0]) show(buttons[0].getAttribute("data-tab"));
  });

  /* ---- collapsible work / solutions (default closed) ---- */
  document.querySelectorAll("details.work").forEach((d) => { d.open = false; });
})();
