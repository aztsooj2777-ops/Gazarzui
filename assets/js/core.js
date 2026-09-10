/* ==========================================================================
   Газарзүй — Core: helpers, theme, shell (header/footer), toast, modal
   ========================================================================== */
(function () {
  "use strict";

  const CFG = window.GZ_CONFIG || {};
  const GZ = (window.GZ = window.GZ || {});

  /* ---------------- DOM helpers ---------------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function el(tag, attrs, children) {
    const n = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v === null || v === undefined || v === false) continue;
        if (k === "class") n.className = v;
        else if (k === "html") n.innerHTML = v;
        else if (k === "text") n.textContent = v;
        else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
        else if (k === "dataset") Object.assign(n.dataset, v);
        else n.setAttribute(k, v);
      }
    }
    (Array.isArray(children) ? children : children != null ? [children] : []).forEach((c) => {
      if (c == null || c === false) return;
      n.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
    });
    return n;
  }

  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------------- Утга боловсруулах ---------------- */
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (arr) => arr[rnd(arr.length)];
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = rnd(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function sample(arr, n) { return shuffle(arr).slice(0, n); }

  /* Монгол цагаан толгойд тохирсон энгийн normalize (хайлт/тааруулалтад) */
  function norm(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  const nf = new Intl.NumberFormat("mn-MN");
  const fmtNum = (n) => nf.format(n || 0);

  function timeAgo(ts) {
    const d = typeof ts === "number" ? ts : Date.parse(ts);
    if (!d || isNaN(d)) return "";
    const s = Math.max(1, Math.round((Date.now() - d) / 1000));
    if (s < 60) return "саяхан";
    const m = Math.round(s / 60);
    if (m < 60) return m + " минутын өмнө";
    const h = Math.round(m / 60);
    if (h < 24) return h + " цагийн өмнө";
    const dd = Math.round(h / 24);
    if (dd < 30) return dd + " хоногийн өмнө";
    return new Date(d).toLocaleDateString("mn-MN");
  }

  function initials(name) {
    const p = String(name || "?").trim().split(/\s+/);
    return ((p[0]?.[0] || "") + (p[1]?.[0] || "")).toUpperCase() || "?";
  }

  /* Тогтмол seed-тэй санамсаргүй (өдөр тутмын сорил гэх мэт) */
  function seededRandom(seed) {
    let s = seed >>> 0 || 1;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5;  s >>>= 0;
      return s / 4294967296;
    };
  }
  function dayIndex() {
    const d = new Date();
    return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
  }

  /* ---------------- Local storage ---------------- */
  const LS = {
    get(k, fb) {
      try { const v = localStorage.getItem("gz:" + k); return v == null ? fb : JSON.parse(v); }
      catch (e) { return fb; }
    },
    set(k, v) { try { localStorage.setItem("gz:" + k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem("gz:" + k); } catch (e) {} },
  };

  /* ---------------- Theme ---------------- */
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    const m = $('meta[name="theme-color"]');
    if (m) m.setAttribute("content", t === "dark" ? "#08161d" : "#f7f4ed");
  }
  function initTheme() {
    const saved = LS.get("theme");
    const t = saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    applyTheme(t);
  }
  function toggleTheme() {
    const t = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    LS.set("theme", t);
    applyTheme(t);
  }
  initTheme();

  /* ---------------- Toast ---------------- */
  function toast(msg, kind, title) {
    let host = $("#toasts");
    if (!host) { host = el("div", { id: "toasts" }); document.body.appendChild(host); }
    const t = el("div", { class: "toast " + (kind || "") }, [
      el("div", {}, [title ? el("strong", { text: title }) : null, el("span", { text: msg })]),
    ]);
    host.appendChild(t);
    setTimeout(() => {
      t.style.transition = "opacity .3s, transform .3s";
      t.style.opacity = "0";
      t.style.transform = "translateX(20px)";
      setTimeout(() => t.remove(), 320);
    }, kind === "err" ? 5200 : 3400);
  }

  /* ---------------- Modal ---------------- */
  function modal(opts) {
    const back = el("div", { class: "modal-back" });
    const box = el("div", { class: "modal" + (opts.wide ? " wide" : "") });
    const head = el("div", { class: "modal-head" }, [
      el("h3", { text: opts.title || "" }),
      el("button", { class: "icon-btn", "aria-label": "Хаах", html: icon("x"), onclick: close }),
    ]);
    box.appendChild(head);
    const body = el("div");
    if (typeof opts.content === "string") body.innerHTML = opts.content;
    else if (opts.content) body.appendChild(opts.content);
    box.appendChild(body);
    if (opts.actions) {
      const bar = el("div", { class: "row row-wrap", style: "justify-content:flex-end;margin-top:22px" });
      opts.actions.forEach((a) =>
        bar.appendChild(el("button", { class: "btn " + (a.class || "btn-ghost"), text: a.label, onclick: () => a.onClick ? a.onClick(close) : close() }))
      );
      box.appendChild(bar);
    }
    back.appendChild(box);
    back.addEventListener("click", (e) => { if (e.target === back) close(); });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(back);
    document.body.style.overflow = "hidden";
    function onKey(e) { if (e.key === "Escape") close(); }
    function close() {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      back.remove();
      if (opts.onClose) opts.onClose();
    }
    return { close, body };
  }

  /* ---------------- Icons (inline SVG) ---------------- */
  const ICONS = {
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.7 4 5.7 4 9s-1.4 6.3-4 9c-2.6-2.7-4-5.7-4-9s1.4-6.3 4-9z"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
    send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>',
    book: '<path d="M4 4.5A2.5 2.5 0 016.5 2H20v16H6.5A2.5 2.5 0 004 20.5z"/><path d="M4 20.5A2.5 2.5 0 016.5 18H20v4H6.5A2.5 2.5 0 014 19.5z"/>',
    play: '<path d="M6 3l14 9-14 9z"/>',
    trophy: '<path d="M8 21h8M12 17v4M6 4h12v5a6 6 0 01-12 0z"/><path d="M6 6H4a2 2 0 002 4M18 6h2a2 2 0 01-2 4"/>',
    chat: '<path d="M21 12a8 8 0 01-8 8H7l-4 3V12a8 8 0 018-8h2a8 8 0 018 8z"/>',
    heart: '<path d="M20.8 6.6a5 5 0 00-7.1 0L12 8.3l-1.7-1.7a5 5 0 10-7.1 7.1L12 22l8.8-8.3a5 5 0 000-7.1z"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
    logout: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    refresh: '<path d="M21 12a9 9 0 11-3-6.7M21 4v5h-5"/>',
    download: '<path d="M12 3v12M7 11l5 5 5-5M4 21h16"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    layers: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>',
    chev: '<path d="M6 9l6 6 6-6"/>',
  };
  function icon(name, size) {
    const p = ICONS[name] || "";
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" ${size ? `width="${size}" height="${size}"` : ""} aria-hidden="true">${p}</svg>`;
  }

  /* ---------------- Nav ---------------- */
  const NAV = [
    { href: "index.html", label: "Нүүр" },
    { href: "about.html", label: "Тухай" },
    { href: "lessons.html", label: "Хичээл" },
    { href: "interactive.html", label: "Интерактив" },
    {
      label: "Материал",
      children: [
        { href: "materials.html", label: "Материалын сан", icon: "📚", note: "ЭЕШ, олимпиад, геологи" },
        { href: "materials.html#maps", label: "Газарзүйн зураг", icon: "🗺️", note: "Зураг, атлас, гарын авлага" },
        { href: "quiz.html", label: "Сорил / ЭЕШ", icon: "🎯", note: "95 асуулт, ЭЕШ горим" },
        { href: "games.html", label: "Тоглоом", icon: "🎮", note: "6 интерактив тоглоом" },
        { href: "resources.html", label: "Түргэн лавлах", icon: "📐", note: "Тоо баримт, томьёо" },
      ],
    },
    { href: "chat.html", label: "AI багш" },
    { href: "community.html", label: "Форум" },
  ];

  /* Дэд цэсийн аль нэг нь идэвхтэй эсэх */
  function navIsActive(item, cur) {
    if (item.href) return item.href === cur;
    return (item.children || []).some((c) => c.href.split("#")[0] === cur);
  }

  function currentPage() {
    const p = location.pathname.split("/").pop();
    return !p || p === "" ? "index.html" : p;
  }

  function renderHeader() {
    const host = $("#app-header");
    if (!host) return;
    const cur = currentPage();
    const site = CFG.SITE || {};
    host.innerHTML = `
      <header class="topbar" id="topbar">
        <div class="wrap">
          <a class="brand" href="index.html" aria-label="${esc(site.name)} нүүр хуудас">
            <span class="brand-mark">${icon("globe")}</span>
            <span class="brand-text">
              <span class="brand-name">${esc(site.name || "Газарзүй")}</span>
              <span class="brand-sub">Газарзүйн сургалт</span>
            </span>
          </a>
          <nav class="nav" id="mainnav">
            ${NAV.map((n, i) => {
              const act = navIsActive(n, cur);
              if (!n.children) {
                return `<a href="${n.href}"${act ? ' class="active" aria-current="page"' : ""}>${esc(n.label)}</a>`;
              }
              return `
                <div class="nav-item" data-drop="${i}">
                  <button class="nav-toggle${act ? " active" : ""}" aria-expanded="false" aria-haspopup="true">
                    ${esc(n.label)} <span class="caret">${icon("chev")}</span>
                  </button>
                  <div class="nav-drop" role="menu">
                    ${n.children.map((c) => `
                      <a href="${c.href}" role="menuitem"${c.href.split("#")[0] === cur ? ' class="active"' : ""}>
                        <span class="di">${c.icon || ""}</span>
                        <span class="dt"><b>${esc(c.label)}</b>${c.note ? `<small>${esc(c.note)}</small>` : ""}</span>
                      </a>`).join("")}
                  </div>
                </div>`;
            }).join("")}
          </nav>
          <div class="nav-actions">
            <button class="icon-btn" id="themeBtn" aria-label="Өнгө солих" title="Гэрэл / харанхуй">${icon("sun")}</button>
            <div id="authSlot"></div>
            <button class="icon-btn burger" id="burger" aria-label="Цэс" aria-expanded="false">${icon("menu")}</button>
          </div>
        </div>
      </header>`;

    $("#themeBtn").addEventListener("click", () => { toggleTheme(); syncThemeIcon(); });
    syncThemeIcon();

    const burger = $("#burger"), nav = $("#mainnav");
    burger.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", String(open));
      burger.innerHTML = icon(open ? "x" : "menu");
    });

    /* Дэд цэс нээх / хаах */
    $$(".nav-item", nav).forEach((item) => {
      const btn = $(".nav-toggle", item);
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const open = !item.classList.contains("open");
        $$(".nav-item", nav).forEach((x) => x.classList.remove("open"));
        item.classList.toggle("open", open);
        btn.setAttribute("aria-expanded", String(open));
      });
    });
    document.addEventListener("click", () => {
      $$(".nav-item", nav).forEach((x) => {
        x.classList.remove("open");
        const b = $(".nav-toggle", x);
        if (b) b.setAttribute("aria-expanded", "false");
      });
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      $$(".nav-item", nav).forEach((x) => x.classList.remove("open"));
    });

    const bar = $("#topbar");
    const onScroll = () => bar.classList.toggle("scrolled", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function syncThemeIcon() {
    const b = $("#themeBtn");
    if (b) b.innerHTML = icon(document.documentElement.getAttribute("data-theme") === "dark" ? "moon" : "sun");
  }

  function renderAuthSlot() {
    const slot = $("#authSlot");
    if (!slot) return;
    const u = GZ.store && GZ.store.user;
    if (!u) {
      slot.innerHTML = `<a class="btn btn-primary btn-sm" href="auth.html">Нэвтрэх</a>`;
      return;
    }
    slot.innerHTML = `
      <div style="position:relative">
        <button class="avatar sm" id="avaBtn" title="${esc(u.name)}" style="border:0">${esc(initials(u.name))}</button>
        <div id="avaMenu" class="card card-pad-sm hidden" style="position:absolute;right:0;top:46px;width:216px;z-index:120;box-shadow:var(--sh-3)">
          <div style="font-weight:700">${esc(u.name)}</div>
          <div class="muted" style="font-size:.8rem;margin-bottom:10px">${esc(u.email || "Оффлайн профайл")}</div>
          <a class="btn btn-ghost btn-sm btn-block" href="profile.html">Миний профайл</a>
          <a class="btn btn-ghost btn-sm btn-block" href="leaderboard.html" style="margin-top:4px">Тэргүүлэгчид</a>
          <button class="btn btn-ghost btn-sm btn-block" id="outBtn" style="margin-top:4px;color:var(--danger)">Гарах</button>
        </div>
      </div>`;
    const menu = $("#avaMenu");
    $("#avaBtn").addEventListener("click", (e) => { e.stopPropagation(); menu.classList.toggle("hidden"); });
    document.addEventListener("click", () => menu.classList.add("hidden"));
    $("#outBtn").addEventListener("click", async () => { await GZ.store.signOut(); toast("Системээс гарлаа."); location.reload(); });
  }

  function renderFooter() {
    const host = $("#app-footer");
    if (!host) return;
    const s = CFG.SITE || {};
    host.innerHTML = `
      <footer class="site-footer">
        <div class="topo" style="opacity:.28"></div>
        <div class="wrap">
          <div class="footer-grid">
            <div>
              <div class="footer-brand-line">
                <span class="brand-mark">${icon("globe")}</span>
                <span class="brand-name">${esc(s.name || "Газарзүй")}</span>
              </div>
              <p style="color:#a8c2ca;font-size:.93rem;max-width:330px">
                Газарзүйн хичээлийг сурагч бүрт хүртээмжтэй болгож, сонирхлыг нь өдөөх нээлттэй сургалтын орчин.
                Хичээл, тест, тоглоом, AI туслах — бүгд үнэгүй.
              </p>
              <div class="row" style="margin-top:14px;gap:8px">
                <span class="badge teal">7–9 анги</span>
                <span class="badge gold">ЭЕШ</span>
                <span class="badge sky">Олимпиад</span>
              </div>
            </div>
            <div>
              <h4>Сургалт</h4>
              <ul class="footer-links">
                <li><a href="lessons.html">Хичээлүүд</a></li>
                <li><a href="interactive.html">Интерактив хичээл</a></li>
                <li><a href="quiz.html">Сорил / ЭЕШ</a></li>
                <li><a href="games.html">Тоглоомууд</a></li>
                <li><a href="chat.html">AI багш</a></li>
              </ul>
            </div>
            <div>
              <h4>Нийгэмлэг</h4>
              <ul class="footer-links">
                <li><a href="community.html">Хэлэлцүүлэг</a></li>
                <li><a href="leaderboard.html">Тэргүүлэгчид</a></li>
                <li><a href="profile.html">Миний профайл</a></li>
                <li><a href="materials.html">Материалын сан</a></li>
                <li><a href="resources.html">Түргэн лавлах</a></li>
              </ul>
            </div>
            <div>
              <h4>Холбоо барих</h4>
              <ul class="footer-links">
                <li><a href="about.html">Багшийн тухай</a></li>
                <li><a href="about.html#contact">Санал хүсэлт</a></li>
                <li><a href="mailto:${esc(s.email || "")}">${esc(s.email || "")}</a></li>
                <li><a href="${esc(s.legacyUrl || "#")}" target="_blank" rel="noopener">Хуучин сайт</a></li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            <span>© ${new Date().getFullYear()} ${esc(s.name || "")} · ${esc(s.teacher || "")} · ${esc(s.org || "")}</span>
            <span id="dbStatus"></span>
          </div>
        </div>
      </footer>`;
  }

  /* ---------------- Reveal on scroll ---------------- */
  function initReveal() {
    const els = $$(".reveal");
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en, i) => {
        if (en.isIntersecting) {
          const d = Number(en.target.dataset.delay || 0) || (i * 60);
          setTimeout(() => en.target.classList.add("in"), d);
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px" });
    els.forEach((e) => io.observe(e));
  }

  function countUp(node, to, dur) {
    const t = Number(to) || 0, D = dur || 1200;
    let start = null;
    function step(ts) {
      if (!start) start = ts;
      const p = clamp((ts - start) / D, 0, 1);
      node.textContent = fmtNum(Math.round(t * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function initCounters() {
    const els = $$("[data-count]");
    if (!els.length || !("IntersectionObserver" in window)) { els.forEach((e) => (e.textContent = fmtNum(e.dataset.count))); return; }
    const io = new IntersectionObserver((en) => {
      en.forEach((x) => { if (x.isIntersecting) { countUp(x.target, x.target.dataset.count); io.unobserve(x.target); } });
    }, { threshold: 0.4 });
    els.forEach((e) => io.observe(e));
  }

  /* ---------------- Simple markdown for chat bubbles ---------------- */
  function mdLite(txt) {
    let h = esc(txt);
    h = h.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/(^|\s)\*(?!\s)(.+?)\*(?=\s|$)/g, "$1<i>$2</i>");
    const lines = h.split(/\n/);
    let out = "", inUl = false;
    for (const ln of lines) {
      const li = ln.match(/^\s*[-•]\s+(.*)$/);
      if (li) { if (!inUl) { out += "<ul>"; inUl = true; } out += "<li>" + li[1] + "</li>"; continue; }
      if (inUl) { out += "</ul>"; inUl = false; }
      if (ln.trim()) out += "<p>" + ln + "</p>";
    }
    if (inUl) out += "</ul>";
    return out || "<p></p>";
  }

  /* ---------------- Boot ---------------- */
  function boot() {
    renderHeader();
    renderFooter();
    initReveal();
    initCounters();
    document.addEventListener("gz:auth", renderAuthSlot);
    renderAuthSlot();
  }

  Object.assign(GZ, {
    $, $$, el, esc, icon, ICONS, LS, toast, modal, mdLite,
    clamp, rnd, pick, shuffle, sample, norm, fmtNum, timeAgo, initials,
    seededRandom, dayIndex, countUp, toggleTheme, renderAuthSlot, currentPage,
    CFG,
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
