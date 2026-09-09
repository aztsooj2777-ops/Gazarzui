/* ==========================================================================
   Дахин ашиглагдах бүрэлдэхүүн: хичээлийн карт, тоглоомын жагсаалт
   ========================================================================== */
(function () {
  "use strict";
  const GZ = window.GZ;

  /* Тоглоомын бүртгэл — нүүр ба тоглоомын хуудсанд ашиглана */
  GZ.GAMES = [
    { id:"aimag",  name:"Аймаг таних",       emoji:"🗺️", color:"var(--teal)",
      desc:"Жинхэнэ солбицлоор байрлуулсан Монголын зураг дээр аймгийг ол.", skill:"Байрлал, орон зайн санамж" },
    { id:"flags",  name:"Далбаа таних",      emoji:"🚩", color:"var(--terra)",
      desc:"Улсын далбааг хараад нэрийг нь тааж, дэлхийн газрын зургаа тэлээрэй.", skill:"Дэлхийн улс орнууд" },
    { id:"capital",name:"Нийслэл таних",     emoji:"🏙️", color:"var(--sky)",
      desc:"Улс ↔ нийслэлийн хосыг зөв холбо. Цуврал зөв хариултаар оноо өснө.", skill:"Улс, нийслэл" },
    { id:"word",   name:"Газарзүйн үг",      emoji:"🔤", color:"var(--plum)",
      desc:"Нуугдсан нэр томьёог 6 оролдлогоор тааж, өнгөт сануулгыг ашигла.", skill:"Нэр томьёо" },
    { id:"match",  name:"Нэр томьёо тааруулах", emoji:"🧩", color:"var(--gold)",
      desc:"Ойлголт ба тодорхойлолтыг цагтай уралдан хослуул.", skill:"Тодорхойлолт" },
    { id:"higher", name:"Аль нь их вэ?",      emoji:"📊", color:"var(--ok)",
      desc:"Уулын өндөр, голын урт, хүн ам — аль нь их болохыг тааварла.", skill:"Тоо баримт, харьцуулалт" },
  ];

  /* Хичээлийн карт */
  GZ.lessonCard = function (L) {
    const cls = L.grade === 7 ? "g7" : L.grade === 8 ? "g8" : L.grade === 9 ? "g9" : "geo";
    const done = !!GZ.store && !!GZ.store.progress()[L.id];
    return `
      <a class="card card-hover lesson-card" href="lesson.html?id=${encodeURIComponent(L.id)}">
        <div class="lesson-cover ${cls}">
          <div class="topo"></div>
          <span class="e">${L.emoji}</span>
          ${done ? '<span class="badge ok" style="position:absolute;top:12px;right:12px;z-index:2">✓ Үзсэн</span>' : ""}
        </div>
        <div class="lesson-body">
          <div class="row" style="gap:6px;flex-wrap:wrap">
            <span class="badge teal">${GZ.esc(L.track)}</span>
            ${(L.tags || []).slice(0, 1).map((t) => `<span class="badge">${GZ.esc(t)}</span>`).join("")}
          </div>
          <h3>${GZ.esc(L.title)}</h3>
          <p>${GZ.esc(L.summary)}</p>
          <div class="lesson-meta">
            <span>${GZ.icon("clock", 14)} ${L.minutes} мин</span>
            <span>${GZ.icon("check", 14)} ${(L.quiz || []).length} дасгал</span>
            <span>${GZ.icon("layers", 14)} ${(L.sections || []).length} бүлэг</span>
          </div>
        </div>
      </a>`;
  };

  /* ------------------------------------------------------------------
     Багшийн өөрийн бэлтгэсэн хичээлийн карт (онцгойлон ялгагдана)
     ------------------------------------------------------------------ */
  GZ.teacherCard = function (t) {
    const media = t.kind === "video"
      ? `<div class="tl-media">
           <div class="topo"></div>
           <img src="${GZ.esc(t.thumb)}" alt="${GZ.esc(t.title)}" loading="lazy"
                onerror="this.style.display='none'">
           <span class="play"><i></i></span>
           ${t.year ? `<span class="dur">${t.year}</span>` : ""}
         </div>`
      : `<div class="tl-media">
           <div class="topo"></div>
           <div class="ext"><div class="e">${t.emoji}</div><div class="p">${GZ.esc(t.source)}</div></div>
         </div>`;

    const credit = t.author
      ? `<b>${GZ.esc(t.author)}</b><small>Хичээл боловсруулсан · ${GZ.esc(t.source)}</small>`
      : `<b>${GZ.esc(t.source)}</b><small>Нийтлэгдсэн эх сурвалж</small>`;

    return `
      <a class="tl-card" href="${GZ.esc(t.url)}" target="_blank" rel="noopener"
         data-tl="${GZ.esc(t.id)}">
        <span class="tl-ribbon">★ Багшийн хичээл</span>
        ${media}
        <div class="tl-body">
          <div class="row" style="gap:6px;flex-wrap:wrap">
            <span class="badge gold">${GZ.esc(t.track)}</span>
            ${t.kind === "video" ? '<span class="badge terra">Видео</span>' : '<span class="badge sky">Интерактив</span>'}
            ${t.unit ? `<span class="badge">${GZ.esc(t.unit)}</span>` : ""}
          </div>
          <h3>${GZ.esc(t.title)}</h3>
          <p class="sum">${GZ.esc(t.summary)}</p>
          ${t.note ? `<p class="muted" style="font-size:.82rem;margin:0">${GZ.esc(t.note)}</p>` : ""}
          <div class="tl-author">
            <span class="av">${GZ.esc(GZ.initials(t.author || t.source))}</span>
            <span class="who">${credit}</span>
            <span class="spacer"></span>
            <span style="color:var(--gold);flex-shrink:0">${GZ.icon(t.kind === "video" ? "play" : "arrow", 18)}</span>
          </div>
        </div>
      </a>`;
  };

  /* Багшийн хичээлийн картуудыг идэвхжүүлэх (видеог сайт дээрээ тоглуулна) */
  GZ.bindTeacherCards = function (root) {
    GZ.$$("[data-tl]", root || document).forEach((a) => {
      const t = (GZ.TEACHER_LESSONS || []).find((x) => x.id === a.dataset.tl);
      if (!t || t.kind !== "video") return;          // гадаад хичээл шинэ табд нээгдэнэ
      a.addEventListener("click", (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // шинэ табд нээх
        e.preventDefault();
        GZ.modal({
          title: t.title,
          wide: true,
          content: `
            <div class="vid-frame">
              <iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(t.videoId)}?rel=0&modestbranding=1"
                title="${GZ.esc(t.title)}" allowfullscreen
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerpolicy="strict-origin-when-cross-origin"></iframe>
            </div>
            <div class="row row-wrap mt16" style="gap:8px">
              <span class="badge gold">${GZ.esc(t.track)}</span>
              <span class="badge terra">Видео хичээл</span>
              <span class="badge">${GZ.esc(t.source)}</span>
            </div>
            <p class="muted mt16" style="font-size:.92rem">${GZ.esc(t.summary)}</p>
            <a class="btn btn-outline btn-sm" href="${GZ.esc(t.url)}" target="_blank" rel="noopener">
              YouTube дээр нээх ↗</a>`,
        });
      });
    });
  };

  /* Тоглоомын карт */
  GZ.gameCard = function (g) {
    return `
      <a class="card card-hover game-card" href="games.html?g=${g.id}">
        <div class="glow" style="background:${g.color}"></div>
        <div class="card-icon" style="background:color-mix(in srgb, ${g.color} 16%, transparent);color:${g.color}">${g.emoji}</div>
        <h3>${GZ.esc(g.name)}</h3>
        <p class="muted" style="font-size:.93rem">${GZ.esc(g.desc)}</p>
        <div class="row mt16" style="gap:8px">
          <span class="badge">${GZ.esc(g.skill)}</span>
        </div>
      </a>`;
  };
})();
