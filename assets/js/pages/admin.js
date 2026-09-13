/* ==========================================================================
   Админ самбар — зөвхөн админ багш
   - Хичээл батлах шаардлагагүй: багш нар шууд нийтэлнэ
   - Админ буруу агуулгыг нуух / устгах
   - Хэрэглэгчийн эрх солих, санал хүсэлт унших
   ========================================================================== */
(function () {
  "use strict";
  const GZ = window.GZ, $ = GZ.$, esc = GZ.esc;

  let tab = "all";
  let cacheLessons = [], cacheProfiles = [];

  async function boot() {
    await GZ.store.ready;
    render();
    document.addEventListener("gz:auth", render);
  }

  async function render() {
    const root = $("#adminRoot");

    if (!GZ.store.user) {
      $("#adminStats").innerHTML = "";
      root.innerHTML = `<div class="empty card"><div class="big">🔒</div>
        <h3>Нэвтэрч орно уу</h3><p>Энэ хуудас зөвхөн админ багшид зориулагдсан.</p>
        <a class="btn btn-primary mt16" href="auth.html?next=admin.html">Нэвтрэх</a></div>`;
      return;
    }
    if (!GZ.store.isAdmin()) {
      $("#adminStats").innerHTML = "";
      root.innerHTML = `<div class="empty card"><div class="big">⛔</div>
        <h3>Хандах эрхгүй</h3>
        <p>Танд админ эрх байхгүй байна. Хэрэв энэ алдаа гэж үзэж байвал системийн админд хандана уу.</p>
        <a class="btn btn-outline mt16" href="index.html">Нүүр хуудас</a></div>`;
      return;
    }

    root.innerHTML = `
      <div class="tabs" id="adminTabs">
        <button data-t="all"${tab === "all" ? ' class="active"' : ""}>Бүх хичээл</button>
        <button data-t="hidden"${tab === "hidden" ? ' class="active"' : ""}>Нуусан</button>
        <button data-t="teachers"${tab === "teachers" ? ' class="active"' : ""}>Багш нар</button>
        <button data-t="messages"${tab === "messages" ? ' class="active"' : ""}>Санал хүсэлт</button>
      </div>
      <div id="adminBody"></div>`;

    $("#adminTabs").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      tab = b.dataset.t;
      GZ.$$("#adminTabs button").forEach((x) => x.classList.toggle("active", x === b));
      body();
    });

    await refreshStats();
    body();
  }

  async function refreshStats() {
    cacheLessons = await GZ.store.listUserLessons({});
    cacheProfiles = await GZ.store.listProfiles();
    const pub = cacheLessons.filter((l) => l.status === "published").length;
    const hid = cacheLessons.filter((l) => l.status !== "published").length;
    const teachers = cacheProfiles.filter((p) => p.role === "teacher").length;
    const w = 'style="background:rgba(255,255,255,.16);color:#fff"';
    $("#adminStats").innerHTML = `
      <span class="badge" ${w}>${pub} нийтлэгдсэн хичээл</span>
      ${hid ? `<span class="badge gold">${hid} нуусан</span>` : ""}
      <span class="badge" ${w}>${teachers} багш</span>
      <span class="badge" ${w}>${cacheProfiles.length} хэрэглэгч</span>`;
  }

  function body() {
    if (tab === "teachers") return teachersView();
    if (tab === "messages") return messagesView();
    return lessonsView(tab === "hidden");
  }

  /* ---------------- Хичээл ---------------- */
  const KIND = { text: "📄 Бичмэл", video: "🎬 Бичлэг", link: "🔗 Холбоос" };
  const STATUS = {
    published: ["ok", "Нийтлэгдсэн"],
    hidden: ["gold", "Нуусан"],
    pending: ["gold", "Хүлээгдэж буй"],
    rejected: ["danger", "Буцаагдсан"],
  };

  async function lessonsView(onlyHidden) {
    const host = $("#adminBody");
    host.innerHTML = `<div class="card"><div class="row"><div class="spinner"></div><span class="muted">Ачаалж байна…</span></div></div>`;
    cacheLessons = await GZ.store.listUserLessons({});
    const rows = onlyHidden ? cacheLessons.filter((l) => l.status !== "published") : cacheLessons;

    if (!rows.length) {
      host.innerHTML = `<div class="empty card"><div class="big">${onlyHidden ? "✅" : "📭"}</div>
        <h3>${onlyHidden ? "Нуусан хичээл алга" : "Хичээл алга"}</h3>
        <p>${onlyHidden ? "Бүх хичээл нээлттэй нийтлэгдсэн байна." : "Багш нар хичээл нэмээгүй байна."}</p></div>`;
      return;
    }

    host.innerHTML = `
      <div class="alert mb24"><span class="ic">ℹ️</span>
        <p>Багш нарын хичээл <b>шууд нийтлэгддэг</b>. Дүрэм зөрчсөн, буруу агуулгыг
        та энд <b>нуух</b> (багшид шалтгаан харагдана) эсвэл <b>бүрмөсөн устгах</b> боломжтой.</p></div>
      <div class="col" style="gap:16px">${rows.map(card).join("")}</div>`;
    bind(host);
  }

  function card(r) {
    const s = STATUS[r.status] || STATUS.pending;
    const files = Array.isArray(r.files) ? r.files : [];
    return `
      <article class="card" data-id="${esc(r.id)}">
        <div class="row row-wrap" style="gap:6px;margin-bottom:8px">
          <span class="badge ${s[0]}">${s[1]}</span>
          <span class="badge teal">${esc(r.track)}</span>
          <span class="badge">${KIND[r.kind] || KIND.text}</span>
          ${files.length ? `<span class="badge">📎 ${files.length} хавсралт</span>` : ""}
        </div>
        <h3 style="margin:0 0 6px;font-size:1.1rem">${esc(r.title)}</h3>
        <p class="muted" style="margin:0 0 10px;font-size:.93rem">${esc(r.summary)}</p>
        <div class="row row-wrap" style="gap:14px;font-size:.82rem;color:var(--ink-4)">
          <span>${GZ.icon("user", 14)} ${esc(r.author_name)}</span>
          <span>${GZ.icon("clock", 14)} ${GZ.timeAgo(r.created_at)}</span>
          ${r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener">Холбоос ↗</a>` : ""}
        </div>
        ${r.body ? `<details class="mt16"><summary style="cursor:pointer;font-size:.88rem;font-weight:600">Агуулга харах</summary>
          <div class="mt8" style="white-space:pre-wrap;font-size:.92rem;color:var(--ink-2)">${esc(r.body)}</div></details>` : ""}
        ${files.length ? `<div class="col mt16" style="gap:6px">${files.map((f) =>
          `<a class="badge" href="${esc(f.url)}" target="_blank" rel="noopener" style="align-self:flex-start">📎 ${esc(f.name)}</a>`).join("")}</div>` : ""}
        <div class="post-actions mt16">
          ${r.status === "published"
            ? `<button class="act" data-hide="${esc(r.id)}" style="color:var(--terra)">🚫 Нийтлэлээс нуух</button>`
            : `<button class="act" data-ok="${esc(r.id)}" style="color:var(--ok)">✓ Буцаан нийтлэх</button>`}
          <button class="act" data-del="${esc(r.id)}" style="color:var(--danger)">🗑 Устгах</button>
        </div>
      </article>`;
  }

  function bind(host) {
    GZ.$$("[data-ok]", host).forEach((b) => b.addEventListener("click", async () => {
      await GZ.store.updateUserLesson(b.dataset.ok, { status: "published", reject_note: null });
      GZ.toast("Хичээлийг буцаан нийтэллээ.", "ok");
      await refreshStats(); body();
    }));

    GZ.$$("[data-hide]", host).forEach((b) => b.addEventListener("click", () => {
      const form = GZ.el("div");
      form.innerHTML = `<p class="muted" style="margin:0 0 12px;font-size:.9rem">
          Хичээл нийтлэлээс алга болно. Багш өөрийн самбар дээрээ шалтгааныг харна.</p>
        <div class="field"><label>Нуух шалтгаан (заавал биш)</label>
        <textarea class="textarea" id="rjNote" maxlength="400"
          placeholder="Жишээ: Эх сурвалжаа дурдана уу / зохиогчийн эрх зөрчсөн"></textarea></div>`;
      GZ.modal({
        title: "Нийтлэлээс нуух", content: form,
        actions: [
          { label: "Болих", class: "btn-ghost" },
          { label: "Нуух", class: "btn-accent", onClick: async (c) => {
              const note = ($("#rjNote") || {}).value || "";
              c();
              await GZ.store.updateUserLesson(b.dataset.hide, { status: "hidden", reject_note: note.trim() || null });
              GZ.toast("Нийтлэлээс нууллаа.");
              await refreshStats(); body();
            } },
        ],
      });
    }));

    GZ.$$("[data-del]", host).forEach((b) => b.addEventListener("click", () => {
      GZ.modal({
        title: "Бүрмөсөн устгах уу?",
        content: "<p>Хичээл болон түүний хэлэлцүүлэг устана. Энэ үйлдлийг буцаах боломжгүй.</p>",
        actions: [
          { label: "Болих", class: "btn-ghost" },
          { label: "Устгах", class: "btn-accent", onClick: async (c) => {
              c();
              await GZ.store.deleteUserLesson(b.dataset.del);
              GZ.toast("Устгалаа.");
              await refreshStats(); body();
            } },
        ],
      });
    }));
  }

  /* ---------------- Багш нар ---------------- */
  async function teachersView() {
    const host = $("#adminBody");
    host.innerHTML = `<div class="card"><div class="row"><div class="spinner"></div><span class="muted">Ачаалж байна…</span></div></div>`;
    cacheProfiles = await GZ.store.listProfiles();

    const order = { admin: 0, teacher: 1, student: 2 };
    const rows = cacheProfiles.slice().sort((a, b) =>
      (order[a.role] ?? 3) - (order[b.role] ?? 3) ||
      Number(a.verified) - Number(b.verified) ||
      String(a.display_name).localeCompare(String(b.display_name), "mn"));

    host.innerHTML = `
      <div class="alert mb24"><span class="ic">ℹ️</span>
        <p>Багшийн эрхтэй хүн бүр хичээлээ <b>шууд нийтэлнэ</b>. Хэрэглэгчийн эрхийг
        энд солино — сурагчийг багш болгох, буруу хэрэглэсэн багшийг сурагч болгож
        нийтлэх эрхийг нь хаах боломжтой.</p></div>
      <div class="table-wrap">
        <table class="tbl">
          <thead><tr><th>Нэр</th><th>Эрх</th><th>Сургууль / хичээл</th><th>Бүртгүүлсэн</th><th>Үйлдэл</th></tr></thead>
          <tbody>
            ${rows.map((p) => {
              const rl = GZ.store.roleLabel(p.role, p.verified);
              const me = GZ.store.user && p.id === GZ.store.user.id;
              return `<tr>
                <td><div class="row" style="gap:9px"><div class="avatar sm">${esc(GZ.initials(p.display_name))}</div>
                  <b>${esc(p.display_name)}</b>${me ? ' <span class="badge teal">Та</span>' : ""}</div></td>
                <td><span class="badge ${rl.cls}">${esc(rl.t)}</span></td>
                <td class="muted" style="font-size:.85rem">${esc([p.school, p.subject, p.grade].filter(Boolean).join(" · ") || "—")}</td>
                <td class="muted" style="font-size:.82rem">${GZ.timeAgo(p.created_at)}</td>
                <td>
                  <div class="row row-wrap" style="gap:5px">
                    ${p.role === "student"
                      ? `<button class="act" data-mk="${esc(p.id)}">Багш болгох</button>` : ""}
                    ${p.role === "teacher"
                      ? `<button class="act" data-stu="${esc(p.id)}">Сурагч болгох</button>` : ""}
                    ${!me && p.role !== "admin"
                      ? `<button class="act" data-adm="${esc(p.id)}" style="color:var(--terra)">Админ болгох</button>` : ""}
                  </div>
                </td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>`;

    const act = async (id, role, verified, msg) => {
      await GZ.store.setUserRole(id, role, verified);
      GZ.toast(msg, "ok");
      await refreshStats(); teachersView();
    };
    GZ.$$("[data-mk]", host).forEach((b) => b.addEventListener("click", () =>
      act(b.dataset.mk, "teacher", true, "Багшийн эрх олголоо.")));
    GZ.$$("[data-stu]", host).forEach((b) => b.addEventListener("click", () =>
      act(b.dataset.stu, "student", false, "Сурагчийн эрхэд шилжүүллээ.")));
    GZ.$$("[data-adm]", host).forEach((b) => b.addEventListener("click", () => {
      GZ.modal({
        title: "Админ эрх олгох уу?",
        content: "<p>Админ нь бүх хичээлийг батлах, устгах, хэрэглэгчийн эрх солих боломжтой болно.</p>",
        actions: [
          { label: "Болих", class: "btn-ghost" },
          { label: "Олгох", class: "btn-primary", onClick: (c) => { c(); act(b.dataset.adm, "admin", true, "Админ эрх олголоо."); } },
        ],
      });
    }));
  }

  /* ---------------- Санал хүсэлт ---------------- */
  async function messagesView() {
    const host = $("#adminBody");
    host.innerHTML = `<div class="card"><div class="row"><div class="spinner"></div><span class="muted">Ачаалж байна…</span></div></div>`;
    const rows = await GZ.store.listMessages();

    host.innerHTML = rows.length ? `<div class="col" style="gap:12px">${rows.map((m) => `
      <div class="card card-pad-sm">
        <div class="row row-wrap between" style="gap:8px">
          <b>${esc(m.name)}</b>
          <span class="muted" style="font-size:.8rem">${GZ.timeAgo(m.created_at)}</span>
        </div>
        ${m.email ? `<a href="mailto:${esc(m.email)}" style="font-size:.85rem">${esc(m.email)}</a>` : ""}
        <p style="margin:8px 0 0;white-space:pre-wrap;font-size:.93rem">${esc(m.body)}</p>
      </div>`).join("")}</div>`
      : `<div class="empty card"><div class="big">📭</div><h3>Санал хүсэлт алга</h3>
         <p>Одоогоор ирсэн захидал байхгүй байна.</p></div>`;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
