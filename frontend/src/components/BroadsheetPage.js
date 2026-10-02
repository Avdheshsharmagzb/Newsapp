import { resolveImg } from "@/lib/api";

const HN = ["०१", "०२", "०३", "०४", "०५", "०६", "०७", "०८"];

const today = () => {
  const d = new Date();
  const months = ["जनवरी","फरवरी","मार्च","अप्रैल","मई","जून","जुलाई","अगस्त","सितंबर","अक्टूबर","नवंबर","दिसंबर"];
  const days = ["रविवार","सोमवार","मंगलवार","बुधवार","गुरुवार","शुक्रवार","शनिवार"];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

export default function BroadsheetPage({ page, meta = {}, articles = [] }) {
  const sorted = [...articles].sort((a, b) => (b.is_lead ? 1 : 0) - (a.is_lead ? 1 : 0));
  const lead = sorted.find((a) => a.is_lead) || sorted[0];
  const rest = sorted.filter((a) => a !== lead);

  return (
    <div className="newspaper mx-auto w-full p-6 sm:p-10">
      {page === 1 ? (
        <div>
          <div className="flex items-stretch justify-between gap-3 border-b-2 border-black pb-3">
            <div className="hidden sm:flex flex-col justify-center text-[10px] leading-tight px-3 py-2 rounded"
                 style={{ background: "#FEF2F2", border: "1px solid var(--paper-border)", maxWidth: 120 }}>
              <span className="font-bold" style={{ color: "var(--jagran-red)" }}>वर्ष ८२</span>
              <span>अंक २१४</span><span>मूल्य ₹ ५.००</span>
            </div>
            <div className="flex-1 text-center">
              <h1 className="masthead-title text-5xl sm:text-7xl">दैनिक जागरण</h1>
              <p className="font-print text-xs mt-1 tracking-wide">सत्य · निष्ठा · निर्भीक पत्रकारिता</p>
            </div>
            <div className="hidden sm:flex flex-col justify-center text-[10px] leading-tight px-3 py-2 rounded text-left"
                 style={{ background: "#FEF2F2", border: "1px solid var(--paper-border)", maxWidth: 120 }}>
              <span className="font-bold" style={{ color: "var(--jagran-red)" }}>मौसम</span>
              <span>दिन ३४°C</span><span>रात २२°C</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-print py-2 border-b border-black" style={{ borderColor: "var(--ink)" }}>
            <span>नई दिल्ली</span><span>{today()}</span><span>पृष्ठ ०१ · कुल ०८ पृष्ठ</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-1">
          <h2 className="masthead-title text-2xl">दैनिक जागरण</h2>
          <span className="font-print text-xs">{today()}</span>
        </div>
      )}

      <div className="flex items-center justify-between py-2 mt-3 mb-4" style={{ background: "var(--jagran-red)", color: "#fff" }}>
        <span className="font-news font-bold text-lg px-3">{meta.title}</span>
        <span className="font-print text-sm px-3">जागरण विशेष · पृष्ठ {HN[page - 1]}</span>
      </div>

      {sorted.length === 0 ? (
        <div className="py-16 text-center font-print text-gray-500">इस पृष्ठ पर कोई समाचार निर्धारित नहीं है।</div>
      ) : (
        <div>
          {lead && (
            <div className="pb-5 mb-5 border-b-2" style={{ borderColor: "var(--ink)" }}>
              <h2 className="np-headline text-3xl sm:text-5xl mb-2">{lead.title}</h2>
              {lead.subtitle && <p className="font-print text-lg text-gray-800 mb-3 italic">{lead.subtitle}</p>}
              <div className={`${lead.image_url ? "sm:flex gap-5" : ""}`}>
                {lead.image_url && (
                  <figure className="sm:w-2/5 mb-3 sm:mb-0">
                    <img src={resolveImg(lead.image_url)} alt="" className="w-full h-56 object-cover" style={{ border: "1px solid var(--paper-border)" }} />
                    <figcaption className="font-print text-xs text-gray-600 mt-1 border-b border-gray-300 pb-1">{lead.category} · फाइल फोटो</figcaption>
                  </figure>
                )}
                <p className="np-body drop-cap text-sm flex-1">
                  <span className="font-bold">{lead.author ? `${lead.author}।` : "संवाददाता।"}</span> {lead.body}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-x-5 gap-y-7" style={{ gridAutoFlow: "dense" }}>
            {rest.map((a) => {
              const span = Math.min(Math.max(a.column_span || 1, 1), 8);
              const wide = span >= 3;
              return (
                <article key={a.id} style={{ gridColumn: `span ${span}`, borderLeft: "1px solid var(--col-rule)", paddingLeft: "1rem" }}>
                  <h3 className={`np-headline mb-1.5 ${wide ? "text-2xl" : "text-lg"}`}>{a.title}</h3>
                  {a.subtitle && <p className="font-print text-sm text-gray-700 mb-2 italic">{a.subtitle}</p>}
                  {a.image_url && span >= 2 && (
                    <img src={resolveImg(a.image_url)} alt="" className="w-full h-36 object-cover mb-2" style={{ border: "1px solid var(--paper-border)" }} />
                  )}
                  <p className="np-body text-sm">
                    <span className="font-bold">{a.author ? `${a.author}।` : ""}</span> {a.body?.slice(0, wide ? 420 : 200)}...
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 pt-2 border-t border-black flex justify-between font-print text-xs" style={{ borderColor: "var(--ink)" }}>
        <span>दैनिक जागरण · {meta.subtitle}</span><span>पृष्ठ {page} / ८</span>
      </div>
    </div>
  );
}
