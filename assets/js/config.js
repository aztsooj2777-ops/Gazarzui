/* ==========================================================================
   Газарзүй — Тохиргоо
   --------------------------------------------------------------------------
   Supabase Dashboard → Project Settings → API keys
     • Project URL       →  SUPABASE_URL      (төгсгөлд /rest/v1/ БИЧИХГҮЙ)
     • Publishable key   →  SUPABASE_KEY      (sb_publishable_... эсвэл хуучин anon JWT)

   ⚠️  ЭНД ЗӨВХӨН PUBLISHABLE (anon) ТҮЛХҮҮР БИЧНЭ.
       sb_secret_... түлхүүрийг ХЭЗЭЭ Ч энд бичиж болохгүй — тэр нь RLS-ийг
       тойрч гардаг админ эрх бөгөөд энэ файл браузерт ил уншигддаг.
       Secret түлхүүр зөвхөн сервер тал (Vercel env) дээр л байрлана.

   Publishable түлхүүр ил байх нь хэвийн. Өгөгдлийг supabase/schema.sql дахь
   Row Level Security дүрэм хамгаална.

   Хоосон орхивол сайт "Оффлайн горим"-оор ажиллаж, өгөгдлийг зөвхөн тухайн
   төхөөрөмжийн санах ойд (localStorage) хадгална.
   ========================================================================== */

window.GZ_CONFIG = {
  SUPABASE_URL: "https://mecskpyrzyafdhqqozgj.supabase.co",
  SUPABASE_KEY: "sb_publishable_h3McdBDPyJTwadrwm2Qm3Q_sUAY5YA8",

  /* AI багш — суурилагдсан мэдлэгийн сангаар ажиллана (нэмэлт төлбөргүй).
     Хэрэв ирээдүйд жинхэнэ хэлний загвартай холбохыг хүсвэл:
       1) Vercel дээр ANTHROPIC_API_KEY орчны хувьсагч нэмнэ
       2) энд "/api/chat" гэж бичнэ
     Хоосон байвал /api/chat руу огт хандахгүй. */
  CHAT_API: "",

  SITE: {
    name: "Газарзүй",
    tagline: "Ц. Азцоож багшийн нээлттэй сургалтын орчин",
    teacher: "Ц. Азцоож",
    teacherTitle: "Газарзүйн багш · Прогресс сургууль",
    email: "aztsooj@moes.edu.mn",
    org: "Ховд аймгийн Боловсролын газар",
    legacyUrl: "https://sites.google.com/moes.edu.mn/aztsooj/",
  },
};

/* Хуучин нэртэй тохирох (SUPABASE_ANON_KEY гэж бичсэн байсан ч ажиллана) */
window.GZ_CONFIG.SUPABASE_ANON_KEY =
  window.GZ_CONFIG.SUPABASE_KEY || window.GZ_CONFIG.SUPABASE_ANON_KEY || "";
