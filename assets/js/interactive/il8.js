/* ==========================================================================
   8-Р АНГИЙН ИНТЕРАКТИВ ХИЧЭЭЛ (40 мин)
   «Монголын уур амьсгал: эрс тэс байдлын механизм»
   ========================================================================== */
(function () {
  "use strict";
  const GZ = window.GZ, IL = GZ.IL, D = IL.draw, $ = GZ.$, esc = GZ.esc;

  /* Цаг уурын станцууд — олон жилийн дундаж ойролцоо утга */
  const ST = [
    { n: "Улаанбаатар", lat: 47.92, lon: 106.92, alt: 1300, zone: "Ойт хээр",
      t: [-21.5, -17, -7.5, 1.5, 9.5, 15.5, 17.5, 15.5, 9, 0.5, -11, -19],
      p: [1, 2, 3, 6, 15, 42, 66, 60, 25, 8, 4, 3] },
    { n: "Мөрөн", lat: 49.63, lon: 100.16, alt: 1290, zone: "Ойт хээр",
      t: [-22, -18, -8, 1, 8.5, 14.5, 16.5, 14.5, 8, -1, -12.5, -20],
      p: [2, 2, 3, 6, 17, 45, 72, 60, 25, 8, 4, 3] },
    { n: "Чойбалсан", lat: 48.07, lon: 114.54, alt: 750, zone: "Хээр",
      t: [-21, -17, -7, 3.5, 12, 18.5, 20.5, 18.5, 11.5, 2, -9.5, -18.5],
      p: [2, 2, 4, 8, 20, 45, 70, 60, 25, 8, 4, 3] },
    { n: "Ховд", lat: 48.01, lon: 91.64, alt: 1400, zone: "Уулархаг",
      t: [-20, -16, -6, 4, 11, 16.5, 18.5, 16.5, 10.5, 2, -9, -17],
      p: [2, 2, 3, 4, 10, 20, 30, 25, 12, 6, 4, 3] },
    { n: "Алтай", lat: 46.37, lon: 96.26, alt: 2180, zone: "Өндөр уул",
      t: [-17, -14, -6.5, 1.5, 8, 13, 15, 13.5, 8, 0.5, -8.5, -15],
      p: [2, 3, 5, 8, 16, 25, 35, 30, 15, 7, 4, 3] },
    { n: "Даланзадгад", lat: 43.57, lon: 104.42, alt: 1470, zone: "Говь",
      t: [-14, -10, -2, 7, 14, 19, 21, 19, 13, 4.5, -5, -12],
      p: [1, 1, 2, 4, 10, 20, 33, 28, 12, 4, 2, 1] },
  ];
  const MN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const avg = (a) => sum(a) / a.length;

  IL.register("g8", {
    grade: 8, emoji: "❄️",
    title: "Монголын уур амьсгал: эрс тэс байдлын механизм",
    summary: "Климатограмм унших, Сибирийн антициклоны ажиллагааг симуляцаар харах, зудын эрсдэлийг загварчлах 40 минутын дадлага.",
    minutes: 40,
    features: ["Климатограмм", "Антициклоны симуляц", "Зудын загвар", "Картограм"],
    next: "«Хичээл → Монголын уур амьсгал» бүлгийг уншиж, ЭЕШ горимоор сорил өгөөрэй.",
    goals: [
      "Цаг агаар ба уур амьсгалыг ялгах",
      "Климатограмм уншиж, амплитуд тооцох",
      "Эрс тэс байдлын 4 шалтгааныг тайлбарлах",
      "Өндөршлийн температурын градиентийг хэрэглэх",
      "Ган, зудын эрсдэлд нөлөөлөх хүчин зүйлсийг үнэлэх",
    ],

    steps: [
      /* ---------------- 1 ---------------- */
      {
        t: "Асуудал: яагаад ийм хүйтэн вэ?", min: 2, kind: "read",
        html: `
          <p>Улаанбаатар бол <b>дэлхийн хамгийн хүйтэн нийслэл</b>. Гэтэл Монгол улс
          Итали, Испанитай ойролцоо өргөрөгт (41°–52°) оршдог. Ромын жилийн дундаж
          температур +15 °С, Улаанбаатарынх −0.4 °С. <b>Яагаад?</b></p>

          <div class="vs-grid">
            <div class="vs-box">
              <h4>🇮🇹 Ром (41.9° х.ө.)</h4>
              <ul>
                <li>Жилийн дундаж: <b>+15.7 °С</b></li>
                <li>1-р сар: +8 °С · 7-р сар: +25 °С</li>
                <li>Амплитуд: <b>17 °С</b></li>
                <li>Далайгаас 25 км</li>
              </ul>
            </div>
            <div class="vs-box b">
              <h4>🇲🇳 Улаанбаатар (47.9° х.ө.)</h4>
              <ul>
                <li>Жилийн дундаж: <b>−0.4 °С</b></li>
                <li>1-р сар: −21.5 °С · 7-р сар: +17.5 °С</li>
                <li>Амплитуд: <b>39 °С</b></li>
                <li>Далайгаас 700+ км, уулсаар хаагдсан</li>
              </ul>
            </div>
          </div>

          <p class="mt24">Энэ хичээлээр бид энэ ялгааг үүсгэж буй <b>механизмыг</b> симуляцаар задлан үзнэ.</p>`,
      },

      /* ---------------- 2 ---------------- */
      {
        t: "Цаг агаар ≠ уур амьсгал", min: 4, kind: "read",
        html: () => `
          <p>Энэ хоёрыг андуурах нь хамгийн түгээмэл алдаа. Ялгаа нь <b>хугацааны хамрах хүрээнд</b> оршино.</p>
          ${D.table({
            head: ["Шинж", "Цаг агаар", "Уур амьсгал"],
            rows: [
              ["Хугацаа", "Одоо, өнөөдөр, энэ 7 хоног", "30+ жилийн дундаж горим"],
              ["Хэмжих зүйл", "Температур, салхи, үүл, тунадас", "Дундаж, амплитуд, олон жилийн хандлага"],
              ["Урьдчилан таамаглах", "3–10 хоног хүртэл нэлээд нарийн", "Улирал, арван жилийн хэмжээнд"],
              ["Хэн судалдаг", "Цаг уурч (метеорологич)", "Уур амьсгал судлаач (климатологич)"],
              ["Жишээ", "«Маргааш −28 °С болно»", "«Монгол эх газрын эрс тэс уур амьсгалтай»"],
            ],
          })}
          <div class="alert mt24"><span class="ic">💡</span>
            <p><b>Санах арга:</b> цаг агаар бол таны <i>өнөөдрийн сэтгэл санаа</i>,
            уур амьсгал бол таны <i>зан чанар</i>. Нэг өдөр уурласан гэдэг нь ууртай хүн гэсэн үг биш.</p></div>

          <h3 style="margin-top:28px">Уур амьсгалыг бүрдүүлэгч 5 хүчин зүйл</h3>
          ${D.table({
            head: ["Хүчин зүйл", "Хэрхэн нөлөөлдөг", "Монголд"],
            rows: [
              ["Газарзүйн өргөрөг", "Нарны туяа тусах өнцөг", "Дунд өргөрөг — улирлын зөрүү их"],
              ["Далайгаас алслагдал", "Далай дулааныг зөөлрүүлнэ", "700–5000 км — нөлөө үгүй"],
              ["Өндөршил", "100 м тутам 0.6 °С буурна", "Дундаж 1580 м — 9 °С хүйтрүүлнэ"],
              ["Рельеф, хаалт", "Уул чийгийг саатуулна", "Хангай, Хэнтий, Алтай чийг барина"],
              ["Агаарын массын эргэлт", "Даралтын мужууд", "Сибирийн антициклон ноёрхоно"],
            ],
          })}`,
      },

      /* ---------------- 3 ---------------- */
      {
        t: "Климатограмм унших лаборатори", min: 9, kind: "lab",
        html: `<p>Зураг дээрх цэгээс станц сонго. Климатограмм автоматаар зурагдана —
          <span style="color:var(--terra);font-weight:700">улаан шугам</span> нь температур,
          <span style="color:var(--sky);font-weight:700">цэнхэр багана</span> нь хур тунадас.</p>`,
        mount(host) {
          const box = GZ.el("div", { class: "lab" });
          const vals = {};
          ST.forEach((s) => (vals[s.n] = avg(s.t)));

          box.innerHTML = `
            <div class="lab-head"><span class="ic">🌡️</span><b>Станцын климатограмм</b></div>
            <div id="s8map"></div>
            <div class="chips mt16" id="s8chips">
              ${ST.map((s, i) => `<button class="chip${i === 0 ? " active" : ""}" data-i="${i}">${esc(s.n)}</button>`).join("")}
            </div>
            <div id="s8chart" class="mt16"></div>
            <div class="readout" id="s8ro"></div>
            <div id="s8note"></div>`;
          host.appendChild(box);

          // Картограм — станцын жилийн дундаж температур
          const border = GZ.MN_BORDER.map(([lo, la], i) => {
            const [x, y] = IL.xy(lo, la);
            return (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
          }).join(" ") + " Z";
          const pts = ST.map((s, i) => {
            const [x, y] = IL.xy(s.lon, s.lat);
            return `<circle class="cdot" data-i="${i}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="13"
                fill="${s.alt > 2000 ? "#5b8ec9" : avg(s.t) > 0 ? "#e08a3c" : "#2f9c8e"}"><title>${esc(s.n)}</title></circle>
              <text x="${x.toFixed(1)}" y="${(y - 20).toFixed(1)}" text-anchor="middle" style="font-weight:700;font-size:15px">${esc(s.n)}</text>`;
          }).join("");
          $("#s8map", box).innerHTML = `<svg class="choro" viewBox="0 0 1000 494">
            <path d="${border}" fill="var(--surface)" stroke="var(--ink-4)" stroke-width="1.6" stroke-linejoin="round"/>
            ${pts}</svg>`;

          function show(i) {
            const s = ST[i];
            const amp = Math.max(...s.t) - Math.min(...s.t);
            const tot = sum(s.p);
            const warm = sum(s.p.slice(4, 9));
            $("#s8chart", box).innerHTML = `<b style="font-size:.95rem">${esc(s.n)} — ${s.alt} м, ${esc(s.zone)}</b>`
              + D.climograph({ temps: s.t, precip: s.p });
            $("#s8ro", box).innerHTML = `
              <div class="cell"><div class="k">Жилийн дундаж</div><div class="v">${avg(s.t).toFixed(1)}°</div></div>
              <div class="cell"><div class="k">1-р сар</div><div class="v" style="color:var(--sky)">${s.t[0]}°</div></div>
              <div class="cell"><div class="k">7-р сар</div><div class="v" style="color:var(--terra)">${s.t[6]}°</div></div>
              <div class="cell ${amp > 38 ? "bad" : "warn"}"><div class="k">Амплитуд</div><div class="v">${amp.toFixed(1)}°</div></div>
              <div class="cell"><div class="k">Жилийн тунадас</div><div class="v">${tot} мм</div></div>
              <div class="cell good"><div class="k">5–9 сард</div><div class="v">${Math.round((warm / tot) * 100)}%</div></div>`;
            $("#s8note", box).innerHTML = `<div class="alert" style="margin-top:12px"><span class="ic">📌</span>
              <p><b>${esc(s.n)}:</b> ${
                s.n === "Даланзадгад" ? "Говийн станц — өвөл хамгийн зөөлөн (өмнөд өргөрөг), гэвч тунадас хамгийн бага. Хуурайшилт эрс тэс байдлыг өөр талаас нь харуулна."
                : s.n === "Алтай" ? "2180 м өндөрт — зун хамгийн сэрүүн. Өндөршил температурыг хэрхэн бууруулдгийн тод жишээ."
                : s.n === "Чойбалсан" ? "Хамгийн нам дор (750 м) — зун хамгийн халуун, гэхдээ өвөл ч хүйтэн. Эх газрын байдал давамгайлна."
                : s.n === "Мөрөн" ? "Хойд өргөрөгт — өвөл хамгийн хүйтэн станцуудын нэг, харин тунадас харьцангуй элбэг."
                : s.n === "Ховд" ? "Уулархаг баруун бүс — уулсаар хаагдсан тул тунадас бага, амплитуд өндөр."
                : "Нийслэл — ойт хээрийн бүс, 1300 м өндөр. Өвлийн инверсээс болж бохирдол хуримтлагддаг."}</p></div>`;
          }

          $("#s8chips", box).addEventListener("click", (e) => {
            const b = e.target.closest(".chip"); if (!b) return;
            GZ.$$("#s8chips .chip", box).forEach((c) => c.classList.toggle("active", c === b));
            show(Number(b.dataset.i));
          });
          GZ.$$("#s8map .cdot", box).forEach((c) =>
            c.addEventListener("click", () => {
              const i = Number(c.dataset.i);
              GZ.$$("#s8chips .chip", box).forEach((x) => x.classList.toggle("active", Number(x.dataset.i) === i));
              show(i);
            }));
          show(0);
        },
      },

      /* ---------------- 4 ---------------- */
      {
        t: "Эрс тэс байдлын дөрвөн шалтгаан", min: 6, kind: "read",
        html: () => `
          <p>Климатограммаас харсан асар том амплитуд нь дөрвөн хүчин зүйлийн <b>нийлбэр</b> үр дүн юм.</p>

          <div class="grid g2" style="gap:14px;margin:20px 0">
            <div class="card card-pad-sm"><div class="card-icon sky" style="width:38px;height:38px;font-size:1.1rem">🌊</div>
              <h4>1. Далайгаас алслагдсан</h4>
              <p class="muted" style="font-size:.9rem;margin:0">Ус нь хуурай газраас 5 дахин их дулаан багтаамжтай.
              Далай зун дулааныг шингээж, өвөл буцааж өгдөг «тохируулагч». Монгол Атлантаас 5 000 км,
              Номхон далайгаас 700 км+ бөгөөд уулсаар хаагдсан.</p></div>

            <div class="card card-pad-sm"><div class="card-icon" style="width:38px;height:38px;font-size:1.1rem">🏔️</div>
              <h4>2. Өндөр өргөгдсөн рельеф</h4>
              <p class="muted" style="font-size:.9rem;margin:0">Дундаж өндөр 1 580 м. 100 м тутамд 0.6 °С хүйтэрдэг тул
              зөвхөн өндөршил л жилийн дунджийг ойролцоогоор <b>9 °С</b>-аар бууруулж байна.</p></div>

            <div class="card card-pad-sm"><div class="card-icon gold" style="width:38px;height:38px;font-size:1.1rem">☀️</div>
              <h4>3. Дунд өргөрөг</h4>
              <p class="muted" style="font-size:.9rem;margin:0">41°–52° өргөрөгт нарны туяа тусах өнцөг зун, өвөлд эрс өөр.
              Зуны өдөр 16 цаг, өвлийн өдөр 8 цаг үргэлжилнэ.</p></div>

            <div class="card card-pad-sm"><div class="card-icon terra" style="width:38px;height:38px;font-size:1.1rem">🌀</div>
              <h4>4. Сибирийн антициклон</h4>
              <p class="muted" style="font-size:.9rem;margin:0">Өвлийн улиралд нутгийг бүрхэх дэлхийн хамгийн хүчтэй
              өндөр даралтын муж. Цэлмэг тэнгэр → шөнийн дулаан огторгуй руу чөлөөтэй алдагдана.</p></div>
          </div>

          <h3>Хур тунадасны тархалт</h3>
          ${D.bars({
            labels: ["Хэнтий", "Хангай", "Хөвсгөл", "Ойт хээр", "Хээр", "Цөлөрхөг", "Говь"],
            values: [350, 340, 380, 280, 220, 140, 90],
            unit: "мм", showValues: true, height: 230, alt: "Бүсийн жилийн хур тунадас",
          })}
          <p class="muted tc" style="font-size:.85rem">Жилийн дундаж хур тунадас (мм), бүсээр</p>

          <div class="alert warn mt24"><span class="ic">⚠️</span>
            <p>Тунадасны <b>85–90%</b> нь 5–9 саруудад ордог. Энэ нь ургамал ургах хугацаатай давхцаж байгаа нь
            эерэг, харин хэт богино хугацаанд төвлөрч <b>үер</b> үүсгэдэг нь сөрөг талтай.</p></div>`,
      },

      /* ---------------- 5 ---------------- */
      {
        t: "Өндөршлийн градиент — тооцоолуур", min: 4, kind: "lab",
        html: `<p>Тропосферт 100 м өгсөх тутам температур дунджаар <b>0.6 °С</b> буурна.
          Энэ дүрмээр Монголын уулсын оройн температурыг тооцъё.</p>`,
        mount(host) {
          const box = GZ.el("div", { class: "lab" });
          box.innerHTML = `
            <div class="lab-head"><span class="ic">🗻</span><b>Өндөршил ↔ температур</b></div>
            <div class="ctl-row">
              ${D.slider({ id: "s8base", label: "Бэлийн температур", min: -40, max: 35, value: 18, unit: " °C" })}
              ${D.slider({ id: "s8h1", label: "Бэлийн өндөр", min: 500, max: 2000, value: 1300, step: 50, unit: " м" })}
              ${D.slider({ id: "s8h2", label: "Оргилын өндөр", min: 1000, max: 4400, value: 4374, step: 50, unit: " м" })}
            </div>
            <div class="readout" id="s8g"></div>
            <div id="s8gnote"></div>
            <p class="lab-note">💡 Хүйтэн оргил (4 374 м), Отгонтэнгэр (4 008 м), Богд хан уул (2 261 м).
              Оргилын температур 0 °С-аас доош байвал цас хайлахгүй — <b>мөнх цас</b> үүснэ.</p>`;
          host.appendChild(box);

          const b = $("#s8base", box), h1 = $("#s8h1", box), h2 = $("#s8h2", box);
          function upd() {
            const T0 = Number(b.value), a1 = Number(h1.value), a2 = Number(h2.value);
            $("#s8base-v", box).textContent = T0 + " °C";
            $("#s8h1-v", box).textContent = a1 + " м";
            $("#s8h2-v", box).textContent = a2 + " м";
            const dh = a2 - a1;
            const dT = (dh / 100) * 0.6;
            const T1 = T0 - dT;
            $("#s8g", box).innerHTML = `
              <div class="cell"><div class="k">Өндрийн зөрүү</div><div class="v">${GZ.fmtNum(dh)} м</div></div>
              <div class="cell"><div class="k">Температурын уналт</div><div class="v">${dT.toFixed(1)} °C</div></div>
              <div class="cell ${T1 < 0 ? "bad" : "good"}"><div class="k">Оргил дээр</div><div class="v">${T1.toFixed(1)} °C</div></div>
              <div class="cell"><div class="k">0 °C-ийн шугам</div><div class="v">${
                dT === 0 ? "—" : GZ.fmtNum(Math.round(a1 + (T0 / 0.6) * 100)) + " м"}</div></div>`;
            $("#s8gnote", box).innerHTML = `<div class="alert ${T1 < -5 ? "warn" : ""}" style="margin-top:12px">
              <span class="ic">${T1 < 0 ? "❄️" : "🌤️"}</span>
              <p><b>Бодолт:</b> ${dh} м ÷ 100 = ${(dh / 100).toFixed(1)} → ${(dh / 100).toFixed(1)} × 0.6 = <b>${dT.toFixed(1)} °C</b> буурна.
              ${T0} − ${dT.toFixed(1)} = <b>${T1.toFixed(1)} °C</b>.
              ${T1 < 0 ? " Оргил дээр 0 °C-аас доош — цас хайлахгүй, мөнх цас тогтох боломжтой." : " Оргил дээр эерэг температур — цас хайлна."}</p></div>`;
          }
          [b, h1, h2].forEach((x) => x.addEventListener("input", upd));
          upd();
        },
      },

      /* ---------------- 6 ---------------- */
      {
        t: "Сибирийн антициклоны симуляци", min: 7, kind: "lab",
        html: `<p>Сарыг сонгож, агаарын даралт хэрхэн өөрчлөгдөж, салхи ямар чиглэлд урсахыг ажигла.
          <b>Антициклон</b> = өндөр даралт → агаар <b>гадагш</b> урсана. <b>Циклон</b> = нам даралт → агаар <b>дотогш</b>.</p>`,
        mount(host) {
          const box = GZ.el("div", { class: "lab" });
          const PRESS = [1040, 1036, 1028, 1018, 1010, 1005, 1003, 1006, 1014, 1024, 1034, 1040];
          const TEMP = [-21.5, -17, -7.5, 1.5, 9.5, 15.5, 17.5, 15.5, 9, 0.5, -11, -19];
          const MONN = ["1-р", "2-р", "3-р", "4-р", "5-р", "6-р", "7-р", "8-р", "9-р", "10-р", "11-р", "12-р"];

          box.innerHTML = `
            <div class="lab-head"><span class="ic">🌀</span><b>Даралт ба салхины симуляц</b></div>
            <div class="ctl-row">
              ${D.slider({ id: "s8mon", label: "Сар", min: 0, max: 11, value: 0, display: "1-р сар" })}
            </div>
            <div id="s8sim" class="mt16"></div>
            <div class="readout" id="s8sro"></div>
            <div id="s8snote"></div>
            <div class="mt24">${D.line({
              labels: MONN.map((m) => m.replace("-р", "")),
              values: PRESS, min: 995, max: 1045, unit: "гПа", height: 190, alt: "Даралтын жилийн явц",
            })}</div>
            <p class="muted tc" style="font-size:.83rem">Улаанбаатарын агаарын даралтын жилийн явц (гПа, ойролцоо)</p>`;
          host.appendChild(box);

          const border = GZ.MN_BORDER.map(([lo, la], i) => {
            const [x, y] = IL.xy(lo, la);
            return (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
          }).join(" ") + " Z";

          const inp = $("#s8mon", box);
          function upd() {
            const m = Number(inp.value);
            const P = PRESS[m], T = TEMP[m];
            $("#s8mon-v", box).textContent = MONN[m] + " сар";
            const high = P >= 1018;
            const strength = GZ.clamp((P - 1003) / 37, 0, 1);

            // Изобарын тойрог + салхины сум
            const CX = 560, CY = 250;
            let iso = "";
            for (let k = 1; k <= 4; k++) {
              const rx = 110 * k, ry = 62 * k;
              iso += `<ellipse cx="${CX}" cy="${CY}" rx="${rx}" ry="${ry}" fill="none"
                stroke="${high ? "#c2571a" : "#2563a5"}" stroke-opacity="${(0.16 + strength * 0.4).toFixed(2)}"
                stroke-width="2" stroke-dasharray="7 5"/>
                <text x="${CX + rx - 4}" y="${CY - 4}" text-anchor="end" style="font-size:15px;font-weight:700;fill:${high ? "#c2571a" : "#2563a5"};opacity:.75">${P - (high ? 1 : -1) * k * 4}</text>`;
            }
            let arrows = "";
            for (let a = 0; a < 360; a += 45) {
              const rad = (a * Math.PI) / 180;
              const r0 = high ? 70 : 300, r1 = high ? 300 : 70;
              const x1 = CX + Math.cos(rad) * r0 * 1.4, y1 = CY + Math.sin(rad) * r0 * 0.8;
              const x2 = CX + Math.cos(rad) * r1 * 1.4, y2 = CY + Math.sin(rad) * r1 * 0.8;
              arrows += `<line x1="${x1.toFixed(0)}" y1="${y1.toFixed(0)}" x2="${x2.toFixed(0)}" y2="${y2.toFixed(0)}"
                stroke="${high ? "#c2571a" : "#2563a5"}" stroke-width="${(2 + strength * 4).toFixed(1)}"
                stroke-opacity="${(0.3 + strength * 0.5).toFixed(2)}" marker-end="url(#s8arw)"/>`;
            }

            $("#s8sim", box).innerHTML = `<svg class="choro" viewBox="0 0 1000 494">
              <defs><marker id="s8arw" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                <path d="M0 0 L10 5 L0 10 z" fill="${high ? "#c2571a" : "#2563a5"}"/></marker></defs>
              <rect width="1000" height="494" fill="${high ? "rgba(194,87,26,.05)" : "rgba(37,99,165,.05)"}"/>
              ${iso}${arrows}
              <path d="${border}" fill="var(--surface)" fill-opacity=".82" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round"/>
              <text x="${CX}" y="${CY + 8}" text-anchor="middle" style="font-size:34px;font-weight:800;fill:${high ? "#c2571a" : "#2563a5"}">${high ? "В" : "Н"}</text>
              <text x="${CX}" y="${CY + 34}" text-anchor="middle" style="font-size:16px;font-weight:700;fill:var(--ink-3)">${P} гПа</text>
            </svg>`;

            $("#s8sro", box).innerHTML = `
              <div class="cell ${high ? "warn" : "good"}"><div class="k">Даралт</div><div class="v">${P} гПа</div></div>
              <div class="cell"><div class="k">Төрөл</div><div class="v" style="font-size:.95rem">${high ? "Антициклон" : "Нам даралт"}</div></div>
              <div class="cell ${T < -10 ? "bad" : T > 10 ? "warn" : ""}"><div class="k">Дундаж темп.</div><div class="v">${T} °C</div></div>
              <div class="cell"><div class="k">Салхины чиглэл</div><div class="v" style="font-size:.95rem">${high ? "Гадагш ↗" : "Дотогш ↙"}</div></div>`;

            $("#s8snote", box).innerHTML = `<div class="alert ${high ? "warn" : "ok"}" style="margin-top:12px">
              <span class="ic">${high ? "❄️" : "🌧️"}</span>
              <p>${high
                ? `<b>${MONN[m]} сар — антициклон ноёрхож байна.</b> Агаар доошилж шахагдана → үүл тарна →
                   тэнгэр цэлмэг → шөнийн дулаан огторгуй руу чөлөөтэй алдагдана → хүчтэй хүйтрэлт.
                   Салхи сул, агаар зогсонги байдаг тул хотод <b>инверси</b> үүсч утаа хуримтлагдана.`
                : `<b>${MONN[m]} сар — даралт буурсан.</b> Агаар халж дээшилнэ → чийг конденсацлана →
                   үүлшил, аадар бороо. Монголын жилийн тунадасны дийлэнх яг энэ саруудад ордог.`}</p></div>`;
          }
          inp.addEventListener("input", upd);
          upd();
        },
      },

      /* ---------------- 7 ---------------- */
      {
        t: "Зудын эрсдэлийн загвар", min: 5, kind: "lab",
        html: `<p>Зуд бол нэг шалтгаантай биш — хэд хэдэн хүчин зүйлийн <b>хосолмол</b> үр дүн.
          Гулсууруудыг хөдөлгөж, эрсдэл хэрхэн өөрчлөгдөхийг үзээрэй.</p>`,
        mount(host) {
          const box = GZ.el("div", { class: "lab" });
          box.innerHTML = `
            <div class="lab-head"><span class="ic">🐑</span><b>Зудын эрсдэлийн симуляц</b></div>
            <div class="ctl-row">
              ${D.slider({ id: "s8rain", label: "Зуны хур тунадас", min: 20, max: 350, value: 220, step: 10, unit: " мм" })}
              ${D.slider({ id: "s8snow", label: "Өвлийн цасны зузаан", min: 0, max: 60, value: 12, unit: " см" })}
              ${D.slider({ id: "s8herd", label: "Малын тоо", min: 20, max: 90, value: 65, unit: " сая" })}
              ${D.slider({ id: "s8feed", label: "Бэлтгэсэн өвс тэжээл", min: 0, max: 100, value: 45, unit: "%" })}
            </div>
            <div class="grid g2 mt16" style="gap:16px;align-items:center">
              <div id="s8gauge"></div>
              <div class="readout" id="s8zro" style="margin-top:0"></div>
            </div>
            <div id="s8znote"></div>
            <p class="lab-note">💡 Түүхэн жишээ: 2009–2010 оны зудад <b>10 сая гаруй мал</b> хорогдсон.
              Тэр жил зуны ган (тунадас багассан) + өвлийн их цас + малын тоо түүхэн дээд хэмжээнд байсан гурав давхцсан.</p>`;
          host.appendChild(box);

          const ids = ["s8rain", "s8snow", "s8herd", "s8feed"];
          function upd() {
            const rain = Number($("#s8rain", box).value);
            const snow = Number($("#s8snow", box).value);
            const herd = Number($("#s8herd", box).value);
            const feed = Number($("#s8feed", box).value);
            $("#s8rain-v", box).textContent = rain + " мм";
            $("#s8snow-v", box).textContent = snow + " см";
            $("#s8herd-v", box).textContent = herd + " сая";
            $("#s8feed-v", box).textContent = feed + "%";

            // Загвар: бэлчээрийн ачаалал + цасны дарамт − тэжээлийн нөөц
            const pasture = GZ.clamp((rain - 40) / 240, 0, 1);        // бэлчээрийн ургац
            const load = GZ.clamp(herd / 90, 0, 1);                   // ачаалал
            const snowRisk = GZ.clamp(snow / 45, 0, 1);               // цагаан зуд
            const dryRisk = snow < 3 ? 0.35 : 0;                      // хар зуд
            let risk = (1 - pasture) * 42 + load * 22 + snowRisk * 30 + dryRisk * 100 * 0.2 - (feed / 100) * 26;
            risk = GZ.clamp(risk, 0, 100);

            const col = risk > 70 ? "var(--danger)" : risk > 45 ? "var(--terra)" : risk > 25 ? "var(--gold)" : "var(--ok)";
            const lvl = risk > 70 ? "Маш өндөр" : risk > 45 ? "Өндөр" : risk > 25 ? "Дунд" : "Бага";
            $("#s8gauge", box).innerHTML = D.gauge(risk, lvl + " (" + Math.round(risk) + ")", col);

            $("#s8zro", box).innerHTML = `
              <div class="cell ${pasture < 0.4 ? "bad" : "good"}"><div class="k">Бэлчээрийн ургац</div><div class="v">${Math.round(pasture * 100)}%</div></div>
              <div class="cell ${load > 0.8 ? "bad" : ""}"><div class="k">Бэлчээрийн ачаалал</div><div class="v">${Math.round(load * 100)}%</div></div>
              <div class="cell ${snow > 30 ? "bad" : snow < 3 ? "warn" : "good"}"><div class="k">Зудын төрөл</div>
                <div class="v" style="font-size:.9rem">${snow > 30 ? "Цагаан зуд" : snow < 3 ? "Хар зуд" : "Хэвийн"}</div></div>
              <div class="cell ${feed < 30 ? "bad" : feed > 60 ? "good" : "warn"}"><div class="k">Тэжээлийн хамгаалалт</div><div class="v">${feed}%</div></div>`;

            $("#s8znote", box).innerHTML = `<div class="alert ${risk > 60 ? "warn" : "ok"}" style="margin-top:14px">
              <span class="ic">${risk > 70 ? "🚨" : risk > 45 ? "⚠️" : "✅"}</span>
              <p>${
                risk > 70 ? "<b>Гамшгийн эрсдэл.</b> Мал бөөнөөр хорогдох магадлалтай. Яаралтай нүүлгэн шилжүүлэх, тэжээл татах шаардлагатай."
                : risk > 45 ? "<b>Анхааруулах түвшин.</b> Отор нүүдэл хийх, нэмэлт тэжээл бэлтгэх шаардлагатай."
                : risk > 25 ? "Хэвийн боловч болгоомжлох хэрэгтэй. Тэжээлийн нөөцөө шалгаарай."
                : "<b>Эрсдэл бага.</b> Бэлчээр хангалттай, тэжээлийн нөөц сайн."}
                ${snow < 3 ? " <br><b>Санамж:</b> цас бага байгаа нь сайн биш — мал цаснаас ус авдаг тул <b>хар зуд</b>-ын эрсдэл нэмэгдэнэ." : ""}</p></div>`;
          }
          ids.forEach((id) => $("#" + id, box).addEventListener("input", upd));
          upd();
        },
      },

      /* ---------------- 8 ---------------- */
      {
        t: "Мэдлэгээ шалгах", min: 3, kind: "check",
        html: `<p>Симуляцаас сурсан зүйлээ бататгая.</p>`,
        quiz: [
          { q: "Өвлийн улиралд Монголыг бүрхэх өндөр даралтын мужийг юу гэдэг вэ?", options: ["Азорын максимум", "Сибирийн антициклон", "Исландын минимум", "Алеутын циклон"], answer: 1, why: "Сибирийн антициклон нь дэлхийн хамгийн хүчтэй өндөр даралтын муж бөгөөд Монголын өвлийн хүйтрэлтийн гол шалтгаан." },
          { q: "1 300 м өндөрт +18 °С байв. 3 300 м өндөрт хэд байх вэ?", options: ["+6 °С", "0 °С", "−6 °С", "+12 °С"], answer: 0, why: "2 000 м ÷ 100 = 20; 20 × 0.6 = 12 °С буурна; 18 − 12 = +6 °С." },
          { q: "Антициклоны нөхцөлд салхи ямар чиглэлд урсах вэ?", options: ["Төв рүү дотогш", "Төвөөс гадагш", "Дээш босоо", "Салхи үүсэхгүй"], answer: 1, why: "Өндөр даралтаас нам даралт руу — өөрөөр хэлбэл антициклоны төвөөс гадагш." },
          { q: "Цас бага, ус олдохгүйгээс мал хорогдох зудыг юу гэдэг вэ?", options: ["Цагаан зуд", "Хар зуд", "Төмөр зуд", "Туурайн зуд"], answer: 1, why: "Хар зуд — цас, ус байхгүйгээс мал ундаалж чадахгүй болно." },
          { q: "Монголын жилийн хур тунадасны дийлэнх нь хэзээ ордог вэ?", options: ["1–3 сар", "3–5 сар", "5–9 сар", "10–12 сар"], answer: 2, why: "85–90% нь 5–9 саруудад буюу дулааны улиралд ордог." },
        ],
      },
    ],
  });
})();
