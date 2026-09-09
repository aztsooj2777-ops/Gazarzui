/**
 * Vercel Serverless Function — AI багшийн хариулт
 * ---------------------------------------------------------------------------
 * POST /api/chat
 *   body: { message: string, history?: [{role, content}], context?: {q,a,topic} }
 *   res : { reply: string, source: "ai" }
 *
 * Vercel дээр ANTHROPIC_API_KEY орчны хувьсагчийг тохируулсан үед л ажиллана.
 * Тохируулаагүй бол 503 буцаах ба вэб талд суурилагдсан мэдлэгийн сан
 * (assets/js/data/kb.js) автоматаар ажиллана — сайт ямар ч тохиолдолд ажиллана.
 */
import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.CHAT_MODEL || "claude-opus-5";

const SYSTEM = `Чи бол Монгол улсын ерөнхий боловсролын сургуулийн газарзүйн багш Ц. Азцоожийн
цахим сургалтын сайт дээрх AI туслах юм. Чиний хэрэглэгчид нь 7–9-р ангийн сурагчид.

ЗАРЧИМ:
- ЗӨВХӨН монгол хэлээр (кирилл) хариул.
- Газарзүй, геологи, байгаль орчин, хүн ам зүй, картографи, ЭЕШ-ийн бэлтгэлтэй
  холбоотой асуултад хариул. Өөр сэдэв асуувал эелдэгээр татгалзаж, газарзүйн
  асуулт асуухыг санал болго.
- Хариулт богино, тодорхой байг: 120–220 үг. Жагсаалт (-), тодруулга (**үг**)
  ашиглан уншихад хялбар болго.
- Бодлого асуувал ЗААВАЛ алхам алхмаар тайлбарла (өгөгдөл → томьёо → тооцоо → хариу).
- Тоо баримтад эргэлзвэл "ойролцоогоор" гэж хэл. Хэзээ ч зохиож болохгүй.
- Сурагчийг урамшуул, эерэг өнгө аястай бай. Эмодзи хэмнэлттэй (0–2).
- Хариултын төгсгөлд шаардлагатай бол холбогдох сэдвийг санал болго.
- Чи багшийг орлохгүй гэдгээ шаардлагатай үед сануул.`;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST хүсэлт илгээнэ үү." });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: "ANTHROPIC_API_KEY тохируулаагүй байна." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const message = String(body.message || "").trim().slice(0, 2000);
    if (!message) return res.status(400).json({ error: "message талбар хоосон байна." });

    // Вэб талаас ирсэн мэдлэгийн сангийн хамгийн ойрын оногдол — лавлах материал
    const ctx = body.context;
    const contextNote = ctx
      ? `\n\nБАГШИЙН БЭЛТГЭСЭН ЛАВЛАХ (сэдэв: ${ctx.topic}).\nАсуулт: ${ctx.q}\nАгуулга:\n${ctx.a}\n\nЭнэ материалыг үндэс болгож, сурагчийн асуултад тохируулан хариул. Хэрэв асуулт үүнээс өөр бол өөрийн мэдлэгээр хариул.`
      : "";

    const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
    const messages = history
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

    // Сүүлийн мессеж давхардахаас сэргийлэх
    if (messages.length && messages[messages.length - 1].role === "user"
      && messages[messages.length - 1].content === message) {
      messages.pop();
    }
    messages.push({ role: "user", content: message });

    const client = new Anthropic();

    const response = await client.beta.messages.create({
      model: MODEL,
      // Сурагчид зориулсан богино хариулт — чат бөмбөлөгт багтах хэмжээ
      max_tokens: 1500,
      // Энгийн Q&A тул бага effort хангалттай (хурд, зардал)
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: SYSTEM + contextNote, cache_control: { type: "ephemeral" } }],
      messages,
    });

    if (response.stop_reason === "refusal") {
      return res.status(200).json({
        reply: "Уучлаарай, энэ асуултад хариулж чадахгүй нь. Газарзүйн хичээлтэй холбоотой өөр асуулт асуугаарай.",
        source: "refusal",
      });
    }

    const reply = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (!reply) throw new Error("Хоосон хариулт");

    return res.status(200).json({ reply, source: "ai", model: response.model });
  } catch (err) {
    console.error("[api/chat]", err);
    const status = err && err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
    return res.status(status).json({ error: "AI хариулт авахад алдаа гарлаа." });
  }
}
