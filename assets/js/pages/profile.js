/* ==========================================================================
   Миний профайл — ахиц, оноо, тэмдэг
   ========================================================================== */
(function () {
  "use strict";
  const GZ = window.GZ, $ = GZ.$, esc = GZ.esc;

  const BADGES = [
    { id: "first",    e: "🌱", t: "Анхны алхам",      d: "Эхний сорилоо өгсөн",           test: (s) => s.plays >= 1 },
    { id: "reader",   e: "📖", t: "Уншигч",           d: "5 хичээл үзсэн",                test: (s) => s.lessons >= 5 },
    { id: "scholar",  e: "🎓", t: "Судлаач",          d: "15 хичээл үзсэн",               test: (s) => s.lessons >= 15 },
    { id: "complete", e: "🏛️", t: "Хөтөлбөр дуусгагч", d: "Бүх хичээлийг үзсэн",          test: (s) => s.lessons >= 22 },
    { id: "quiz10",   e: "🎯", t: "Тогтмол",          d: "10 сорил өгсөн",                test: (s) => s.quizzes >= 10 },
    { id: "perfect",  e: "💯", t: "Төгс дүн",         d: "Сорилыг 100%-иар өгсөн",        test: (s) => s.perfect },
    { id: "gamer",    e: "🎮", t: "Тоглогч",          d: "Бүх 6 тоглоомыг тоглосон",      test: (s) => s.gamesPlayed >= 6 },
    { id: "score500", e: "⭐", t: "500 оноо",         d: "Нийт 500 оноо цуглуулсан",      test: (s) => s.total >= 500 },
    { id: "score2000",e: "🏆", t: "2000 оноо",        d: "Нийт 2000 оноо цуглуулсан",     test: (s) => s.total >= 2000 },
    { id: "mapper",   e: "🗺️", t: "Зурагчин",         d: "Аймаг таних тоглоомд 150+ оноо", test: (s) => s.bestAimag >= 150 },
  ];

  async function boot() {
    await GZ.store.ready;
    const root = $("#profileRoot");
    const u = GZ.store.user;

    if (!u) {
      root.innerHTML = `
        <section class="section"><div class="wrap">
          <div class="empty">
            <div class="big">👤</div>
            <h2>Нэвтрээгүй байна</h2>
            <p>Ахиц, оноогоо харахын тулд нэвтэрнэ үү.</p>
            <a class="btn btn-primary mt16" href="auth.html">Нэвтрэх / Бүртгүүлэх</a>
          </div>
        </div></section>`;
      return;
    }

    const s = stats();

    root.innerHTML = `
      <section class="page-hero">
        <div class="topo"></div>
        <div class="wrap">
          <div class="crumbs"><a href="index.html">Нүүр</a> <span>›</span> <span>Профайл</span></div>
          <div class="row row-wrap" style="gap:20px;align-items:center">
            <div class="avatar xl" style="background:rgba(255,255,255,.16);border:2px solid rgba(255,255,255,.3)">${esc(GZ.initials(u.name))}</div>
            <div>
              <h1 style="margin-bottom:6px">${esc(u.name)}</h1>
              <p style="margin:0">${esc(u.email || "Оффлайн профайл")}${u.grade ? " · " + esc(u.grade) : ""}${u.school ? " · " + esc(u.school) : ""}</p>
              <div class="row row-wrap mt16" style="gap:8px">
                <span class="badge" style="background:rgba(255,255,255,.16);color:#fff">${GZ.fmtNum(s.total)} оноо</span>
                <span class="badge" style="background:rgba(255,255,255,.16);color:#fff">${s.earned.length} тэмдэг</span>
                <button class="btn btn-light btn-sm" id="editBtn">Профайл засах</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section-sm">
        <div class="wrap">
          <div class="grid g4 mb32">
            <div class="card stat"><div class="stat-num">${GZ.fmtNum(s.total)}</div><div class="stat-label">Нийт оноо</div></div>
            <div class="card stat"><div class="stat-num">${s.lessons}/${(GZ.LESSONS || []).length}</div><div class="stat-label">Үзсэн хичээл</div></div>
            <div class="card stat"><div class="stat-num">${s.quizzes}</div><div class="stat-label">Өгсөн сорил</div></div>
            <div class="card stat"><div class="stat-num">${s.plays}</div><div class="stat-label">Нийт тоглолт</div></div>
          </div>

          <div class="card mb24">
            <div class="row between mb8"><h3 style="margin:0">Хөтөлбөрийн ахиц</h3>
              <span class="mono muted">${Math.round((s.lessons / Math.max(1, (GZ.LESSONS || []).length)) * 100)}%</span></div>
            <div class="progress"><span style="width:${(s.lessons / Math.max(1, (GZ.LESSONS || []).length)) * 100}%"></span></div>
            <div class="grid g4 mt24" id="trackProgress"></div>
          </div>

          <h3>Тэмдгүүд</h3>
          <div class="grid g-auto-sm mb32" id="badgeGrid"></div>

          <h3>Сүүлийн үйл ажиллагаа</h3>
          <div id="historyBox"></div>
        </div>
      </section>`;

    renderTracks(s);
    renderBadges(s);
    renderHistory();
    $("#editBtn").addEventListener("click", () => edit(u));
  }

  function stats() {
    const hist = GZ.store.history();
    const progress = GZ.store.progress();
    const quizRows = hist.filter((h) => h.kind === "quiz");
    const gameRows = hist.filter((h) => h.kind === "game");
    const total = hist.reduce((a, h) => a + (Number(h.score) || 0), 0);
    return {
      total,
      lessons: Object.keys(progress).length,
      quizzes: quizRows.length,
      plays: hist.length,
      perfect: quizRows.some((h) => h.meta && h.meta.pct === 100),
      gamesPlayed: new Set(gameRows.map((h) => h.game)).size,
      bestAimag: Math.max(0, ...gameRows.filter((h) => h.game === "aimag").map((h) => h.score)),
      earned: [],
    };
  }

  function renderTracks(s) {
    const tracks = ["7-р анги", "8-р анги", "9-р анги", "Геологийн түүх"];
    const progress = GZ.store.progress();
    $("#trackProgress").innerHTML = tracks.map((t) => {
      const all = (GZ.LESSONS || []).filter((l) => l.track === t);
      const done = all.filter((l) => progress[l.id]).length;
      const pct = all.length ? (done / all.length) * 100 : 0;
      return `<div>
        <div class="row between" style="font-size:.85rem;margin-bottom:6px">
          <span>${esc(t)}</span><span class="mono muted">${done}/${all.length}</span>
        </div>
        <div class="progress"><span style="width:${pct}%"></span></div>
      </div>`;
    }).join("");
  }

  function renderBadges(s) {
    const earned = BADGES.filter((b) => b.test(s));
    s.earned = earned;
    $("#badgeGrid").innerHTML = BADGES.map((b) => {
      const has = earned.includes(b);
      return `<div class="badge-tile${has ? "" : " locked"}">
        <div class="e">${b.e}</div>
        <div class="t">${esc(b.t)}</div>
        <div class="d">${esc(b.d)}</div>
      </div>`;
    }).join("");
  }

  function renderHistory() {
    const hist = GZ.store.history().slice(0, 12);
    const label = (h) => {
      if (h.kind === "quiz") return "Сорил · " + ((h.meta && h.meta.cat) || "");
      if (h.kind === "lesson") return "Хичээл · " + ((h.meta && h.meta.title) || "");
      const g = (GZ.GAMES || []).find((x) => x.id === h.game);
      return "Тоглоом · " + (g ? g.name : h.game);
    };
    $("#historyBox").innerHTML = hist.length ? `
      <div class="table-wrap">
        <table class="tbl">
          <thead><tr><th>Хэзээ</th><th>Юу</th><th>Оноо</th></tr></thead>
          <tbody>${hist.map((h) => `<tr>
            <td class="muted">${GZ.timeAgo(h.created_at)}</td>
            <td>${esc(label(h))}</td>
            <td class="mono"><b>${h.score}</b>${h.max_score ? ` <span class="muted">/ ${h.max_score}</span>` : ""}</td>
          </tr>`).join("")}</tbody>
        </table>
      </div>` : `<div class="empty card"><div class="big">📋</div><p>Одоогоор түүх алга. Сорил өгөх эсвэл тоглоом тоглоод эхлээрэй.</p>
        <div class="row center row-wrap mt16"><a class="btn btn-primary" href="quiz.html">Сорил өгөх</a>
        <a class="btn btn-outline" href="games.html">Тоглоом</a></div></div>`;
  }

  function edit(u) {
    const form = GZ.el("form");
    form.innerHTML = `
      <div class="field"><label>Нэр</label>
        <input class="input" name="name" value="${esc(u.name)}" required maxlength="60"></div>
      <div class="field"><label>Анги</label>
        <select class="select" name="grade">
          <option value="">Сонгох…</option>
          ${["6-р анги", "7-р анги", "8-р анги", "9-р анги", "10-р анги", "11-р анги", "12-р анги", "Багш", "Бусад"]
            .map((g) => `<option${u.grade === g ? " selected" : ""}>${g}</option>`).join("")}
        </select></div>
      <div class="field"><label>Сургууль</label>
        <input class="input" name="school" value="${esc(u.school || "")}" maxlength="80" placeholder="Жишээ: Прогресс сургууль"></div>
      <button class="btn btn-primary btn-block" type="submit">Хадгалах</button>`;
    const m = GZ.modal({ title: "Профайл засах", content: form });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      await GZ.store.updateProfile({
        name: String(fd.get("name")).trim() || u.name,
        grade: fd.get("grade") || null,
        school: String(fd.get("school")).trim() || null,
      });
      m.close();
      GZ.toast("Хадгаллаа.", "ok");
      location.reload();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
