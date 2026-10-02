import { useEffect, useState, useCallback } from "react";
import { api, resolveImg } from "@/lib/api";
import { PageHeader } from "@/components/common";
import { toast } from "sonner";
import { Plus, X, Star, ImagePlus, Trash2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HINDI_NUM = ["१", "२", "३", "४", "५", "६", "७", "८"];

export default function LayoutPanel() {
  const [pages, setPages] = useState([]);
  const [articles, setArticles] = useState([]);
  const [media, setMedia] = useState([]);
  const [addFor, setAddFor] = useState(null);     // page number for add-article modal
  const [photoFor, setPhotoFor] = useState(null); // article id for photo picker
  const nav = useNavigate();

  const loadArticles = useCallback(() => api.get("/articles").then((r) => setArticles(r.data)), []);

  useEffect(() => {
    api.get("/newspaper/pages").then((r) => setPages(r.data));
    loadArticles();
    api.get("/media").then((r) => setMedia(r.data));
  }, [loadArticles]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") { setAddFor(null); setPhotoFor(null); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const place = async (id, body) => { await api.put(`/newspaper/place/${id}`, body); loadArticles(); };
  const setPhoto = async (id, url) => { await api.put(`/articles/${id}`, { image_url: url }); setPhotoFor(null); toast.success("फोटो सेट हुई"); loadArticles(); };

  const onPage = (p) => articles
    .filter((a) => a.newspaper_page === p)
    .sort((a, b) => (b.is_lead ? 1 : 0) - (a.is_lead ? 1 : 0));

  const unassignedForPage = (p) => articles.filter((a) => a.newspaper_page !== p && a.target !== "website");

  return (
    <div>
      <PageHeader title="लेआउट पैनल — ८ पेज" subtitle="अपनी चुनिंदा खबरें और फोटो पेज १ से ८ पर अपनी मर्जी से सेट करें">
        <button data-testid="open-viewer-btn" onClick={() => nav("/newspaper")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: "var(--jg-red)" }}>
          <Eye size={17} /> अखबार प्रीव्यू
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {pages.map((pg, idx) => {
          const list = onPage(pg.page);
          return (
            <div key={pg.page} className="jg-surface p-5 stagger-in" style={{ animationDelay: `${idx * 50}ms` }} data-testid={`layout-page-${pg.page}`}>
              <div className="flex items-start justify-between gap-3 mb-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-news font-black text-lg text-white" style={{ background: "var(--jg-red)" }}>
                    {HINDI_NUM[idx]}
                  </div>
                  <div>
                    <h3 className="font-news font-bold text-lg text-white leading-tight">{pg.title}</h3>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{pg.subtitle}</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full shrink-0" style={{ background: "var(--bg-hover)", color: "var(--text-main)" }}>
                  {list.length} समाचार
                </span>
              </div>

              <p className="text-xs mb-4 px-1 py-2 rounded-lg" style={{ background: "var(--bg-main)", color: "var(--gold)" }} data-testid={`guide-${pg.page}`}>
                निर्देश: {pg.guide}
              </p>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {list.length === 0 && (
                  <div className="text-sm py-6 text-center" style={{ color: "var(--text-muted)" }}>अभी कोई समाचार नहीं — नीचे से जोड़ें</div>
                )}
                {list.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: "var(--bg-main)", border: `1px solid ${a.is_lead ? "var(--gold)" : "var(--border)"}` }} data-testid={`layout-article-${a.id}`}>
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "var(--bg-hover)" }}>
                      {a.image_url ? <img src={resolveImg(a.image_url)} alt="" className="w-full h-full object-cover" /> : <ImagePlus size={18} className="text-slate-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{a.title}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{a.category || "—"}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button data-testid={`lead-${a.id}`} onClick={() => place(a.id, { is_lead: !a.is_lead })}
                              title="मुख्य समाचार" className="p-1.5 rounded-lg hover:bg-slate-700">
                        <Star size={15} fill={a.is_lead ? "var(--gold)" : "none"} color={a.is_lead ? "var(--gold)" : "#94A3B8"} />
                      </button>
                      <select value={a.column_span} data-testid={`layout-span-${a.id}`}
                              onChange={(e) => place(a.id, { column_span: Number(e.target.value) })}
                              className="text-xs px-1.5 py-1 rounded-md text-white outline-none" style={{ background: "var(--bg-hover)" }} title="कॉलम चौड़ाई">
                        {[1,2,3,4,5,6,7,8].map((n) => <option key={n} value={n}>{n}कॉ</option>)}
                      </select>
                      <button data-testid={`photo-${a.id}`} onClick={() => setPhotoFor(a.id)} title="फोटो सेट करें" className="p-1.5 rounded-lg hover:bg-slate-700" style={{ color: "#60A5FA" }}>
                        <ImagePlus size={15} />
                      </button>
                      <button data-testid={`remove-${a.id}`} onClick={() => place(a.id, { newspaper_page: null, is_lead: false })} title="हटाएँ" className="p-1.5 rounded-lg hover:bg-slate-700" style={{ color: "#F87171" }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button data-testid={`add-to-page-${pg.page}`} onClick={() => setAddFor(pg.page)}
                      className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:bg-slate-700/50 transition-colors"
                      style={{ background: "var(--bg-main)", border: "1px dashed var(--border)" }}>
                <Plus size={16} /> इस पेज पर समाचार जोड़ें
              </button>
            </div>
          );
        })}
      </div>

      {/* Add article modal */}
      {addFor !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)" }} onClick={() => setAddFor(null)}>
          <div className="jg-surface w-full max-w-lg max-h-[80vh] flex flex-col p-6" onClick={(e) => e.stopPropagation()} data-testid="add-article-modal">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-news font-bold text-xl text-white">पेज {HINDI_NUM[addFor - 1]} पर समाचार जोड़ें</h3>
              <button onClick={() => setAddFor(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-2 overflow-y-auto">
              {unassignedForPage(addFor).map((a) => (
                <button key={a.id} data-testid={`pick-article-${a.id}`}
                        onClick={async () => { await place(a.id, { newspaper_page: addFor }); toast.success("जोड़ा गया"); }}
                        className="w-full text-right flex items-center gap-3 p-3 rounded-xl hover:bg-slate-700/50 transition-colors" style={{ background: "var(--bg-main)" }}>
                  <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "var(--bg-hover)" }}>
                    {a.image_url ? <img src={resolveImg(a.image_url)} alt="" className="w-full h-full object-cover" /> : <ImagePlus size={16} className="text-slate-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{a.title}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{a.category || "—"} {a.newspaper_page ? `· वर्तमान पेज ${a.newspaper_page}` : ""}</p>
                  </div>
                  <Plus size={18} style={{ color: "var(--jg-red)" }} />
                </button>
              ))}
              {unassignedForPage(addFor).length === 0 && <p className="text-center py-6" style={{ color: "var(--text-muted)" }}>जोड़ने के लिए कोई समाचार उपलब्ध नहीं</p>}
            </div>
          </div>
        </div>
      )}

      {/* Photo picker modal */}
      {photoFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)" }} onClick={() => setPhotoFor(null)}>
          <div className="jg-surface w-full max-w-2xl max-h-[80vh] flex flex-col p-6" onClick={(e) => e.stopPropagation()} data-testid="photo-picker-modal">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-news font-bold text-xl text-white">फोटो चुनें</h3>
              <button onClick={() => setPhotoFor(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            {media.length === 0 ? (
              <p className="text-center py-8" style={{ color: "var(--text-muted)" }}>मीडिया लाइब्रेरी खाली है। पहले "मीडिया लाइब्रेरी" से फोटो अपलोड करें।</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 overflow-y-auto">
                <button onClick={() => setPhoto(photoFor, "")} className="aspect-square rounded-lg flex items-center justify-center text-xs text-slate-300" style={{ background: "var(--bg-main)", border: "1px dashed var(--border)" }} data-testid="photo-none">
                  फोटो हटाएँ
                </button>
                {media.map((m) => (
                  <button key={m.id} data-testid={`pick-photo-${m.id}`} onClick={() => setPhoto(photoFor, m.url)}
                          className="aspect-square rounded-lg overflow-hidden hover:ring-2 ring-red-500 transition-all" style={{ background: "var(--bg-main)" }}>
                    <img src={resolveImg(m.url)} alt={m.original_filename} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
