/* ==========================================================================
   Нүүр хуудас
   ========================================================================== */
(function () {
  "use strict";
  const GZ = window.GZ, $ = GZ.$;

  /* ---------------- 1. Баримт эргүүлэгч ---------------- */
  function initFacts() {
    const box = $("#factBox"), dots = $("#factDots");
    if (!box) return;
    const facts = GZ.shuffle(GZ.FACTS).slice(0, 6);
    let i = 0, timer;

    dots.innerHTML = facts.map(() => "<i></i>").join("");
    const dotEls = Array.from(dots.children);

    function show(n) {
      i = (n + facts.length) % facts.length;
      const f = facts[i];
      box.style.opacity = "0";
      box.style.transform = "translateY(8px)";
      setTimeout(() => {
        box.innerHTML = `<p class="q">${GZ.esc(f.q)}</p><p class="a">${GZ.esc(f.a)}</p>`;
        box.style.transition = "opacity .45s, transform .45s";
        box.style.opacity = "1";
        box.style.transform = "none";
      }, 220);
      dotEls.forEach((d, k) => d.classList.toggle("on", k === i));
    }
    function loop() { timer = setInterval(() => show(i + 1), 6500); }
    dotEls.forEach((d, k) => {
      d.style.cursor = "pointer";
      d.addEventListener("click", () => { clearInterval(timer); show(k); loop(); });
    });
    show(0); loop();
  }

  /* ---------------- 2. Өдрийн 5 асуулт ---------------- */
  function initDaily() {
    const host = $("#dailyBox");
    if (!host) return;

    const rnd = GZ.seededRandom(GZ.dayIndex() * 7919 + 13);
    const bank = GZ.QUIZ_BANK.slice();
    const picks = [];
    const used = {};
    while (picks.length < 5 && picks.length < bank.length) {
      const k = Math.floor(rnd() * bank.length);
      if (used[k]) continue;
      used[k] = 1; picks.push(bank[k]);
    }

    const key = "daily:" + GZ.dayIndex();
    let state = GZ.LS.get(key, { idx: 0, right: 0, answers: [] });

    function render() {
      if (state.idx >= picks.length) return renderDone();
      const q = picks[state.idx];
      host.innerHTML = `
        <div class="row between mb16" style="font-size:.85rem">
          <span class="badge teal">${GZ.esc(q.cat)}</span>
          <span class="muted mono">${state.idx + 1} / ${picks.length}</span>
        </div>
        <div class="progress mb24"><span style="width:${(state.idx / picks.length) * 100}%"></span></div>
        <p class="q-text">${GZ.esc(q.q)}</p>
        <div class="opts" id="dOpts"></div>
        <div id="dExplain"></div>`;
      const opts = $("#dOpts");
      q.options.forEach((o, k) => {
        const b = GZ.el("button", { class: "opt", html: `<span class="k">${"АБВГ"[k]}</span><span>${GZ.esc(o)}</span>` });
        b.addEventListener("click", () => answer(k, q, opts));
        opts.appendChild(b);
      });
    }

    function answer(k, q, opts) {
      const btns = Array.from(opts.children);
      btns.forEach((b, n) => {
        b.disabled = true;
        if (n === q.answer) b.classList.add("correct");
        else if (n === k) b.classList.add("wrong");
      });
      const ok = k === q.answer;
      if (ok) state.right++;
      state.answers.push(k);
      $("#dExplain").innerHTML =
        `<div class="explain"><b>${ok ? "Зөв! ✅" : "Зөв хариулт: " + "АБВГ"[q.answer]}</b> — ${GZ.esc(q.why)}</div>
         <button class="btn btn-primary mt16" id="dNext">${state.idx + 1 >= picks.length ? "Дүн харах" : "Дараагийн асуулт →"}</button>`;
      $("#dNext").addEventListener("click", () => {
        state.idx++;
        GZ.LS.set(key, state);
        render();
      });
      GZ.LS.set(key, state);
    }

    function renderDone() {
      const pct = Math.round((state.right / picks.length) * 100);
      const msg = pct === 100 ? "Гайхалтай! Та өнөөдрийн бүх асуултыг зөв хариуллаа. 🏆"
        : pct >= 60 ? "Сайн байна! Цөөн хэдэн зүйлийг давтвал бүрэн болно. 💪"
        : "Эхлэл сайн. Хичээлүүдийг үзээд маргааш дахин оролдоорой. 📚";
      host.innerHTML = `
        <div class="tc">
          <div style="font-size:3rem;line-height:1">${pct === 100 ? "🏆" : pct >= 60 ? "🎉" : "📚"}</div>
          <h3 style="margin:10px 0 6px">${state.right} / ${picks.length} зөв</h3>
          <p class="muted">${msg}</p>
          <div class="progress gold mb24" style="max-width:320px;margin-inline:auto"><span style="width:${pct}%"></span></div>
          <div class="row center row-wrap">
            <a class="btn btn-primary" href="quiz.html">Бүтэн сорил өгөх</a>
            <a class="btn btn-outline" href="lessons.html">Хичээл давтах</a>
          </div>
          <p class="muted mt16" style="font-size:.83rem">Маргааш шинэ 5 асуулт гарна.</p>
        </div>`;
    }

    render();
  }

  /* ---------------- 3. Онцлох хичээл ---------------- */
  function initLessons() {
    const host = $("#featuredLessons");
    if (!host || !GZ.LESSONS) return;
    const picked = [
      GZ.LESSONS.find((l) => l.id === "g7-02"),
      GZ.LESSONS.find((l) => l.id === "g8-03"),
      GZ.LESSONS.find((l) => l.id === "geo-02"),
    ].filter(Boolean);
    host.innerHTML = picked.map((l) => `<div class="reveal">${GZ.lessonCard(l)}</div>`).join("");
    reveal(host);
  }

  /* ---------------- 4. Тоглоомын урьдчилсан ---------------- */
  function initGames() {
    const host = $("#gamePreview");
    if (!host) return;
    host.innerHTML = GZ.GAMES.slice(0, 6).map((g, i) => `<div class="reveal" data-delay="${i * 60}">${GZ.gameCard(g)}</div>`).join("");
    reveal(host);
  }

  /* ---------------- 4b. Интерактив хичээлийн урьдчилсан ---------------- */
  /* Тайлбар: бүрэн тодорхойлолт нь interactive.html дээр ачаалагдана.
     Нүүр хуудсыг хөнгөн байлгах үүднээс энд зөвхөн товч мэдээллийг хадгална. */
  const IL_PREVIEW = [
    { id: "g7", grade: 7, emoji: "🧭", title: "Газрын зураг унших: масштаб, изогипс, азимут",
      summary: "Контур зураг дээр огтлолын профайл байгуулж, луужингаар азимут тогтоох дадлага.",
      features: ["Контур зураг", "Огтлолын профайл", "Луужин"] },
    { id: "g8", grade: 8, emoji: "❄️", title: "Монголын уур амьсгал: эрс тэс байдлын механизм",
      summary: "Климатограмм унших, Сибирийн антициклоны ажиллагааг симуляцаар харах, зудын эрсдэлийг загварчлах.",
      features: ["Климатограмм", "Антициклоны симуляц", "Зудын загвар"] },
    { id: "g9", grade: 9, emoji: "👥", title: "Хүн ам зүй: нягтшил, пирамид, шилжих хөдөлгөөн",
      summary: "Аймгийн нягтшлыг картограмаар харах, нас-хүйсийн пирамид байгуулах, шилжилтийг загварчлах.",
      features: ["Картограм", "Пирамид", "Шилжилтийн загвар"] },
  ];

  function initInteractive() {
    const host = $("#interactivePreview");
    if (!host) return;
    const done = GZ.store.progress();
    host.innerHTML = IL_PREVIEW.map((L, i) => `
      <div class="reveal" data-delay="${i * 70}">
        <a class="card card-hover il-card" href="interactive.html?id=${L.id}">
          <div class="il-cover c${L.grade}">
            <div class="topo"></div>
            <span class="e">${L.emoji}</span>
            ${done["il-" + L.id] ? '<span class="badge ok" style="position:absolute;top:12px;right:12px;z-index:2">✓ Дууссан</span>' : ""}
          </div>
          <div class="il-body">
            <div class="row" style="gap:6px;flex-wrap:wrap">
              <span class="badge teal">${L.grade}-р анги</span><span class="badge gold">40 минут</span>
            </div>
            <h3>${GZ.esc(L.title)}</h3>
            <p>${GZ.esc(L.summary)}</p>
            <div class="il-feat">${L.features.map((f) => `<span>${GZ.esc(f)}</span>`).join("")}</div>
          </div>
        </a>
      </div>`).join("");
    reveal(host);
  }

  /* ---------------- 4c. Багшийн өөрийн бэлтгэсэн хичээл ---------------- */
  function initTeacher() {
    const host = $("#teacherHome");
    if (!host || !GZ.TEACHER_LESSONS) return;
    host.innerHTML = GZ.TEACHER_LESSONS.map((t) => GZ.teacherCard(t)).join("");
    GZ.bindTeacherCards(host);
  }

  function reveal(host) {
    if (!("IntersectionObserver" in window)) { GZ.$$(".reveal", host).forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((en) => {
      en.forEach((x) => {
        if (x.isIntersecting) {
          setTimeout(() => x.target.classList.add("in"), Number(x.target.dataset.delay || 0));
          io.unobserve(x.target);
        }
      });
    }, { threshold: 0.1 });
    GZ.$$(".reveal", host).forEach((e) => io.observe(e));
  }

  function boot() { initFacts(); initDaily(); initInteractive(); initTeacher(); initLessons(); initGames(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
