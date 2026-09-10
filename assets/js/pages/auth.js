/* ==========================================================================
   Нэвтрэх / Бүртгүүлэх — сурагч эсвэл багшийн эрхээр
   ========================================================================== */
(function () {
  "use strict";
  const GZ = window.GZ, $ = GZ.$, esc = GZ.esc;

  const qs = new URLSearchParams(location.search);
  const next = qs.get("next") || "profile.html";
  let role = qs.get("role") === "teacher" ? "teacher" : "student";
  let mode = qs.get("role") ? "up" : "in";

  async function boot() {
    await GZ.store.ready;

    if (GZ.store.user) {
      $("#authBody").innerHTML = `
        <div class="tc" style="padding:14px 0">
          <div class="avatar xl" style="margin:0 auto 14px">${esc(GZ.initials(GZ.store.user.name))}</div>
          <h3 style="margin:0 0 4px">${esc(GZ.store.user.name)}</h3>
          <p class="muted">${esc(GZ.store.user.email || "Оффлайн профайл")}</p>
          <a class="btn btn-primary btn-block mt16" href="profile.html">Профайл руу</a>
          <button class="btn btn-ghost btn-block mt8" id="outBtn2" style="color:var(--danger)">Гарах</button>
        </div>`;
      $("#authTabs").classList.add("hidden");
      $("#outBtn2").addEventListener("click", async () => {
        await GZ.store.signOut();
        location.reload();
      });
      return;
    }

    $("#authTabs").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      mode = b.dataset.t;
      GZ.$$("#authTabs button").forEach((x) => x.classList.toggle("active", x === b));
      render();
    });
    GZ.$$("#authTabs button").forEach((x) => x.classList.toggle("active", x.dataset.t === mode));
    render();
  }

  function render() {
    const cloud = GZ.store.mode === "cloud";
    $("#authBody").innerHTML = `
      ${cloud ? "" : `<div class="alert warn mb16" style="font-size:.87rem"><span class="ic">💾</span>
        <p><b>Оффлайн горим.</b> Supabase холбогдоогүй байна — профайл зөвхөн энэ төхөөрөмж дээр хадгалагдана.
        Ямар ч и-мэйл, нууц үгээр орж туршиж болно.</p></div>`}

      <form id="authForm">
        ${mode === "up" ? `
        <div class="field">
          <label>Та хэн бэ?</label>
          <div class="role-pick" id="rolePick">
            <label class="role-opt${role === "student" ? " on" : ""}">
              <input type="radio" name="role" value="student"${role === "student" ? " checked" : ""}>
              <span class="e">🎒</span>
              <b>Сурагч</b>
              <small>Хичээл үзэх, сорил өгөх, тоглох</small>
            </label>
            <label class="role-opt${role === "teacher" ? " on" : ""}">
              <input type="radio" name="role" value="teacher"${role === "teacher" ? " checked" : ""}>
              <span class="e">👩‍🏫</span>
              <b>Багш</b>
              <small>Хичээл байршуулах, хэлэлцүүлэг хийх</small>
            </label>
          </div>
        </div>

        <div class="field">
          <label for="fName">Нэр</label>
          <input class="input" id="fName" name="name" required maxlength="60" placeholder="Б. Номин" autocomplete="name">
        </div>

        <div id="teacherFields" class="${role === "teacher" ? "" : "hidden"}">
          <div class="grid g2" style="gap:0 14px">
            <div class="field">
              <label for="fSchool">Сургууль</label>
              <input class="input" id="fSchool" name="school" maxlength="80" placeholder="Прогресс сургууль">
            </div>
            <div class="field">
              <label for="fSubject">Заадаг хичээл</label>
              <input class="input" id="fSubject" name="subject" maxlength="60" placeholder="Газарзүй">
            </div>
          </div>
          <div class="alert warn mb16" style="font-size:.85rem"><span class="ic">ℹ️</span>
            <p>Багшийн эрхийг админ багш баталгаажуулна. Түүн хүртэл таны нэмсэн хичээл
            хяналтын жагсаалтад орж, батлагдсаны дараа нийтлэгдэнэ.</p></div>
        </div>` : ""}
        <div class="field">
          <label for="fEmail">И-мэйл</label>
          <input class="input" id="fEmail" name="email" type="email" required placeholder="nomin@example.com" autocomplete="email">
        </div>
        <div class="field">
          <label for="fPass">Нууц үг</label>
          <input class="input" id="fPass" name="password" type="password" required minlength="6" placeholder="Хамгийн багадаа 6 тэмдэгт" autocomplete="${mode === "up" ? "new-password" : "current-password"}">
          ${mode === "up" ? '<span class="hint">Хамгийн багадаа 6 тэмдэгт.</span>' : ""}
        </div>
        <div id="authErr"></div>
        <button class="btn btn-primary btn-block btn-lg" type="submit">
          ${mode === "up" ? "Бүртгүүлэх" : "Нэвтрэх"}
        </button>
      </form>

      <div class="row center mt16" style="gap:10px;color:var(--ink-4);font-size:.85rem">
        <span style="flex:1;height:1px;background:var(--line)"></span> эсвэл <span style="flex:1;height:1px;background:var(--line)"></span>
      </div>
      <button class="btn btn-outline btn-block mt16" id="guestBtn">Зочноор үргэлжлүүлэх</button>
      <p class="muted tc mt8" style="font-size:.8rem">Зочин горимд оноо энэ төхөөрөмжид хадгалагдана.</p>`;

    $("#authForm").addEventListener("submit", submit);

    // Эрхийн сонголт
    const pick = $("#rolePick");
    if (pick) pick.addEventListener("change", (e) => {
      role = e.target.value;
      GZ.$$(".role-opt", pick).forEach((o) =>
        o.classList.toggle("on", o.querySelector("input").checked));
      $("#teacherFields").classList.toggle("hidden", role !== "teacher");
    });

    $("#guestBtn").addEventListener("click", () => {
      GZ.modal({
        title: "Зочны нэр",
        content: `<div class="field"><label>Таныг юу гэж дуудах вэ?</label>
          <input class="input" id="gName" placeholder="Зочин сурагч" maxlength="40"></div>`,
        actions: [
          { label: "Болих", class: "btn-ghost" },
          { label: "Эхлэх", class: "btn-primary", onClick: (c) => {
              GZ.store.guest(($("#gName").value || "").trim() || "Зочин сурагч");
              c();
              GZ.toast("Тавтай морил!", "ok");
              setTimeout(() => (location.href = next), 500);
            } },
        ],
      });
    });
  }

  async function submit(e) {
    e.preventDefault();
    const f = e.target;
    const btn = f.querySelector('button[type="submit"]');
    const err = $("#authErr");
    err.innerHTML = "";
    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = "Түр хүлээнэ үү…";

    const fd = new FormData(f);
    try {
      if (mode === "up") {
        const r = await GZ.store.signUp(
          fd.get("email"), fd.get("password"), String(fd.get("name")).trim(),
          {
            role: fd.get("role") === "teacher" ? "teacher" : "student",
            school: String(fd.get("school") || "").trim(),
            subject: String(fd.get("subject") || "").trim(),
          });
        if (r.needsConfirm) {
          err.innerHTML = `<div class="alert ok mb16"><span class="ic">📧</span>
            <p>И-мэйл хаяг руу баталгаажуулах холбоос илгээлээ. Түүнийг дарсны дараа нэвтэрнэ үү.</p></div>`;
          btn.disabled = false; btn.textContent = label;
          return;
        }
      } else {
        await GZ.store.signIn(fd.get("email"), fd.get("password"));
      }
      GZ.toast("Тавтай морил!", "ok");
      setTimeout(() => (location.href = next), 400);
    } catch (ex) {
      err.innerHTML = `<div class="alert mb16" style="background:color-mix(in srgb,var(--danger) 12%,transparent);border-color:color-mix(in srgb,var(--danger) 30%,transparent)">
        <span class="ic">⚠️</span><p>${esc(translate(ex.message || "Алдаа гарлаа."))}</p></div>`;
      btn.disabled = false;
      btn.textContent = label;
    }
  }

  function translate(m) {
    const s = String(m).toLowerCase();
    if (s.includes("invalid login")) return "И-мэйл эсвэл нууц үг буруу байна.";
    if (s.includes("already registered") || s.includes("already been registered")) return "Энэ и-мэйл аль хэдийн бүртгэгдсэн байна. Нэвтэрнэ үү.";
    if (s.includes("password")) return "Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.";
    if (s.includes("email")) return "И-мэйл хаяг буруу форматтай байна.";
    if (s.includes("rate")) return "Хэт олон оролдлого хийлээ. Түр хүлээгээд дахин оролдоно уу.";
    return m;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
