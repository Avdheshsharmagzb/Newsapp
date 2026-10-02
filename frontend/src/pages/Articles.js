import { useEffect, useState, useCallback } from "react";
import { api, resolveImg } from "@/lib/api";
import { PageHeader, StatusBadge, TargetBadge } from "@/components/common";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, X, Upload } from "lucide-react";

const empty = {
  title: "", subtitle: "", body: "", category: "", author: "",
  image_url: "", target: "both", status: "draft", newspaper_page: "", column_span: 1, is_lead: false,
};

export default function Articles() {
  const [articles, setArticles] = useState([]);
  const [cats, setCats] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [pages, setPages] = useState([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(() => {
    api.get("/articles").then((r) => setArticles(r.data));
  }, []);

  useEffect(() => {
    load();
    api.get("/categories").then((r) => setCats(r.data));
    api.get("/authors").then((r) => setAuthors(r.data));
    api.get("/newspaper/pages").then((r) => setPages(r.data));
  }, [load]);

  const openNew = () => { setForm(empty); setEditId(null); setOpen(true); };
  const openEdit = (a) => {
    setForm({ ...a, newspaper_page: a.newspaper_page ?? "" });
    setEditId(a.id); setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) { toast.error("शीर्षक आवश्यक है"); return; }
    const payload = { ...form, newspaper_page: form.newspaper_page === "" ? null : Number(form.newspaper_page), column_span: Number(form.column_span) };
    try {
      if (editId) { await api.put(`/articles/${editId}`, payload); toast.success("समाचार अपडेट हुआ"); }
      else { await api.post("/articles", payload); toast.success("समाचार जोड़ा गया"); }
      setOpen(false); load();
    } catch { toast.error("त्रुटि हुई"); }
  };

  const del = async (id) => {
    await api.delete(`/articles/${id}`);
    toast.success("समाचार हटाया गया"); load();
  };

  const onUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await api.post("/media/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setForm((f) => ({ ...f, image_url: r.data.url }));
      toast.success("फोटो अपलोड हुई");
    } catch { toast.error("अपलोड विफल"); }
    setUploading(false);
  };

  const filtered = articles.filter((a) => a.title.toLowerCase().includes(q.toLowerCase()) || (a.category || "").includes(q));

  const input = "w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none";
  const inputStyle = { background: "var(--bg-main)", border: "1px solid var(--border)" };

  return (
    <div>
      <PageHeader title="समाचार प्रबंधन" subtitle="वेबसाइट और अखबार के लिए समाचार लिखें, संपादित करें और प्रकाशित करें">
        <button data-testid="add-article-btn" onClick={openNew}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90"
                style={{ background: "var(--jg-red)" }}>
          <Plus size={18} /> नया समाचार
        </button>
      </PageHeader>

      <div className="jg-surface p-3 mb-5 flex items-center gap-3">
        <Search size={18} style={{ color: "var(--text-muted)" }} className="ml-2" />
        <input data-testid="article-search" value={q} onChange={(e) => setQ(e.target.value)}
               placeholder="समाचार खोजें..." className="flex-1 bg-transparent outline-none text-white text-sm py-1.5" />
      </div>

      <div className="jg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--bg-main)", color: "var(--text-muted)" }}>
                <th className="text-right p-4 font-semibold">शीर्षक</th>
                <th className="text-right p-4 font-semibold hidden md:table-cell">श्रेणी</th>
                <th className="text-right p-4 font-semibold hidden lg:table-cell">लक्ष्य</th>
                <th className="text-right p-4 font-semibold">स्थिति</th>
                <th className="text-right p-4 font-semibold hidden sm:table-cell">पृष्ठ</th>
                <th className="text-right p-4 font-semibold">क्रिया</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-t" style={{ borderColor: "var(--border)" }} data-testid={`article-row-${a.id}`}>
                  <td className="p-4">
                    <div className="text-white font-medium max-w-xs truncate">{a.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{a.author}</div>
                  </td>
                  <td className="p-4 hidden md:table-cell text-slate-300">{a.category || "—"}</td>
                  <td className="p-4 hidden lg:table-cell"><TargetBadge target={a.target} /></td>
                  <td className="p-4"><StatusBadge status={a.status} /></td>
                  <td className="p-4 hidden sm:table-cell text-slate-300">{a.newspaper_page ? `पृष्ठ ${a.newspaper_page}` : "—"}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button data-testid={`edit-article-${a.id}`} onClick={() => openEdit(a)}
                              className="p-2 rounded-lg hover:bg-slate-700" style={{ color: "#60A5FA" }}><Pencil size={16} /></button>
                      <button data-testid={`delete-article-${a.id}`} onClick={() => del(a.id)}
                              className="p-2 rounded-lg hover:bg-slate-700" style={{ color: "#F87171" }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="p-10 text-center" style={{ color: "var(--text-muted)" }}>कोई समाचार नहीं मिला</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4"
             style={{ background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)" }}>
          <div className="jg-surface w-full max-w-3xl my-8 p-7" data-testid="article-modal">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-news font-bold text-2xl text-white">{editId ? "समाचार संपादित करें" : "नया समाचार"}</h2>
              <button data-testid="close-modal" onClick={() => setOpen(false)} className="text-slate-400 hover:text-white"><X size={22} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block">शीर्षक *</label>
                <input data-testid="input-title" className={input} style={inputStyle} value={form.title}
                       onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="मुख्य शीर्षक" />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block">उप-शीर्षक</label>
                <input data-testid="input-subtitle" className={input} style={inputStyle} value={form.subtitle}
                       onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="उप-शीर्षक" />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block">समाचार विवरण</label>
                <textarea data-testid="input-body" rows={5} className={input} style={inputStyle} value={form.body}
                          onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="पूरा समाचार यहाँ लिखें..." />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-300 mb-1.5 block">श्रेणी</label>
                  <select data-testid="input-category" className={input} style={inputStyle} value={form.category}
                          onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="">चुनें</option>
                    {cats.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1.5 block">लेखक / संवाददाता</label>
                  <select data-testid="input-author" className={input} style={inputStyle} value={form.author}
                          onChange={(e) => setForm({ ...form, author: e.target.value })}>
                    <option value="">चुनें</option>
                    {authors.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-slate-300 mb-1.5 block">लक्ष्य</label>
                  <select data-testid="input-target" className={input} style={inputStyle} value={form.target}
                          onChange={(e) => setForm({ ...form, target: e.target.value })}>
                    <option value="both">दोनों</option>
                    <option value="website">वेबसाइट</option>
                    <option value="newspaper">अखबार</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1.5 block">स्थिति</label>
                  <select data-testid="input-status" className={input} style={inputStyle} value={form.status}
                          onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="draft">ड्राफ्ट</option>
                    <option value="published">प्रकाशित</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1.5 block">अखबार पृष्ठ</label>
                  <select data-testid="input-page" className={input} style={inputStyle} value={form.newspaper_page}
                          onChange={(e) => setForm({ ...form, newspaper_page: e.target.value })}>
                    <option value="">कोई नहीं</option>
                    {pages.map((p) => <option key={p.page} value={p.page}>पृष्ठ {p.page} - {p.title}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-300 mb-1.5 block">कॉलम चौड़ाई (१-३)</label>
                  <select data-testid="input-span" className={input} style={inputStyle} value={form.column_span}
                          onChange={(e) => setForm({ ...form, column_span: e.target.value })}>
                    <option value={1}>१ कॉलम</option>
                    <option value={2}>२ कॉलम</option>
                    <option value={3}>३ कॉलम (पूर्ण)</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2.5 text-sm text-slate-300 cursor-pointer py-2.5" data-testid="input-lead">
                    <input type="checkbox" checked={form.is_lead} onChange={(e) => setForm({ ...form, is_lead: e.target.checked })}
                           className="w-4 h-4 accent-red-600" />
                    मुख्य समाचार (Lead) के रूप में दिखाएँ
                  </label>
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-1.5 block">फोटो</label>
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm cursor-pointer text-slate-200"
                         style={{ background: "var(--bg-main)", border: "1px solid var(--border)" }} data-testid="upload-photo">
                    <Upload size={16} /> {uploading ? "अपलोड हो रहा..." : "फोटो अपलोड करें"}
                    <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
                  </label>
                  {form.image_url && <img src={resolveImg(form.image_url)} alt="" className="w-16 h-16 rounded-lg object-cover" />}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-7">
              <button data-testid="cancel-btn" onClick={() => setOpen(false)}
                      className="px-5 py-2.5 rounded-xl text-sm text-slate-300" style={{ background: "var(--bg-hover)" }}>रद्द करें</button>
              <button data-testid="save-article-btn" onClick={save}
                      className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90" style={{ background: "var(--jg-red)" }}>
                {editId ? "अपडेट करें" : "सहेजें"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
