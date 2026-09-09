/* ==========================================================================
   Интерактив хичээлийн хөдөлгүүр
   - Алхмын систем, явцын хэмжүүр, цаг
   - SVG диаграм зурах туслах функцууд (багана, шугам, климатограмм,
     пирамид, картограм, хэмжүүр, хүснэгт, гулсуур)
   ========================================================================== */
(function () {
  "use strict";
  const GZ = window.GZ, esc = GZ.esc;
  const IL = (GZ.IL = GZ.IL || {});

  IL.REG = {};
  IL.register = function (id, lesson) { IL.REG[id] = Object.assign({ id }, lesson); };

  /* ====================================================================
     ТУСЛАХ: SVG диаграм
     ==================================================================== */
  const D = (IL.draw = {});

  function esc2(s) { return esc(s); }
  const fmt = (n, d) => {
    const x = Number(n);
    return d ? x.toFixed(d) : GZ.fmtNum(Math.round(x));
  };

  /* ---- Босоо баганан диаграм ---- */
  D.bars = function (o) {
    const labels = o.labels, values = o.values;
    const W = 640, H = o.height || 240, PL = 44, PR = 12, PT = 14, PB = 30;
    const iw = W - PL - PR, ih = H - PT - PB;
    const max = o.max != null ? o.max : Math.max(...values) * 1.15 || 1;
    const bw = (iw / values.length) * 0.62;
    const gap = iw / values.length;

    let ticks = "";
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const v = (max / steps) * i;
      const y = PT + ih - (v / max) * ih;
      ticks += `<line class="grid-l" x1="${PL}" y1="${y.toFixed(1)}" x2="${W - PR}" y2="${y.toFixed(1)}"/>
        <text class="tick" x="${PL - 7}" y="${(y + 3.5).toFixed(1)}" text-anchor="end">${fmt(v, max < 10 ? 1 : 0)}</text>`;
    }

    let bars = "";
    values.forEach((v, i) => {
      const h = Math.max(1, (v / max) * ih);
      const x = PL + gap * i + (gap - bw) / 2;
      const y = PT + ih - h;
      bars += `<rect class="bar${o.hotIdx && o.hotIdx.indexOf(i) >= 0 ? " hot" : ""}" x="${x.toFixed(1)}" y="${y.toFixed(1)}"
        width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="3"${o.color ? ` fill="${o.color}"` : ""}>
        <title>${esc2(labels[i])}: ${fmt(v, 1)} ${esc2(o.unit || "")}</title></rect>`;
      if (o.showValues) {
        bars += `<text class="lbl" x="${(x + bw / 2).toFixed(1)}" y="${(y - 4).toFixed(1)}" text-anchor="middle">${fmt(v, 0)}</text>`;
      }
      bars += `<text class="tick-b" x="${(x + bw / 2).toFixed(1)}" y="${H - 10}" text-anchor="middle">${esc2(labels[i])}</text>`;
    });

    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc2(o.alt || "Баганан диаграм")}">
      ${ticks}<line class="axis" x1="${PL}" y1="${PT + ih}" x2="${W - PR}" y2="${PT + ih}"/>${bars}</svg>`;
  };

  /* ---- Шугаман диаграм ---- */
  D.line = function (o) {
    const labels = o.labels, values = o.values;
    const W = 640, H = o.height || 240, PL = 46, PR = 14, PT = 14, PB = 30;
    const iw = W - PL - PR, ih = H - PT - PB;
    const min = o.min != null ? o.min : 0;
    const max = o.max != null ? o.max : Math.max(...values) * 1.1;
    const X = (i) => PL + (iw / Math.max(1, values.length - 1)) * i;
    const Y = (v) => PT + ih - ((v - min) / (max - min)) * ih;

    let ticks = "";
    for (let i = 0; i <= 4; i++) {
      const v = min + ((max - min) / 4) * i;
      const y = Y(v);
      ticks += `<line class="grid-l" x1="${PL}" y1="${y.toFixed(1)}" x2="${W - PR}" y2="${y.toFixed(1)}"/>
        <text class="tick" x="${PL - 7}" y="${(y + 3.5).toFixed(1)}" text-anchor="end">${fmt(v, 0)}</text>`;
    }

    const pts = values.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
    const area = o.area
      ? `<polygon class="area" points="${PL},${PT + ih} ${pts} ${(W - PR)},${PT + ih}"/>` : "";
    let dots = "", xlab = "";
    values.forEach((v, i) => {
      dots += `<circle class="dot-m" cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="3.6">
        <title>${esc2(labels[i])}: ${fmt(v, 1)} ${esc2(o.unit || "")}</title></circle>`;
      if (!o.everyOther || i % 2 === 0 || i === values.length - 1) {
        xlab += `<text class="tick-b" x="${X(i).toFixed(1)}" y="${H - 10}" text-anchor="middle">${esc2(labels[i])}</text>`;
      }
    });

    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc2(o.alt || "Шугаман диаграм")}">
      ${ticks}${area}<polyline class="${o.teal ? "line2" : "line"}" points="${pts}"/>${dots}
      <line class="axis" x1="${PL}" y1="${PT + ih}" x2="${W - PR}" y2="${PT + ih}"/>${xlab}</svg>`;
  };

  /* ---- Климатограмм: температур (шугам) + хур тунадас (багана) ---- */
  D.climograph = function (o) {
    const M = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
    const T = o.temps, P = o.precip;
    const W = 640, H = 280, PL = 46, PR = 46, PT = 18, PB = 34;
    const iw = W - PL - PR, ih = H - PT - PB;

    const tMin = Math.min(-30, Math.floor(Math.min(...T) / 10) * 10);
    const tMax = Math.max(30, Math.ceil(Math.max(...T) / 10) * 10);
    const pMax = Math.max(80, Math.ceil(Math.max(...P) / 20) * 20);

    const Xc = (i) => PL + (iw / 12) * (i + 0.5);
    const Yt = (v) => PT + ih - ((v - tMin) / (tMax - tMin)) * ih;
    const Yp = (v) => PT + ih - (v / pMax) * ih;

    let grid = "", axL = "", axR = "";
    for (let i = 0; i <= 4; i++) {
      const tv = tMin + ((tMax - tMin) / 4) * i;
      const y = Yt(tv);
      grid += `<line class="grid-l" x1="${PL}" y1="${y.toFixed(1)}" x2="${W - PR}" y2="${y.toFixed(1)}"/>`;
      axL += `<text class="tick" x="${PL - 7}" y="${(y + 3.5).toFixed(1)}" text-anchor="end">${Math.round(tv)}°</text>`;
      const pv = (pMax / 4) * (4 - i);
      axR += `<text class="tick" x="${W - PR + 7}" y="${(y + 3.5).toFixed(1)}" text-anchor="start">${Math.round(pv)}</text>`;
    }

    const bw = (iw / 12) * 0.56;
    let bars = "", months = "";
    P.forEach((v, i) => {
      const y = Yp(v), h = Math.max(1, PT + ih - y);
      bars += `<rect class="bar" x="${(Xc(i) - bw / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="2">
        <title>${M[i]} сар: ${v} мм</title></rect>`;
      months += `<text class="tick-b" x="${Xc(i).toFixed(1)}" y="${H - 12}" text-anchor="middle">${M[i]}</text>`;
    });

    const tp = T.map((v, i) => `${Xc(i).toFixed(1)},${Yt(v).toFixed(1)}`).join(" ");
    let tdots = "";
    T.forEach((v, i) => {
      tdots += `<circle class="dot-m" cx="${Xc(i).toFixed(1)}" cy="${Yt(v).toFixed(1)}" r="3.2">
        <title>${M[i]} сар: ${v} °C</title></circle>`;
    });
    const zeroY = Yt(0);

    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Климатограмм">
      ${grid}
      <line class="axis" x1="${PL}" y1="${zeroY.toFixed(1)}" x2="${W - PR}" y2="${zeroY.toFixed(1)}" stroke-dasharray="4 3"/>
      ${bars}<polyline class="line" points="${tp}"/>${tdots}
      <line class="axis" x1="${PL}" y1="${PT + ih}" x2="${W - PR}" y2="${PT + ih}"/>
      ${axL}${axR}${months}
      <text class="tick" x="${PL - 7}" y="${PT - 5}" text-anchor="end" font-weight="700">°C</text>
      <text class="tick" x="${W - PR + 7}" y="${PT - 5}" text-anchor="start" font-weight="700">мм</text>
    </svg>
    <div class="chart-legend">
      <span><i style="background:var(--terra)"></i>Температур (°C)</span>
      <span><i style="background:var(--sky)"></i>Хур тунадас (мм)</span>
    </div>`;
  };

  /* ---- Нас-хүйсийн пирамид ---- */
  D.pyramid = function (o) {
    const ages = o.ages, m = o.male, f = o.female;
    const W = 640, H = 320, PT = 14, PB = 26, CW = 54;
    const ih = H - PT - PB;
    const rowH = ih / ages.length;
    const half = (W - CW) / 2 - 10;
    const max = o.max || Math.max(...m, ...f) * 1.05;

    let rows = "";
    ages.forEach((a, i) => {
      const y = PT + ih - rowH * (i + 1) + 1.5;
      const h = rowH - 3;
      const mw = (m[i] / max) * half;
      const fw = (f[i] / max) * half;
      rows += `<rect class="m" x="${(half - mw + 5).toFixed(1)}" y="${y.toFixed(1)}" width="${mw.toFixed(1)}" height="${h.toFixed(1)}" rx="2">
          <title>${esc2(a)} эрэгтэй: ${fmt(m[i], 1)}%</title></rect>
        <rect class="f" x="${(half + CW + 5).toFixed(1)}" y="${y.toFixed(1)}" width="${fw.toFixed(1)}" height="${h.toFixed(1)}" rx="2">
          <title>${esc2(a)} эмэгтэй: ${fmt(f[i], 1)}%</title></rect>
        <text class="agelbl" x="${(half + CW / 2 + 5).toFixed(1)}" y="${(y + h / 2 + 3).toFixed(1)}" text-anchor="middle">${esc2(a)}</text>`;
    });

    return `<svg class="pyramid" viewBox="0 0 ${W} ${H}" role="img" aria-label="Нас хүйсийн пирамид">
      ${rows}
      <text class="tick-b" x="${(half / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle">Эрэгтэй</text>
      <text class="tick-b" x="${(half + CW + half / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle">Эмэгтэй</text>
    </svg>`;
  };

  /* ---- Хагас дугуй хэмжүүр ---- */
  D.gauge = function (pct, label, color) {
    const p = GZ.clamp(pct, 0, 100);
    const R = 78, CX = 95, CY = 95;
    const len = Math.PI * R;
    const off = len * (1 - p / 100);
    return `<div class="gauge-wrap">
      <svg class="gauge" viewBox="0 0 190 108">
        <path class="track" d="M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}"/>
        <path class="val" d="M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}"
          stroke="${color}" stroke-dasharray="${len.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/>
      </svg>
      <div class="gauge-label" style="color:${color}">${esc2(label)}</div>
    </div>`;
  };

  /* ---- Монгол улсын картограм (аймгийн утгаар өнгөлнө) ---- */
  const LON0 = 87.5, LON1 = 120.0, LAT1 = 52.3, LAT0 = 41.3, MW = 1000;
  const KK = Math.cos((46.8 * Math.PI) / 180);
  const SS = MW / ((LON1 - LON0) * KK);
  const MH = Math.round((LAT1 - LAT0) * SS);
  IL.xy = (lon, lat) => [(lon - LON0) * KK * SS, (LAT1 - lat) * SS];

  D.choropleth = function (o) {
    const vals = o.values;                 // { аймгийн нэр: тоо }
    const arr = Object.values(vals).filter((v) => isFinite(v));
    const min = Math.min(...arr), max = Math.max(...arr);
    const ramp = o.ramp || ["#d8efec", "#8fd4c9", "#41a99a", "#177a70", "#0b4a45"];

    const col = (v) => {
      if (!isFinite(v)) return "var(--surface-3)";
      const t = o.log
        ? (Math.log10(v + 1) - Math.log10(min + 1)) / Math.max(1e-6, Math.log10(max + 1) - Math.log10(min + 1))
        : (v - min) / Math.max(1e-6, max - min);
      return ramp[GZ.clamp(Math.floor(t * ramp.length), 0, ramp.length - 1)];
    };

    const sw = ramp.map((c) => `<i style="background:${c}"></i>`).join("");
    const legend = `<div class="scale-bar"><span>${o.fmt ? o.fmt(min) : fmt(min, 1)}</span>
      <span class="sw">${sw}</span><span>${o.fmt ? o.fmt(max) : fmt(max, 1)}</span></div>`;

    /* Бодит аймгийн хил байвал полигоноор будна (илүү үнэн зөв картограм) */
    if (GZ.MN_SHAPES && GZ.MN_SHAPES.length) {
      const V = GZ.MN_VIEW || { w: MW, h: MH };
      const provs = GZ.MN_SHAPES.map((s) => {
        const v = vals[s.n];
        return `<path class="a" data-a="${esc2(s.n)}" d="${s.d}" fill="${col(v)}"
          ><title>${esc2(s.n)}: ${o.fmt ? o.fmt(v) : fmt(v, 1)}</title></path>`;
      }).join("");
      const names = GZ.AIMAGS.filter((a) => o.showNames).map((a) => {
        const p = IL.xy(a.lon, a.lat);
        return `<text x="${(p[0] + (a.dx || 0)).toFixed(1)}" y="${(p[1] + (a.dy || 0)).toFixed(1)}"
          text-anchor="middle">${esc2(a.n)}</text>`;
      }).join("");
      return `<svg class="choro" viewBox="0 0 ${V.w} ${V.h}" role="img" aria-label="${esc2(o.alt || "Монголын картограм")}">
          ${provs}${names}
        </svg>${legend}`;
    }

    /* Нөөц: схем зураг дээр хэмжээгээр нь ялгасан цэг */
    const border = GZ.MN_BORDER.map(([lo, la], i) => {
      const [x, y] = IL.xy(lo, la);
      return (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
    }).join(" ") + " Z";

    const dots = GZ.AIMAGS.map((a) => {
      const p = IL.xy(a.lon, a.lat);
      const x = p[0] + (a.dx || 0), y = p[1] + (a.dy || 0);
      const v = vals[a.n];
      const r = o.sizeBy && isFinite(v)
        ? 6 + 22 * Math.sqrt(GZ.clamp((v - min) / Math.max(1e-6, max - min), 0, 1))
        : 9;
      return `<circle class="cdot" data-a="${esc2(a.n)}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}"
        r="${r.toFixed(1)}" fill="${col(v)}"><title>${esc2(a.n)}: ${o.fmt ? o.fmt(v) : fmt(v, 1)}</title></circle>`;
    }).join("");

    return `<svg class="choro" viewBox="0 0 ${MW} ${MH}" role="img" aria-label="${esc2(o.alt || "Монголын картограм")}">
        <path d="${border}" fill="var(--surface-2)" stroke="var(--ink-4)" stroke-width="1.6" stroke-linejoin="round"/>
        ${dots}
      </svg>${legend}`;
  };

  /* ---- Гулсуур ---- */
  D.slider = function (o) {
    return `<div class="ctl">
      <label for="${o.id}">${esc2(o.label)} <span class="v" id="${o.id}-v">${esc2(o.display || o.value + (o.unit || ""))}</span></label>
      <input type="range" id="${o.id}" min="${o.min}" max="${o.max}" step="${o.step || 1}" value="${o.value}">
    </div>`;
  };

  /* ---- Хүснэгт (эрэмбэлэгддэг) ---- */
  D.table = function (o) {
    const head = o.head.map((h, i) =>
      `<th data-c="${i}"${o.num && o.num.indexOf(i) >= 0 ? ' class="num"' : ""}>${esc2(h)}</th>`).join("");
    const body = o.rows.map((r) =>
      `<tr>${r.map((c, i) =>
        `<td${o.num && o.num.indexOf(i) >= 0 ? ' class="num"' : ""}>${typeof c === "number" ? fmt(c, o.dec || 0) : esc2(c)}</td>`
      ).join("")}</tr>`).join("");
    return `<div class="table-wrap" style="margin-top:12px"><table class="il-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  };

  /* Хүснэгтийн эрэмбэлэлтийг идэвхжүүлэх */
  D.makeSortable = function (root) {
    GZ.$$("table.il-table", root).forEach((tbl) => {
      const ths = GZ.$$("th", tbl);
      ths.forEach((th) => th.addEventListener("click", () => {
        const c = Number(th.dataset.c);
        const asc = !(th.classList.contains("sorted") && !th.classList.contains("asc"));
        ths.forEach((x) => x.classList.remove("sorted", "asc"));
        th.classList.add("sorted"); if (asc) th.classList.add("asc");
        const tb = tbl.querySelector("tbody");
        const rows = Array.from(tb.rows);
        rows.sort((r1, r2) => {
          const a = r1.cells[c].textContent.trim(), b = r2.cells[c].textContent.trim();
          const na = parseFloat(a.replace(/[^\d.-]/g, "")), nb = parseFloat(b.replace(/[^\d.-]/g, ""));
          const bothNum = !isNaN(na) && !isNaN(nb) && /\d/.test(a) && /\d/.test(b);
          const r = bothNum ? na - nb : a.localeCompare(b, "mn");
          return asc ? r : -r;
        });
        rows.forEach((r) => tb.appendChild(r));
      }));
    });
  };

  /* ====================================================================
     ТОГЛУУЛАГЧ
     ==================================================================== */
  IL.mount = function (host, id) {
    const L = IL.REG[id];
    if (!L) {
      host.innerHTML = `<div class="empty"><div class="big">🧪</div><h2>Хичээл олдсонгүй</h2>
        <a class="btn btn-primary mt16" href="interactive.html">Буцах</a></div>`;
      return;
    }

    let cur = 0;
    const started = Date.now();
    const visited = new Set([0]);
    let tick = null;

    host.innerHTML = `
      <div class="il-layout">
        <aside class="il-rail">
          <div class="card card-pad-sm">
            <h4 style="font-family:var(--f-sans);font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-4);margin-bottom:10px">Хичээлийн явц</h4>
            <ul class="il-steps" id="ilSteps"></ul>
          </div>
          <div class="card card-pad-sm mt16">
            <h4 style="font-family:var(--f-sans);font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-4);margin-bottom:8px">Хичээлийн зорилт</h4>
            <ul style="margin:0;padding-left:17px;font-size:.85rem;color:var(--ink-3);line-height:1.6">
              ${(L.goals || []).map((g) => `<li style="margin-bottom:5px">${esc(g)}</li>`).join("")}
            </ul>
          </div>
        </aside>
        <div class="il-stage" id="ilStage"></div>
      </div>`;

    const rail = GZ.$("#ilSteps", host);
    const stage = GZ.$("#ilStage", host);

    function drawRail() {
      rail.innerHTML = L.steps.map((s, i) => `
        <li><button class="il-step-btn${i === cur ? " active" : ""}${visited.has(i) && i !== cur ? " done" : ""}" data-i="${i}">
          <span class="n">${i + 1}</span><span>${esc(s.t)}</span><span class="mins">${s.min}′</span>
        </button></li>`).join("");
      GZ.$$(".il-step-btn", rail).forEach((b) =>
        b.addEventListener("click", () => go(Number(b.dataset.i))));
    }

    function clock() {
      const s = Math.round((Date.now() - started) / 1000);
      const n = GZ.$("#ilClock", host);
      if (n) n.textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
    }

    function go(i) {
      cur = GZ.clamp(i, 0, L.steps.length - 1);
      visited.add(cur);
      const s = L.steps[cur];
      const passed = L.steps.slice(0, cur).reduce((a, x) => a + x.min, 0);
      const total = L.steps.reduce((a, x) => a + x.min, 0);

      stage.innerHTML = `
        <div class="il-topbar">
          <span class="badge teal">${cur + 1} / ${L.steps.length}</span>
          <div class="progress"><span style="width:${(passed / total) * 100}%"></span></div>
          <span class="il-clock" id="ilClock">0:00</span>
        </div>
        <div class="il-kicker">${s.kind === "lab" ? "🧪 Лаборатори" : s.kind === "check" ? "✅ Шалгах" : "📖 Судлах"} · ${s.min} минут</div>
        <h2>${esc(s.t)}</h2>
        <div id="ilBody"></div>
        <div class="il-nav">
          <button class="btn btn-ghost" id="ilPrev"${cur === 0 ? " disabled" : ""}>← Өмнөх</button>
          <button class="btn btn-primary" id="ilNext">${cur + 1 >= L.steps.length ? "Хичээл дуусгах ✓" : "Дараагийнх →"}</button>
        </div>`;

      const body = GZ.$("#ilBody", stage);
      if (s.html) body.innerHTML = typeof s.html === "function" ? s.html() : s.html;
      if (s.quiz) renderQuiz(body, s.quiz);
      if (s.mount) { try { s.mount(body); } catch (e) { console.error("[IL]", e); } }
      D.makeSortable(body);

      GZ.$("#ilPrev", stage).addEventListener("click", () => go(cur - 1));
      GZ.$("#ilNext", stage).addEventListener("click", () => {
        if (cur + 1 >= L.steps.length) return finish();
        go(cur + 1);
      });

      drawRail();
      clock();
      stage.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function renderQuiz(host2, qs) {
      const wrap = GZ.el("div", { class: "il-check" });
      let right = 0, done = 0;
      qs.forEach((q, qi) => {
        const box = GZ.el("div", { class: "card card-pad-sm", style: "margin-bottom:12px" });
        box.innerHTML = `<div class="q">${qi + 1}. ${esc(q.q)}</div><div class="opts"></div><div class="ex"></div>`;
        const opts = box.querySelector(".opts");
        q.options.forEach((o, k) => {
          const b = GZ.el("button", { class: "opt", html: `<span class="k">${"АБВГ"[k]}</span><span>${esc(o)}</span>` });
          b.addEventListener("click", () => {
            Array.from(opts.children).forEach((x, n) => {
              x.disabled = true;
              if (n === q.answer) x.classList.add("correct");
              else if (n === k) x.classList.add("wrong");
            });
            if (k === q.answer) right++;
            done++;
            box.querySelector(".ex").innerHTML =
              `<div class="explain"><b>${k === q.answer ? "Зөв!" : "Зөв хариулт: " + "АБВГ"[q.answer]}</b> — ${esc(q.why)}</div>`;
            if (done === qs.length) {
              wrap.appendChild(GZ.el("div", {
                class: "alert " + (right === qs.length ? "ok" : "warn"),
                html: `<span class="ic">${right === qs.length ? "🏆" : "📘"}</span>
                  <p><b>${right} / ${qs.length} зөв.</b> ${right === qs.length
                    ? "Энэ хэсгийг бүрэн эзэмшсэн байна."
                    : "Алдсан хэсгээ дээш гүйлгэж дахин уншаарай."}</p>`,
              }));
            }
          });
          opts.appendChild(b);
        });
        wrap.appendChild(box);
      });
      host2.appendChild(wrap);
    }

    function finish() {
      if (tick) clearInterval(tick);
      const secs = Math.round((Date.now() - started) / 1000);
      const mins = Math.max(1, Math.round(secs / 60));
      GZ.store.saveScore({
        kind: "interactive", game: "il:" + L.id, score: 60, max_score: 60,
        meta: { title: L.title, mins },
      });
      GZ.store.markLesson("il-" + L.id);
      stage.innerHTML = `
        <div class="tc" style="padding:20px 0">
          <div style="font-size:3.4rem">🎓</div>
          <h2 style="margin:8px 0 6px">Хичээл дууслаа!</h2>
          <p class="muted">${esc(L.title)}</p>
          <div class="row center row-wrap mt16">
            <span class="badge gold">+60 оноо</span>
            <span class="badge teal">${mins} минут зарцуулсан</span>
            <span class="badge">${L.steps.length} алхам</span>
          </div>
          <div class="alert ok mt24" style="text-align:left">
            <span class="ic">💡</span>
            <div><b>Дараагийн алхам:</b> ${esc(L.next || "Сорил өгч мэдлэгээ бататга, дараа нь тоглоомоор давт.")}</div>
          </div>
          <div class="row center row-wrap mt24">
            <button class="btn btn-outline" id="ilAgain">Эхнээс нь дахин</button>
            <a class="btn btn-primary" href="quiz.html">Сорил өгөх</a>
            <a class="btn btn-ghost" href="interactive.html">Бусад интерактив хичээл</a>
          </div>
        </div>`;
      GZ.$("#ilAgain", stage).addEventListener("click", () => { visited.clear(); go(0); startClock(); });
      GZ.toast("Интерактив хичээл дуусгасанд баяр хүргэе!", "ok");
    }

    function startClock() { if (tick) clearInterval(tick); tick = setInterval(clock, 1000); }

    go(0);
    startClock();
  };
})();
