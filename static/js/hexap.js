(() => {
  "use strict";
  const DATA = window.HEXAP;
  const BASE = "static/results/";
  const $ = (id) => document.getElementById(id);
  const SVG = "http://www.w3.org/2000/svg";

  function chips(container, items, onPick, initial) {
    container.innerHTML = "";
    const buttons = items.map(([value, label]) => {
      const b = document.createElement("button");
      b.className = "chip";
      b.textContent = label;
      b.addEventListener("click", () => select(value));
      container.appendChild(b);
      return [value, b];
    });
    function select(value) {
      buttons.forEach(([v, b]) => b.classList.toggle("on", v === value));
      onPick(value);
    }
    select(initial === undefined ? items[0][0] : initial);
    return select;
  }

  function svg(tag, attrs, parent) {
    const el = document.createElementNS(SVG, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    if (parent) parent.appendChild(el);
    return el;
  }

  function lazyVideo(src, poster) {
    const v = document.createElement("video");
    Object.assign(v, { muted: true, loop: true, playsInline: true, preload: "metadata" });
    v.src = src;
    if (poster) v.poster = poster;
    return v;
  }

  const watch = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) e.target.play().catch(() => {}); else e.target.pause();
  }), { threshold: 0.2 });

  function grid(container, items, folder) {
    items.forEach((c) => {
      const fig = document.createElement("figure");
      const v = lazyVideo(BASE + folder + "/" + c.key + ".mp4", BASE + folder + "/" + c.key + ".jpg");
      const cap = document.createElement("figcaption");
      cap.textContent = c.title;
      fig.append(v, cap);
      container.appendChild(fig);
      watch.observe(v);
    });
  }

  /* ---------------------------------------------------------------- before / after slider */
  (function compare() {
    const box = $("compare"), canvas = $("compare-canvas"), video = $("compare-video"), handle = $("compare-handle");
    const ctx = canvas.getContext("2d");
    let split = 0.5, clip = null;
    function load(key) {
      clip = DATA.compare.find((c) => c.key === key);
      canvas.width = clip.width;
      canvas.height = clip.height;
      video.src = BASE + "compare/" + key + ".mp4";
      video.play().catch(() => {});
    }
    function draw() {
      if (clip && video.readyState >= 2) {
        const w = clip.width, h = clip.height, x = Math.max(1, Math.min(w - 1, Math.round(split * w)));
        ctx.drawImage(video, 0, 0, x, h, 0, 0, x, h);
        ctx.drawImage(video, x, h, w - x, h, x, 0, w - x, h);
      }
      requestAnimationFrame(draw);
    }
    function move(event) {
      const r = box.getBoundingClientRect();
      split = Math.max(0, Math.min(1, (event.clientX - r.left) / r.width));
      handle.style.left = split * 100 + "%";
    }
    let dragging = false;
    box.addEventListener("pointerdown", (e) => { dragging = true; box.setPointerCapture(e.pointerId); move(e); });
    box.addEventListener("pointermove", (e) => { if (dragging) move(e); });
    box.addEventListener("pointerup", () => { dragging = false; });
    handle.style.left = "50%";
    chips($("compare-chips"), DATA.compare.map((c) => [c.key, c.title]), load);
    requestAnimationFrame(draw);
  })();

  /* ---------------------------------------------------------------- observation length */
  (function observation() {
    const video = $("obs-video"), curve = $("obs-curve"), obs = DATA.observation;
    let clip = null;
    function drawCurve(length) {
      curve.innerHTML = "";
      const lengths = obs.lengths;
      const values = Object.values(obs.ade).flat();
      const top = Math.ceil(Math.max(...values) * 10) / 10;
      const X = (i) => 46 + (i / (lengths.length - 1)) * 255, Y = (a) => 190 - (a / top) * 170;
      svg("line", { x1: 46, y1: 190, x2: 305, y2: 190, stroke: "#bbb" }, curve);
      svg("line", { x1: 46, y1: 20, x2: 46, y2: 190, stroke: "#bbb" }, curve);
      [0, top / 2, top].forEach((a) => { const t = svg("text", { x: 40, y: Y(a) + 4, "text-anchor": "end" }, curve); t.textContent = a.toFixed(1); });
      lengths.forEach((l, i) => { const t = svg("text", { x: X(i), y: 206, "text-anchor": "middle" }, curve); t.textContent = l; });
      const lab = svg("text", { x: 175, y: 222, "text-anchor": "middle" }, curve); lab.textContent = "observed frames";
      const yl = svg("text", { x: 50, y: 14 }, curve); yl.textContent = "ADE (m)";
      Object.entries(obs.ade).forEach(([name, ys], k) => {
        const color = obs.colors[name];
        const pts = ys.map((a, i) => [X(i), Y(a)]);
        svg("polyline", { points: pts.map((q) => q.join(",")).join(" "), fill: "none", stroke: color, "stroke-width": 2 }, curve);
        pts.forEach(([x, y], i) => svg("circle", { cx: x, cy: y, r: lengths[i] === length ? 5 : 2.5, fill: color, stroke: lengths[i] === length ? "#222" : "none" }, curve));
        const t = svg("text", { x: 305, y: 34 + k * 18, "text-anchor": "end", fill: color }, curve);
        t.textContent = name;
        t.style.fill = color;
      });
    }
    function loadLength(length) {
      video.src = BASE + "observation/" + clip + "/obs_" + length + ".mp4";
      video.play().catch(() => {});
      drawCurve(length);
    }
    function loadClip(key) {
      clip = key;
      chips($("obs-tabs"), obs.lengths.map((l) => [l, l + (l === 1 ? " frame" : " frames")]), loadLength, 2);
    }
    chips($("obs-clips"), obs.clips.map((c) => [c.key, c.title]), loadClip);
  })();

  /* ---------------------------------------------------------------- navigation chart */
  (function navigation() {
    const chart = $("nav-chart"), rows = DATA.navigation.rows;
    const W = 640, left = 190, right = 40, barH = 30, gap = 14;
    const X = (v) => left + (v / 40) * (W - left - right);
    rows.forEach((r, i) => {
      const y = 10 + i * (barH + gap);
      const t = svg("text", { x: left - 10, y: y + barH / 2 + 5, "text-anchor": "end" }, chart);
      t.textContent = r.name;
      svg("rect", { x: left, y, width: X(r.collision) - left, height: barH, fill: r.color, rx: 3 }, chart);
      const v = svg("text", { x: X(r.collision) + 6, y: y + barH / 2 + 5 }, chart);
      v.textContent = r.collision + "%";
    });
    chart.setAttribute("viewBox", `0 0 ${W} ${10 + rows.length * (barH + gap)}`);
    grid($("nav-grid"), DATA.navigation.videos || [], "navigation");
  })();

  grid($("exec-grid"), DATA.executability, "executability");
  grid($("grid"), DATA.grid, "grid");

  $("copy-bibtex").addEventListener("click", () => {
    navigator.clipboard.writeText($("bibtex-code").textContent);
  });
})();
