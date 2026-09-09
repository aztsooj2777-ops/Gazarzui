/* ==========================================================================
   Сорил / ЭЕШ горим
   ========================================================================== */
(function () {
  "use strict";
  const GZ = window.GZ, $ = GZ.$, esc = GZ.esc;

  const CATS = ["Бүх ангилал", "Монголын газарзүй", "Дэлхийн газарзүй", "Байгалийн газарзүй", "Нийгэм-эдийн засаг", "Картографи", "Геологи"];
  const LEVELS = [{ v: 0, t: "Бүх түвшин" }, { v: 1, t: "Хялбар" }, { v: 2, t: "Дунд" }, { v: 3, t: "Хүнд" }];
  const COUNTS = [10, 15, 20, 30];

  let cfg = { cat: "Бүх ангилал", lvl: 0, n: 15, exam: false };
  let qs = [], idx = 0, right = 0, answers = [], startTime = 0, timer = null, left = 0;

  const root = () => $("#quizRoot");

  /* ---------------- Тохиргооны дэлгэц ---------------- */
  function setup() {
    stopTimer();
    const hist = GZ.store.history().filter((h) => h.kind === "quiz").slice(0, 5);

    root().innerHTML = `
      <div class="card" style="padding:clamp(22px,3vw,34px)">
        <h2 style="margin-top:0">Сорилоо тохируулах</h2>
        <p class="muted">Сонголтоо хийгээд эхлүүлээрэй.</p>

        <div class="field">
          <label>Ангилал</label>
          <div class="chips" id="catChips">
            ${CATS.map((c) => `<button class="chip${c === cfg.cat ? " active" : ""}" data-v="${esc(c)}">${esc(c)}</button>`).join("")}
          </div>
        </div>

        <div class="grid g2 mt16">
          <div class="field">
            <label>Түвшин</label>
            <div class="chips" id="lvlChips">
              ${LEVELS.map((l) => `<button class="chip${l.v === cfg.lvl ? " active" : ""}" data-v="${l.v}">${esc(l.t)}</button>`).join("")}
            </div>
          </div>
          <div class="field">
            <label>Асуултын тоо</label>
            <div class="chips" id="cntChips">
              ${COUNTS.map((n) => `<button class="chip${n === cfg.n ? " active" : ""}" data-v="${n}">${n}</button>`).join("")}
            </div>
          </div>
        </div>

        <label class="card card-pad-sm card-flat" style="display:flex;gap:12px;align-items:flex-start;cursor:pointer;background:var(--surface-2);margin-top:8px">
          <input type="checkbox" id="examMode" ${cfg.exam ? "checked" : ""} style="margin-top:4px;width:18px;height:18px;accent-color:var(--teal)">
          <span>
            <b>ЭЕШ горим</b>
            <span class="muted" style="display:block;font-size:.88rem">Асуулт тутамд 45 секунд. Тайлбар нь шалгалт дууссаны дараа нэг дор гарна.</span>
          </span>
        </label>

        <div class="row row-wrap mt24">
          <button class="btn btn-primary btn-lg" id="startBtn">Сорил эхлүүлэх</button>
          <a class="btn btn-ghost" href="leaderboard.html">Тэргүүлэгчид харах</a>
        </div>

        <div class="row mt16" style="font-size:.86rem;color:var(--ink-4)">
          <span id="poolInfo"></span>
        </div>
      </div>

      ${hist.length ? `
      <div class="card mt24">
        <h3 style="margin-top:0;font-size:1.1rem">Сүүлийн үр дүн</h3>
        <div class="table-wrap" style="border:0">
          <table class="tbl">
            <thead><tr><th>Огноо</th><th>Ангилал</th><th>Оноо</th></tr></thead>
            <tbody>
              ${hist.map((h) => `<tr>
                <td class="muted">${GZ.timeAgo(h.created_at)}</td>
                <td>${esc((h.meta && h.meta.cat) || "—")}</td>
                <td class="mono"><b>${h.score}</b> / ${h.max_score}</td>
              </tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>` : ""}`;

    bindChips("#catChips", (v) => (cfg.cat = v));
    bindChips("#lvlChips", (v) => (cfg.lvl = Number(v)));
    bindChips("#cntChips", (v) => (cfg.n = Number(v)));
    $("#examMode").addEventListener("change", (e) => (cfg.exam = e.target.checked));
    $("#startBtn").addEventListener("click", start);
    updatePool();
  }

  function bindChips(sel, set) {
    const host = $(sel);
    host.addEventListener("click", (e) => {
      const b = e.target.closest(".chip");
      if (!b) return;
      GZ.$$(".chip", host).forEach((c) => c.classList.toggle("active", c === b));
      set(b.dataset.v);
      updatePool();
    });
  }

  function pool() {
    return GZ.QUIZ_BANK.filter((q) =>
      (cfg.cat === "Бүх ангилал" || q.cat === cfg.cat) && (!cfg.lvl || q.lvl === cfg.lvl));
  }

  function updatePool() {
    const p = pool().length;
    const info = $("#poolInfo");
    if (info) info.textContent = `Энэ сонголтод ${p} асуулт байна${p < cfg.n ? " — боломжит бүх асуултыг өгнө." : "."}`;
  }

  /* ---------------- Сорил ---------------- */
  function start() {
    const p = pool();
    if (!p.length) { GZ.toast("Энэ сонголтод асуулт олдсонгүй.", "err"); return; }
    qs = GZ.sample(p, Math.min(cfg.n, p.length)).map((q) => {
      // Хариултын дарааллыг холих
      const order = GZ.shuffle(q.options.map((_, i) => i));
      return {
        q: q.q, cat: q.cat, why: q.why,
        options: order.map((i) => q.options[i]),
        answer: order.indexOf(q.answer),
      };
    });
    idx = 0; right = 0; answers = [];
    startTime = Date.now();
    renderQ();
  }

  function renderQ() {
    if (idx >= qs.length) return finish();
    const q = qs[idx];

    root().innerHTML = `
      <div class="quiz-top">
        <div class="progress" style="flex:1"><span style="width:${(idx / qs.length) * 100}%"></span></div>
        <span class="mono muted" style="font-size:.88rem;white-space:nowrap">${idx + 1}/${qs.length}</span>
        ${cfg.exam ? '<span class="quiz-timer" id="timerBox">45</span>' : ""}
      </div>
      <div class="card q-card" style="padding:clamp(20px,3vw,32px)">
        <div class="row between mb16">
          <span class="badge teal">${esc(q.cat)}</span>
          <span class="muted mono" style="font-size:.85rem">Зөв: ${right}</span>
        </div>
        <p class="q-text">${esc(q.q)}</p>
        <div class="opts" id="qOpts"></div>
        <div id="qEx"></div>
      </div>
      <div class="row center mt16">
        <button class="btn btn-ghost btn-sm" id="quitBtn">Сорилоос гарах</button>
      </div>`;

    const opts = $("#qOpts");
    q.options.forEach((o, k) => {
      const b = GZ.el("button", { class: "opt", html: `<span class="k">${"АБВГ"[k]}</span><span>${esc(o)}</span>` });
      b.addEventListener("click", () => choose(k));
      opts.appendChild(b);
    });

    $("#quitBtn").addEventListener("click", () => {
      GZ.modal({
        title: "Сорилоос гарах уу?",
        content: "<p>Одоогийн ахиц хадгалагдахгүй.</p>",
        actions: [
          { label: "Үргэлжлүүлэх", class: "btn-ghost" },
          { label: "Гарах", class: "btn-outline", onClick: (c) => { c(); setup(); } },
        ],
      });
    });

    if (cfg.exam) startTimer();
    document.addEventListener("keydown", keyHandler);
  }

  function keyHandler(e) {
    const k = ["1", "2", "3", "4"].indexOf(e.key);
    if (k >= 0) {
      const btns = GZ.$$("#qOpts .opt");
      if (btns[k] && !btns[k].disabled) btns[k].click();
    }
  }

  function startTimer() {
    stopTimer();
    left = 45;
    const box = $("#timerBox");
    const tick = () => {
      left--;
      if (box) {
        box.textContent = left;
        box.classList.toggle("low", left <= 10);
      }
      if (left <= 0) { stopTimer(); choose(-1); }
    };
    timer = setInterval(tick, 1000);
  }
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

  function choose(k) {
    stopTimer();
    document.removeEventListener("keydown", keyHandler);
    const q = qs[idx];
    const ok = k === q.answer;
    if (ok) right++;
    answers.push({ q: q.q, cat: q.cat, why: q.why, options: q.options, answer: q.answer, chosen: k });

    const btns = GZ.$$("#qOpts .opt");
    btns.forEach((b, n) => {
      b.disabled = true;
      if (n === q.answer) b.classList.add("correct");
      else if (n === k) b.classList.add("wrong");
    });

    const nextLabel = idx + 1 >= qs.length ? "Дүн харах →" : "Дараагийнх →";
    $("#qEx").innerHTML = cfg.exam
      ? `<button class="btn btn-primary mt16" id="nextBtn">${nextLabel}</button>`
      : `<div class="explain"><b>${ok ? "Зөв!" : k === -1 ? "Цаг дууслаа." : "Зөв хариулт: " + "АБВГ"[q.answer]}</b> — ${esc(q.why)}</div>
         <button class="btn btn-primary mt16" id="nextBtn">${nextLabel}</button>`;
    $("#nextBtn").addEventListener("click", () => { idx++; renderQ(); });
    $("#nextBtn").focus();
  }

  /* ---------------- Дүн ---------------- */
  function finish() {
    stopTimer();
    const pct = Math.round((right / qs.length) * 100);
    const secs = Math.round((Date.now() - startTime) / 1000);
    const score = right * 10 + (cfg.exam ? right * 2 : 0);

    GZ.store.saveScore({
      kind: "quiz", game: "quiz", score, max_score: qs.length * (cfg.exam ? 12 : 10),
      meta: { cat: cfg.cat, exam: cfg.exam, pct, secs },
    });

    const C = 2 * Math.PI * 70;
    const grade = pct >= 90 ? { t: "Онц", e: "🏆", c: "var(--gold)" }
      : pct >= 75 ? { t: "Сайн", e: "🎉", c: "var(--ok)" }
      : pct >= 60 ? { t: "Хангалттай", e: "👍", c: "var(--teal)" }
      : { t: "Дахин давтъя", e: "📚", c: "var(--terra)" };

    root().innerHTML = `
      <div class="card tc" style="padding:clamp(24px,4vw,40px)">
        <div class="result-ring">
          <svg width="168" height="168" viewBox="0 0 168 168">
            <circle cx="84" cy="84" r="70" fill="none" stroke="var(--surface-3)" stroke-width="14"/>
            <circle cx="84" cy="84" r="70" fill="none" stroke="${grade.c}" stroke-width="14" stroke-linecap="round"
              stroke-dasharray="${C}" stroke-dashoffset="${C}" id="ringArc"/>
          </svg>
          <div class="val" style="color:${grade.c}">${pct}%</div>
        </div>
        <div style="font-size:2rem">${grade.e}</div>
        <h2 style="margin:6px 0">${grade.t} — ${right}/${qs.length} зөв</h2>
        <p class="muted">
          ${esc(cfg.cat)} · ${cfg.exam ? "ЭЕШ горим" : "Дасгал горим"} · ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")} хугацаа
        </p>
        <div class="row center row-wrap mt16">
          <span class="badge gold">+${score} оноо</span>
          <span class="badge teal">${qs.length} асуулт</span>
        </div>
        <div class="row center row-wrap mt24">
          <button class="btn btn-primary" id="againBtn">Дахин өгөх</button>
          <button class="btn btn-outline" id="reviewBtn">Алдаа харах (${qs.length - right})</button>
          <a class="btn btn-ghost" href="leaderboard.html">Тэргүүлэгчид</a>
        </div>
      </div>
      <div id="reviewBox" class="mt24"></div>`;

    requestAnimationFrame(() => {
      const arc = $("#ringArc");
      arc.style.transition = "stroke-dashoffset 1.1s cubic-bezier(.22,.9,.3,1)";
      arc.style.strokeDashoffset = String(C * (1 - pct / 100));
    });

    $("#againBtn").addEventListener("click", setup);
    $("#reviewBtn").addEventListener("click", review);
    if (!GZ.store.user) {
      setTimeout(() => GZ.toast("Оноогоо тэргүүлэгчдийн жагсаалтад бүртгүүлэхийн тулд нэвтэрнэ үү.", "", "Санамж"), 900);
    }
  }

  function review() {
    const box = $("#reviewBox");
    if (box.dataset.open) { box.innerHTML = ""; delete box.dataset.open; return; }
    box.dataset.open = "1";
    const wrong = answers.filter((a) => a.chosen !== a.answer);
    box.innerHTML = `
      <div class="card">
        <h3 style="margin-top:0">Тайлбар</h3>
        ${wrong.length ? wrong.map((a) => `
          <div style="padding:16px 0;border-top:1px solid var(--line)">
            <div class="row between mb8"><span class="badge">${esc(a.cat)}</span></div>
            <p style="font-weight:600;margin-bottom:8px">${esc(a.q)}</p>
            <p style="margin:0 0 4px;font-size:.92rem;color:var(--danger)">
              Таны хариулт: ${a.chosen >= 0 ? esc(a.options[a.chosen]) : "хариулаагүй"}
            </p>
            <p style="margin:0 0 8px;font-size:.92rem;color:var(--ok)">Зөв хариулт: ${esc(a.options[a.answer])}</p>
            <div class="explain" style="margin-top:0">${esc(a.why)}</div>
          </div>`).join("")
        : `<p class="muted">Алдаа гараагүй — бүх асуултыг зөв хариуллаа! 🎉</p>`}
      </div>`;
    box.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup);
  else setup();
})();
