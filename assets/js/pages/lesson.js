/* ==========================================================================
   Хичээлийн дэлгэрэнгүй хуудас
   ========================================================================== */
(function () {
  "use strict";
  const GZ = window.GZ, $ = GZ.$, esc = GZ.esc;

  function boot() {
    const id = new URLSearchParams(location.search).get("id");
    const list = GZ.LESSONS || [];
    const L = list.find((x) => x.id === id);
    const root = $("#lessonRoot");

    if (!L) {
      root.innerHTML = `
        <section class="section"><div class="wrap">
          <div class="empty">
            <div class="big">🧭</div>
            <h2>Хичээл олдсонгүй</h2>
            <p>Хаяг буруу байж магадгүй. Хичээлийн жагсаалтаас сонгоно уу.</p>
            <a class="btn btn-primary mt16" href="lessons.html">Хичээлүүд рүү буцах</a>
          </div>
        </div></section>`;
      return;
    }

    document.title = L.title + " — Газарзүй";
    const idx = list.indexOf(L);
    const prev = list[idx - 1], next = list[idx + 1];

    root.innerHTML = `
      <section class="page-hero">
        <div class="topo"></div>
        <div class="wrap">
          <div class="crumbs">
            <a href="index.html">Нүүр</a> <span>›</span>
            <a href="lessons.html?track=${encodeURIComponent(L.track)}">${esc(L.track)}</a> <span>›</span>
            <span>${esc(L.title)}</span>
          </div>
          <div class="row row-wrap" style="gap:8px;margin-bottom:12px">
            <span class="badge teal">${esc(L.track)}</span>
            ${(L.tags || []).map((t) => `<span class="badge" style="background:rgba(255,255,255,.14);color:#fff">${esc(t)}</span>`).join("")}
            <span class="badge" style="background:rgba(255,255,255,.14);color:#fff">${L.minutes} минут</span>
          </div>
          <h1>${L.emoji} ${esc(L.title)}</h1>
          <p>${esc(L.summary)}</p>
        </div>
      </section>

      <section class="section-sm">
        <div class="wrap lesson-layout">
          <article class="prose" id="proseBody"></article>
          <aside>
            <div class="card card-pad-sm lesson-toc mb16">
              <h4 style="font-family:var(--f-sans);font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-4);margin-bottom:10px">Агуулга</h4>
              <ol id="tocList"></ol>
            </div>
            <div class="card card-pad-sm" id="objBox"></div>
          </aside>
        </div>
      </section>

      <section class="section-sm" id="lessonQuizWrap"></section>

      <section class="section-sm">
        <div class="wrap">
          <div class="grid g2" id="prevNext"></div>
        </div>
      </section>`;

    renderProse(L);
    renderToc(L);
    renderObjectives(L);
    renderQuiz(L);
    renderPrevNext(prev, next);

    // Үзсэн гэж тэмдэглэх (10 секунд эсвэл гүйлгэсний дараа)
    let marked = false;
    const mark = () => {
      if (marked) return;
      marked = true;
      GZ.store.markLesson(L.id);
    };
    setTimeout(mark, 12000);
    window.addEventListener("scroll", () => {
      const p = window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight);
      if (p > 0.55) mark();
    }, { passive: true });
  }

  function renderProse(L) {
    const out = [];
    (L.sections || []).forEach((s, i) => {
      out.push(`<h2 id="sec-${i}">${esc(s.h)}</h2>`);
      (s.p || []).forEach((p) => out.push(`<p>${p}</p>`));
      if (s.list && s.list.length) out.push(`<ul>${s.list.map((x) => `<li>${x}</li>`).join("")}</ul>`);
    });

    if (L.terms && L.terms.length) {
      out.push(`<h2 id="sec-terms">Нэр томьёоны тайлбар</h2>`);
      out.push(`<div class="term-grid">${L.terms.map((t) =>
        `<dl class="term"><dt>${esc(t.t)}</dt><dd>${esc(t.d)}</dd></dl>`).join("")}</div>`);
    }
    $("#proseBody").innerHTML = out.join("\n");
  }

  function renderToc(L) {
    const items = (L.sections || []).map((s, i) => ({ h: s.h, id: "sec-" + i }));
    if (L.terms && L.terms.length) items.push({ h: "Нэр томьёо", id: "sec-terms" });
    if (L.quiz && L.quiz.length) items.push({ h: "Бататгах дасгал", id: "sec-quiz" });

    $("#tocList").innerHTML = items.map((x) => `<li><a href="#${x.id}">${esc(x.h)}</a></li>`).join("");

    if ("IntersectionObserver" in window) {
      const links = GZ.$$("#tocList a");
      const io = new IntersectionObserver((en) => {
        en.forEach((e) => {
          if (e.isIntersecting) {
            links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
          }
        });
      }, { rootMargin: "-80px 0px -70% 0px" });
      items.forEach((x) => { const n = document.getElementById(x.id); if (n) io.observe(n); });
    }
  }

  function renderObjectives(L) {
    const done = !!GZ.store.progress()[L.id];
    $("#objBox").innerHTML = `
      <h4 style="font-family:var(--f-sans);font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-4);margin-bottom:10px">Энэ хичээлээр та</h4>
      <ul style="margin:0;padding-left:18px;font-size:.9rem;color:var(--ink-2);line-height:1.6">
        ${(L.objectives || []).map((o) => `<li style="margin-bottom:6px">${esc(o)}</li>`).join("")}
      </ul>
      <div class="mt16">
        ${done ? '<span class="badge ok">✓ Үзсэн гэж тэмдэглэгдсэн</span>' : '<span class="badge">Уншиж эхэлмэгц тэмдэглэгдэнэ</span>'}
      </div>
      <a class="btn btn-outline btn-sm btn-block mt16" href="chat.html?q=${encodeURIComponent(L.title)}">
        Энэ сэдвээр AI багшаас асуух
      </a>`;
  }

  function renderQuiz(L) {
    const wrap = $("#lessonQuizWrap");
    if (!L.quiz || !L.quiz.length) { wrap.remove(); return; }

    wrap.innerHTML = `
      <div class="wrap-narrow" id="sec-quiz">
        <div class="sec-head center">
          <span class="eyebrow">Бататгах</span>
          <h2>Ойлгосон эсэхээ шалгая</h2>
          <p>${L.quiz.length} асуулт. Хариулт бүрд тайлбар гарна.</p>
        </div>
        <div class="card" style="padding:clamp(20px,3vw,32px)" id="lqBox"></div>
      </div>`;

    let i = 0, right = 0;
    const box = $("#lqBox");

    function render() {
      if (i >= L.quiz.length) return done();
      const q = L.quiz[i];
      box.innerHTML = `
        <div class="row between mb16" style="font-size:.85rem">
          <span class="muted mono">Асуулт ${i + 1} / ${L.quiz.length}</span>
          <span class="muted mono">Зөв: ${right}</span>
        </div>
        <div class="progress mb24"><span style="width:${(i / L.quiz.length) * 100}%"></span></div>
        <p class="q-text">${esc(q.q)}</p>
        <div class="opts" id="lqOpts"></div>
        <div id="lqEx"></div>`;
      const opts = $("#lqOpts");
      q.options.forEach((o, k) => {
        const b = GZ.el("button", { class: "opt", html: `<span class="k">${"АБВГ"[k]}</span><span>${esc(o)}</span>` });
        b.addEventListener("click", () => pick(k, q, opts));
        opts.appendChild(b);
      });
    }

    function pick(k, q, opts) {
      Array.from(opts.children).forEach((b, n) => {
        b.disabled = true;
        if (n === q.answer) b.classList.add("correct");
        else if (n === k) b.classList.add("wrong");
      });
      const ok = k === q.answer;
      if (ok) right++;
      $("#lqEx").innerHTML = `
        <div class="explain"><b>${ok ? "Зөв!" : "Зөв хариулт: " + "АБВГ"[q.answer]}</b> — ${esc(q.why)}</div>
        <button class="btn btn-primary mt16" id="lqNext">${i + 1 >= L.quiz.length ? "Дүн харах" : "Дараагийнх →"}</button>`;
      $("#lqNext").addEventListener("click", () => { i++; render(); });
    }

    function done() {
      const pct = Math.round((right / L.quiz.length) * 100);
      GZ.store.saveScore({ kind: "lesson", game: "lesson:" + L.id, score: right * 10, max_score: L.quiz.length * 10, meta: { title: L.title } });
      GZ.store.markLesson(L.id);
      box.innerHTML = `
        <div class="tc">
          <div style="font-size:3rem">${pct === 100 ? "🏆" : pct >= 60 ? "👏" : "📖"}</div>
          <h3 style="margin:8px 0">${right} / ${L.quiz.length} зөв</h3>
          <p class="muted">${pct === 100 ? "Төгс! Энэ сэдвийг бүрэн эзэмшсэн байна."
            : pct >= 60 ? "Сайн байна. Алдсан хэсгээ дахин уншаарай."
            : "Хичээлийг дахин үзээд оролдоод үзье."}</p>
          <div class="row center row-wrap mt16">
            <button class="btn btn-outline" id="lqAgain">Дахин оролдох</button>
            <a class="btn btn-primary" href="quiz.html">Бүтэн сорил өгөх</a>
          </div>
        </div>`;
      $("#lqAgain").addEventListener("click", () => { i = 0; right = 0; render(); });
      GZ.toast("Хичээл дуусгасанд баяр хүргэе!", "ok");
    }

    render();
  }

  function renderPrevNext(prev, next) {
    const host = $("#prevNext");
    const card = (L, dir) => L ? `
      <a class="card card-hover" href="lesson.html?id=${encodeURIComponent(L.id)}" style="display:flex;gap:14px;align-items:center">
        <span style="font-size:1.8rem">${L.emoji}</span>
        <span>
          <span class="muted" style="font-size:.78rem;display:block">${dir}</span>
          <b>${esc(L.title)}</b>
        </span>
      </a>` : `<div></div>`;
    host.innerHTML = card(prev, "← Өмнөх хичээл") + card(next, "Дараагийн хичээл →");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
