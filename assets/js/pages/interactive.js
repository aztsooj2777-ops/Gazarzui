/* ==========================================================================
   Интерактив хичээлийн хуудас — галерей ба тоглуулагч
   ========================================================================== */
(function () {
  "use strict";
  const GZ = window.GZ, IL = GZ.IL, $ = GZ.$, esc = GZ.esc;
  const ORDER = ["g7", "g8", "g9"];

  function gallery() {
    const done = GZ.store.progress();
    $("#ilTitle").textContent = "Интерактив хичээл";
    $("#ilDesc").textContent = "Уншаад өнгөрөх биш — өөрөө хийж үзэх. Газрын зураг, симуляци, диаграмаар баяжуулсан 40 минутын хичээл бүр анги тус бүрд зориулагдсан.";
    $("#ilCrumb").innerHTML = '<a href="index.html">Нүүр</a> <span>›</span> <span>Интерактив хичээл</span>';

    $("#ilRoot").innerHTML = `
      <div class="grid g3">
        ${ORDER.map((id) => {
          const L = IL.REG[id];
          if (!L) return "";
          const fin = !!done["il-" + id];
          return `
            <a class="card card-hover il-card" href="interactive.html?id=${id}">
              <div class="il-cover c${L.grade}">
                <div class="topo"></div>
                <span class="e">${L.emoji}</span>
                ${fin ? '<span class="badge ok" style="position:absolute;top:12px;right:12px;z-index:2">✓ Дууссан</span>' : ""}
              </div>
              <div class="il-body">
                <div class="row" style="gap:6px;flex-wrap:wrap">
                  <span class="badge teal">${L.grade}-р анги</span>
                  <span class="badge gold">${L.minutes} минут</span>
                </div>
                <h3>${esc(L.title)}</h3>
                <p>${esc(L.summary)}</p>
                <div class="il-feat">${(L.features || []).map((f) => `<span>${esc(f)}</span>`).join("")}</div>
                <div class="lesson-meta" style="margin-top:4px">
                  <span>${GZ.icon("layers", 14)} ${L.steps.length} алхам</span>
                  <span>${GZ.icon("check", 14)} ${L.goals.length} зорилт</span>
                </div>
              </div>
            </a>`;
        }).join("")}
      </div>

      <div class="grid g3 mt32">
        <div class="card card-pad-sm">
          <div class="card-icon" style="width:38px;height:38px;font-size:1.05rem">🧪</div>
          <h4>Лабораторийн дасгал</h4>
          <p class="muted" style="font-size:.9rem;margin:0">Гулсуур хөдөлгөж, зураг дээр дарж, өөрөө туршиж үз.
          Диаграм шууд хариу үйлдэл үзүүлнэ.</p>
        </div>
        <div class="card card-pad-sm">
          <div class="card-icon gold" style="width:38px;height:38px;font-size:1.05rem">⏱️</div>
          <h4>40 минутын бүтэц</h4>
          <p class="muted" style="font-size:.9rem;margin:0">Ангийн нэг цагт багтаасан алхмууд.
          Багш ангид, сурагч гэртээ ашиглаж болно.</p>
        </div>
        <div class="card card-pad-sm">
          <div class="card-icon terra" style="width:38px;height:38px;font-size:1.05rem">📈</div>
          <h4>Бодит өгөгдөл</h4>
          <p class="muted" style="font-size:.9rem;margin:0">Аймгийн талбай, хүн ам, цаг уурын станцын
          олон жилийн дундаж утга дээр суурилсан.</p>
        </div>
      </div>

      <div class="alert mt32"><span class="ic">👩‍🏫</span>
        <p><b>Багш нарт:</b> Хичээлийг ангид проектороор үзүүлж, лабораторийн хэсэгт сурагчдаас
        таамаглал асуугаад дараа нь гулсуурыг хөдөлгөж шалгаж болно. Хажуугийн жагсаалтаас
        дурын алхам руу шууд шилжинэ.</p></div>`;
  }

  function boot() {
    const id = new URLSearchParams(location.search).get("id");
    if (id && IL.REG[id]) {
      const L = IL.REG[id];
      document.title = L.title + " — Газарзүй";
      $("#ilTitle").textContent = L.emoji + " " + L.title;
      $("#ilDesc").textContent = L.summary;
      $("#ilCrumb").innerHTML =
        '<a href="index.html">Нүүр</a> <span>›</span> <a href="interactive.html">Интерактив хичээл</a> <span>›</span> ' +
        esc(L.grade + "-р анги");
      IL.mount($("#ilRoot"), id);
    } else {
      gallery();
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
