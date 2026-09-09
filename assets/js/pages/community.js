/* ==========================================================================
   Хэлэлцүүлэг — нийтлэл, сэтгэгдэл, таалагдсан
   ========================================================================== */
(function () {
  "use strict";
  const GZ = window.GZ, $ = GZ.$, esc = GZ.esc;

  const CATS = ["Бүгд", "Асуулт", "Хэлэлцүүлэг", "Туршлага", "Олдвор", "Зарлал"];
  let cat = "Бүгд", posts = [];

  async function boot() {
    $("#catChips").innerHTML = CATS.map((c) =>
      `<button class="chip${c === cat ? " active" : ""}" data-c="${esc(c)}">${esc(c)}</button>`).join("");
    $("#catChips").addEventListener("click", (e) => {
      const b = e.target.closest(".chip");
      if (!b) return;
      cat = b.dataset.c;
      GZ.$$("#catChips .chip").forEach((x) => x.classList.toggle("active", x === b));
      load();
    });

    $("#newPostBtn").addEventListener("click", newPost);
    await GZ.store.ready;
    load();
  }

  async function load() {
    const host = $("#postList");
    host.innerHTML = `<div class="card"><div class="row"><div class="spinner"></div><span class="muted">Ачаалж байна…</span></div></div>`;
    posts = await GZ.store.listPosts(cat);
    render();
    stats();
  }

  function render() {
    const host = $("#postList");
    if (!posts.length) {
      host.innerHTML = `<div class="empty card">
        <div class="big">💬</div><h3>Энэ ангилалд сэдэв алга</h3>
        <p>Эхний сэдвийг та эхлүүлээрэй!</p></div>`;
      return;
    }
    host.innerHTML = posts.map(postHtml).join("");

    GZ.$$(".post [data-like]").forEach((b) =>
      b.addEventListener("click", () => like(b, b.dataset.like)));
    GZ.$$(".post [data-comments]").forEach((b) =>
      b.addEventListener("click", () => toggleComments(b.dataset.comments)));
  }

  function postHtml(p) {
    const liked = GZ.store.isLiked(p.id);
    return `
      <article class="post" data-id="${esc(p.id)}">
        <div class="avatar${p.teacher ? "" : ""}" style="${p.teacher ? "background:var(--grad-terra)" : ""}">${esc(GZ.initials(p.author_name))}</div>
        <div class="post-main">
          <div class="post-head">
            <b>${esc(p.author_name)}</b>
            ${p.teacher ? '<span class="badge terra">Багш</span>' : ""}
            <span class="badge">${esc(p.category)}</span>
            <span>· ${GZ.timeAgo(p.created_at)}</span>
          </div>
          <h3>${esc(p.title)}</h3>
          <div class="post-body">${esc(p.body)}</div>
          <div class="post-actions">
            <button class="act${liked ? " on" : ""}" data-like="${esc(p.id)}">
              ${GZ.icon("heart", 15)} <span class="n">${p.likes || 0}</span>
            </button>
            <button class="act" data-comments="${esc(p.id)}">
              ${GZ.icon("chat", 15)} Сэтгэгдэл
            </button>
          </div>
          <div class="comments" id="cm-${esc(p.id)}"></div>
        </div>
      </article>`;
  }

  async function like(btn, id) {
    if (!GZ.store.requireUser("Сэдэвт таалагдсан тэмдэг тавихад нэвтэрсэн байх шаардлагатай.")) return;
    const on = await GZ.store.toggleLike(id);
    btn.classList.toggle("on", on);
    const n = btn.querySelector(".n");
    n.textContent = Math.max(0, Number(n.textContent) + (on ? 1 : -1));
  }

  async function toggleComments(id) {
    const box = $("#cm-" + CSS.escape(id));
    if (box.dataset.open) { box.innerHTML = ""; delete box.dataset.open; return; }
    box.dataset.open = "1";
    box.innerHTML = `<div class="row mt16"><div class="spinner"></div></div>`;

    const list = await GZ.store.listComments(id);
    box.innerHTML = `
      ${list.map((c) => `
        <div class="comment">
          <div class="avatar sm">${esc(GZ.initials(c.author_name))}</div>
          <div class="c-body">
            <div class="c-head"><b>${esc(c.author_name)}</b> · ${GZ.timeAgo(c.created_at)}</div>
            <div>${esc(c.body)}</div>
          </div>
        </div>`).join("")}
      <form class="row mt16" style="gap:8px" data-cf="${esc(id)}">
        <input class="input" placeholder="Сэтгэгдэл бичих…" required maxlength="600">
        <button class="btn btn-primary btn-sm" type="submit">Илгээх</button>
      </form>`;

    box.querySelector("form").addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!GZ.store.requireUser("Сэтгэгдэл бичихэд нэвтэрсэн байх шаардлагатай.")) return;
      const inp = e.target.querySelector("input");
      const val = inp.value.trim();
      if (!val) return;
      inp.disabled = true;
      await GZ.store.addComment(id, val);
      delete box.dataset.open;
      await toggleComments(id);
      GZ.toast("Сэтгэгдэл нэмэгдлээ.", "ok");
    });
  }

  function newPost() {
    if (!GZ.store.requireUser("Шинэ сэдэв нээхэд нэвтэрсэн байх шаардлагатай.")) return;
    const form = GZ.el("form", { class: "col", style: "gap:0" });
    form.innerHTML = `
      <div class="field">
        <label>Ангилал</label>
        <select class="select" name="category">
          ${CATS.filter((c) => c !== "Бүгд" && c !== "Зарлал").map((c) => `<option>${esc(c)}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label>Гарчиг</label>
        <input class="input" name="title" required maxlength="140" placeholder="Товч, тодорхой гарчиг бичнэ үү">
      </div>
      <div class="field">
        <label>Агуулга</label>
        <textarea class="textarea" name="body" required maxlength="4000" placeholder="Асуултаа дэлгэрэнгүй тайлбарлаарай. Юуг ойлгосон, юуг ойлгоогүйгээ бичвэл илүү сайн хариулт авна."></textarea>
        <span class="hint">Бусад сурагчид болон багш харах болно.</span>
      </div>
      <button class="btn btn-primary btn-block" type="submit">Нийтлэх</button>`;

    const m = GZ.modal({ title: "Шинэ сэдэв нээх", content: form });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const btn = form.querySelector("button");
      btn.disabled = true; btn.textContent = "Илгээж байна…";
      await GZ.store.addPost({
        category: fd.get("category"),
        title: String(fd.get("title")).trim(),
        body: String(fd.get("body")).trim(),
      });
      m.close();
      GZ.toast("Сэдэв нийтлэгдлээ!", "ok");
      cat = "Бүгд";
      GZ.$$("#catChips .chip").forEach((x) => x.classList.toggle("active", x.dataset.c === "Бүгд"));
      load();
    });
  }

  function stats() {
    const total = posts.length;
    const likes = posts.reduce((s, p) => s + (p.likes || 0), 0);
    $("#statsBox").innerHTML = `
      <h4 style="font-family:var(--f-sans);font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-4);margin-bottom:10px">Нийгэмлэг</h4>
      <div class="row between" style="font-size:.9rem"><span class="muted">Сэдэв</span><b>${total}</b></div>
      <div class="row between" style="font-size:.9rem"><span class="muted">Таалагдсан</span><b>${likes}</b></div>
      <div class="row between" style="font-size:.9rem"><span class="muted">Горим</span><b>${GZ.store.mode === "cloud" ? "Нийтийн" : "Локал"}</b></div>
      ${GZ.store.mode === "local" ? '<p class="muted mt8" style="font-size:.8rem">Supabase холбогдоогүй тул сэдвүүд зөвхөн энэ төхөөрөмж дээр хадгалагдана.</p>' : ""}`;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
