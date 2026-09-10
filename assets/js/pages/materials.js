/* ==========================================================================
   Материалын сан — шүүх, хайх, татах
   ========================================================================== */
(function () {
  "use strict";
  const GZ = window.GZ, $ = GZ.$, esc = GZ.esc;

  let group = "all", query = "";

  function allItems() {
    const out = [];
    GZ.MAT_GROUPS.forEach((g) => g.items.forEach((it) => out.push(Object.assign({ g }, it))));
    return out;
  }

  function boot() {
    $("#matSearchIcon").innerHTML = GZ.icon("search", 16);

    const items = allItems();
    const totalMB = items.reduce((a, i) => a + parseFloat(i.size), 0);
    $("#matStats").innerHTML = `
      <div class="card stat"><div class="stat-num">${items.length}</div><div class="stat-label">Нийт файл</div></div>
      <div class="card stat"><div class="stat-num">24</div><div class="stat-label">ЭЕШ-ийн хувилбар</div></div>
      <div class="card stat"><div class="stat-num">6</div><div class="stat-label">Шалгалтын жил</div></div>
      <div class="card stat"><div class="stat-num">${totalMB.toFixed(0)}</div><div class="stat-label">МБ материал</div></div>`;

    $("#matChips").innerHTML =
      `<button class="chip active" data-g="all">Бүгд</button>` +
      GZ.MAT_GROUPS.map((g) => `<button class="chip" data-g="${g.id}">${g.icon} ${esc(g.title)}</button>`).join("");

    $("#matChips").addEventListener("click", (e) => {
      const b = e.target.closest(".chip"); if (!b) return;
      GZ.$$("#matChips .chip").forEach((c) => c.classList.toggle("active", c === b));
      group = b.dataset.g;
      render();
    });

    let t;
    $("#matSearch").addEventListener("input", (e) => {
      clearTimeout(t);
      t = setTimeout(() => { query = GZ.norm(e.target.value); render(); }, 150);
    });

    render();

    // Хаягт #maps гэх мэт заалт байвал тухайн ангилалыг сонгож гүйлгэнэ
    const hash = (location.hash || "").replace("#", "");
    if (hash && GZ.MAT_GROUPS.some((g) => g.id === hash)) {
      const chip = GZ.$$("#matChips .chip").find((c) => c.dataset.g === hash);
      if (chip) chip.click();
      setTimeout(() => {
        const sec = document.getElementById(hash);
        if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
  }

  function match(it) {
    if (!query) return true;
    const hay = GZ.norm(it.t + " " + (it.note || "") + " " + it.g.title);
    return query.split(" ").every((w) => hay.includes(w));
  }

  function render() {
    const groups = GZ.MAT_GROUPS.filter((g) => group === "all" || g.id === group);
    let html = "", shown = 0;

    groups.forEach((g) => {
      const items = g.items.filter((it) => match(Object.assign({ g }, it)));
      if (!items.length) return;
      shown += items.length;

      // Жилээр бүлэглэх (ЭЕШ)
      let inner = "";
      if (g.id === "eesh") {
        const years = [...new Set(items.map((i) => i.year))].sort((a, b) => b - a);
        inner = years.map((y) => `
          <div style="margin-bottom:18px">
            <div class="row" style="gap:10px;margin-bottom:8px">
              <b style="font-size:.95rem">${y} он</b>
              <span class="badge">${items.filter((i) => i.year === y).length} хувилбар</span>
            </div>
            <div class="grid g4">${items.filter((i) => i.year === y).map(card).join("")}</div>
          </div>`).join("");
      } else {
        inner = `<div class="grid g-auto">${items.map(card).join("")}</div>`;
      }

      html += `
        <section id="${g.id}" style="margin-bottom:40px;scroll-margin-top:calc(var(--nav-h) + 90px)">
          <div class="row row-wrap" style="gap:12px;align-items:flex-start;margin-bottom:16px">
            <div class="card-icon" style="margin:0;width:44px;height:44px;background:color-mix(in srgb, ${g.color} 15%, transparent);color:${g.color}">${g.icon}</div>
            <div style="flex:1;min-width:220px">
              <h2 style="margin:0 0 4px;font-size:1.35rem">${esc(g.title)}</h2>
              <p class="muted" style="margin:0;font-size:.92rem">${esc(g.desc)}</p>
            </div>
            <span class="badge teal">${items.length} файл</span>
          </div>
          ${inner}
        </section>`;
    });

    $("#matRoot").innerHTML = shown ? html : `
      <div class="empty card">
        <div class="big">🔍</div><h3>Материал олдсонгүй</h3>
        <p>Өөр түлхүүр үгээр хайж үзнэ үү.</p>
      </div>`;
  }

  function card(it) {
    const ext = it.f.split(".").pop().toUpperCase();
    return `
      <a class="card card-hover" href="${esc(it.f)}" target="_blank" rel="noopener"
         style="display:flex;gap:12px;align-items:flex-start;padding:16px">
        <span style="font-size:1.6rem;line-height:1">${GZ.matIcon(it.f)}</span>
        <span style="flex:1;min-width:0">
          <b style="display:block;font-size:.92rem;line-height:1.4">${esc(it.t)}</b>
          ${it.note ? `<span class="muted" style="display:block;font-size:.8rem;margin-top:3px">${esc(it.note)}</span>` : ""}
          <span class="row" style="gap:6px;margin-top:8px">
            <span class="badge">${ext}</span>
            <span class="badge">${esc(it.size)}</span>
          </span>
        </span>
        <span style="color:var(--teal);flex-shrink:0">${GZ.icon("download", 18)}</span>
      </a>`;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
