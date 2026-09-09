/* ==========================================================================
   Хичээлийн жагсаалт — шүүлтүүр, хайлт, ахиц
   ========================================================================== */
(function () {
  "use strict";
  const GZ = window.GZ, $ = GZ.$;

  const TRACKS = ["Бүгд", "7-р анги", "8-р анги", "9-р анги", "Геологийн түүх"];
  let track = "Бүгд", query = "";

  function boot() {
    $("#searchIcon").innerHTML = GZ.icon("search", 17);

    const chips = $("#trackChips");
    chips.innerHTML = TRACKS.map((t) => `<button class="chip${t === track ? " active" : ""}" data-t="${GZ.esc(t)}">${GZ.esc(t)}</button>`).join("");
    chips.addEventListener("click", (e) => {
      const b = e.target.closest(".chip");
      if (!b) return;
      track = b.dataset.t;
      GZ.$$(".chip", chips).forEach((c) => c.classList.toggle("active", c === b));
      render();
    });

    const search = $("#lessonSearch");
    let t;
    search.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => { query = GZ.norm(search.value); render(); }, 160);
    });

    // URL-аас анги шүүх (?track=8)
    const p = new URLSearchParams(location.search).get("track");
    if (p) {
      const found = TRACKS.find((x) => x.startsWith(p));
      if (found) {
        track = found;
        GZ.$$(".chip", chips).forEach((c) => c.classList.toggle("active", c.dataset.t === found));
      }
    }
    render();
  }

  function match(L) {
    if (track !== "Бүгд" && L.track !== track) return false;
    if (!query) return true;
    const hay = GZ.norm([
      L.title, L.summary, (L.tags || []).join(" "),
      (L.terms || []).map((x) => x.t + " " + x.d).join(" "),
      (L.sections || []).map((s) => s.h).join(" "),
    ].join(" "));
    return query.split(" ").every((w) => hay.includes(w));
  }

  function render() {
    const list = (GZ.LESSONS || []).filter(match);
    const grid = $("#lessonGrid"), empty = $("#emptyState");

    grid.innerHTML = list.map((L) => GZ.lessonCard(L)).join("");
    empty.innerHTML = list.length ? "" : `
      <div class="empty">
        <div class="big">🔍</div>
        <h3>Хичээл олдсонгүй</h3>
        <p>«${GZ.esc($("#lessonSearch").value)}» гэсэн хайлтад тохирох хичээл алга. Өөр түлхүүр үг оруулж үзнэ үү.</p>
      </div>`;

    const done = Object.keys(GZ.store.progress()).length;
    const total = (GZ.LESSONS || []).length;
    $("#lessonCount").textContent = `${list.length} хичээл харагдаж байна`;
    $("#progressNote").innerHTML = done
      ? `Таны ахиц: <b>${done}/${total}</b> хичээл үзсэн`
      : `Хичээл нээхэд ахиц тань бүртгэгдэнэ`;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
