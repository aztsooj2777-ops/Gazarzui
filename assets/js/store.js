/* ==========================================================================
   Газарзүй — Өгөгдлийн давхарга
   Supabase холбогдсон бол → үүлэн сан (бүх хэрэглэгч хуваалцана)
   Холбогдоогүй бол      → "Оффлайн горим" (localStorage), сайт бүрэн ажиллана
   ========================================================================== */
(function () {
  "use strict";
  const GZ = window.GZ, CFG = window.GZ_CONFIG || {};
  const LS = GZ.LS;

  const store = {
    mode: "local",           // "cloud" | "local"
    user: null,              // { id, name, email, grade, school }
    sb: null,
    ready: null,
  };
  GZ.store = store;

  const emit = () => document.dispatchEvent(new CustomEvent("gz:auth"));

  /* ---------------- Supabase-ийг эхлүүлэх ---------------- */
  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.async = true;
      s.onload = res; s.onerror = () => rej(new Error("script " + src));
      document.head.appendChild(s);
    });
  }

  /* Project URL-ийг цэвэрлэх: /rest/v1/ эсвэл төгсгөлийн ташуу зураас байж болно */
  function cleanUrl(u) {
    return String(u || "").trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
  }

  async function initCloud() {
    const url = cleanUrl(CFG.SUPABASE_URL);
    const key = (CFG.SUPABASE_KEY || CFG.SUPABASE_ANON_KEY || "").trim();
    if (!url || !key) return false;
    if (/^sb_secret_/.test(key)) {
      console.error("[Газарзүй] config.js дотор SECRET түлхүүр байна! Publishable түлхүүр ашиглана уу.");
      return false;
    }
    try {
      if (!window.supabase) await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
      store.sb = window.supabase.createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true },
      });
      store.mode = "cloud";
      const { data } = await store.sb.auth.getSession();
      if (data && data.session) await hydrateProfile(data.session.user);
      store.sb.auth.onAuthStateChange(async (_e, session) => {
        if (session && session.user) await hydrateProfile(session.user);
        else { store.user = null; emit(); }
      });
      return true;
    } catch (e) {
      console.warn("[Газарзүй] Supabase холбогдсонгүй, оффлайн горимд шилжлээ:", e.message);
      store.mode = "local";
      store.sb = null;
      return false;
    }
  }

  async function hydrateProfile(authUser) {
    let prof = null;
    try {
      const { data } = await store.sb.from("profiles").select("*").eq("id", authUser.id).maybeSingle();
      prof = data;
      if (!prof) {
        const name = (authUser.user_metadata && authUser.user_metadata.display_name) || (authUser.email || "").split("@")[0];
        const ins = await store.sb.from("profiles").insert({ id: authUser.id, display_name: name }).select().maybeSingle();
        prof = ins.data || { id: authUser.id, display_name: name };
      }
    } catch (e) { /* профайлын хүснэгт байхгүй байж болно */ }
    store.user = {
      id: authUser.id,
      email: authUser.email,
      name: (prof && prof.display_name) || (authUser.email || "Сурагч").split("@")[0],
      grade: prof && prof.grade,
      school: prof && prof.school,
    };
    emit();
  }

  function initLocal() {
    store.mode = "local";
    store.user = LS.get("user", null);
    emit();
  }

  store.ready = (async () => {
    const ok = await initCloud();
    if (!ok) initLocal();
    stamp();
    return store.mode;
  })();

  function stamp() {
    const n = document.getElementById("dbStatus");
    if (!n) return;
    n.innerHTML = store.mode === "cloud"
      ? '<span style="color:#7fe3d4">● Supabase холбогдсон</span>'
      : '<span title="assets/js/config.js дотор Supabase түлхүүрээ оруулна уу">● Оффлайн горим (локал санах ой)</span>';
  }
  document.addEventListener("gz:auth", stamp);

  /* ================= AUTH ================= */
  store.signUp = async function (email, password, name) {
    if (store.mode === "cloud") {
      const { data, error } = await store.sb.auth.signUp({
        email, password, options: { data: { display_name: name } },
      });
      if (error) throw error;
      if (data.user && !data.session) return { needsConfirm: true };
      return { needsConfirm: false };
    }
    const u = { id: "local-" + Date.now().toString(36), name: name || email.split("@")[0], email };
    LS.set("user", u); store.user = u; emit();
    return { needsConfirm: false };
  };

  store.signIn = async function (email, password) {
    if (store.mode === "cloud") {
      const { error } = await store.sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return true;
    }
    const u = LS.get("user", null);
    const nu = u && u.email === email ? u : { id: "local-" + Date.now().toString(36), name: email.split("@")[0], email };
    LS.set("user", nu); store.user = nu; emit();
    return true;
  };

  store.guest = function (name) {
    const u = { id: "guest-" + Date.now().toString(36), name: name || "Зочин сурагч", email: null, guest: true };
    LS.set("user", u); store.user = u; emit();
    return u;
  };

  store.signOut = async function () {
    if (store.mode === "cloud" && store.sb) { try { await store.sb.auth.signOut(); } catch (e) {} }
    LS.del("user"); store.user = null; emit();
  };

  store.updateProfile = async function (patch) {
    if (!store.user) return;
    Object.assign(store.user, patch);
    if (store.mode === "cloud" && !String(store.user.id).startsWith("guest")) {
      try {
        await store.sb.from("profiles").upsert({
          id: store.user.id, display_name: store.user.name, grade: store.user.grade || null, school: store.user.school || null,
        });
      } catch (e) {}
    }
    LS.set("user", store.user);
    emit();
  };

  store.requireUser = function (why) {
    if (store.user) return true;
    GZ.modal({
      title: "Эхлээд нэвтэрнэ үү",
      content: `<p>${GZ.esc(why || "Энэ үйлдлийг хийхийн тулд нэвтрэх шаардлагатай.")}</p>
        <p class="muted" style="font-size:.9rem">Хурдан эхлэхийг хүсвэл зочноор орж болно — оноо, ахиц нь энэ төхөөрөмж дээр хадгалагдана.</p>`,
      actions: [
        { label: "Зочноор үргэлжлүүлэх", class: "btn-outline", onClick: (c) => { store.guest(); GZ.toast("Зочин горимд орлоо."); c(); } },
        { label: "Нэвтрэх / Бүртгүүлэх", class: "btn-primary", onClick: () => (location.href = "auth.html?next=" + encodeURIComponent(location.pathname.split("/").pop())) },
      ],
    });
    return false;
  };

  /* ================= ОНОО / ТЭРГҮҮЛЭГЧИД ================= */
  store.saveScore = async function (row) {
    const rec = Object.assign({
      user_id: store.user ? store.user.id : "anon",
      user_name: store.user ? store.user.name : "Зочин",
      created_at: new Date().toISOString(),
    }, row);

    // Локал түүх нь үргэлж хадгалагдана (профайл, badge-д хэрэгтэй)
    const hist = LS.get("history", []);
    hist.unshift(rec);
    LS.set("history", hist.slice(0, 400));

    if (store.mode === "cloud" && store.user && !String(store.user.id).startsWith("guest")) {
      try {
        await store.sb.from("scores").insert({
          user_id: rec.user_id, user_name: rec.user_name, kind: rec.kind,
          game: rec.game, score: rec.score, max_score: rec.max_score, meta: rec.meta || {},
        });
      } catch (e) { console.warn("score save:", e.message); }
    } else if (store.mode === "local") {
      const all = LS.get("scores", []);
      all.unshift(rec);
      LS.set("scores", all.slice(0, 400));
    }
    return rec;
  };

  store.history = function () { return LS.get("history", []); };

  store.leaderboard = async function (filter) {
    let rows = [];
    if (store.mode === "cloud") {
      try {
        let q = store.sb.from("scores").select("user_id,user_name,kind,game,score,max_score,created_at")
          .order("created_at", { ascending: false }).limit(600);
        if (filter && filter !== "all") q = q.eq("game", filter);
        const { data, error } = await q;
        if (error) throw error;
        rows = data || [];
      } catch (e) { rows = []; }
    } else {
      rows = LS.get("scores", []);
      if (filter && filter !== "all") rows = rows.filter((r) => r.game === filter);
    }
    const map = new Map();
    rows.forEach((r) => {
      const k = r.user_id || r.user_name;
      if (!map.has(k)) map.set(k, { id: k, name: r.user_name || "Зочин", total: 0, best: 0, plays: 0, last: r.created_at });
      const e = map.get(k);
      e.total += Number(r.score) || 0;
      e.best = Math.max(e.best, Number(r.score) || 0);
      e.plays += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total || b.best - a.best).slice(0, 50);
  };

  /* ================= ХИЧЭЭЛИЙН АХИЦ ================= */
  store.progress = function () { return LS.get("progress", {}); };
  store.markLesson = async function (lessonId) {
    const p = store.progress();
    if (p[lessonId]) return p;
    p[lessonId] = new Date().toISOString();
    LS.set("progress", p);
    if (store.mode === "cloud" && store.user && !String(store.user.id).startsWith("guest")) {
      try { await store.sb.from("lesson_progress").upsert({ user_id: store.user.id, lesson_id: lessonId }); } catch (e) {}
    }
    return p;
  };

  /* ================= ХЭЛЭЛЦҮҮЛЭГ ================= */
  const seedPosts = () => ([
    {
      id: "seed-1", user_id: "seed", author_name: "Ц. Азцоож (багш)", category: "Зарлал", teacher: true,
      title: "Тавтай морил! Энэ бол бидний нээлттэй газарзүйн орчин",
      body: "Сайн байцгаана уу, сурагчид аа!\n\nЭнд та хичээлээ давтах, тест бөглөх, тоглоом тоглох, асуултаа асуух боломжтой. Хичээлийн явцад ойлгомжгүй зүйл гарвал энд бичээрэй — би болон бусад сурагчид хариулна.\n\nДүрэм ганцхан: бие биенээ хүндэтгэе.",
      likes: 42, created_at: new Date(Date.now() - 864e5 * 5).toISOString(),
    },
    {
      id: "seed-2", user_id: "seed2", author_name: "Б. Номин", category: "Асуулт",
      title: "Яагаад Монголд эх газрын эрс тэс уур амьсгал үүсдэг вэ?",
      body: "Далайгаас алслагдсан гэдгийг ойлгож байгаа. Гэхдээ Сибирийн антициклон яг ямар үүрэгтэй юм бол? Хичээл дээр товч ярьсан.",
      likes: 18, created_at: new Date(Date.now() - 864e5 * 2).toISOString(),
    },
    {
      id: "seed-3", user_id: "seed3", author_name: "Э. Тэмүүлэн", category: "Туршлага",
      title: "ЭЕШ-д бэлдэж буй хүмүүст — газрын зургийн даалгавар хэрхэн хийх вэ",
      body: "Надад тустай байсан 3 зөвлөгөө:\n1. Эхлээд масштабыг шалга, дараа нь чиглэлээ тогтоо.\n2. Изогипс хоорондын зайг тоол — налуу эгц эсэхийг тэр хэлнэ.\n3. Гол мөрний урсгалын чиглэлийг өндөршлөөр шалга.\n\nӨдөрт 10 даалгавар хийхэд сарын дараа мэдэгдэхүйц ахисан.",
      likes: 27, created_at: new Date(Date.now() - 864e5).toISOString(),
    },
  ]);

  store.listPosts = async function (category) {
    if (store.mode === "cloud") {
      try {
        let q = store.sb.from("posts").select("*").order("created_at", { ascending: false }).limit(80);
        if (category && category !== "Бүгд") q = q.eq("category", category);
        const { data, error } = await q;
        if (error) throw error;
        if (data && data.length) return data;
      } catch (e) { console.warn("posts:", e.message); }
    }
    let rows = LS.get("posts", null);
    if (!rows) { rows = seedPosts(); LS.set("posts", rows); }
    return category && category !== "Бүгд" ? rows.filter((p) => p.category === category) : rows;
  };

  store.addPost = async function (post) {
    const rec = Object.assign({
      id: "p" + Date.now().toString(36),
      user_id: store.user ? store.user.id : "anon",
      author_name: store.user ? store.user.name : "Зочин",
      likes: 0, created_at: new Date().toISOString(),
    }, post);
    if (store.mode === "cloud" && store.user && !String(store.user.id).startsWith("guest")) {
      try {
        const { data, error } = await store.sb.from("posts")
          .insert({ user_id: rec.user_id, author_name: rec.author_name, category: rec.category, title: rec.title, body: rec.body })
          .select().maybeSingle();
        if (error) throw error;
        return data || rec;
      } catch (e) { GZ.toast("Үүлэн санд хадгалж чадсангүй, локалд хадгаллаа.", "err"); }
    }
    const rows = LS.get("posts", seedPosts());
    rows.unshift(rec); LS.set("posts", rows);
    return rec;
  };

  store.toggleLike = async function (postId) {
    const liked = LS.get("likes", {});
    const on = !liked[postId];
    liked[postId] = on; LS.set("likes", liked);
    if (store.mode === "cloud" && store.user && !String(store.user.id).startsWith("guest")) {
      try {
        if (on) await store.sb.from("post_likes").insert({ post_id: postId, user_id: store.user.id });
        else await store.sb.from("post_likes").delete().eq("post_id", postId).eq("user_id", store.user.id);
      } catch (e) {}
    } else {
      const rows = LS.get("posts", seedPosts());
      const p = rows.find((r) => r.id === postId);
      if (p) { p.likes = Math.max(0, (p.likes || 0) + (on ? 1 : -1)); LS.set("posts", rows); }
    }
    return on;
  };
  store.isLiked = (postId) => !!LS.get("likes", {})[postId];

  store.listComments = async function (postId) {
    if (store.mode === "cloud") {
      try {
        const { data, error } = await store.sb.from("comments").select("*").eq("post_id", postId).order("created_at");
        if (error) throw error;
        if (data) return data;
      } catch (e) {}
    }
    return LS.get("comments", {})[postId] || [];
  };

  store.addComment = async function (postId, body) {
    const rec = {
      id: "c" + Date.now().toString(36), post_id: postId,
      user_id: store.user ? store.user.id : "anon",
      author_name: store.user ? store.user.name : "Зочин",
      body, created_at: new Date().toISOString(),
    };
    if (store.mode === "cloud" && store.user && !String(store.user.id).startsWith("guest")) {
      try {
        const { data, error } = await store.sb.from("comments")
          .insert({ post_id: postId, user_id: rec.user_id, author_name: rec.author_name, body }).select().maybeSingle();
        if (error) throw error;
        return data || rec;
      } catch (e) {}
    }
    const all = LS.get("comments", {});
    (all[postId] = all[postId] || []).push(rec);
    LS.set("comments", all);
    return rec;
  };

  /* ================= САНАЛ ХҮСЭЛТ ================= */
  store.sendMessage = async function (m) {
    if (store.mode === "cloud") {
      try {
        const { error } = await store.sb.from("messages").insert(m);
        if (error) throw error;
        return true;
      } catch (e) { console.warn("message:", e.message); }
    }
    const rows = LS.get("messages", []);
    rows.unshift(Object.assign({ created_at: new Date().toISOString() }, m));
    LS.set("messages", rows);
    return true;
  };
})();
