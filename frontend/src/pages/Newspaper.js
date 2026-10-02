import { useEffect, useState, useCallback } from "react";
import { api, resolveImg } from "@/lib/api";
import { toast } from "sonner";
import { Printer, Settings2, ChevronLeft, ChevronRight, X } from "lucide-react";

const today = () => {
  const d = new Date();
  const months = ["जनवरी","फरवरी","मार्च","अप्रैल","मई","जून","जुलाई","अगस्त","सितंबर","अक्टूबर","नवंबर","दिसंबर"];
  const days = ["रविवार","सोमवार","मंगलवार","बुधवार","गुरुवार","शुक्रवार","शनिवार"];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

export default function Newspaper() {
  const [pages, setPages] = useState([]);
  const [page, setPage] = useState(1);
  const [articles, setArticles] = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [allArticles, setAllArticles] = useState([]);

  const loadPage = useCallback((p) => {
    api.get(`/newspaper/${p}`).then((r) => setArticles(r.data));
  }, []);

  useEffect(() => { api.get("/newspaper/pages").then((r) => setPages(r.data)); }, []);
  useEffect(() => { loadPage(page); }, [page, loadPage]);

  const meta = pages.find((p) => p.page === page) || { title: "", subtitle: "" };

  const openEditor = () => {
    api.get("/articles").then((r) => setAllArticles(r.data));
    setShowEditor(true);
  };

  const place = async (id, body) => {
    await api.put(`/newspaper/place/${id}`, body);
    loadPage(page);
    const r = await api.get("/articles");
    setAllArticles(r.data);
  };

  const lead = articles.find((a) => a.is_lead) || articles[0];
  const rest = articles.filter((a) => a !== lead);

  return (
    <div>
      {/* Toolbar */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-news font-black text-3xl text-white">८-पेज अखबार व्यूअर</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>दैनिक जागरण शैली में प्रिंट लेआउट · एडमिन द्वारा नियंत्रित</p>
        </div>
        <div className="flex items-center gap-3">
          <button data-testid="layout-editor-btn" onClick={openEditor}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-slate-200" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
            <Settings2 size={17} /> लेआउट संपादक
          </button>
          <button data-testid="print-btn" onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: "var(--jg-red)" }}>
            <Printer size={17} /> प्रिंट
          </button>
        </div>
      </div>

      {/* Page selector */}
      <div className="no-print flex items-center flex-wrap gap-2 mb-6">
        <button data-testid="prev-page" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                className="p-2 rounded-lg disabled:opacity-40" style={{ background: "var(--bg-surface)" }}><ChevronLeft size={18} className="text-white" /></button>
        {pages.map((p) => (
          <button key={p.page} data-testid={`select-page-${p.page}`} onClick={() => setPage(p.page)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${page === p.page ? "text-white" : "text-slate-300"}`}
                  style={{ background: page === p.page ? "var(--jg-red)" : "var(--bg-surface)" }}>
            पृष्ठ {p.page}
          </button>
        ))}
        <button data-testid="next-page" onClick={() => setPage(Math.min(8, page + 1))} disabled={page === 8}
                className="p-2 rounded-lg disabled:opacity-40" style={{ background: "var(--bg-surface)" }}><ChevronRight size={18} className="text-white" /></button>
      </div>

      {/* Broadsheet */}
      <div className="newspaper mx-auto max-w-5xl p-6 sm:p-10" data-testid="newspaper-sheet">
        {/* Masthead - only page 1 gets big masthead */}
        {page === 1 ? (
          <div>
            <div className="flex items-stretch justify-between gap-3 border-b-2 border-black pb-3">
              <div className="hidden sm:flex flex-col justify-center text-[10px] leading-tight px-3 py-2 rounded"
                   style={{ background: "var(--ear-panel-bg, #FEF2F2)", border: "1px solid var(--paper-border)", maxWidth: 120 }}>
                <span className="font-bold" style={{ color: "var(--jagran-red)" }}>वर्ष ८२</span>
                <span>अंक २१४</span>
                <span>मूल्य ₹ ५.००</span>
              </div>
              <div className="flex-1 text-center">
                <h1 className="masthead-title text-5xl sm:text-7xl">दैनिक जागरण</h1>
                <p className="font-print text-xs mt-1 tracking-wide">सत्य · निष्ठा · निर्भीक पत्रकारिता</p>
              </div>
              <div className="hidden sm:flex flex-col justify-center text-[10px] leading-tight px-3 py-2 rounded text-left"
                   style={{ background: "var(--ear-panel-bg, #FEF2F2)", border: "1px solid var(--paper-border)", maxWidth: 120 }}>
                <span className="font-bold" style={{ color: "var(--jagran-red)" }}>मौसम</span>
                <span>दिन ३४°C</span>
                <span>रात २२°C</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-print py-2 border-b border-black"
                 style={{ borderColor: "var(--ink)" }}>
              <span>नई दिल्ली</span>
              <span>{today()}</span>
              <span>पृष्ठ ०१ · कुल ०८ पृष्ठ</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-1">
            <h2 className="masthead-title text-2xl">दैनिक जागरण</h2>
            <span className="font-print text-xs">{today()}</span>
          </div>
        )}

        {/* Section header */}
        <div className="flex items-center justify-between py-2 mt-3 mb-4"
             style={{ background: "var(--jagran-red)", color: "#fff" }}>
          <span className="font-news font-bold text-lg px-3">{meta.title}</span>
          <span className="font-print text-sm px-3">जागरण विशेष · पृष्ठ {["०१","०२","०३","०४","०५","०६","०७","०८"][page - 1]}</span>
        </div>

        {articles.length === 0 ? (
          <div className="py-16 text-center font-print text-gray-500">इस पृष्ठ पर कोई समाचार निर्धारित नहीं है। लेआउट संपादक से समाचार जोड़ें।</div>
        ) : (
          <div>
            {/* Lead story */}
            {lead && (
              <div className="pb-5 mb-5 border-b-2" style={{ borderColor: "var(--ink)" }} data-testid={`np-lead-${lead.id}`}>
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

            {/* Other stories in columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 np-col-divider">
              {rest.map((a) => (
                <article key={a.id} className={`sm:pl-5 ${a.column_span >= 2 ? "lg:col-span-2" : ""} ${a.column_span >= 3 ? "lg:col-span-3" : ""}`} data-testid={`np-article-${a.id}`}>
                  <h3 className="np-headline text-xl mb-1.5">{a.title}</h3>
                  {a.subtitle && <p className="font-print text-sm text-gray-700 mb-2 italic">{a.subtitle}</p>}
                  {a.image_url && a.column_span >= 2 && (
                    <img src={resolveImg(a.image_url)} alt="" className="w-full h-40 object-cover mb-2" style={{ border: "1px solid var(--paper-border)" }} />
                  )}
                  <p className="np-body text-sm">
                    <span className="font-bold">{a.author ? `${a.author}।` : ""}</span> {a.body?.slice(0, 320)}...
                  </p>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* footer */}
        <div className="mt-6 pt-2 border-t border-black flex justify-between font-print text-xs" style={{ borderColor: "var(--ink)" }}>
          <span>दैनिक जागरण · {meta.subtitle}</span>
          <span>पृष्ठ {page} / ८</span>
        </div>
      </div>

      {/* Layout editor drawer */}
      {showEditor && (
        <div className="no-print fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(0,0,0,.5)" }} onClick={() => setShowEditor(false)}>
          <div className="w-full max-w-md h-full overflow-y-auto p-6" style={{ background: "var(--bg-surface)" }} onClick={(e) => e.stopPropagation()} data-testid="layout-editor">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-news font-bold text-xl text-white">पृष्ठ {page} — लेआउट संपादक</h3>
              <button onClick={() => setShowEditor(false)} className="text-slate-400 hover:text-white"><X size={22} /></button>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>समाचार को इस पृष्ठ पर जोड़ें/हटाएँ, मुख्य समाचार और कॉलम चौड़ाई सेट करें।</p>

            <div className="space-y-3">
              {allArticles.filter((a) => a.target !== "website").map((a) => {
                const onPage = a.newspaper_page === page;
                return (
                  <div key={a.id} className="p-3 rounded-xl" style={{ background: "var(--bg-main)", border: `1px solid ${onPage ? "var(--jg-red)" : "var(--border)"}` }} data-testid={`editor-article-${a.id}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-white font-medium flex-1">{a.title}</p>
                      <button data-testid={`toggle-page-${a.id}`} onClick={() => place(a.id, { newspaper_page: onPage ? null : page })}
                              className="text-xs px-2.5 py-1 rounded-md font-semibold shrink-0"
                              style={{ background: onPage ? "var(--jg-red)" : "var(--bg-hover)", color: "#fff" }}>
                        {onPage ? "हटाएँ" : "जोड़ें"}
                      </button>
                    </div>
                    {onPage && (
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <button data-testid={`set-lead-${a.id}`} onClick={() => place(a.id, { is_lead: !a.is_lead })}
                                className="text-xs px-2.5 py-1 rounded-md" style={{ background: a.is_lead ? "var(--gold)" : "var(--bg-hover)", color: "#fff" }}>
                          {a.is_lead ? "★ मुख्य" : "मुख्य बनाएँ"}
                        </button>
                        <select value={a.column_span} data-testid={`span-${a.id}`}
                                onChange={(e) => place(a.id, { column_span: Number(e.target.value) })}
                                className="text-xs px-2 py-1 rounded-md text-white outline-none" style={{ background: "var(--bg-hover)" }}>
                          <option value={1}>१ कॉलम</option>
                          <option value={2}>२ कॉलम</option>
                          <option value={3}>३ कॉलम</option>
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
