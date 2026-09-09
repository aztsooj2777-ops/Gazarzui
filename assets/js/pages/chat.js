/* ==========================================================================
   AI багш — чатбот
   1) /api/chat байгаа бол жинхэнэ хэлний загвар руу илгээнэ
   2) Байхгүй/алдаа гарвал суурилагдсан мэдлэгийн сан (GZ.KB) ажиллана
   ========================================================================== */
(function () {
  "use strict";
  const GZ = window.GZ, $ = GZ.$, esc = GZ.esc, CFG = window.GZ_CONFIG || {};

  let apiState = "unknown";   // unknown | live | offline
  let history = [];
  let busy = false;

  /* ================= Мэдлэгийн сангийн тааруулагч ================= */
  const STOP = new Set(["юу","вэ","гэж","нь","бол","байна","уу","үү","ямар","хэрхэн","яаж","аль","тухай","талаар","би","та","энэ","тэр","болон","мөн","бас","хэд","хэдэн","дээр","доор","гэдэг","гэсэн","хийх","өгөх","авах"]);

  function tokens(s) {
    return GZ.norm(s).split(" ").filter((w) => w.length > 2 && !STOP.has(w));
  }

  function stem(w) {
    // Монгол хэлний энгийн үг таслалт (нөхцөл, тийн ялгал)
    return w.replace(/(ийн|ын|ийг|ыг|аас|ээс|оос|өөс|тай|тэй|той|төй|даа|дээ|доо|дөө|луу|лүү|руу|рүү|нууд|нүүд|ууд|үүд|ний)$/u, "");
  }

  function findKB(text) {
    const q = GZ.norm(text);
    const toks = tokens(text).map(stem).filter(Boolean);
    let best = null, bestScore = 0;

    GZ.KB.forEach((e) => {
      let s = 0;
      // Бүтэн түлхүүр хэллэг таарвал өндөр оноо
      (e.keys || []).forEach((k) => {
        const nk = GZ.norm(k);
        if (!nk) return;
        if (q.includes(nk)) s += 6 + nk.length * 0.25;
        else {
          const kt = tokens(k).map(stem);
          const hit = kt.filter((x) => toks.some((t) => t.startsWith(x) || x.startsWith(t))).length;
          if (kt.length && hit === kt.length) s += 3.5;
          else s += hit * 1.2;
        }
      });
      // Асуултын гарчигтай давхцал
      const qt = tokens(e.q).map(stem);
      const overlap = qt.filter((x) => toks.some((t) => t.startsWith(x) || x.startsWith(t))).length;
      s += overlap * 1.4;
      // Сэдвийн нэр
      if (q.includes(GZ.norm(e.topic))) s += 2;

      if (s > bestScore) { bestScore = s; best = e; }
    });

    return bestScore >= 4 ? { entry: best, score: bestScore } : null;
  }

  function relatedSuggestions(entry) {
    if (!entry) return GZ.sample(GZ.KB_SUGGEST, 3);
    const same = GZ.KB.filter((e) => e.topic === entry.topic && e.id !== entry.id);
    const rel = (entry.related || []).map((id) => GZ.KB.find((e) => e.id === id)).filter(Boolean);
    return GZ.shuffle(rel.concat(same)).slice(0, 3).map((e) => e.q);
  }

  function fallbackAnswer(text) {
    const topics = GZ.shuffle(GZ.KB).slice(0, 4).map((e) => "• " + e.q).join("\n");
    return {
      text:
        "Уучлаарай, энэ асуултад яг тохирох бэлтгэсэн хариулт олдсонгүй. 🤔\n\n" +
        "Асуултаа арай тодорхой болгож бичвэл олох магадлал өснө. Жишээ нь ойлголтын нэрийг оруулаарай:\n" +
        topics + "\n\n" +
        "Мөн **Хичээл** хэсгээс сэдвээ хайж, эсвэл **Хэлэлцүүлэг** хэсэгт багшаас шууд асууж болно.",
      suggest: GZ.sample(GZ.KB_SUGGEST, 3),
    };
  }

  function localAnswer(text) {
    const hit = findKB(text);
    if (!hit) return fallbackAnswer(text);
    return { text: hit.entry.a, suggest: relatedSuggestions(hit.entry) };
  }

  /* ================= API дуудлага ================= */
  async function askApi(text) {
    if (!CFG.CHAT_API || apiState === "offline") return null;
    const ctx = findKB(text);
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 25000);
      const res = await fetch(CFG.CHAT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          message: text,
          history: history.slice(-8),
          context: ctx ? { q: ctx.entry.q, a: ctx.entry.a, topic: ctx.entry.topic } : null,
        }),
      });
      clearTimeout(to);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      if (!data || !data.reply) throw new Error("no reply");
      apiState = "live";
      setMode("AI загвар холбогдсон");
      return { text: data.reply, suggest: ctx ? relatedSuggestions(ctx.entry) : GZ.sample(GZ.KB_SUGGEST, 3) };
    } catch (e) {
      apiState = "offline";
      setMode("Мэдлэгийн санд суурилсан горим");
      return null;
    }
  }

  function setMode(t) {
    const n = $("#chatMode");
    if (n) n.textContent = t;
  }

  /* ================= UI ================= */
  function bubble(role, html, opts) {
    const log = $("#chatLog");
    const wrap = GZ.el("div", { class: "msg" + (role === "me" ? " me" : "") });
    if (role !== "me") wrap.appendChild(GZ.el("div", { class: "avatar sm", text: "АЦ" }));
    const b = GZ.el("div", { class: "bubble", html });
    wrap.appendChild(b);
    log.appendChild(wrap);
    log.scrollTop = log.scrollHeight;
    return wrap;
  }

  function typing() {
    const log = $("#chatLog");
    const wrap = GZ.el("div", { class: "msg", id: "typingMsg" }, [
      GZ.el("div", { class: "avatar sm", text: "АЦ" }),
      GZ.el("div", { class: "bubble", html: '<span class="typing"><i></i><i></i><i></i></span>' }),
    ]);
    log.appendChild(wrap);
    log.scrollTop = log.scrollHeight;
    return wrap;
  }

  function renderSuggest(list) {
    const host = $("#chatSuggest");
    host.innerHTML = (list || []).map((s) => `<button type="button">${esc(s)}</button>`).join("");
  }

  async function send(text) {
    text = String(text || "").trim();
    if (!text || busy) return;
    busy = true;
    $("#chatSend").disabled = true;

    bubble("me", "<p>" + esc(text) + "</p>");
    history.push({ role: "user", content: text });
    $("#chatText").value = "";
    autoGrow();
    renderSuggest([]);

    const t = typing();
    let ans = await askApi(text);
    if (!ans) {
      // Хүн шиг богино завсарлага
      await new Promise((r) => setTimeout(r, 420 + Math.random() * 380));
      ans = localAnswer(text);
    }
    t.remove();

    bubble("ai", GZ.mdLite(ans.text));
    history.push({ role: "assistant", content: ans.text });
    renderSuggest(ans.suggest);
    saveHistory();

    busy = false;
    $("#chatSend").disabled = false;
    $("#chatText").focus();
  }

  function saveHistory() { GZ.LS.set("chat", history.slice(-40)); }

  function welcome() {
    const name = GZ.store.user ? GZ.store.user.name.split(" ")[0] : null;
    bubble("ai", GZ.mdLite(
      `Сайн байна уу${name ? ", **" + name + "**" : ""}! 👋\n\n` +
      "Би газарзүйн AI туслах байна. Хичээлийн ойлголт, бодлогын алхам, ЭЕШ-ийн зөвлөгөө — юуг ч асуугаарай.\n\n" +
      "Доорх санал болгосон асуултуудаас сонгож эсвэл өөрөө бичээрэй."
    ));
    renderSuggest(GZ.sample(GZ.KB_SUGGEST, 4));
  }

  function autoGrow() {
    const t = $("#chatText");
    t.style.height = "auto";
    t.style.height = Math.min(130, t.scrollHeight) + "px";
  }

  function boot() {
    $("#clearChat").innerHTML = GZ.icon("refresh");
    $("#chatSend").innerHTML = GZ.icon("send");

    // Сэдвийн жагсаалт
    const topics = $("#topicList");
    topics.innerHTML = GZ.KB_TOPICS.map((t) => `<button data-t="${esc(t)}">${esc(t)}</button>`).join("");
    topics.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      const list = GZ.KB.filter((x) => x.topic === b.dataset.t);
      renderSuggest(list.slice(0, 5).map((x) => x.q));
      bubble("ai", GZ.mdLite(`**${b.dataset.t}** сэдвээр дараах асуултуудад бэлтгэсэн хариулт бий:\n` +
        list.slice(0, 6).map((x) => "- " + x.q).join("\n")));
    });

    // Санал болгосон асуултууд
    $("#chatSuggest").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (b) send(b.textContent);
    });

    // Форм
    $("#chatForm").addEventListener("submit", (e) => { e.preventDefault(); send($("#chatText").value); });
    $("#chatText").addEventListener("input", autoGrow);
    $("#chatText").addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send($("#chatText").value); }
    });

    $("#clearChat").addEventListener("click", () => {
      history = [];
      GZ.LS.del("chat");
      $("#chatLog").innerHTML = "";
      welcome();
      GZ.toast("Яриа цэвэрлэгдлээ.");
    });

    // Өмнөх яриаг сэргээх
    const saved = GZ.LS.get("chat", []);
    if (saved.length) {
      history = saved;
      saved.forEach((m) => bubble(m.role === "user" ? "me" : "ai",
        m.role === "user" ? "<p>" + esc(m.content) + "</p>" : GZ.mdLite(m.content)));
      renderSuggest(GZ.sample(GZ.KB_SUGGEST, 3));
    } else {
      welcome();
    }

    // Хичээлээс ирсэн асуулт
    const q = new URLSearchParams(location.search).get("q");
    if (q) { $("#chatText").value = q + " талаар тайлбарлаж өгнө үү"; autoGrow(); $("#chatText").focus(); }

    setMode(CFG.CHAT_API ? "Бэлэн" : "Мэдлэгийн санд суурилсан горим");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
