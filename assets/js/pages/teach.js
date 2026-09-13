/* ==========================================================================
   Багшийн самбар
   - Багш нарын хичээлийн урсгал + хэлэлцүүлэг
   - Өөрийн хичээл (төлөв, засах, устгах)
   - Шинэ хичээл нэмэх: бичлэг, зураг, хөтөлбөр, баримт хавсаргах
   ========================================================================== */
(function () {
  "use strict";
  const GZ = window.GZ, $ = GZ.$, esc = GZ.esc;

  const TRACKS = ["7-р анги", "8-р анги", "9-р анги", "10-р анги", "11-р анги", "12-р анги", "Бүх анги", "Арга зүй"];
  let tab = "feed";
  let pending = [];          // хавсаргахаар хүлээгдэж буй файлууд

  /* ---------------- Эхлүүлэх ---------------- */
  async function boot() {
    await GZ.store.ready;
    renderWho();
    document.addEventListener("gz:auth", () => { renderWho(); render(); });
    render();
  }

  function renderWho() {
    const u = GZ.store.user;
    const host = $("#teachWho");
    if (!u) { host.innerHTML = ""; return; }
    const r = GZ.store.roleLabel(u.role, u.verified);
    host.innerHTML = `
      <div class="row row-wrap" style="gap:8px">
        <span class="badge" style="background:rgba(255,255,255,.16);color:#fff">${esc(u.name)}</span>
        <span class="badge ${r.cls}">${esc(r.t)}</span>
        ${GZ.store.isTeacher() ? '<span class="badge ok">Хичээл шууд нийтлэгдэнэ</span>' : ""}
      </div>`;
  }

  /* ---------------- Бүтэц ---------------- */
  function render() {
    const u = GZ.store.user;
    const root = $("#teachRoot");

    if (!u) {
      root.innerHTML = gate("👋", "Нэвтэрч орно уу",
        "Багшийн самбарыг ашиглахын тулд багшийн эрхээр бүртгүүлэх шаардлагатай.",
        '<a class="btn btn-primary" href="auth.html?role=teacher&next=teach.html">Багшаар бүртгүүлэх</a>' +
        '<a class="btn btn-outline" href="auth.html?next=teach.html">Нэвтрэх</a>');
      return;
    }

    if (!GZ.store.isTeacher()) {
      root.innerHTML = gate("🎓", "Та сурагчийн эрхтэй байна",
        "Багшийн самбарт хичээл нэмэхийн тулд багшийн эрх шаардлагатай. Хэрэв та багш бол админд хандаж эрхээ солиулна уу.",
        '<a class="btn btn-primary" href="lessons.html">Хичээл үзэх</a>' +
        '<a class="btn btn-outline" href="about.html#contact">Админд хандах</a>');
      return;
    }

    root.innerHTML = `
      <div class="tabs" id="teachTabs">
        <button data-t="feed"${tab === "feed" ? ' class="active"' : ""}>Багш нарын хичээл</button>
        <button data-t="mine"${tab === "mine" ? ' class="active"' : ""}>Миний хичээл</button>
        <button data-t="new"${tab === "new" ? ' class="active"' : ""}>＋ Шинэ хичээл</button>
      </div>
      <div id="teachBody"></div>`;

    $("#teachTabs").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      tab = b.dataset.t;
      GZ.$$("#teachTabs button").forEach((x) => x.classList.toggle("active", x === b));
      body();
    });
    body();
  }

  function gate(emoji, title, text, actions) {
    return `<div class="empty card"><div class="big">${emoji}</div>
      <h3>${esc(title)}</h3><p>${esc(text)}</p>
      <div class="row center row-wrap mt16">${actions}</div></div>`;
  }

  function body() {
    if (tab === "new") return formView();
    if (tab === "mine") return listView(true);
    return listView(false);
  }

  /* ---------------- Хичээлийн жагсаалт ---------------- */
  async function listView(mine) {
    const host = $("#teachBody");
    host.innerHTML = `<div class="card"><div class="row"><div class="spinner"></div>
      <span class="muted">Ачаалж байна…</span></div></div>`;

    const rows = await GZ.store.listUserLessons(mine ? { mine: true } : { status: "published" });

    if (!rows.length) {
      host.innerHTML = mine
        ? gate("📝", "Та одоогоор хичээл нэмээгүй байна",
            "Эхний хичээлээ нэмээд бусад багштай хуваалцаарай.",
            '<button class="btn btn-primary" id="goNew">＋ Шинэ хичээл нэмэх</button>')
        : gate("📚", "Одоогоор нийтлэгдсэн хичээл алга",
            "Эхний хичээлийг та нэмж болно.",
            '<button class="btn btn-primary" id="goNew">＋ Шинэ хичээл нэмэх</button>');
      const g = $("#goNew");
      if (g) g.addEventListener("click", () => {
        tab = "new";
        GZ.$$("#teachTabs button").forEach((x) => x.classList.toggle("active", x.dataset.t === "new"));
        body();
      });
      return;
    }

    host.innerHTML = `<div class="col" style="gap:16px">${rows.map((r) => lessonRow(r, mine)).join("")}</div>`;
    bindRows(host, mine);
  }

  const KIND = { text: ["📄", "Бичмэл"], video: ["🎬", "Бичлэг"], link: ["🔗", "Холбоос"] };
  const STATUS = {
    published: ["ok", "Нийтлэгдсэн"],
    hidden:    ["gold", "Админ нуусан"],
    pending:   ["gold", "Хүлээгдэж буй"],
    rejected:  ["danger", "Буцаагдсан"],
  };

  function lessonRow(r, mine) {
    const k = KIND[r.kind] || KIND.text;
    const s = STATUS[r.status] || STATUS.published;
    const files = Array.isArray(r.files) ? r.files : [];
    const canEdit = mine || GZ.store.isAdmin();
    return `
      <article class="card tl-row" data-id="${esc(r.id)}">
        <div class="row row-wrap between" style="align-items:flex-start;gap:12px">
          <div style="flex:1;min-width:240px">
            <div class="row row-wrap" style="gap:6px;margin-bottom:6px">
              <span class="badge teal">${esc(r.track)}</span>
              <span class="badge">${k[0]} ${k[1]}</span>
              ${mine ? `<span class="badge ${s[0]}">${s[1]}</span>` : ""}
              ${files.length ? `<span class="badge">📎 ${files.length}</span>` : ""}
            </div>
            <h3 style="margin:0 0 6px;font-size:1.12rem">${esc(r.title)}</h3>
            <p class="muted" style="margin:0;font-size:.93rem">${esc(r.summary)}</p>
            <div class="row row-wrap mt16" style="gap:14px;font-size:.82rem;color:var(--ink-4)">
              <span>${GZ.icon("user", 14)} ${esc(r.author_name)}</span>
              <span>${GZ.icon("clock", 14)} ${GZ.timeAgo(r.created_at)}</span>
            </div>
          </div>
        </div>
        ${(r.status === "hidden" || r.status === "rejected")
          ? `<div class="alert warn mt16"><span class="ic">🚫</span><p><b>Админ энэ хичээлийг нийтлэлээс хассан.</b>${r.reject_note ? " " + esc(r.reject_note) : ""}</p></div>` : ""}
        <div class="post-actions mt16">
          <button class="act" data-open="${esc(r.id)}">${GZ.icon("book", 15)} Дэлгэрэнгүй</button>
          <button class="act" data-disc="${esc(r.id)}">${GZ.icon("chat", 15)} Хэлэлцүүлэг</button>
          ${canEdit ? `<button class="act" data-del="${esc(r.id)}" style="color:var(--danger)">${GZ.icon("x", 15)} Устгах</button>` : ""}
        </div>
        <div id="d-${esc(r.id)}"></div>
      </article>`;
  }

  function bindRows(host, mine) {
    GZ.$$("[data-open]", host).forEach((b) =>
      b.addEventListener("click", () => openLesson(b.dataset.open)));
    GZ.$$("[data-disc]", host).forEach((b) =>
      b.addEventListener("click", () => toggleDiscussion(b.dataset.disc)));
    GZ.$$("[data-del]", host).forEach((b) =>
      b.addEventListener("click", () => removeLesson(b.dataset.del, mine)));
  }

  /* ---------------- Дэлгэрэнгүй ---------------- */
  async function openLesson(id) {
    const rows = await GZ.store.listUserLessons({});
    const r = rows.find((x) => x.id === id);
    if (!r) return;
    const files = Array.isArray(r.files) ? r.files : [];
    GZ.modal({
      title: r.title,
      wide: true,
      content: `
        <div class="row row-wrap mb16" style="gap:6px">
          <span class="badge teal">${esc(r.track)}</span>
          <span class="badge">${esc(r.author_name)}</span>
          <span class="badge">${GZ.timeAgo(r.created_at)}</span>
        </div>
        <p>${esc(r.summary)}</p>
        ${r.url ? `<p><a class="btn btn-outline btn-sm" href="${esc(r.url)}" target="_blank" rel="noopener">
          ${r.kind === "video" ? "Бичлэг үзэх ↗" : "Холбоос нээх ↗"}</a></p>` : ""}
        ${r.body ? `<div class="prose" style="font-size:.98rem">${esc(r.body).replace(/\n/g, "<br>")}</div>` : ""}
        ${files.length ? `<h4 class="mt24">Хавсралт (${files.length})</h4>
          <div class="col" style="gap:8px">${files.map(fileRow).join("")}</div>` : ""}`,
    });
  }

  function fileRow(f) {
    const isImg = /^image\//.test(f.type || "");
    return `<a class="card card-pad-sm card-hover" href="${esc(f.url)}" target="_blank" rel="noopener"
        style="display:flex;gap:12px;align-items:center;text-decoration:none">
        ${isImg ? `<img src="${esc(f.url)}" alt="" style="width:56px;height:42px;object-fit:cover;border-radius:6px;flex-shrink:0">`
                : `<span style="font-size:1.5rem">${fileIcon(f)}</span>`}
        <span style="flex:1;min-width:0">
          <b style="display:block;font-size:.9rem">${esc(f.name)}</b>
          <small class="muted">${fmtSize(f.size)}</small>
        </span>
        <span style="color:var(--teal)">${GZ.icon("download", 17)}</span>
      </a>`;
  }
  function fileIcon(f) {
    const t = (f.type || "") + " " + (f.name || "");
    if (/video/i.test(t)) return "🎬";
    if (/pdf/i.test(t)) return "📕";
    if (/presentation|powerpoint|pptx?/i.test(t)) return "📊";
    if (/word|document|docx?/i.test(t)) return "📄";
    if (/sheet|excel|xlsx?/i.test(t)) return "📗";
    return "📎";
  }
  const fmtSize = (b) => !b ? "" : b > 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.round(b / 1024) + " KB";

  /* ---------------- Хэлэлцүүлэг ---------------- */
  async function toggleDiscussion(id) {
    const box = document.getElementById("d-" + id);
    if (!box) return;
    if (box.dataset.open) { box.innerHTML = ""; delete box.dataset.open; return; }
    box.dataset.open = "1";
    box.innerHTML = `<div class="row mt16"><div class="spinner"></div></div>`;

    const list = await GZ.store.listLessonComments(id);
    const canWrite = GZ.store.isTeacher();

    box.innerHTML = `
      <div class="mt16" style="border-top:1px solid var(--line);padding-top:14px">
        <div class="row between mb8">
          <b style="font-size:.9rem">Багш нарын санал (${list.length})</b>
        </div>
        ${list.length ? list.map((c) => {
          const rl = GZ.store.roleLabel(c.author_role, true);
          const own = GZ.store.user && (c.user_id === GZ.store.user.id || GZ.store.isAdmin());
          return `<div class="comment">
            <div class="avatar sm">${esc(GZ.initials(c.author_name))}</div>
            <div class="c-body">
              <div class="c-head"><b>${esc(c.author_name)}</b>
                <span class="badge ${rl.cls}" style="font-size:.65rem">${esc(rl.t)}</span>
                · ${GZ.timeAgo(c.created_at)}
                ${own ? `<button class="act" data-delc="${esc(c.id)}" style="padding:2px 8px;font-size:.72rem;margin-left:6px">Устгах</button>` : ""}
              </div>
              <div style="white-space:pre-wrap">${esc(c.body)}</div>
            </div></div>`;
        }).join("") : `<p class="muted" style="font-size:.88rem">Одоогоор санал алга. Эхний саналыг та бичээрэй.</p>`}

        ${canWrite ? `
        <form class="row mt16" style="gap:8px" id="lcf-${esc(id)}">
          <input class="input" placeholder="Саналаа бичих…" required maxlength="1000">
          <button class="btn btn-primary btn-sm" type="submit">Илгээх</button>
        </form>`
        : `<p class="muted mt16" style="font-size:.85rem">Зөвхөн багш нар санал бичих боломжтой.</p>`}
      </div>`;

    const f = box.querySelector("form");
    if (f) f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const inp = f.querySelector("input");
      const v = inp.value.trim(); if (!v) return;
      inp.disabled = true;
      try {
        await GZ.store.addLessonComment(id, v);
        delete box.dataset.open;
        await toggleDiscussion(id);
        GZ.toast("Санал нэмэгдлээ.", "ok");
      } catch (ex) { GZ.toast(ex.message, "err"); inp.disabled = false; }
    });

    GZ.$$("[data-delc]", box).forEach((b) => b.addEventListener("click", async () => {
      await GZ.store.deleteLessonComment(b.dataset.delc, id);
      delete box.dataset.open;
      toggleDiscussion(id);
    }));
  }

  async function removeLesson(id, mine) {
    GZ.modal({
      title: "Хичээл устгах уу?",
      content: "<p>Энэ үйлдлийг буцаах боломжгүй. Хавсаргасан файлууд ч устна.</p>",
      actions: [
        { label: "Болих", class: "btn-ghost" },
        { label: "Устгах", class: "btn-accent", onClick: async (c) => {
            c();
            await GZ.store.deleteUserLesson(id);
            GZ.toast("Устгалаа.");
            listView(mine);
          } },
      ],
    });
  }

  /* ---------------- Шинэ хичээл ---------------- */
  function formView() {
    pending = [];
    const host = $("#teachBody");

    host.innerHTML = `
      <div class="alert ok mb24"><span class="ic">🚀</span>
        <p>Таны хичээл <b>батлуулахгүйгээр шууд нийтлэгдэнэ</b>. Бүх багш үзэж,
        хэлэлцүүлэгт саналаа бичих боломжтой. Дүрэм зөрчсөн агуулгыг админ нуух
        буюу устгах эрхтэй тул эх сурвалж, зохиогчийн эрхээ анхаарна уу.</p></div>

      <form class="card" id="ulForm" style="padding:clamp(20px,3vw,30px)">
        <div class="field">
          <label for="ulTitle">Хичээлийн нэр *</label>
          <input class="input" id="ulTitle" required maxlength="140" placeholder="Жишээ: Монголын гол мөрөн, ай сав">
        </div>

        <div class="field">
          <label for="ulSummary">Товч тайлбар *</label>
          <textarea class="textarea" id="ulSummary" required maxlength="500" style="min-height:80px"
            placeholder="Хичээл юуны тухай вэ, ямар зорилготой вэ — 1–3 өгүүлбэр."></textarea>
        </div>

        <div class="grid g2" style="gap:0 16px">
          <div class="field">
            <label for="ulTrack">Анги / чиглэл</label>
            <select class="select" id="ulTrack">
              ${TRACKS.map((t) => `<option${t === "9-р анги" ? " selected" : ""}>${esc(t)}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label for="ulKind">Төрөл</label>
            <select class="select" id="ulKind">
              <option value="text">📄 Бичмэл хичээл</option>
              <option value="video">🎬 Бичлэг (YouTube г.м)</option>
              <option value="link">🔗 Гадаад холбоос</option>
            </select>
          </div>
        </div>

        <div class="field hidden" id="ulUrlField">
          <label for="ulUrl">Холбоос</label>
          <input class="input" id="ulUrl" type="url" placeholder="https://www.youtube.com/watch?v=…">
          <span class="hint">Бичлэг эсвэл гадаад платформын хаяг.</span>
        </div>

        <div class="field">
          <label for="ulBody">Агуулга (заавал биш)</label>
          <textarea class="textarea" id="ulBody" maxlength="8000" style="min-height:150px"
            placeholder="Хичээлийн явц, арга зүй, даалгавар… Мөр таслалт хадгалагдана."></textarea>
        </div>

        <div class="field">
          <label>Хавсралт — бичлэг, зураг, хөтөлбөр, баримт</label>
          <div class="upload-zone" id="ulDrop" tabindex="0" role="button">
            <div class="uz-ic">📎</div>
            <b>Файл сонгох буюу энд чирж оруулах</b>
            <small class="muted">Зураг, PDF, Word, PowerPoint, бичлэг — нэг файл 50 МБ хүртэл</small>
            <input type="file" id="ulFiles" multiple hidden
              accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt">
          </div>
          <div class="col mt16" id="ulFileList" style="gap:8px"></div>
        </div>

        <div id="ulMsg"></div>
        <div class="row row-wrap mt16">
          <button class="btn btn-primary btn-lg" type="submit" id="ulSubmit">
            Нийтлэх
          </button>
          <button class="btn btn-ghost" type="button" id="ulCancel">Болих</button>
        </div>
      </form>`;

    const kind = $("#ulKind"), urlField = $("#ulUrlField");
    kind.addEventListener("change", () => urlField.classList.toggle("hidden", kind.value === "text"));

    const drop = $("#ulDrop"), input = $("#ulFiles");
    drop.addEventListener("click", () => input.click());
    drop.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } });
    input.addEventListener("change", () => addFiles(input.files));
    ["dragenter", "dragover"].forEach((ev) =>
      drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
    ["dragleave", "drop"].forEach((ev) =>
      drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
    drop.addEventListener("drop", (e) => addFiles(e.dataTransfer.files));

    $("#ulCancel").addEventListener("click", () => {
      tab = "mine";
      GZ.$$("#teachTabs button").forEach((x) => x.classList.toggle("active", x.dataset.t === "mine"));
      body();
    });

    $("#ulForm").addEventListener("submit", submitLesson);
  }

  async function addFiles(fileList) {
    const files = Array.from(fileList || []);
    for (const f of files) {
      const row = { name: f.name, size: f.size, type: f.type, state: "uploading" };
      pending.push(row);
      drawFiles();
      try {
        const up = await GZ.store.uploadFile(f);
        Object.assign(row, up, { state: "done" });
      } catch (e) {
        row.state = "error"; row.err = e.message;
      }
      drawFiles();
    }
  }

  function drawFiles() {
    const host = $("#ulFileList");
    if (!host) return;
    host.innerHTML = pending.map((f, i) => `
      <div class="card card-pad-sm" style="display:flex;gap:10px;align-items:center">
        <span style="font-size:1.3rem">${f.state === "error" ? "⚠️" : fileIcon(f)}</span>
        <span style="flex:1;min-width:0">
          <b style="display:block;font-size:.88rem">${esc(f.name)}</b>
          <small class="muted">${f.state === "uploading" ? "Байршуулж байна…"
            : f.state === "error" ? esc(f.err || "Алдаа") : fmtSize(f.size)}</small>
        </span>
        ${f.state === "uploading" ? '<div class="spinner"></div>'
          : `<button type="button" class="act" data-rm="${i}" style="color:var(--danger)">Хасах</button>`}
      </div>`).join("");
    GZ.$$("[data-rm]", host).forEach((b) => b.addEventListener("click", async () => {
      const f = pending[Number(b.dataset.rm)];
      if (f && f.path) await GZ.store.deleteFile(f.path);
      pending.splice(Number(b.dataset.rm), 1);
      drawFiles();
    }));
  }

  async function submitLesson(e) {
    e.preventDefault();
    const btn = $("#ulSubmit"), msg = $("#ulMsg");
    const kind = $("#ulKind").value;
    const url = $("#ulUrl").value.trim();

    if (kind !== "text" && !url) {
      msg.innerHTML = `<div class="alert warn"><span class="ic">⚠️</span><p>Бичлэг эсвэл холбоосын хаягийг оруулна уу.</p></div>`;
      return;
    }
    if (pending.some((f) => f.state === "uploading")) {
      msg.innerHTML = `<div class="alert warn"><span class="ic">⏳</span><p>Файл байршиж дуустал түр хүлээнэ үү.</p></div>`;
      return;
    }

    btn.disabled = true; btn.textContent = "Илгээж байна…";
    try {
      const rec = await GZ.store.addUserLesson({
        title: $("#ulTitle").value.trim(),
        summary: $("#ulSummary").value.trim(),
        body: $("#ulBody").value.trim() || null,
        kind, url: url || null,
        track: $("#ulTrack").value,
        files: pending.filter((f) => f.state === "done")
          .map((f) => ({ name: f.name, path: f.path, url: f.url, type: f.type, size: f.size })),
      });
      pending = [];
      GZ.toast("Хичээл нийтлэгдлээ!", "ok");
      tab = "mine";
      render();
    } catch (ex) {
      msg.innerHTML = `<div class="alert warn"><span class="ic">⚠️</span><p>${esc(ex.message)}</p></div>`;
      btn.disabled = false;
      btn.textContent = "Нийтлэх";
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
