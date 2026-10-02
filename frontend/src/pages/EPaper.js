import { useEffect, useState, useCallback } from "react";
import { api, API } from "@/lib/api";
import BroadsheetPage from "@/components/BroadsheetPage";
import { toast } from "sonner";
import { ZoomIn, ZoomOut, Maximize, ChevronLeft, ChevronRight, FileDown, Download, Loader2 } from "lucide-react";

export default function EPaper() {
  const [pages, setPages] = useState([]);
  const [page, setPage] = useState(1);
  const [articles, setArticles] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [downloading, setDownloading] = useState("");

  const loadPage = useCallback((p) => api.get(`/newspaper/${p}`).then((r) => setArticles(r.data)), []);
  useEffect(() => { api.get("/newspaper/pages").then((r) => setPages(r.data)); }, []);
  useEffect(() => { loadPage(page); }, [page, loadPage]);

  const meta = pages.find((p) => p.page === page) || {};

  const download = async (scope) => {
    setDownloading(scope);
    try {
      const url = `${API}/export/pdf?page=${scope === "all" ? "all" : page}`;
      const res = await api.get(url.replace(API, ""), { responseType: "blob" });
      const blobUrl = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = scope === "all" ? "dainik-jagran-8page.pdf" : `dainik-jagran-page-${page}.pdf`;
      a.click();
      URL.revokeObjectURL(blobUrl);
      toast.success("वेक्टर PDF डाउनलोड हुआ");
    } catch {
      toast.error("PDF बनाने में त्रुटि");
    }
    setDownloading("");
  };

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-news font-black text-3xl text-white">ई-पेपर एवं एक्सपोर्ट</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>किसी भी ज़ूम पर क्रिस्प वेक्टर टेक्स्ट · रेडी-टू-प्रिंट PDF</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button data-testid="download-page-pdf" onClick={() => download("page")} disabled={downloading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-slate-200 disabled:opacity-60" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
            {downloading === "page" ? <Loader2 size={17} className="animate-spin" /> : <FileDown size={17} />} यह पृष्ठ PDF
          </button>
          <button data-testid="download-all-pdf" onClick={() => download("all")} disabled={downloading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60" style={{ background: "var(--jg-red)" }}>
            {downloading === "all" ? <Loader2 size={17} className="animate-spin" /> : <Download size={17} />} पूरा ८-पेज PDF
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="jg-surface p-3 mb-5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button data-testid="prev-page" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                  className="p-2 rounded-lg disabled:opacity-40" style={{ background: "var(--bg-main)" }}><ChevronLeft size={18} className="text-white" /></button>
          {pages.map((p) => (
            <button key={p.page} data-testid={`select-page-${p.page}`} onClick={() => setPage(p.page)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${page === p.page ? "text-white" : "text-slate-300"}`}
                    style={{ background: page === p.page ? "var(--jg-red)" : "var(--bg-main)" }}>{p.page}</button>
          ))}
          <button data-testid="next-page" onClick={() => setPage(Math.min(8, page + 1))} disabled={page === 8}
                  className="p-2 rounded-lg disabled:opacity-40" style={{ background: "var(--bg-main)" }}><ChevronRight size={18} className="text-white" /></button>
        </div>
        <div className="flex items-center gap-2">
          <button data-testid="zoom-out" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.15).toFixed(2)))}
                  className="p-2 rounded-lg" style={{ background: "var(--bg-main)" }}><ZoomOut size={18} className="text-white" /></button>
          <span className="text-sm text-slate-300 w-14 text-center" data-testid="zoom-level">{Math.round(zoom * 100)}%</span>
          <button data-testid="zoom-in" onClick={() => setZoom((z) => Math.min(3, +(z + 0.15).toFixed(2)))}
                  className="p-2 rounded-lg" style={{ background: "var(--bg-main)" }}><ZoomIn size={18} className="text-white" /></button>
          <button data-testid="zoom-reset" onClick={() => setZoom(1)}
                  className="p-2 rounded-lg" style={{ background: "var(--bg-main)" }}><Maximize size={18} className="text-white" /></button>
        </div>
      </div>

      {/* Zoomable e-paper canvas (vector DOM text stays crisp) */}
      <div className="overflow-auto rounded-2xl p-6" style={{ background: "#0b1120", maxHeight: "78vh" }} data-testid="epaper-canvas">
        <div style={{ width: `${100 / zoom}%`, transform: `scale(${zoom})`, transformOrigin: "top center", transition: "transform .15s ease" }}>
          <div className="max-w-5xl mx-auto">
            <BroadsheetPage page={page} meta={meta} articles={articles} />
          </div>
        </div>
      </div>
    </div>
  );
}
