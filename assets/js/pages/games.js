/* ==========================================================================
   Тоглоомууд — 6 интерактив дасгал
   ========================================================================== */
(function () {
  "use strict";
  const GZ = window.GZ, $ = GZ.$, esc = GZ.esc;
  const root = () => $("#gameRoot");
  let cleanup = null;

  /* ================= Ерөнхий туслахууд ================= */
  function hud(items) {
    return `<div class="game-hud">${items.map((i) =>
      `<span class="hud-pill ${i.cls || ""}">${esc(i.label)} <span class="v">${i.value}</span></span>`).join("")}
      <span class="spacer"></span>
      <button class="btn btn-ghost btn-sm" id="backGames">← Бүх тоглоом</button></div>`;
  }

  function bindBack() {
    const b = $("#backGames");
    if (b) b.addEventListener("click", () => go(null));
  }

  function endScreen(opts) {
    const { title, emoji, score, max, lines, gameId, again } = opts;
    GZ.store.saveScore({ kind: "game", game: gameId, score: score, max_score: max || score, meta: opts.meta || {} });
    root().innerHTML = `
      <div class="game-stage tc" style="max-width:560px;margin-inline:auto">
        <div style="font-size:3.2rem;line-height:1">${emoji}</div>
        <h2 style="margin:8px 0 4px">${esc(title)}</h2>
        <div class="mono" style="font-size:2.4rem;font-weight:700;color:var(--teal)">${score} оноо</div>
        <div class="col mt16" style="gap:6px">
          ${(lines || []).map((l) => `<div class="muted" style="font-size:.93rem">${l}</div>`).join("")}
        </div>
        <div class="row center row-wrap mt24">
          <button class="btn btn-primary" id="againBtn">Дахин тоглох</button>
          <a class="btn btn-outline" href="leaderboard.html">Тэргүүлэгчид</a>
          <button class="btn btn-ghost" id="backGames">Бусад тоглоом</button>
        </div>
      </div>`;
    $("#againBtn").addEventListener("click", again);
    bindBack();
  }

  /* ================= 1. АЙМАГ ТАНИХ ================= */
  const MAP = (() => {
    const LON0 = 87.5, LON1 = 120.0, LAT1 = 52.3, LAT0 = 41.3, W = 1000;
    const K = Math.cos((46.8 * Math.PI) / 180);
    const S = W / ((LON1 - LON0) * K);
    const H = (LAT1 - LAT0) * S;
    return {
      W, H: Math.round(H),
      xy: (lon, lat) => [((lon - LON0) * K * S), ((LAT1 - lat) * S)],
      path: (pts, close) => pts.map(([lo, la], i) => {
        const [x, y] = MAPXY(lo, la);
        return (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
      }).join(" ") + (close ? " Z" : ""),
    };
    function MAPXY(lo, la) { return [((lo - LON0) * K * S), ((LAT1 - la) * S)]; }
  })();

  function mapSvg(extra) {
    const border = GZ.MN_BORDER.map(([lo, la], i) => {
      const [x, y] = MAP.xy(lo, la);
      return (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
    }).join(" ") + " Z";
    const lakes = GZ.MN_LAKES.map((L) => {
      const d = L.pts.map(([lo, la], i) => {
        const [x, y] = MAP.xy(lo, la);
        return (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
      }).join(" ") + " Z";
      return `<path class="lake" d="${d}"/>`;
    }).join("");
    return `<div class="map-wrap">
      <svg class="mn-map" viewBox="0 0 ${MAP.W} ${MAP.H}" role="img" aria-label="Монгол улсын схем зураг">
        <path class="border" d="${border}"/>${lakes}${extra || ""}
      </svg>
    </div>
    <p class="map-hint muted tc">Зургийг хажуу тийш гүйлгэж болно</p>`;
  }

  function gameAimag() {
    const rounds = GZ.shuffle(GZ.AIMAGS).slice(0, 12);
    let i = 0, score = 0, lives = 3, streak = 0, best = 0;
    const solved = {};

    function draw() {
      if (i >= rounds.length || lives <= 0) return done();
      const target = rounds[i];

      const dots = GZ.AIMAGS.map((a) => {
        const p = MAP.xy(a.lon, a.lat);
        const x = p[0] + (a.dx || 0), y = p[1] + (a.dy || 0);
        const st = solved[a.n];
        // Нийслэлийг холбох туслах шугам (байрлалыг шилжүүлсэн тул)
        const lead = a.dx || a.dy
          ? `<line x1="${p[0].toFixed(1)}" y1="${p[1].toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--ink-4)" stroke-width="1" stroke-dasharray="2 2"/>`
          : "";
        return lead +
          `<circle class="dot${st ? " " + st : ""}" data-n="${esc(a.n)}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${a.capital ? 9 : 7.5}"/>` +
          (a.capital ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="var(--terra)" pointer-events="none"/>` : "") +
          (st ? `<text x="${x.toFixed(1)}" y="${(y - 12).toFixed(1)}" text-anchor="middle" class="${a.capital ? "cap" : ""}">${esc(a.n)}</text>` : "");
      }).join("");

      root().innerHTML = `
        ${hud([
          { label: "Оноо", value: score },
          { label: "Асуулт", value: `${i + 1}/${rounds.length}` },
          { label: "Амь", value: "❤".repeat(lives) || "—", cls: "lives" },
          { label: "Цуврал", value: streak },
        ])}
        <div class="game-stage">
          <div class="tc mb24">
            <span class="badge terra">${esc(target.zone)} бүс</span>
            <h2 style="margin:10px 0 2px">«${esc(target.n)}» аймгийг ол</h2>
            <p class="muted" style="margin:0">Зураг дээрх зөв цэг дээр дарна уу</p>
          </div>
          ${mapSvg(dots)}
          <div id="mapMsg" class="tc mt16" style="min-height:64px"></div>
        </div>`;
      bindBack();

      GZ.$$(".mn-map .dot").forEach((d) => {
        if (solved[d.dataset.n]) return;
        d.addEventListener("click", () => pick(d, target));
      });
    }

    function pick(dot, target) {
      const name = dot.dataset.n;
      const ok = name === target.n;
      GZ.$$(".mn-map .dot").forEach((d) => d.replaceWith(d.cloneNode(true)));

      if (ok) {
        streak++; best = Math.max(best, streak);
        const pts = 10 + Math.min(streak - 1, 5) * 2;
        score += pts;
        solved[name] = "correct";
        $("#mapMsg").innerHTML = `<div class="alert ok" style="justify-content:center"><span class="ic">✅</span>
          <div><b>Зөв! +${pts} оноо</b><p style="margin:4px 0 0;font-size:.88rem">${esc(target.fact)}</p></div></div>`;
      } else {
        streak = 0; lives--;
        solved[target.n] = "solved";
        $("#mapMsg").innerHTML = `<div class="alert warn" style="justify-content:center"><span class="ic">📍</span>
          <div><b>Тэр бол ${esc(name)}.</b> ${esc(target.n)} аймаг өөр байрлалд байна — тэмдэглэсэн.
          <p style="margin:4px 0 0;font-size:.88rem">${esc(target.fact)}</p></div></div>`;
        // Зөв байрлалыг тодруулах
        const t = GZ.$$(".mn-map .dot").find((d) => d.dataset.n === target.n);
        if (t) t.classList.add("target");
      }

      const btn = GZ.el("button", { class: "btn btn-primary mt16", text: i + 1 >= rounds.length || lives <= 0 ? "Дүн харах →" : "Дараагийнх →" });
      btn.addEventListener("click", () => { i++; draw(); });
      $("#mapMsg").appendChild(btn);
    }

    function done() {
      endScreen({
        title: score >= 100 ? "Газрын зургийн мастер!" : score >= 50 ? "Сайн байна!" : "Дахин оролдъё",
        emoji: score >= 100 ? "🏆" : score >= 50 ? "🗺️" : "🧭",
        score, max: rounds.length * 20, gameId: "aimag",
        lines: [`Хамгийн урт цуврал: <b>${best}</b>`, `${rounds.length} аймгаас ${Object.values(solved).filter((v) => v === "correct").length}-г зөв таасан`],
        meta: { streak: best },
        again: gameAimag,
      });
    }

    draw();
  }

  /* ================= 2. ДАЛБАА ТАНИХ ================= */
  function gameFlags() {
    quizStyle({
      id: "flags", title: "Далбаа таних", rounds: 12,
      make: () => {
        const c = GZ.pick(GZ.COUNTRIES);
        const wrong = GZ.shuffle(GZ.COUNTRIES.filter((x) => x.n !== c.n)).slice(0, 3);
        const opts = GZ.shuffle([c, ...wrong]);
        return {
          visual: `<div class="flag-big">${c.f}</div>`,
          prompt: "Энэ бол аль улсын далбаа вэ?",
          options: opts.map((o) => o.n),
          answer: opts.indexOf(c),
          after: `<b>${esc(c.n)}</b> — нийслэл нь ${esc(c.cap)}, ${esc(c.cont)} тивд.`,
        };
      },
      again: gameFlags,
    });
  }

  /* ================= 3. НИЙСЛЭЛ ТАНИХ ================= */
  function gameCapital() {
    quizStyle({
      id: "capital", title: "Нийслэл таних", rounds: 12,
      make: () => {
        const rev = Math.random() < 0.5;
        const c = GZ.pick(GZ.COUNTRIES);
        const wrong = GZ.shuffle(GZ.COUNTRIES.filter((x) => x.n !== c.n)).slice(0, 3);
        const opts = GZ.shuffle([c, ...wrong]);
        return rev ? {
          visual: `<div class="tc" style="font-size:2.6rem;margin-bottom:6px">🏙️</div>`,
          prompt: `«${c.cap}» аль улсын нийслэл вэ?`,
          options: opts.map((o) => o.n),
          answer: opts.indexOf(c),
          after: `<b>${esc(c.cap)}</b> — ${esc(c.n)} ${c.f} улсын нийслэл.`,
        } : {
          visual: `<div class="flag-big" style="font-size:clamp(3rem,10vw,5rem)">${c.f}</div>`,
          prompt: `${c.n} улсын нийслэл аль нь вэ?`,
          options: opts.map((o) => o.cap),
          answer: opts.indexOf(c),
          after: `<b>${esc(c.n)}</b> ${c.f} улсын нийслэл нь <b>${esc(c.cap)}</b>.`,
        };
      },
      again: gameCapital,
    });
  }

  /* Далбаа/нийслэл зэрэг сонголттой тоглоомын нийтлэг хөдөлгүүр */
  function quizStyle(cfg) {
    let i = 0, score = 0, streak = 0, best = 0, right = 0;

    function draw() {
      if (i >= cfg.rounds) return done();
      const q = cfg.make();
      root().innerHTML = `
        ${hud([
          { label: "Оноо", value: score },
          { label: "Асуулт", value: `${i + 1}/${cfg.rounds}` },
          { label: "Цуврал", value: streak },
        ])}
        <div class="game-stage" style="max-width:620px;margin-inline:auto">
          ${q.visual}
          <p class="q-text tc">${esc(q.prompt)}</p>
          <div class="opts" id="gOpts"></div>
          <div id="gAfter"></div>
        </div>`;
      bindBack();
      const opts = $("#gOpts");
      q.options.forEach((o, k) => {
        const b = GZ.el("button", { class: "opt", html: `<span class="k">${"АБВГ"[k]}</span><span>${esc(o)}</span>` });
        b.addEventListener("click", () => choose(k, q, opts));
        opts.appendChild(b);
      });
    }

    function choose(k, q, opts) {
      Array.from(opts.children).forEach((b, n) => {
        b.disabled = true;
        if (n === q.answer) b.classList.add("correct");
        else if (n === k) b.classList.add("wrong");
      });
      if (k === q.answer) {
        right++; streak++; best = Math.max(best, streak);
        score += 10 + Math.min(streak - 1, 5) * 2;
      } else streak = 0;
      $("#gAfter").innerHTML = `<div class="explain">${q.after}</div>
        <button class="btn btn-primary mt16 btn-block" id="gNext">${i + 1 >= cfg.rounds ? "Дүн харах →" : "Дараагийнх →"}</button>`;
      $("#gNext").addEventListener("click", () => { i++; draw(); });
    }

    function done() {
      endScreen({
        title: right === cfg.rounds ? "Төгс тоглолт!" : right >= cfg.rounds * 0.7 ? "Сайн байна!" : "Үргэлжлүүлээрэй",
        emoji: right === cfg.rounds ? "🏆" : right >= cfg.rounds * 0.7 ? "🎉" : "🌍",
        score, max: cfg.rounds * 20, gameId: cfg.id,
        lines: [`${right} / ${cfg.rounds} зөв`, `Хамгийн урт цуврал: <b>${best}</b>`],
        again: cfg.again,
      });
    }
    draw();
  }

  /* ================= 4. ГАЗАРЗҮЙН ҮГ (Wordle) ================= */
  const KB_ROWS = [
    "ФЦУЖЭНГШҮЗКЪ".split(""),
    "ЙЫБӨАХРОЛДП".split(""),
    "ЯЧЁСМИТЬВЮ".split(""),
  ];

  function gameWord() {
    const item = GZ.pick(GZ.WORDS);
    const WORD = item.w;
    const LEN = WORD.length, TRIES = 6;
    let row = 0, cur = "", finished = false;
    const keyState = {};

    function draw() {
      root().innerHTML = `
        ${hud([{ label: "Урт", value: LEN + " үсэг" }, { label: "Оролдлого", value: `${row}/${TRIES}` }])}
        <div class="game-stage" style="max-width:560px;margin-inline:auto">
          <div class="tc mb24">
            <h2 style="margin:0 0 6px">Газарзүйн үг</h2>
            <p class="muted" style="margin:0">Сануулга: <b>${esc(item.h)}</b></p>
          </div>
          <div class="wd-grid" id="wdGrid"></div>
          <div id="wdMsg" class="tc" style="min-height:44px"></div>
          <div class="kbd-rows" id="wdKbd"></div>
          <p class="muted tc mt16" style="font-size:.8rem">
            <span style="color:var(--ok)">■</span> зөв байрлалд ·
            <span style="color:var(--gold)">■</span> үг дотор байгаа ·
            <span style="color:var(--ink-4)">■</span> байхгүй
          </p>
        </div>`;
      bindBack();
      drawGrid();
      drawKbd();
      $("#wdKbd").addEventListener("click", (e) => {
        const b = e.target.closest(".kbd-key");
        if (b) press(b.dataset.k);
      });
      document.addEventListener("keydown", onKey);
      cleanup = () => document.removeEventListener("keydown", onKey);
    }

    function drawGrid() {
      const g = $("#wdGrid");
      g.style.gridTemplateRows = `repeat(${TRIES}, auto)`;
      let html = "";
      for (let r = 0; r < TRIES; r++) {
        html += `<div class="wd-row" id="wdr${r}">`;
        for (let c = 0; c < LEN; c++) html += `<div class="wd-cell" id="wd${r}-${c}"></div>`;
        html += `</div>`;
      }
      g.innerHTML = html;
      paintCurrent();
    }

    function paintCurrent() {
      for (let c = 0; c < LEN; c++) {
        const cell = $(`#wd${row}-${c}`);
        if (!cell) continue;
        cell.textContent = cur[c] || "";
        cell.classList.toggle("filled", !!cur[c]);
      }
    }

    function drawKbd() {
      $("#wdKbd").innerHTML = KB_ROWS.map((r, ri) => {
        let row = r.map((k) => `<button class="kbd-key ${keyState[k] || ""}" data-k="${k}">${k}</button>`).join("");
        if (ri === 2) {
          row = `<button class="kbd-key wide" data-k="ENTER">ОРУУЛАХ</button>` + row + `<button class="kbd-key wide" data-k="DEL">⌫</button>`;
        }
        return `<div class="kbd-row">${row}</div>`;
      }).join("");
    }

    function onKey(e) {
      if (e.key === "Enter") press("ENTER");
      else if (e.key === "Backspace") press("DEL");
      else if (e.key.length === 1) {
        const ch = e.key.toUpperCase();
        if (/[Ѐ-ӿ]/.test(ch)) press(ch);
      }
    }

    function press(k) {
      if (finished) return;
      if (k === "DEL") { cur = cur.slice(0, -1); paintCurrent(); return; }
      if (k === "ENTER") { submit(); return; }
      if (cur.length < LEN) { cur += k; paintCurrent(); }
    }

    function submit() {
      if (cur.length !== LEN) {
        $("#wdMsg").innerHTML = `<span class="badge danger">${LEN} үсэг оруулна уу</span>`;
        const r = $(`#wdr${row}`);
        r.style.animation = "shake .4s"; setTimeout(() => (r.style.animation = ""), 420);
        return;
      }
      const res = score(cur, WORD);
      for (let c = 0; c < LEN; c++) {
        const cell = $(`#wd${row}-${c}`);
        setTimeout(() => {
          cell.classList.add(res[c]);
          const ch = cur[c];
          const rank = { hit: 3, near: 2, miss: 1 };
          if (!keyState[ch] || rank[res[c]] > rank[keyState[ch]]) keyState[ch] = res[c];
          drawKbd();
        }, c * 130);
      }

      setTimeout(() => {
        if (cur === WORD) return win();
        row++; cur = "";
        if (row >= TRIES) return lose();
        $("#wdMsg").innerHTML = "";
        paintCurrent();
        const pill = GZ.$$(".hud-pill .v")[1];
        if (pill) pill.textContent = `${row}/${TRIES}`;
      }, LEN * 130 + 220);
    }

    function score(guess, word) {
      const res = new Array(guess.length).fill("miss");
      const pool = {};
      for (let i = 0; i < word.length; i++) {
        if (guess[i] === word[i]) res[i] = "hit";
        else pool[word[i]] = (pool[word[i]] || 0) + 1;
      }
      for (let i = 0; i < guess.length; i++) {
        if (res[i] === "hit") continue;
        if (pool[guess[i]] > 0) { res[i] = "near"; pool[guess[i]]--; }
      }
      return res;
    }

    function win() {
      finished = true;
      if (cleanup) cleanup();
      const pts = [0, 60, 50, 40, 32, 25, 20][row + 1] || 20;
      endScreen({
        title: "Таалаа!", emoji: "🎯", score: pts, max: 60, gameId: "word",
        lines: [`Үг: <b>${WORD}</b>`, `${row + 1} дэх оролдлогоор`, esc(item.h)],
        again: gameWord,
      });
    }

    function lose() {
      finished = true;
      if (cleanup) cleanup();
      endScreen({
        title: "Дуусчихлаа", emoji: "📖", score: 5, max: 60, gameId: "word",
        lines: [`Зөв үг: <b>${WORD}</b>`, esc(item.h)],
        again: gameWord,
      });
    }

    draw();
  }

  /* ================= 5. НЭР ТОМЬЁО ТААРУУЛАХ ================= */
  function gameMatch() {
    const pairs = GZ.sample(GZ.TERM_PAIRS, 6);
    const cells = GZ.shuffle([
      ...pairs.map((p, i) => ({ id: i, t: p[0], kind: "t" })),
      ...pairs.map((p, i) => ({ id: i, t: p[1], kind: "d" })),
    ]);
    let sel = null, done = 0, score = 0, tries = 0, t0 = Date.now(), tick;

    function draw() {
      root().innerHTML = `
        ${hud([
          { label: "Тааруулсан", value: `${done}/6` },
          { label: "Оролдлого", value: tries },
          { label: "Хугацаа", value: '<span id="mTime">0:00</span>' },
        ])}
        <div class="game-stage">
          <div class="tc mb24">
            <h2 style="margin:0 0 6px">Нэр томьёо тааруулах</h2>
            <p class="muted" style="margin:0">Ойлголт болон түүний тодорхойлолтыг хосоор нь дар</p>
          </div>
          <div class="match-grid" id="mGrid"></div>
        </div>`;
      bindBack();
      const g = $("#mGrid");
      cells.forEach((c, n) => {
        const b = GZ.el("button", {
          class: "match-cell" + (c.kind === "t" ? "" : ""),
          html: c.kind === "t" ? `<b>${esc(c.t)}</b>` : `<span style="font-size:.82rem">${esc(c.t)}</span>`,
          dataset: { n: String(n) },
        });
        b.addEventListener("click", () => tap(b, c));
        g.appendChild(b);
      });
      tick = setInterval(() => {
        const s = Math.round((Date.now() - t0) / 1000);
        const el = $("#mTime");
        if (el) el.textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
      }, 500);
      cleanup = () => clearInterval(tick);
    }

    function tap(btn, cell) {
      if (btn.classList.contains("done") || btn === (sel && sel.btn)) return;
      if (!sel) { sel = { btn, cell }; btn.classList.add("sel"); return; }
      tries++;
      const ok = sel.cell.id === cell.id && sel.cell.kind !== cell.kind;
      if (ok) {
        sel.btn.classList.remove("sel");
        sel.btn.classList.add("done"); btn.classList.add("done");
        sel.btn.disabled = true; btn.disabled = true;
        done++; score += 20;
        sel = null;
        const p = GZ.$$(".hud-pill .v");
        if (p[0]) p[0].textContent = `${done}/6`;
        if (p[1]) p[1].textContent = tries;
        if (done === 6) finish();
      } else {
        btn.classList.add("bad");
        const s = sel;
        s.btn.classList.add("bad");
        setTimeout(() => { btn.classList.remove("bad", "sel"); s.btn.classList.remove("bad", "sel"); }, 460);
        sel = null;
        score = Math.max(0, score - 2);
        const p = GZ.$$(".hud-pill .v");
        if (p[1]) p[1].textContent = tries;
      }
    }

    function finish() {
      clearInterval(tick);
      const secs = Math.round((Date.now() - t0) / 1000);
      const bonus = Math.max(0, 60 - secs);
      endScreen({
        title: tries === 6 ? "Алдаагүй!" : "Бүгдийг таарууллаа", emoji: tries === 6 ? "🏆" : "🧩",
        score: score + bonus, max: 180, gameId: "match",
        lines: [`Хугацаа: <b>${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}</b>`,
                `Оролдлого: <b>${tries}</b> (хамгийн бага 6)`, `Хурдны урамшуулал: +${bonus}`],
        again: gameMatch,
      });
    }
    draw();
  }

  /* ================= 6. АЛЬ НЬ ИХ ВЭ? ================= */
  function gameHigher() {
    let score = 0, lives = 3, best = 0, streak = 0;
    let cat = GZ.pick(GZ.COMPARE);
    let a = GZ.pick(cat.items), b;
    nextB();

    function nextB() {
      let tries = 0;
      do { b = GZ.pick(cat.items); tries++; } while ((b.n === a.n || b.v === a.v) && tries < 30);
    }

    function draw(revealed) {
      root().innerHTML = `
        ${hud([
          { label: "Оноо", value: score },
          { label: "Амь", value: "❤".repeat(lives) || "—", cls: "lives" },
          { label: "Цуврал", value: streak },
        ])}
        <div class="game-stage" style="max-width:720px;margin-inline:auto">
          <div class="tc mb24">
            <span class="badge sky">${esc(cat.cat)}</span>
            <h2 style="margin:10px 0 2px">Аль нь их вэ?</h2>
            <p class="muted" style="margin:0">Хоёр хувилбарыг харьцуулж сонгоно уу</p>
          </div>
          <div class="hl-pair">
            <div class="hl-side"><div class="topo"></div>
              <div class="e">${a.e}</div><div class="n">${esc(a.n)}</div>
              <div class="v">${GZ.fmtNum(a.v)} <span style="font-size:.7rem;opacity:.7">${esc(cat.unit)}</span></div>
            </div>
            <div class="hl-vs">VS</div>
            <div class="hl-side"><div class="topo"></div>
              <div class="e">${b.e}</div><div class="n">${esc(b.n)}</div>
              <div class="v" id="bVal">${revealed ? GZ.fmtNum(b.v) + ` <span style="font-size:.7rem;opacity:.7">${esc(cat.unit)}</span>` : "???"}</div>
            </div>
          </div>
          <div class="hl-btns" id="hlBtns">
            <button class="btn btn-primary" data-c="more">▲ ${esc(b.n)} их</button>
            <button class="btn btn-outline" data-c="less">▼ ${esc(b.n)} бага</button>
          </div>
          <div id="hlMsg" class="tc mt16" style="min-height:50px"></div>
        </div>`;
      bindBack();
      $("#hlBtns").addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-c]");
        if (btn) guess(btn.dataset.c);
      });
    }

    function guess(c) {
      const ok = (c === "more" && b.v > a.v) || (c === "less" && b.v < a.v);
      $("#bVal").innerHTML = GZ.fmtNum(b.v) + ` <span style="font-size:.7rem;opacity:.7">${esc(cat.unit)}</span>`;
      GZ.$$("#hlBtns button").forEach((x) => (x.disabled = true));

      if (ok) { streak++; best = Math.max(best, streak); score += 10 + Math.min(streak - 1, 5) * 3; }
      else { streak = 0; lives--; }

      $("#hlMsg").innerHTML = `<div class="alert ${ok ? "ok" : "warn"}" style="justify-content:center">
        <span class="ic">${ok ? "✅" : "❌"}</span>
        <div><b>${ok ? "Зөв!" : "Буруу."}</b> ${esc(b.n)}: ${GZ.fmtNum(b.v)} ${esc(cat.unit)} ·
        ${esc(a.n)}: ${GZ.fmtNum(a.v)} ${esc(cat.unit)}</div></div>`;

      const btn = GZ.el("button", { class: "btn btn-primary mt16", text: lives <= 0 ? "Дүн харах →" : "Үргэлжлүүлэх →" });
      btn.addEventListener("click", () => {
        if (lives <= 0) return finish();
        a = b;
        if (Math.random() < 0.25) { cat = GZ.pick(GZ.COMPARE); a = GZ.pick(cat.items); }
        nextB();
        draw(false);
      });
      $("#hlMsg").appendChild(btn);
    }

    function finish() {
      endScreen({
        title: best >= 10 ? "Гайхалтай мэдлэг!" : best >= 5 ? "Сайн байна!" : "Дахин оролдъё",
        emoji: best >= 10 ? "🏆" : best >= 5 ? "📊" : "🤔",
        score, max: 200, gameId: "higher",
        lines: [`Хамгийн урт цуврал: <b>${best}</b>`],
        again: gameHigher,
      });
    }
    draw(false);
  }

  /* ================= Галерей ба чиглүүлэлт ================= */
  const REG = { aimag: gameAimag, flags: gameFlags, capital: gameCapital, word: gameWord, match: gameMatch, higher: gameHigher };

  function gallery() {
    $("#gameTitle").textContent = "Газарзүйн тоглоомууд";
    $("#gameDesc").textContent = "Байрлал, нэр томьёо, тоо баримтыг тархинд суулгах хамгийн хурдан арга. Оноо тань тэргүүлэгчдийн жагсаалтад нэгдэнэ.";
    $("#crumbGame").textContent = "Тоглоом";

    const hist = GZ.store.history().filter((h) => h.kind === "game");
    const bestBy = {};
    hist.forEach((h) => { bestBy[h.game] = Math.max(bestBy[h.game] || 0, h.score); });

    root().innerHTML = `
      <div class="grid g3">
        ${GZ.GAMES.map((g) => `
          <button class="card card-hover game-card" data-g="${g.id}" style="text-align:left;border:1px solid var(--line)">
            <div class="glow" style="background:${g.color}"></div>
            <div class="card-icon" style="background:color-mix(in srgb, ${g.color} 16%, transparent);color:${g.color}">${g.emoji}</div>
            <h3>${esc(g.name)}</h3>
            <p class="muted" style="font-size:.93rem">${esc(g.desc)}</p>
            <div class="row between mt16">
              <span class="badge">${esc(g.skill)}</span>
              ${bestBy[g.id] ? `<span class="badge gold">Таны дээд: ${bestBy[g.id]}</span>` : ""}
            </div>
          </button>`).join("")}
      </div>
      <div class="alert mt24"><span class="ic">💡</span>
        <p>Оноо цуглуулахын тулд нэвтэрсэн байх шаардлагагүй — гэхдээ нэвтэрвэл үр дүн тань
        <a href="leaderboard.html">тэргүүлэгчдийн жагсаалтад</a> бүх сурагчидтай хамт харагдана.</p></div>`;

    root().addEventListener("click", (e) => {
      const b = e.target.closest("[data-g]");
      if (b) go(b.dataset.g);
    });
  }

  function go(id) {
    if (cleanup) { cleanup(); cleanup = null; }
    const url = new URL(location.href);
    if (id) url.searchParams.set("g", id); else url.searchParams.delete("g");
    history.replaceState(null, "", url);

    if (!id || !REG[id]) return gallery();
    const meta = GZ.GAMES.find((g) => g.id === id);
    $("#gameTitle").textContent = meta.emoji + " " + meta.name;
    $("#gameDesc").textContent = meta.desc;
    $("#crumbGame").innerHTML = `<a href="games.html">Тоглоом</a> <span>›</span> ${esc(meta.name)}`;
    window.scrollTo({ top: 0 });
    REG[id]();
  }

  function boot() { go(new URLSearchParams(location.search).get("g")); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
