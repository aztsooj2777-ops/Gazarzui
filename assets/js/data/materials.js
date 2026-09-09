/* ==========================================================================
   Хичээлийн хэрэглэгдэхүүний сан
   Файлууд /materials/ фолдерт байрлана. Шинэ файл нэмэхдээ:
     1) materials/<бүлэг>/ дотор файлаа хийнэ
     2) энэ жагсаалтад нэг мөр нэмнэ
   ========================================================================== */
window.GZ = window.GZ || {};

GZ.MAT_GROUPS = [
  {
    id: "eesh", icon: "📝", color: "var(--gold)",
    title: "ЭЕШ-ийн даалгавар",
    desc: "2019–2025 оны Элсэлтийн ерөнхий шалгалтын газарзүйн даалгавар, A/B/C/D дөрвөн хувилбараар. Бодит шалгалтын нөхцөлд дасгал хийхэд тохиромжтой.",
    items: [
      { t: "2025 оны ЭЕШ — A хувилбар", f: "materials/eesh-2025/a.pdf", size: "1.7 MB", year: 2025 },
      { t: "2025 оны ЭЕШ — B хувилбар", f: "materials/eesh-2025/b.pdf", size: "1.8 MB", year: 2025 },
      { t: "2025 оны ЭЕШ — C хувилбар", f: "materials/eesh-2025/c.pdf", size: "1.8 MB", year: 2025 },
      { t: "2025 оны ЭЕШ — D хувилбар", f: "materials/eesh-2025/d.pdf", size: "1.7 MB", year: 2025 },
      { t: "2024 оны ЭЕШ — A хувилбар", f: "materials/eesh-2024/a.pdf", size: "3.2 MB", year: 2024 },
      { t: "2024 оны ЭЕШ — B хувилбар", f: "materials/eesh-2024/b.pdf", size: "3.2 MB", year: 2024 },
      { t: "2024 оны ЭЕШ — C хувилбар", f: "materials/eesh-2024/c.pdf", size: "3.1 MB", year: 2024 },
      { t: "2024 оны ЭЕШ — D хувилбар", f: "materials/eesh-2024/d.pdf", size: "3.2 MB", year: 2024 },
      { t: "2023 оны ЭЕШ — A хувилбар", f: "materials/eesh-2023/a.pdf", size: "1.6 MB", year: 2023 },
      { t: "2023 оны ЭЕШ — B хувилбар", f: "materials/eesh-2023/b.pdf", size: "1.7 MB", year: 2023 },
      { t: "2023 оны ЭЕШ — C хувилбар", f: "materials/eesh-2023/c.pdf", size: "2.0 MB", year: 2023 },
      { t: "2023 оны ЭЕШ — D хувилбар", f: "materials/eesh-2023/d.pdf", size: "1.9 MB", year: 2023 },
      { t: "2022 оны ЭЕШ — A хувилбар", f: "materials/eesh-2022/a.pdf", size: "1.5 MB", year: 2022 },
      { t: "2022 оны ЭЕШ — B хувилбар", f: "materials/eesh-2022/b.pdf", size: "1.6 MB", year: 2022 },
      { t: "2022 оны ЭЕШ — C хувилбар", f: "materials/eesh-2022/c.pdf", size: "1.5 MB", year: 2022 },
      { t: "2022 оны ЭЕШ — D хувилбар", f: "materials/eesh-2022/d.pdf", size: "1.5 MB", year: 2022 },
      { t: "2020 оны ЭЕШ — A хувилбар", f: "materials/eesh-2020/a.pdf", size: "1.8 MB", year: 2020 },
      { t: "2020 оны ЭЕШ — B хувилбар", f: "materials/eesh-2020/b.pdf", size: "1.8 MB", year: 2020 },
      { t: "2020 оны ЭЕШ — C хувилбар", f: "materials/eesh-2020/c.pdf", size: "1.8 MB", year: 2020 },
      { t: "2020 оны ЭЕШ — D хувилбар", f: "materials/eesh-2020/d.pdf", size: "1.7 MB", year: 2020 },
      { t: "2019 оны ЭЕШ — A хувилбар", f: "materials/eesh-2019/a.pdf", size: "2.0 MB", year: 2019 },
      { t: "2019 оны ЭЕШ — B хувилбар", f: "materials/eesh-2019/b.pdf", size: "2.0 MB", year: 2019 },
      { t: "2019 оны ЭЕШ — C хувилбар", f: "materials/eesh-2019/c.pdf", size: "2.0 MB", year: 2019 },
      { t: "2019 оны ЭЕШ — D хувилбар", f: "materials/eesh-2019/d.pdf", size: "1.9 MB", year: 2019 },
    ],
  },
  {
    id: "olympiad", icon: "🏅", color: "var(--terra)",
    title: "Олимпиад ба газрын зураг",
    desc: "Газарзүйн зургийн олимпиадын гарын авлага, ангиудын сорил, бэлтгэлийн даалгавар.",
    items: [
      { t: "Газарзүйн зургийг хэн сайн мэдэх вэ — гарын авлага (Алтанболд, 2018)", f: "materials/olympiad/gazarzuin-zurag-2018.pdf", size: "21.2 MB", note: "Зургийн олимпиадын үндсэн эх сурвалж" },
      { t: "Газарзүй — 7-р ангийн даалгавар", f: "materials/olympiad/gazarzui-7.docx", size: "0.5 MB" },
      { t: "Газарзүй — 9-р ангийн даалгавар", f: "materials/olympiad/gazarzui-9.docx", size: "2.2 MB" },
      { t: "Газарзүй — сорилын түүвэр", f: "materials/olympiad/gazarzui-soril.docx", size: "2.0 MB" },
      { t: "Прогресс 2026 — 9-р анги", f: "materials/olympiad/progress-2026-9r.docx", size: "2.0 MB" },
    ],
  },
  {
    id: "geology", icon: "🦕", color: "var(--plum)",
    title: "Геологийн хөгжлийн түүх",
    desc: "8-р ангийн геологийн хөгжлийн түүхийн ээлжит хичээлийн боловсруулалт, слайд, судалгааны тайлан.",
    items: [
      { t: "Геологийн хөгжлийн түүх — слайд (8-р анги)", f: "materials/geology/8r-geology.pptx", size: "10.0 MB" },
      { t: "Геологийн хөгжлийн түүх — ээлжит хичээлийн боловсруулалт", f: "materials/geology/eelzhit-hicheel.docx", size: "3.6 MB" },
      { t: "Судалгаат хичээлийн тайлан (Д. Дэлгэржаргал)", f: "materials/geology/sudalgaat-tailan.docx", size: "0.1 MB" },
    ],
  },
];

/* Файлын төрлөөр дүрс */
GZ.matIcon = function (path) {
  const e = String(path).split(".").pop().toLowerCase();
  return e === "pdf" ? "📕" : e === "pptx" || e === "ppt" ? "📊" : e === "docx" || e === "doc" ? "📄" : "📎";
};
