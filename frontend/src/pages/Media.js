import { useEffect, useState } from "react";
import { api, resolveImg } from "@/lib/api";
import { PageHeader } from "@/components/common";
import { toast } from "sonner";
import { UploadCloud, Trash2 } from "lucide-react";

export default function Media() {
  const [items, setItems] = useState([]);
  const [uploading, setUploading] = useState(false);

  const load = () => api.get("/media").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const upload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      try { await api.post("/media/upload", fd, { headers: { "Content-Type": "multipart/form-data" } }); }
      catch { toast.error(`${file.name} अपलोड विफल`); }
    }
    toast.success("अपलोड पूर्ण"); setUploading(false); load();
  };

  const del = async (id) => { await api.delete(`/media/${id}`); toast.success("हटाया गया"); load(); };

  return (
    <div>
      <PageHeader title="मीडिया लाइब्रेरी" subtitle="समाचार और अखबार के लिए फोटो अपलोड करें" />

      <label data-testid="media-dropzone"
             className="jg-surface flex flex-col items-center justify-center py-12 mb-6 cursor-pointer border-dashed hover:bg-slate-800/40 transition-colors"
             style={{ borderWidth: 2, borderColor: "var(--border)", borderStyle: "dashed" }}>
        <UploadCloud size={40} style={{ color: "var(--jg-red)" }} />
        <p className="mt-3 text-white font-medium">{uploading ? "अपलोड हो रहा है..." : "फोटो यहाँ अपलोड करें"}</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>JPG, PNG, WEBP · एक साथ कई फाइलें</p>
        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => upload(Array.from(e.target.files))} />
      </label>

      {items.length === 0 ? (
        <div className="jg-surface py-16 text-center" style={{ color: "var(--text-muted)" }}>अभी तक कोई फोटो अपलोड नहीं की गई</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((m, i) => (
            <div key={m.id} className="jg-surface overflow-hidden group stagger-in" style={{ animationDelay: `${i * 30}ms` }} data-testid={`media-${m.id}`}>
              <div className="relative aspect-video overflow-hidden" style={{ background: "var(--bg-main)" }}>
                <img src={resolveImg(m.url)} alt={m.original_filename} className="w-full h-full object-cover" />
                <button data-testid={`delete-media-${m.id}`} onClick={() => del(m.id)}
                        className="absolute top-2 left-2 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "rgba(220,38,38,.9)" }}><Trash2 size={15} className="text-white" /></button>
              </div>
              <div className="p-3">
                <p className="text-xs text-white truncate">{m.original_filename}</p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{(m.size / 1024).toFixed(0)} KB</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
