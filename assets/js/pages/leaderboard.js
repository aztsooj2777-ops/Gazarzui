/* ==========================================================================
   Тэргүүлэгчид
   ========================================================================== */
(function () {
  "use strict";
  const GZ = window.GZ, $ = GZ.$, esc = GZ.esc;

  let filter = "all";

  const FILTERS = [{ v: "all", t: "Бүгд" }, { v: "quiz", t: "Сорил" }]
    .concat((GZ.GAMES || []).map((g) => ({ v: g.id, t: g.name })));

  async function boot() {
    $("#lbFilter").innerHTML = FILTERS.map((f) =>
      `<button class="chip${f.v === filter ? " active" : ""}" data-v="${f.v}">${esc(f.t)}</button>`).join("");
    $("#lbFilter").addEventListener("click", (e) => {
      const b = e.target.closest(".chip");
      if (!b) return;
      filter = b.dataset.v;
      GZ.$$("#lbFilter .chip").forEach((x) => x.classList.toggle("active", x === b));
      load();
    });
    await GZ.store.ready;
    load();
  }

  async function load() {
    $("#lbRoot").innerHTML = `<div class="card"><div class="row"><div class="spinner"></div><span class="muted">Ачаалж байна…</span></div></div>`;
    const rows = await GZ.store.leaderboard(filter);
    render(rows);
  }

  function render(rows) {
    const me = GZ.store.user;
    if (!rows.length) {
      $("#lbRoot").innerHTML = `
        <div class="empty card">
          <div class="big">🏅</div>
          <h3>Одоогоор оноо алга</h3>
          <p>Эхний оноог та авах боломжтой — сорил өгөх эсвэл тоглоом тоглоорой.</p>
          <div class="row center row-wrap mt16">
            <a class="btn btn-primary" href="quiz.html">Сорил өгөх</a>
            <a class="btn btn-outline" href="games.html">Тоглоом тоглох</a>
          </div>
        </div>`;
      return;
    }

    const top = rows.slice(0, 3);
    const rest = rows.slice(3);
    const podOrder = [top[1], top[0], top[2]].filter(Boolean);

    $("#lbRoot").innerHTML = `
      <div class="podium">
        ${podOrder.map((r) => {
          const rank = rows.indexOf(r) + 1;
          return `<div class="pod p${rank}">
            <div class="avatar lg" style="margin:0 auto 8px">${esc(GZ.initials(r.name))}</div>
            <div class="rank">${rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}</div>
            <div class="nm">${esc(r.name)}</div>
            <div class="sc mono">${GZ.fmtNum(r.total)} оноо</div>
            <div class="muted" style="font-size:.78rem">${r.plays} тоглолт</div>
          </div>`;
        }).join("")}
      </div>

      ${rest.length ? `
      <div class="table-wrap">
        <table class="tbl">
          <thead><tr><th style="width:60px">#</th><th>Нэр</th><th>Нийт оноо</th><th>Дээд дүн</th><th>Тоглолт</th></tr></thead>
          <tbody>
            ${rest.map((r, i) => `
              <tr${me && r.id === me.id ? ' style="background:var(--teal-soft)"' : ""}>
                <td><span class="rank-badge">${i + 4}</span></td>
                <td><div class="row" style="gap:10px"><div class="avatar sm">${esc(GZ.initials(r.name))}</div>
                  <b>${esc(r.name)}</b>${me && r.id === me.id ? ' <span class="badge teal">Та</span>' : ""}</div></td>
                <td class="mono"><b>${GZ.fmtNum(r.total)}</b></td>
                <td class="mono muted">${GZ.fmtNum(r.best)}</td>
                <td class="mono muted">${r.plays}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>` : ""}

      <div class="alert mt24"><span class="ic">${GZ.store.mode === "cloud" ? "🌍" : "💾"}</span>
        <p>${GZ.store.mode === "cloud"
          ? "Энэ жагсаалт бүх хэрэглэгчийн оноог харуулж байна."
          : "Supabase холбогдоогүй тул зөвхөн энэ төхөөрөмжийн оноо харагдаж байна. Нийтийн жагсаалт үүсгэхийн тулд <code>assets/js/config.js</code>-д Supabase түлхүүрээ оруулна уу."}</p></div>`;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
