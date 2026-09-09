/* ==========================================================================
   7-Р АНГИЙН ИНТЕРАКТИВ ХИЧЭЭЛ (40 мин)
   «Газрын зураг унших: масштаб, изогипс, азимут»
   ========================================================================== */
(function () {
  "use strict";
  const GZ = window.GZ, IL = GZ.IL, D = IL.draw, $ = GZ.$, esc = GZ.esc;

  /* ---------------- Гадаргын загвар (гауссын нийлбэр) ---------------- */
  function elev(x, y) {
    const g = (cx, cy, a, s) => a * Math.exp(-(((x - cx) ** 2 + (y - cy) ** 2) / s));
    return 1150
      + g(0.30, 0.36, 760, 0.030)
      + g(0.68, 0.58, 520, 0.024)
      + g(0.54, 0.20, 300, 0.016)
      - g(0.48, 0.86, 260, 0.050)
      + 55 * Math.sin(x * 8.5) * Math.cos(y * 6.5);
  }

  /* ---------------- Marching squares — изогипс байгуулах ---------------- */
  function contourSegments(level, NX, NY) {
    const segs = [];
    const V = (i, j) => elev(i / (NX - 1), j / (NY - 1));
    const ip = (a, b, va, vb) => {
      const t = (level - va) / (vb - va);
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    };
    for (let j = 0; j < NY - 1; j++) {
      for (let i = 0; i < NX - 1; i++) {
        const v0 = V(i, j), v1 = V(i + 1, j), v2 = V(i + 1, j + 1), v3 = V(i, j + 1);
        let idx = 0;
        if (v0 > level) idx |= 8;
        if (v1 > level) idx |= 4;
        if (v2 > level) idx |= 2;
        if (v3 > level) idx |= 1;
        if (idx === 0 || idx === 15) continue;
        const p0 = [i, j], p1 = [i + 1, j], p2 = [i + 1, j + 1], p3 = [i, j + 1];
        const T = () => ip(p0, p1, v0, v1);      // дээд ирмэг
        const R = () => ip(p1, p2, v1, v2);      // баруун
        const B = () => ip(p3, p2, v3, v2);      // доод
        const Lf = () => ip(p0, p3, v0, v3);     // зүүн
        const push = (a, b) => segs.push([a[0], a[1], b[0], b[1]]);
        switch (idx) {
          case 1: case 14: push(Lf(), B()); break;
          case 2: case 13: push(B(), R()); break;
          case 3: case 12: push(Lf(), R()); break;
          case 4: case 11: push(T(), R()); break;
          case 5: push(Lf(), T()); push(B(), R()); break;
          case 6: case 9: push(T(), B()); break;
          case 7: case 8: push(Lf(), T()); break;
          case 10: push(T(), R()); push(Lf(), B()); break;
        }
      }
    }
    return segs;
  }

  const MAPW = 620, MAPH = 420, NX = 90, NY = 64;

  function buildContourMap() {
    const sx = MAPW / (NX - 1), sy = MAPH / (NY - 1);
    let lines = "", fills = "";
    const lo = 950, hi = 2000, step = 50;

    // Өндөршлийн бүсийн өнгө (арын дэвсгэр)
    const bands = [
      [950, "#e8f1e6"], [1150, "#d9e9cf"], [1350, "#e6e6bd"],
      [1550, "#e8d7ab"], [1750, "#dfc09a"], [1900, "#cfa98f"],
    ];
    // Өндөршлийн өнгийг бүдүүн торон дээр зурна (DOM хөнгөвчлөх)
    const FS = 3;
    for (let j = 0; j < NY - 1; j += FS) {
      for (let i = 0; i < NX - 1; i += FS) {
        const v = elev(i / (NX - 1), j / (NY - 1));
        let c = bands[0][1];
        for (const b of bands) if (v >= b[0]) c = b[1];
        fills += `<rect class="cfill" x="${(i * sx).toFixed(1)}" y="${(j * sy).toFixed(1)}"
          width="${(sx * FS + 0.8).toFixed(1)}" height="${(sy * FS + 0.8).toFixed(1)}" fill="${c}"/>`;
      }
    }

    for (let lv = lo; lv <= hi; lv += step) {
      const major = lv % 250 === 0;
      const segs = contourSegments(lv, NX, NY);
      if (!segs.length) continue;
      let d = "";
      segs.forEach((s) => {
        d += `M${(s[0] * sx).toFixed(1)} ${(s[1] * sy).toFixed(1)}L${(s[2] * sx).toFixed(1)} ${(s[3] * sy).toFixed(1)}`;
      });
      lines += `<path class="cline${major ? " major" : ""}" d="${d}"/>`;
      if (major && segs.length > 6) {
        const s = segs[Math.floor(segs.length / 2)];
        lines += `<text class="clbl" x="${(s[0] * sx).toFixed(1)}" y="${(s[1] * sy - 3).toFixed(1)}">${lv}</text>`;
      }
    }
    return { fills, lines };
  }

  /* ================================================================== */
  IL.register("g7", {
    grade: 7, emoji: "🧭",
    title: "Газрын зураг унших: масштаб, изогипс, азимут",
    summary: "Топографын зураг дээр зай хэмжих, рельефийг «унших», огтлолын профайл байгуулах, чиг баримжаа тогтоох 40 минутын дадлага.",
    minutes: 40,
    features: ["Контур зураг", "Огтлолын профайл", "Луужин", "Бодлого"],
    next: "«Тоглоом → Аймаг таних» дээр зурган дээрх байрлал таних чадвараа бататга.",
    goals: [
      "Масштабыг ашиглан зурган зайг бодит зайд шилжүүлэх",
      "Изогипсээр рельефийн хэлбэрийг тодорхойлох",
      "Хоёр цэгийн хоорондох огтлолын профайл байгуулах",
      "Налуугийн эгц байдлыг тооцох",
      "Азимут хэмжиж чиг баримжаа тогтоох",
    ],

    steps: [
      /* ---------------- 1 ---------------- */
      {
        t: "Юуг сурах вэ?", min: 2, kind: "read",
        html: `
          <p>Газрын зураг бол газарзүйчийн хамгийн гол хэрэглүүр. Түүнийг унших чадвар нь
          ЭЕШ-ийн даалгаврын мэдэгдэхүйц хэсгийг эзэлдэг ба амьдрал дээр ч аялал, барилга,
          хайгуул, аврах ажиллагаанд шууд хэрэглэгддэг.</p>

          <div class="vs-grid">
            <div class="vs-box">
              <h4>Энэ хичээлээр хийх зүйл</h4>
              <ul>
                <li>Масштабын гулсуураар туршилт хийх</li>
                <li>Жинхэнэ контур зураг дээр өндөршил уншиж, <b>огтлолын профайл</b> байгуулах</li>
                <li>Луужин эргүүлж азимут тогтоох дасгал</li>
              </ul>
            </div>
            <div class="vs-box b">
              <h4>Хичээлийн дараа чадах зүйл</h4>
              <ul>
                <li>«1:200 000 зураг дээр 7.5 см хэд вэ?» — 10 секундэд бодох</li>
                <li>Изогипс хараад аль тал нь эгц болохыг хэлэх</li>
                <li>Хоёр цэгийн хоорондох рельефийг зурж үзүүлэх</li>
              </ul>
            </div>
          </div>

          <div class="alert mt24"><span class="ic">⏱️</span>
            <p>Хичээл 8 алхамтай, нийт 40 минут. Хажуугийн жагсаалтаас дурын алхам руу шууд шилжиж болно.</p></div>`,
      },

      /* ---------------- 2 ---------------- */
      {
        t: "Масштаб — туршилтаар ойлгох", min: 5, kind: "lab",
        html: `<p>Масштаб нь зурган зай бодит зайнаас хэдэн дахин багассаныг заана.
          Гулсуурыг хөдөлгөж, масштаб өөрчлөгдөхөд юу болохыг ажигла.</p>`,
        mount(host) {
          const SC = [10000, 25000, 50000, 100000, 200000, 500000, 1000000];
          const box = GZ.el("div", { class: "lab" });
          box.innerHTML = `
            <div class="lab-head"><span class="ic">📐</span><b>Масштабын лаборатори</b></div>
            <div class="ctl-row">
              ${D.slider({ id: "s7scale", label: "Масштаб", min: 0, max: SC.length - 1, value: 3, display: "1:100 000" })}
            </div>
            <div class="readout" id="s7out"></div>
            <svg class="chart" viewBox="0 0 620 96" style="margin-top:16px">
              <text class="tick-b" x="10" y="20">Зураг дээрх 5 см = </text>
              <line class="axis" x1="12" y1="42" x2="212" y2="42" stroke="var(--teal)" stroke-width="4" stroke-linecap="round"/>
              <line class="axis" x1="12" y1="34" x2="12" y2="50" stroke="var(--teal)" stroke-width="3"/>
              <line class="axis" x1="212" y1="34" x2="212" y2="50" stroke="var(--teal)" stroke-width="3"/>
              <text class="lbl" id="s7real" x="222" y="46" style="font-size:14px;font-weight:700;fill:var(--teal)">—</text>
              <text class="tick" x="12" y="72">Улаанбаатар–Дархан (219 км) энэ зураг дээр:</text>
              <text class="lbl" id="s7ud" x="12" y="90" style="font-size:13px;font-weight:700;fill:var(--terra)">—</text>
            </svg>
            <p class="lab-note">💡 Хуваарийн хоёр дахь тоо <b>бага</b> байх тусам масштаб <b>том</b>, зураг <b>нарийвчлалтай</b>,
              харин хамрах талбай бага байна.</p>`;
          host.appendChild(box);

          const inp = $("#s7scale", box);
          function upd() {
            const s = SC[Number(inp.value)];
            const kmPerCm = s / 100000;
            $("#s7scale-v", box).textContent = "1:" + GZ.fmtNum(s);
            $("#s7out", box).innerHTML = `
              <div class="cell"><div class="k">1 см = </div><div class="v">${kmPerCm >= 1 ? kmPerCm + " км" : (s / 100) + " м"}</div></div>
              <div class="cell"><div class="k">Нэрлэсэн</div><div class="v" style="font-size:.95rem">1 см-т ${kmPerCm >= 1 ? kmPerCm + " км" : s / 100 + " м"}</div></div>
              <div class="cell ${s <= 50000 ? "good" : s >= 500000 ? "warn" : ""}"><div class="k">Нарийвчлал</div>
                <div class="v" style="font-size:.95rem">${s <= 25000 ? "Маш өндөр" : s <= 100000 ? "Дунд" : s <= 200000 ? "Бага" : "Тойм"}</div></div>
              <div class="cell"><div class="k">Хэрэглээ</div><div class="v" style="font-size:.9rem">${
                s <= 25000 ? "Хот, барилга" : s <= 100000 ? "Сум, аялал" : s <= 200000 ? "Аймаг" : "Улс, тив"}</div></div>`;
            $("#s7real", box).textContent = (5 * kmPerCm >= 1)
              ? GZ.fmtNum(5 * kmPerCm) + " км" : (5 * s / 100) + " м";
            const cm = 219 / kmPerCm;
            $("#s7ud", box).textContent = cm > 500
              ? cm.toFixed(0) + " см (≈" + (cm / 100).toFixed(1) + " м — цаасанд багтахгүй!)"
              : cm.toFixed(1) + " см";
          }
          inp.addEventListener("input", upd);
          upd();
        },
      },

      /* ---------------- 3 ---------------- */
      {
        t: "Зайн бодлого — дадлага", min: 6, kind: "lab",
        html: `<p>Одоо өөрөө бод. Товч дарахад шинэ бодлого гарна. Эхлээд толгойдоо бодоод,
          дараа нь «Шийдлийг харах» дар.</p>`,
        mount(host) {
          const box = GZ.el("div", { class: "lab" });
          box.innerHTML = `
            <div class="lab-head"><span class="ic">🧮</span><b>Бодлогын машин</b></div>
            <div id="s7prob"></div>`;
          host.appendChild(box);

          let solved = 0;
          const SC = [25000, 50000, 100000, 200000, 500000];

          function newProb() {
            const s = GZ.pick(SC);
            const cm = Math.round((2 + Math.random() * 9) * 10) / 10;
            const km = (cm * s) / 100000;
            const host2 = $("#s7prob", box);
            host2.innerHTML = `
              <div class="card card-pad-sm">
                <p style="font-family:var(--f-display);font-size:1.15rem;margin-bottom:14px">
                  <b>1:${GZ.fmtNum(s)}</b> масштабтай зураг дээр хоёр сумын төв
                  <b>${cm} см</b> зайтай байв. Бодит зай хэд вэ?
                </p>
                <div class="row row-wrap" style="gap:8px">
                  <input class="input" id="s7ans" style="max-width:170px" placeholder="Хариу (км)" inputmode="decimal">
                  <button class="btn btn-primary btn-sm" id="s7chk">Шалгах</button>
                  <button class="btn btn-ghost btn-sm" id="s7sol">Шийдлийг харах</button>
                  <button class="btn btn-outline btn-sm" id="s7new">Шинэ бодлого</button>
                </div>
                <div id="s7fb" class="mt16"></div>
              </div>`;

            $("#s7new", box).addEventListener("click", newProb);
            $("#s7chk", box).addEventListener("click", () => {
              const v = parseFloat(String($("#s7ans", box).value).replace(",", "."));
              const ok = isFinite(v) && Math.abs(v - km) < Math.max(0.05, km * 0.02);
              if (ok) solved++;
              $("#s7fb", box).innerHTML = `<div class="alert ${ok ? "ok" : "warn"}">
                <span class="ic">${ok ? "✅" : "🤔"}</span>
                <p>${ok ? `<b>Зөв! ${km} км.</b> Нийт ${solved} бодлого зөв бодлоо.`
                        : `Дахин оролдоод үз. Сануулга: см × масштаб → см, дараа нь 100 000-д хуваа.`}</p></div>`;
            });
            $("#s7sol", box).addEventListener("click", () => {
              $("#s7fb", box).innerHTML = `
                <div class="explain">
                  <b>Алхам алхмаар:</b><br>
                  1. ${cm} см × ${GZ.fmtNum(s)} = <b>${GZ.fmtNum(cm * s)} см</b><br>
                  2. ${GZ.fmtNum(cm * s)} см ÷ 100 = ${GZ.fmtNum((cm * s) / 100)} м<br>
                  3. ${GZ.fmtNum((cm * s) / 100)} м ÷ 1000 = <b>${km} км</b><br><br>
                  ⚡ Түргэн арга: 1:${GZ.fmtNum(s)} → 1 см = ${s / 100000} км, тэгэхээр ${cm} × ${s / 100000} = <b>${km} км</b>
                </div>`;
            });
            $("#s7ans", box).addEventListener("keydown", (e) => { if (e.key === "Enter") $("#s7chk", box).click(); });
          }
          newProb();
        },
      },

      /* ---------------- 4 ---------------- */
      {
        t: "Изогипс ба огтлолын профайл", min: 8, kind: "lab",
        html: `<p>Доорх бол жинхэнэ топографын зураг — изогипс 50 метр тутамд, тод шугам нь 250 метр тутамд татагдсан.
          Зураг дээр <b>хоёр цэг дарж</b> тэдгээрийн хоорондох <b>рельефийн огтлол</b>-ыг байгуул.</p>`,
        mount(host) {
          const M = buildContourMap();
          const box = GZ.el("div", { class: "lab" });
          box.innerHTML = `
            <div class="lab-head"><span class="ic">⛰️</span><b>Контур зураг ба профайл байгуулагч</b></div>
            <svg class="contour-map" id="s7map" viewBox="0 0 ${MAPW} ${MAPH}">
              <g>${M.fills}</g>
              <g>${M.lines}</g>
              <g id="s7marks"></g>
            </svg>
            <div class="readout" id="s7ro">
              <div class="cell"><div class="k">Хулганы доорх өндөр</div><div class="v" id="s7hov">—</div></div>
              <div class="cell"><div class="k">A цэг</div><div class="v" id="s7A">—</div></div>
              <div class="cell"><div class="k">B цэг</div><div class="v" id="s7B">—</div></div>
              <div class="cell"><div class="k">Харьцангуй өндөр</div><div class="v" id="s7rel">—</div></div>
            </div>
            <div id="s7prof" style="margin-top:16px"></div>
            <div class="row row-wrap mt16">
              <button class="btn btn-outline btn-sm" id="s7reset">Цэгүүдийг арилгах</button>
              <span class="muted" style="font-size:.83rem;align-self:center">Зураг дээр дарж A, дараа нь B цэгээ сонго</span>
            </div>
            <p class="lab-note">💡 Изогипс <b>ойрхон</b> = налуу <b>эгц</b>. <b>Сийрэг</b> = налуу <b>тэгш</b>.
              Профайл дээр энэ ялгаа шууд харагдана.</p>`;
          host.appendChild(box);

          const svg = $("#s7map", box), marks = $("#s7marks", box);
          let A = null, B = null;

          const toLocal = (ev) => {
            const r = svg.getBoundingClientRect();
            const cx = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left;
            const cy = (ev.touches ? ev.touches[0].clientY : ev.clientY) - r.top;
            return [GZ.clamp(cx / r.width, 0, 1), GZ.clamp(cy / r.height, 0, 1)];
          };

          svg.addEventListener("mousemove", (e) => {
            const [u, v] = toLocal(e);
            $("#s7hov", box).textContent = Math.round(elev(u, v)) + " м";
          });
          svg.addEventListener("mouseleave", () => { $("#s7hov", box).textContent = "—"; });

          svg.addEventListener("click", (e) => {
            const [u, v] = toLocal(e);
            if (!A || (A && B)) { A = [u, v]; B = null; }
            else B = [u, v];
            redraw();
          });

          $("#s7reset", box).addEventListener("click", () => { A = null; B = null; redraw(); });

          function redraw() {
            let g = "";
            if (A) g += `<circle class="pick" cx="${(A[0] * MAPW).toFixed(1)}" cy="${(A[1] * MAPH).toFixed(1)}" r="7"/>
              <text x="${(A[0] * MAPW + 11).toFixed(1)}" y="${(A[1] * MAPH + 4).toFixed(1)}" style="font-size:13px;font-weight:800;fill:var(--ink)">A</text>`;
            if (B) g += `<circle class="pick b" cx="${(B[0] * MAPW).toFixed(1)}" cy="${(B[1] * MAPH).toFixed(1)}" r="7"/>
              <text x="${(B[0] * MAPW + 11).toFixed(1)}" y="${(B[1] * MAPH + 4).toFixed(1)}" style="font-size:13px;font-weight:800;fill:var(--ink)">B</text>`;
            if (A && B) g += `<line class="seg" x1="${(A[0] * MAPW).toFixed(1)}" y1="${(A[1] * MAPH).toFixed(1)}"
              x2="${(B[0] * MAPW).toFixed(1)}" y2="${(B[1] * MAPH).toFixed(1)}"/>`;
            marks.innerHTML = g;

            $("#s7A", box).textContent = A ? Math.round(elev(A[0], A[1])) + " м" : "—";
            $("#s7B", box).textContent = B ? Math.round(elev(B[0], B[1])) + " м" : "—";
            $("#s7rel", box).textContent = (A && B)
              ? Math.abs(Math.round(elev(A[0], A[1]) - elev(B[0], B[1]))) + " м" : "—";

            if (A && B) drawProfile(); else $("#s7prof", box).innerHTML =
              `<p class="muted tc" style="font-size:.88rem;padding:14px 0">Хоёр цэг сонгоход энд огтлолын профайл гарна</p>`;
          }

          function drawProfile() {
            const N = 70, vals = [], labels = [];
            for (let i = 0; i < N; i++) {
              const t = i / (N - 1);
              vals.push(elev(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t));
              labels.push(i === 0 ? "A" : i === N - 1 ? "B" : "");
            }
            const mn = Math.floor(Math.min(...vals) / 100) * 100 - 50;
            const mx = Math.ceil(Math.max(...vals) / 100) * 100 + 50;
            // Гоpизонталь зай (зургийн 1 нэгж = 1 км гэж үзье)
            const dxKm = Math.hypot((B[0] - A[0]) * 12, (B[1] - A[1]) * 8);
            const dh = Math.abs(vals[N - 1] - vals[0]);
            const slope = (dh / (dxKm * 1000)) * 100;

            $("#s7prof", box).innerHTML = `
              <div class="card card-pad-sm">
                <b style="font-size:.9rem">A–B огтлолын профайл</b>
                ${D.line({ labels, values: vals, min: mn, max: mx, unit: "м", area: true, teal: true, height: 200, alt: "Огтлолын профайл" })}
                <div class="readout" style="margin-top:6px">
                  <div class="cell"><div class="k">Хэвтээ зай</div><div class="v">${dxKm.toFixed(1)} км</div></div>
                  <div class="cell"><div class="k">Өндрийн зөрүү</div><div class="v">${Math.round(dh)} м</div></div>
                  <div class="cell ${slope > 15 ? "bad" : slope > 6 ? "warn" : "good"}">
                    <div class="k">Дундаж налуу</div><div class="v">${slope.toFixed(1)}%</div></div>
                  <div class="cell"><div class="k">Хамгийн өндөр</div><div class="v">${Math.round(Math.max(...vals))} м</div></div>
                </div>
                <p class="lab-note">${slope > 15 ? "⚠️ Маш эгц — явган хүнд хүнд, техник гарахгүй."
                  : slope > 6 ? "Дунд зэргийн налуу — зам тавихад тохиромжтой."
                  : "Тэгш — суурьшил, тариаланд тохиромжтой."}</p>
              </div>`;
          }

          redraw();
        },
      },

      /* ---------------- 5 ---------------- */
      {
        t: "Налуу хэрхэн тооцох вэ?", min: 5, kind: "lab",
        html: `<p>Налууг хувиар (%) эсвэл градусаар илэрхийлнэ.
          <b>Налуу (%) = өндрийн зөрүү ÷ хэвтээ зай × 100</b>. Гулсуураар туршиж үз.</p>`,
        mount(host) {
          const box = GZ.el("div", { class: "lab" });
          box.innerHTML = `
            <div class="lab-head"><span class="ic">📏</span><b>Налуугийн тооцоолуур</b></div>
            <div class="ctl-row">
              ${D.slider({ id: "s7dh", label: "Өндрийн зөрүү", min: 10, max: 900, value: 250, step: 10, unit: " м" })}
              ${D.slider({ id: "s7dx", label: "Хэвтээ зай", min: 100, max: 8000, value: 2000, step: 100, unit: " м" })}
            </div>
            <svg class="chart" viewBox="0 0 620 180" style="margin-top:14px">
              <line class="axis" x1="40" y1="150" x2="580" y2="150"/>
              <polygon id="s7tri" points="40,150 580,150 580,60" fill="color-mix(in srgb, var(--teal) 18%, transparent)" stroke="var(--teal)" stroke-width="2"/>
              <text class="lbl" id="s7lx" x="310" y="168" text-anchor="middle">—</text>
              <text class="lbl" id="s7ly" x="590" y="105" text-anchor="start">—</text>
              <text class="lbl" id="s7lang" x="70" y="143" style="font-weight:700;fill:var(--terra)">—</text>
            </svg>
            <div class="readout" id="s7sl"></div>
            <p class="lab-note">💡 Зам барихад ерөнхийдөө 6–8%-иас доош налуу тохиромжтой.
              10%-иас дээш бол ачаатай машин гарахад хүндрэлтэй.</p>`;
          host.appendChild(box);

          const dh = $("#s7dh", box), dx = $("#s7dx", box);
          function upd() {
            const h = Number(dh.value), x = Number(dx.value);
            $("#s7dh-v", box).textContent = h + " м";
            $("#s7dx-v", box).textContent = x >= 1000 ? (x / 1000).toFixed(1) + " км" : x + " м";
            const pct = (h / x) * 100;
            const deg = (Math.atan(h / x) * 180) / Math.PI;
            const ty = GZ.clamp(150 - (pct / 60) * 90, 30, 148);
            $("#s7tri", box).setAttribute("points", `40,150 580,150 580,${ty.toFixed(1)}`);
            $("#s7lx", box).textContent = (x >= 1000 ? (x / 1000).toFixed(1) + " км" : x + " м") + " хэвтээ";
            $("#s7ly", box).textContent = h + " м";
            $("#s7lang", box).textContent = deg.toFixed(1) + "°";
            $("#s7sl", box).innerHTML = `
              <div class="cell ${pct > 15 ? "bad" : pct > 6 ? "warn" : "good"}"><div class="k">Налуу</div><div class="v">${pct.toFixed(1)}%</div></div>
              <div class="cell"><div class="k">Өнцөг</div><div class="v">${deg.toFixed(1)}°</div></div>
              <div class="cell"><div class="k">Изогипсийн зай</div><div class="v" style="font-size:.95rem">${pct > 12 ? "Маш ойрхон" : pct > 5 ? "Ойрхон" : "Сийрэг"}</div></div>
              <div class="cell"><div class="k">Үнэлгээ</div><div class="v" style="font-size:.9rem">${
                pct > 20 ? "Хад цохио" : pct > 12 ? "Эгц" : pct > 6 ? "Дунд" : pct > 2 ? "Налуу" : "Тэгш"}</div></div>`;
          }
          dh.addEventListener("input", upd); dx.addEventListener("input", upd); upd();
        },
      },

      /* ---------------- 6 ---------------- */
      {
        t: "Азимут — чиг баримжаа", min: 7, kind: "lab",
        html: `<p><b>Азимут</b> нь хойд зүгээс цагийн зүүний дагуу хэмжсэн өнцөг (0°–360°).
          Луужингийн зүүг чирж эргүүлээд, доор өгөгдсөн зорилтот азимутыг ол.</p>`,
        mount(host) {
          const box = GZ.el("div", { class: "lab" });
          const CX = 150, CY = 150, R = 118;
          let ticks = "", cards = "";
          for (let a = 0; a < 360; a += 5) {
            const maj = a % 45 === 0;
            const r1 = maj ? R - 16 : R - 9;
            const rad = ((a - 90) * Math.PI) / 180;
            ticks += `<line class="tickm${maj ? " maj" : ""}"
              x1="${(CX + Math.cos(rad) * r1).toFixed(1)}" y1="${(CY + Math.sin(rad) * r1).toFixed(1)}"
              x2="${(CX + Math.cos(rad) * (R - 3)).toFixed(1)}" y2="${(CY + Math.sin(rad) * (R - 3)).toFixed(1)}"/>`;
          }
          [["Х", 0], ["ЗХ", 45], ["З", 90], ["ЗУ", 135], ["У", 180], ["БУ", 225], ["Б", 270], ["БХ", 315]].forEach(([t, a]) => {
            const rad = ((a - 90) * Math.PI) / 180;
            cards += `<text class="card" x="${(CX + Math.cos(rad) * (R - 32)).toFixed(1)}"
              y="${(CY + Math.sin(rad) * (R - 32) + 5).toFixed(1)}" text-anchor="middle">${t}</text>`;
          });

          box.innerHTML = `
            <div class="lab-head"><span class="ic">🧭</span><b>Луужингийн дасгал</b></div>
            <svg class="compass" id="s7c" viewBox="0 0 300 300">
              <circle class="face" cx="${CX}" cy="${CY}" r="${R}"/>
              <circle class="ring" cx="${CX}" cy="${CY}" r="${R - 30}"/>
              ${ticks}${cards}
              <line class="target" id="s7tgt" x1="${CX}" y1="${CY}" x2="${CX}" y2="${CY - R + 22}"/>
              <g id="s7needle">
                <polygon class="needle-n" points="${CX},${CY - R + 30} ${CX - 9},${CY} ${CX + 9},${CY}"/>
                <polygon class="needle-s" points="${CX},${CY + R - 44} ${CX - 8},${CY} ${CX + 8},${CY}"/>
              </g>
              <circle cx="${CX}" cy="${CY}" r="7" fill="var(--ink)"/>
            </svg>
            <div class="readout" id="s7cro"></div>
            <div class="row center row-wrap mt16">
              <button class="btn btn-primary btn-sm" id="s7cchk">Шалгах</button>
              <button class="btn btn-outline btn-sm" id="s7cnew">Шинэ даалгавар</button>
            </div>
            <div id="s7cfb" class="mt16"></div>
            <p class="lab-note">💡 Хойд = 0°, Зүүн = 90°, Урд = 180°, Баруун = 270°.
              Луужинг чирэх эсвэл ← → товчоор нарийвчилж болно.</p>`;
          host.appendChild(box);

          const svg = $("#s7c", box), needle = $("#s7needle", box);
          let az = 0, target = 0, score = 0;

          function setTarget() {
            target = Math.round(Math.random() * 35) * 10;
            const rad = ((target - 90) * Math.PI) / 180;
            $("#s7tgt", box).setAttribute("x2", (CX + Math.cos(rad) * (R - 22)).toFixed(1));
            $("#s7tgt", box).setAttribute("y2", (CY + Math.sin(rad) * (R - 22)).toFixed(1));
            $("#s7cfb", box).innerHTML = "";
            upd();
          }
          function upd() {
            needle.setAttribute("transform", `rotate(${az} ${CX} ${CY})`);
            const diff = Math.min(Math.abs(az - target), 360 - Math.abs(az - target));
            $("#s7cro", box).innerHTML = `
              <div class="cell"><div class="k">Таны азимут</div><div class="v">${Math.round(az)}°</div></div>
              <div class="cell"><div class="k">Зорилтот</div><div class="v" style="color:var(--gold)">${target}°</div></div>
              <div class="cell ${diff <= 5 ? "good" : diff <= 15 ? "warn" : "bad"}"><div class="k">Зөрүү</div><div class="v">${Math.round(diff)}°</div></div>
              <div class="cell"><div class="k">Зүг</div><div class="v" style="font-size:.95rem">${dirName(az)}</div></div>`;
          }
          function dirName(a) {
            const n = ["Хойд", "Зүүн хойд", "Зүүн", "Зүүн урд", "Урд", "Баруун урд", "Баруун", "Баруун хойд"];
            return n[Math.round(a / 45) % 8];
          }
          function fromEvent(e) {
            const r = svg.getBoundingClientRect();
            const cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left - r.width / 2;
            const cy = (e.touches ? e.touches[0].clientY : e.clientY) - r.top - r.height / 2;
            az = (Math.atan2(cx, -cy) * 180) / Math.PI;
            if (az < 0) az += 360;
            upd();
          }
          let drag = false;
          svg.addEventListener("mousedown", (e) => { drag = true; fromEvent(e); });
          window.addEventListener("mousemove", (e) => { if (drag) fromEvent(e); });
          window.addEventListener("mouseup", () => { drag = false; });
          svg.addEventListener("touchstart", (e) => { drag = true; fromEvent(e); e.preventDefault(); }, { passive: false });
          svg.addEventListener("touchmove", (e) => { if (drag) { fromEvent(e); e.preventDefault(); } }, { passive: false });
          svg.addEventListener("touchend", () => { drag = false; });
          svg.setAttribute("tabindex", "0");
          svg.addEventListener("keydown", (e) => {
            if (e.key === "ArrowLeft") { az = (az + 359) % 360; upd(); e.preventDefault(); }
            if (e.key === "ArrowRight") { az = (az + 1) % 360; upd(); e.preventDefault(); }
          });

          $("#s7cchk", box).addEventListener("click", () => {
            const diff = Math.min(Math.abs(az - target), 360 - Math.abs(az - target));
            const ok = diff <= 5;
            if (ok) score++;
            $("#s7cfb", box).innerHTML = `<div class="alert ${ok ? "ok" : "warn"}"><span class="ic">${ok ? "🎯" : "↩️"}</span>
              <p>${ok ? `<b>Онож байна!</b> Зөрүү ${Math.round(diff)}°. Нийт ${score} удаа зөв.`
                      : `Зөрүү ${Math.round(diff)}°. ${az > target ? "Цагийн зүүний эсрэг" : "Цагийн зүүний дагуу"} бага зэрэг эргүүлээрэй.`}</p></div>`;
          });
          $("#s7cnew", box).addEventListener("click", setTarget);
          setTarget();
        },
      },

      /* ---------------- 7 ---------------- */
      {
        t: "Нөхцөлт тэмдэг ба зургийн элементүүд", min: 3, kind: "read",
        html: () => `
          <p>Газрын зураг дээрх бүх объект нөхцөлт тэмдгээр дүрслэгддэг. Тэдгээрийг гурав ангилна:</p>
          ${D.table({
            head: ["Ангилал", "Юуг дүрслэх", "Жишээ", "Хэрхэн таних"],
            rows: [
              ["Талбайн", "Өргөн уудам объект", "Нуур, ой, хот, намаг", "Өнгө, чичрэлт, хүрээ"],
              ["Шугаман", "Урт нарийн объект", "Гол, зам, төмөр зам, хил", "Шугамын хэлбэр, өнгө"],
              ["Цэгэн", "Жижиг цэгэн объект", "Худаг, оргил, сумын төв", "Тэмдэглэгээ, дүрс"],
              ["Тайлбар бичиг", "Нэр, өндөр, гүн", "«Отгонтэнгэр 4008»", "Тоо, үсэг"],
            ],
            num: [],
          })}
          <h3 style="margin-top:26px">Зураг бүр дээр заавал байх 5 элемент</h3>
          <ol class="num-list mt16" style="counter-reset:n">
            <li><b>Гарчиг</b><p>Юуны тухай зураг вэ.</p></li>
            <li><b>Масштаб</b><p>Тоон, нэрлэсэн эсвэл шугаман хэлбэрээр.</p></li>
            <li><b>Чиглэлийн заагч</b><p>Ихэвчлэн хойд зүг заасан сум.</p></li>
            <li><b>Тайлбар (легенд)</b><p>Нөхцөлт тэмдгийн утга.</p></li>
            <li><b>Эх сурвалж, огноо</b><p>Мэдээлэл хэзээ, хаанаас авсан.</p></li>
          </ol>
          <div class="alert warn mt24"><span class="ic">⚠️</span>
            <p>ЭЕШ-д «энэ зурагт юу дутуу байна?» гэсэн даалгавар гардаг. Дээрх 5 элементийг санаж байгаарай.</p></div>`,
      },

      /* ---------------- 8 ---------------- */
      {
        t: "Мэдлэгээ шалгах", min: 4, kind: "check",
        html: `<p>Хичээлээр сурсан зүйлээ шалгая. Асуулт бүрд тайлбар гарна.</p>`,
        quiz: [
          { q: "1:50 000 масштабтай зураг дээр 8 см зай бодитоор хэд вэ?", options: ["400 м", "4 км", "40 км", "0.4 км"], answer: 1, why: "8 × 50 000 = 400 000 см = 4 000 м = 4 км." },
          { q: "Изогипсүүд хоорондоо маш ойрхон байвал юуг илтгэх вэ?", options: ["Тэгш тал", "Эгц налуу", "Гүн нуур", "Намаг"], answer: 1, why: "Богино зайд өндөршил хурдан өөрчлөгдөж байгаа тул налуу эгц." },
          { q: "1600 м ба 1250 м өндөртэй хоёр цэгийн харьцангуй өндөр хэд вэ?", options: ["1600 м", "1250 м", "350 м", "2850 м"], answer: 2, why: "Харьцангуй өндөр = хоёр цэгийн зөрүү: 1600 − 1250 = 350 м." },
          { q: "Азимут 270° ямар зүгийг заах вэ?", options: ["Хойд", "Зүүн", "Урд", "Баруун"], answer: 3, why: "0° хойд, 90° зүүн, 180° урд, 270° баруун." },
          { q: "500 м өндрийн зөрүүтэй, 5 000 м хэвтээ зайтай налуу хэдэн хувь вэ?", options: ["1%", "10%", "25%", "100%"], answer: 1, why: "500 ÷ 5 000 × 100 = 10%." },
          { q: "Аль масштаб хамгийн нарийвчилсан зураг өгөх вэ?", options: ["1:1 000 000", "1:200 000", "1:50 000", "1:10 000"], answer: 3, why: "Хуваарийн хоёр дахь тоо бага байх тусам масштаб том, нарийвчлал өндөр." },
        ],
      },
    ],
  });
})();
