/* ==========================================================================
   9-Р АНГИЙН ИНТЕРАКТИВ ХИЧЭЭЛ (40 мин)
   «Монголын хүн ам зүй: нягтшил, пирамид, шилжих хөдөлгөөн»
   ========================================================================== */
(function () {
  "use strict";
  const GZ = window.GZ, IL = GZ.IL, D = IL.draw, $ = GZ.$, esc = GZ.esc;

  /* Аймгийн хүн ам — мянган хүн, ойролцоо (2024) */
  const POP = {
    "Улаанбаатар": 1700, "Хөвсгөл": 137, "Орхон": 114, "Сэлэнгэ": 108, "Дархан-Уул": 108,
    "Баян-Өлгий": 106, "Өвөрхангай": 105, "Архангай": 92, "Төв": 92, "Баянхонгор": 88,
    "Ховд": 82, "Увс": 82, "Дорнод": 82, "Хэнтий": 76, "Завхан": 71, "Өмнөговь": 71,
    "Дорноговь": 70, "Сүхбаатар": 63, "Булган": 61, "Говь-Алтай": 57, "Дундговь": 43,
    "Говьсүмбэр": 19,
  };
  const dens = (a) => (POP[a.n] * 1000) / a.area;

  const AGES = ["0–4","5–9","10–14","15–19","20–24","25–29","30–34","35–39","40–44",
                "45–49","50–54","55–59","60–64","65–69","70–74","75–79","80+"];

  /* Нас-хүйсийн бүтцийг өсөлт ба наслалтаас загварчлах */
  function pyramidData(growthPct, lifeExp) {
    const r = growthPct / 100;
    const m = [], f = [];
    for (let i = 0; i < AGES.length; i++) {
      const age = i * 5 + 2;
      const surv = Math.exp(-Math.pow(age / lifeExp, 5.5));
      const cohort = surv / Math.pow(1 + r, age);
      m.push(cohort * 1.05);                       // төрөлтөд эрэгтэй бага зэрэг олон
      f.push(cohort * (1 + Math.min(0.35, age / 220)));  // өндөр насанд эмэгтэй олон
    }
    const tot = m.reduce((a, b) => a + b, 0) + f.reduce((a, b) => a + b, 0);
    return { male: m.map((x) => (x / tot) * 100), female: f.map((x) => (x / tot) * 100) };
  }

  IL.register("g9", {
    grade: 9, emoji: "👥",
    title: "Монголын хүн ам зүй: нягтшил, пирамид, шилжих хөдөлгөөн",
    summary: "Аймгийн нягтшлыг картограмаар харах, нас-хүйсийн пирамид байгуулах, хот руу чиглэсэн шилжилтийг загварчлах 40 минутын дадлага.",
    minutes: 40,
    features: ["Картограм", "Хүн амын пирамид", "Шилжилтийн загвар", "Эрэмбэлэх хүснэгт"],
    next: "«Хичээл → Хүн ам зүй» болон «Хот суурин, дэд бүтэц» бүлгүүдийг уншаарай.",
    goals: [
      "Хүн амын нягтшлыг тооцож, тархалтын тэгш бус байдлыг тайлбарлах",
      "Нас-хүйсийн пирамидын хэлбэрээс дүгнэлт хийх",
      "Хотжилтын хандлагыг график дээр унших",
      "Шилжих хөдөлгөөний түлхэх-татах хүчийг үнэлэх",
      "Хүн ам зүйн ногоон гарцын мөн чанарыг ойлгох",
    ],

    steps: [
      /* ---------------- 1 ---------------- */
      {
        t: "3.5 сая хүн, 1.56 сая км²", min: 2, kind: "read",
        html: `
          <p>Монгол улс газар нутгаараа дэлхийд <b>18-р</b>, харин хүн амын нягтшлаараа
          <b>хамгийн сүүлийн</b> байранд ордог. Энэ хосолмол байдал нь боловсрол, эрүүл мэнд,
          зам тээвэр, эдийн засгийн бүх бодлогыг тодорхойлдог.</p>

          <div class="readout" style="margin:20px 0">
            <div class="cell"><div class="k">Хүн ам</div><div class="v">3.5 сая</div></div>
            <div class="cell"><div class="k">Нягтшил</div><div class="v">2.2 хүн/км²</div></div>
            <div class="cell"><div class="k">Хотод амьдардаг</div><div class="v">69%</div></div>
            <div class="cell"><div class="k">Улаанбаатарт</div><div class="v">48%</div></div>
            <div class="cell"><div class="k">Дундаж нас</div><div class="v">29</div></div>
            <div class="cell"><div class="k">Байгалийн өсөлт</div><div class="v">1.6%</div></div>
          </div>

          <div class="alert"><span class="ic">🤔</span>
            <p><b>Бодож үзээрэй:</b> Сингапурын нягтшил 8 000 хүн/км². Монголынх 2.2.
            Өөрөөр хэлбэл Сингапурын нэг км²-т амьдардаг хүн Монголын <b>3 600 км²</b>-т тархан амьдарна.
            Энэ нь Говьсүмбэр аймгийн тэн хагастай тэнцэнэ.</p></div>

          <p class="mt24">Энэ хичээлээр бид дараах гурван хэрэгслээр хүн амыг судална:
          <b>картограм</b> (хаана?), <b>пирамид</b> (хэн?), <b>шилжилтийн загвар</b> (яагаад нүүж байна?).</p>`,
      },

      /* ---------------- 2 ---------------- */
      {
        t: "Нягтшлын картограм", min: 8, kind: "lab",
        html: `<p>Нягтшил = <b>хүн ам ÷ талбай</b>. Доорх газрын зураг дээр аймаг бүрийн <b>өнгө</b> нь
          нягтшлыг илэрхийлнэ — тод байх тусам нягт. Аймаг дээр дарж дэлгэрэнгүйг үз.</p>`,
        mount(host) {
          const box = GZ.el("div", { class: "lab" });
          const vals = {};
          GZ.AIMAGS.forEach((a) => (vals[a.n] = dens(a)));

          box.innerHTML = `
            <div class="lab-head"><span class="ic">🗺️</span><b>Аймгийн хүн амын нягтшил</b></div>
            <div class="chips mb16" id="s9mode">
              <button class="chip active" data-m="dens">Нягтшил (хүн/км²)</button>
              <button class="chip" data-m="pop">Хүн амын тоо</button>
              <button class="chip" data-m="area">Талбай</button>
            </div>
            <div id="s9map"></div>
            <div id="s9info" class="mt16"></div>
            <div class="readout" id="s9calc" style="margin-top:14px"></div>
            <p class="lab-note">💡 Улаанбаатарыг оруулаад тооцвол дундаж нягтшил 2.2 хүн/км².
              Хэрэв нийслэлийг хасвал үлдсэн нутгийн дундаж ердөө <b>1.1 хүн/км²</b> болно.</p>`;
          host.appendChild(box);

          let mode = "dens";
          function draw() {
            const v = {};
            GZ.AIMAGS.forEach((a) => {
              v[a.n] = mode === "dens" ? dens(a) : mode === "pop" ? POP[a.n] : a.area / 1000;
            });
            $("#s9map", box).innerHTML = D.choropleth({
              values: v, sizeBy: true, log: mode !== "area", showNames: false,
              fmt: (x) => mode === "dens" ? x.toFixed(1) + " хүн/км²"
                : mode === "pop" ? GZ.fmtNum(x) + " мянга"
                : GZ.fmtNum(Math.round(x)) + " мянган км²",
              alt: "Монголын аймгуудын картограм",
            });
            GZ.$$("#s9map .cdot, #s9map path.a", box).forEach((c) =>
              c.addEventListener("click", () => info(c.dataset.a)));
          }

          function info(name) {
            const a = GZ.AIMAGS.find((x) => x.n === name);
            if (!a) return;
            const d = dens(a);
            $("#s9info", box).innerHTML = `
              <div class="card card-pad-sm">
                <div class="row between row-wrap"><b style="font-size:1.05rem">${esc(a.n)} аймаг</b>
                  <span class="badge teal">${esc(a.zone)} бүс</span></div>
                <p class="muted" style="font-size:.9rem;margin:8px 0 0">${esc(a.fact)}</p>
              </div>`;
            $("#s9calc", box).innerHTML = `
              <div class="cell"><div class="k">Төв</div><div class="v" style="font-size:1rem">${esc(a.c)}</div></div>
              <div class="cell"><div class="k">Хүн ам</div><div class="v">${GZ.fmtNum(POP[a.n])}′</div></div>
              <div class="cell"><div class="k">Талбай</div><div class="v">${GZ.fmtNum(a.area)}</div></div>
              <div class="cell ${d > 10 ? "warn" : d < 0.5 ? "bad" : "good"}"><div class="k">Нягтшил</div><div class="v">${d.toFixed(2)}</div></div>
              <div class="cell"><div class="k">Бодолт</div><div class="v" style="font-size:.8rem">${GZ.fmtNum(POP[a.n] * 1000)} ÷ ${GZ.fmtNum(a.area)}</div></div>`;
          }

          $("#s9mode", box).addEventListener("click", (e) => {
            const b = e.target.closest(".chip"); if (!b) return;
            GZ.$$("#s9mode .chip", box).forEach((c) => c.classList.toggle("active", c === b));
            mode = b.dataset.m; draw();
          });
          draw();
          info("Улаанбаатар");
        },
      },

      /* ---------------- 3 ---------------- */
      {
        t: "Нас-хүйсийн пирамид байгуулах", min: 8, kind: "lab",
        html: `<p>Пирамидын <b>хэлбэр</b> нь улсын ирээдүйг хэлж өгдөг. Байгалийн өсөлт болон
          дундаж наслалтыг өөрчилж, хэлбэр хэрхэн хувирахыг ажигла.</p>`,
        mount(host) {
          const box = GZ.el("div", { class: "lab" });
          box.innerHTML = `
            <div class="lab-head"><span class="ic">📊</span><b>Пирамид загварчлагч</b></div>
            <div class="chips mb16" id="s9pre">
              <button class="chip active" data-g="1.6" data-e="71">🇲🇳 Монгол</button>
              <button class="chip" data-g="-0.5" data-e="84">🇯🇵 Япон</button>
              <button class="chip" data-g="3.7" data-e="63">🇳🇪 Нигер</button>
              <button class="chip" data-g="0.4" data-e="81">🇩🇪 Герман</button>
            </div>
            <div class="ctl-row">
              ${D.slider({ id: "s9g", label: "Байгалийн өсөлт", min: -10, max: 45, value: 16, unit: "%" })}
              ${D.slider({ id: "s9e", label: "Дундаж наслалт", min: 45, max: 90, value: 71, unit: " нас" })}
            </div>
            <div id="s9pyr" class="mt16"></div>
            <div class="chart-legend">
              <span><i style="background:var(--sky)"></i>Эрэгтэй</span>
              <span><i style="background:var(--plum)"></i>Эмэгтэй</span>
            </div>
            <div class="readout" id="s9pro"></div>
            <div id="s9pnote"></div>
            <p class="lab-note">💡 <b>Прогрессив</b> (өргөн суурьтай) = залуу, өсөн нэмэгдэж буй хүн ам.
              <b>Стационар</b> (багана хэлбэртэй) = тогтвортой. <b>Регрессив</b> (нарийссан суурьтай) = хөгширч буй.</p>`;
          host.appendChild(box);

          const g = $("#s9g", box), e = $("#s9e", box);
          function upd() {
            const gr = Number(g.value) / 10, le = Number(e.value);
            $("#s9g-v", box).textContent = gr.toFixed(1) + "%";
            $("#s9e-v", box).textContent = le + " нас";
            const p = pyramidData(gr, le);
            $("#s9pyr", box).innerHTML = D.pyramid({ ages: AGES, male: p.male, female: p.female });

            const young = p.male.slice(0, 3).reduce((a, b) => a + b, 0) + p.female.slice(0, 3).reduce((a, b) => a + b, 0);
            const old = p.male.slice(13).reduce((a, b) => a + b, 0) + p.female.slice(13).reduce((a, b) => a + b, 0);
            const work = 100 - young - old;
            const type = gr > 2 ? "Прогрессив" : gr > 0.5 ? "Прогрессив (зөөлөн)" : gr > -0.2 ? "Стационар" : "Регрессив";

            $("#s9pro", box).innerHTML = `
              <div class="cell"><div class="k">Хэлбэр</div><div class="v" style="font-size:.95rem">${type}</div></div>
              <div class="cell ${young > 25 ? "warn" : ""}"><div class="k">0–14 нас</div><div class="v">${young.toFixed(1)}%</div></div>
              <div class="cell good"><div class="k">Хөдөлмөрийн нас</div><div class="v">${work.toFixed(1)}%</div></div>
              <div class="cell ${old > 18 ? "bad" : ""}"><div class="k">65+ нас</div><div class="v">${old.toFixed(1)}%</div></div>
              <div class="cell"><div class="k">Хүн ам 2 дахин өсөх</div><div class="v">${gr > 0.1 ? Math.round(70 / gr) + " жил" : "—"}</div></div>`;

            $("#s9pnote", box).innerHTML = `<div class="alert ${old > 20 ? "warn" : "ok"}" style="margin-top:12px">
              <span class="ic">${gr > 2 ? "👶" : gr < 0 ? "👵" : "⚖️"}</span>
              <p>${
                gr > 2 ? "<b>Маш залуу хүн ам.</b> Сургууль, ажлын байрны эрэлт эрс өснө. Боловсролд хөрөнгө оруулбал 20 жилийн дараа эдийн засгийн хүчтэй өсөлт өгнө."
                : gr > 0.5 ? "<b>Хүн ам зүйн ногоон гарц.</b> Хөдөлмөрийн насны хүн ам зонхилж байна — Монгол яг энэ үед байгаа. Энэ боломж 20–25 жил үргэлжилнэ."
                : gr > -0.2 ? "<b>Тогтвортой бүтэц.</b> Төрөлт, нас баралт ойролцоо. Хүн ам бараг өсөхгүй."
                : "<b>Хөгширч буй хүн ам.</b> Тэтгэврийн ачаалал өснө, ажиллах хүч хомсдоно. Япон, Герман энэ байдалтай."}</p></div>`;
          }
          g.addEventListener("input", upd); e.addEventListener("input", upd);
          $("#s9pre", box).addEventListener("click", (ev) => {
            const b = ev.target.closest(".chip"); if (!b) return;
            GZ.$$("#s9pre .chip", box).forEach((c) => c.classList.toggle("active", c === b));
            g.value = Math.round(Number(b.dataset.g) * 10);
            e.value = b.dataset.e;
            upd();
          });
          upd();
        },
      },

      /* ---------------- 4 ---------------- */
      {
        t: "Хотжилтын хандлага", min: 5, kind: "read",
        html: () => {
          const years = ["1960", "1970", "1980", "1990", "2000", "2010", "2020", "2024"];
          const urban = [35, 45, 52, 57, 57, 63, 68, 69];
          const ub = [20, 24, 26, 27, 32, 41, 46, 48];
          return `
            <p>Монголын хотжилт 1960-аад оноос эхэлж, 2000 оноос хойш эрс хурдассан.
            Хамгийн онцлох нь — хотжилтын дийлэнх нь <b>ганц хот</b> руу чиглэсэн байдал.</p>
            ${D.line({ labels: years, values: urban, min: 0, max: 80, unit: "%", area: true, teal: true, height: 230, alt: "Хотжилтын хувь" })}
            <p class="muted tc" style="font-size:.85rem">Хотод амьдрагчдын эзлэх хувь (%)</p>

            ${D.bars({ labels: years, values: ub, unit: "%", showValues: true, height: 220, color: "var(--plum)", alt: "УБ-ын эзлэх хувь" })}
            <p class="muted tc" style="font-size:.85rem">Улаанбаатарт амьдрагчдын эзлэх хувь (%)</p>

            <div class="alert warn mt24"><span class="ic">⚠️</span>
              <p><b>Гол ажиглалт:</b> 1990 онд хотод амьдрагчдын 47% нь Улаанбаатарт байсан бол
              өнөөдөр <b>70 гаруй хувь</b> нь нийслэлд төвлөрчээ. Өөрөөр хэлбэл хотжилт биш,
              харин <b>нэг хот руу төвлөрөх</b> үйл явц болж хувирсан.</p></div>

            <h3 style="margin-top:26px">Үр дагавар</h3>
            <div class="vs-grid">
              <div class="vs-box"><h4>Хотод</h4>
                <ul><li>Гэр хорооллын хяналтгүй тэлэлт</li><li>Өвлийн агаарын бохирдол</li>
                <li>Замын түгжрэл, сургуулийн хүрэлцээ</li><li>Ус, дулааны хангамжийн ачаалал</li></ul></div>
              <div class="vs-box b"><h4>Хөдөөд</h4>
                <ul><li>Хүн ам хөгширнө</li><li>Сургууль, эмнэлэг хаагдана</li>
                <li>Бэлчээр эзэнгүйдэх / хэт ачаалагдах</li><li>Уламжлалт мэдлэг тасрах</li></ul></div>
            </div>`;
        },
      },

      /* ---------------- 5 ---------------- */
      {
        t: "Шилжих хөдөлгөөний симуляци", min: 7, kind: "lab",
        html: `<p>Шилжилтийг <b>«түлхэх–татах»</b> загвараар тайлбарладаг. Гулсуурыг хөдөлгөж,
          Улаанбаатар руу чиглэх урсгал хэрхэн өөрчлөгдөхийг үзээрэй.</p>`,
        mount(host) {
          const box = GZ.el("div", { class: "lab" });
          box.innerHTML = `
            <div class="lab-head"><span class="ic">➡️</span><b>Хөдөө → хот шилжилтийн загвар</b></div>
            <div class="ctl-row">
              ${D.slider({ id: "s9zud", label: "Зудын давтамж (10 жилд)", min: 0, max: 5, value: 2, unit: " удаа" })}
              ${D.slider({ id: "s9job", label: "Хөдөөгийн ажлын байр", min: 0, max: 100, value: 30, unit: "%" })}
              ${D.slider({ id: "s9serv", label: "Орон нутгийн үйлчилгээ", min: 0, max: 100, value: 35, unit: "%" })}
              ${D.slider({ id: "s9wage", label: "Хотын цалингийн давуу тал", min: 0, max: 200, value: 90, step: 5, unit: "%" })}
            </div>
            <div class="grid g2 mt16" style="gap:16px;align-items:center">
              <div id="s9flow"></div>
              <div>
                <div class="readout" id="s9mro" style="margin-top:0"></div>
              </div>
            </div>
            <div id="s9mnote"></div>
            <p class="lab-note">💡 <b>Түлхэх хүч</b> = гарал газраас зайлуулах сөрөг нөхцөл.
              <b>Татах хүч</b> = очих газрын давуу тал. Хоёулаа хүчтэй үед урсгал хамгийн их болно.</p>`;
          host.appendChild(box);

          const ids = ["s9zud", "s9job", "s9serv", "s9wage"];
          function upd() {
            const zud = Number($("#s9zud", box).value);
            const job = Number($("#s9job", box).value);
            const serv = Number($("#s9serv", box).value);
            const wage = Number($("#s9wage", box).value);
            $("#s9zud-v", box).textContent = zud + " удаа";
            $("#s9job-v", box).textContent = job + "%";
            $("#s9serv-v", box).textContent = serv + "%";
            $("#s9wage-v", box).textContent = wage + "%";

            const push = (zud / 5) * 45 + (1 - job / 100) * 35 + (1 - serv / 100) * 20;
            const pull = (wage / 200) * 60 + 25;
            const flow = GZ.clamp((push / 100) * (pull / 100) * 90000, 0, 90000);
            const ubShare = GZ.clamp(48 + (flow / 90000) * 14, 40, 66);
            const ger = GZ.clamp(50 + (flow / 90000) * 22, 35, 78);

            const w = GZ.clamp(6 + (flow / 90000) * 40, 6, 46);
            const col = flow > 45000 ? "var(--danger)" : flow > 22000 ? "var(--terra)" : "var(--teal)";
            $("#s9flow", box).innerHTML = `
              <svg class="chart" viewBox="0 0 340 190">
                <defs><marker id="s9a" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto">
                  <path d="M0 0 L10 5 L0 10 z" fill="${col}"/></marker></defs>
                <circle cx="58" cy="95" r="42" fill="var(--surface-3)" stroke="var(--line-2)" stroke-width="2"/>
                <text x="58" y="92" text-anchor="middle" style="font-size:26px">🐎</text>
                <text x="58" y="152" text-anchor="middle" class="tick-b">Хөдөө</text>
                <line x1="106" y1="95" x2="228" y2="95" stroke="${col}" stroke-width="${w.toFixed(1)}"
                  stroke-opacity=".8" marker-end="url(#s9a)" stroke-linecap="round"/>
                <circle cx="280" cy="95" r="46" fill="var(--teal-soft)" stroke="var(--teal)" stroke-width="2"/>
                <text x="280" y="92" text-anchor="middle" style="font-size:28px">🏙️</text>
                <text x="280" y="156" text-anchor="middle" class="tick-b">Улаанбаатар</text>
                <text x="167" y="${w > 24 ? 66 : 74}" text-anchor="middle" style="font-size:14px;font-weight:800;fill:${col}">${GZ.fmtNum(Math.round(flow))}</text>
                <text x="167" y="${w > 24 ? 146 : 138}" text-anchor="middle" class="tick">хүн / жил</text>
              </svg>`;

            $("#s9mro", box).innerHTML = `
              <div class="cell ${push > 60 ? "bad" : push > 35 ? "warn" : "good"}"><div class="k">Түлхэх хүч</div><div class="v">${Math.round(push)}</div></div>
              <div class="cell ${pull > 60 ? "warn" : ""}"><div class="k">Татах хүч</div><div class="v">${Math.round(pull)}</div></div>
              <div class="cell"><div class="k">УБ-ын эзлэх хувь</div><div class="v">${ubShare.toFixed(0)}%</div></div>
              <div class="cell ${ger > 65 ? "bad" : ""}"><div class="k">Гэр хороолол</div><div class="v">${ger.toFixed(0)}%</div></div>`;

            $("#s9mnote", box).innerHTML = `<div class="alert ${flow > 45000 ? "warn" : "ok"}" style="margin-top:14px">
              <span class="ic">${flow > 45000 ? "🚨" : flow > 22000 ? "📈" : "⚖️"}</span>
              <p>${
                flow > 45000 ? "<b>Хяналтгүй урсгал.</b> Гэр хороолол хурдацтай тэлж, дэд бүтэц хоцорно. Агаарын бохирдол, түгжрэл хурцдана."
                : flow > 22000 ? "<b>Дундаж урсгал.</b> Хот өсөж байгаа ч дэд бүтэц гүйцэж чадаж байна."
                : "<b>Тэнцвэртэй байдал.</b> Орон нутагт боломж бүрдсэн тул хүмүүс үлдэж байна."}
              <br><br><b>Туршиж үзээрэй:</b> «Хөдөөгийн ажлын байр» ба «Орон нутгийн үйлчилгээ»-г 80% болгож үзээрэй —
              урсгал хэрхэн буурахыг харна. Энэ бол яг <b>бүсийн төвүүдийг хөгжүүлэх</b> бодлогын логик.</p></div>`;
          }
          ids.forEach((id) => $("#" + id, box).addEventListener("input", upd));
          upd();
        },
      },

      /* ---------------- 6 ---------------- */
      {
        t: "Аймгуудын харьцуулалт", min: 5, kind: "lab",
        html: `<p>Хүснэгтийн <b>гарчиг дээр дарж</b> эрэмбэлээрэй. Юуг анзаарч байна вэ?
          Талбай ихтэй аймгууд нягтшил багатай байна уу?</p>`,
        mount(host) {
          const rows = GZ.AIMAGS.map((a) => [
            a.n, a.c, a.zone, a.area, POP[a.n], Number(dens(a).toFixed(2)),
          ]).sort((x, y) => y[5] - x[5]);

          const box = GZ.el("div", { class: "lab" });
          box.innerHTML = `
            <div class="lab-head"><span class="ic">📋</span><b>21 аймаг + нийслэл</b></div>
            ${D.table({
              head: ["Аймаг", "Төв", "Бүс", "Талбай (км²)", "Хүн ам (мянга)", "Нягтшил"],
              rows, num: [3, 4, 5], dec: 0,
            })}
            <div class="readout mt16">
              <div class="cell"><div class="k">Хамгийн нягт</div><div class="v" style="font-size:.95rem">Улаанбаатар</div></div>
              <div class="cell"><div class="k">Хамгийн сийрэг</div><div class="v" style="font-size:.95rem">Өмнөговь</div></div>
              <div class="cell"><div class="k">Хамгийн том</div><div class="v" style="font-size:.95rem">Өмнөговь</div></div>
              <div class="cell"><div class="k">Хамгийн жижиг</div><div class="v" style="font-size:.95rem">Орхон</div></div>
            </div>
            <div class="alert mt16"><span class="ic">🔍</span>
              <p><b>Дасгал:</b> «Нягтшил» баганаар эрэмбэлээд, дээд 5 болон доод 5-ыг харьцуул.
              Дээд талд нь <b>жижиг талбайтай аж үйлдвэрийн төвүүд</b> (Орхон, Дархан-Уул), доод талд нь
              <b>говийн уудам аймгууд</b> байгааг анзаараарай. Нягтшил нь талбайгаас илүү
              <b>эдийн засгийн үйл ажиллагаа</b>-наас хамаардаг.</p></div>`;
          host.appendChild(box);
        },
      },

      /* ---------------- 7 ---------------- */
      {
        t: "Мэдлэгээ шалгах", min: 3, kind: "check",
        html: `<p>Хичээлээр судалсан зүйлээ бататгая.</p>`,
        quiz: [
          { q: "Хүн амын нягтшлыг хэрхэн тооцох вэ?", options: ["Хүн ам × талбай", "Хүн ам ÷ талбай", "Талбай ÷ хүн ам", "Хүн ам ÷ хот"], answer: 1, why: "Нягтшил = хүн амын тоо ÷ нутаг дэвсгэрийн талбай, нэгж нь хүн/км²." },
          { q: "Өргөн суурьтай, дээшээ нарийссан пирамид юуг илтгэх вэ?", options: ["Хүн ам хөгширч байгаа", "Төрөлт өндөр, хүн ам залуу", "Хүн ам буурч байгаа", "Шилжилт их"], answer: 1, why: "Прогрессив хэлбэр — өндөр төрөлт, залуу бүтэц." },
          { q: "Дараахаас аль нь «түлхэх хүч» вэ?", options: ["Хотын өндөр цалин", "Их сургууль", "Зуд, ган", "Эмнэлгийн үйлчилгээ"], answer: 2, why: "Түлхэх хүч нь гарал газраас зайлуулах сөрөг нөхцөл — зуд, ган, ажилгүйдэл." },
          { q: "Улаанбаатарт улсын хүн амын ойролцоогоор хэдэн хувь нь амьдардаг вэ?", options: ["28%", "38%", "48%", "68%"], answer: 2, why: "Ойролцоогоор 48% буюу бараг тэн хагас нь нийслэлд төвлөрсөн." },
          { q: "«Хүн ам зүйн ногоон гарц» гэж юу вэ?", options: ["Хүн ам буурах үе", "Хөдөлмөрийн насны хүн ам зонхилох үеийн эдийн засгийн боломж", "Хот руу нүүх үйл явц", "Төрөлт огцом буурах"], answer: 1, why: "Хөдөлмөрийн насны хүн ам их байх энэ үед боловсрол, ажлын байранд хөрөнгө оруулбал эдийн засаг хурдацтай өснө." },
          { q: "Хот руу чиглэсэн шилжилтийг бууруулах хамгийн үр дүнтэй бодлого юу вэ?", options: ["Нүүхийг хориглох", "Бүсийн төвүүдэд ажлын байр, үйлчилгээ бий болгох", "Хотын татвар нэмэх", "Гэр хороолол буулгах"], answer: 1, why: "Түлхэх хүчийг арилгах буюу орон нутагт боломж бүрдүүлэх нь шалтгаанд нь нөлөөлдөг." },
        ],
      },

      /* ---------------- 8 ---------------- */
      {
        t: "Дүгнэлт: тоо баримт цаана нь хүн байдаг", min: 2, kind: "read",
        html: `
          <p>Хүн ам зүй бол зөвхөн тоо биш. Нягтшлын карт дээрх цайвар цэг бүрийн ард
          сургууль хаагдсан сум, эмч хүрдэггүй баг, интернэт байхгүй ангиуд байдаг.</p>

          <div class="alert ok"><span class="ic">🌱</span>
            <p><b>Гол санаа:</b> Монголын өнөөгийн залуу бүтэц бол <b>20–25 жилийн боломжийн цонх</b>.
            Энэ хугацаанд боловсрол, эрүүл мэнд, ажлын байранд хөрөнгө оруулж чадвал
            эдийн засаг хүчтэй өснө. Чадахгүй бол хүн ам хөгширсний дараа энэ боломж хаагдана.</p></div>

          <h3 style="margin-top:26px">Дараа нь юу хийх вэ?</h3>
          <ul class="num-list mt16">
            <li><b>Хичээл унших</b><p>«Хүн ам зүй» болон «Хот суурин, дэд бүтэц» бүлгүүд.</p></li>
            <li><b>Сорил өгөх</b><p>«Нийгэм-эдийн засаг» ангилалаар ЭЕШ горимд.</p></li>
            <li><b>Өөрийн аймгийг судлах</b><p>Картограмаас өөрийн аймгийг олоод, нягтшлыг нь бод.</p></li>
          </ul>`,
      },
    ],
  });
})();
