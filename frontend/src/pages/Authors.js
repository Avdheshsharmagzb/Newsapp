import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/common";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X, UserRound } from "lucide-react";

export default function Authors() {
  const [authors, setAuthors] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", designation: "संवाददाता", email: "", bio: "" });
  const [editId, setEditId] = useState(null);

  const load = () => api.get("/authors").then((r) => setAuthors(r.data));
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name.trim()) { toast.error("नाम आवश्यक है"); return; }
    if (editId) await api.put(`/authors/${editId}`, form);
    else await api.post("/authors", form);
    toast.success("सहेजा गया"); setOpen(false); load();
  };
  const del = async (id) => { await api.delete(`/authors/${id}`); toast.success("हटाया गया"); load(); };

  const input = "w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none";
  const inputStyle = { background: "var(--bg-main)", border: "1px solid var(--border)" };
  const designations = ["ब्यूरो प्रमुख", "विशेष संवाददाता", "वरिष्ठ संवाददाता", "संवाददाता", "स्तंभकार"];

  return (
    <div>
      <PageHeader title="लेखक एवं संवाददाता" subtitle="रिपोर्टर प्रोफाइल और पदनाम प्रबंधित करें">
        <button data-testid="add-author-btn" onClick={() => { setForm({ name: "", designation: "संवाददाता", email: "", bio: "" }); setEditId(null); setOpen(true); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: "var(--jg-red)" }}>
          <Plus size={18} /> नया लेखक
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {authors.map((a, i) => (
          <div key={a.id} className="jg-surface p-5 stagger-in" style={{ animationDelay: `${i * 40}ms` }} data-testid={`author-${a.id}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "var(--jg-red)" }}>
                  <UserRound size={22} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold">{a.name}</p>
                  <p className="text-xs" style={{ color: "var(--jg-red)" }}>{a.designation}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button data-testid={`edit-author-${a.id}`} onClick={() => { setForm({ name: a.name, designation: a.designation, email: a.email, bio: a.bio }); setEditId(a.id); setOpen(true); }}
                        className="p-2 rounded-lg hover:bg-slate-700" style={{ color: "#60A5FA" }}><Pencil size={15} /></button>
                <button data-testid={`delete-author-${a.id}`} onClick={() => del(a.id)} className="p-2 rounded-lg hover:bg-slate-700" style={{ color: "#F87171" }}><Trash2 size={15} /></button>
              </div>
            </div>
            {a.email && <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>{a.email}</p>}
            {a.bio && <p className="text-sm mt-2 text-slate-300">{a.bio}</p>}
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)" }}>
          <div className="jg-surface w-full max-w-md p-7" data-testid="author-modal">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-news font-bold text-xl text-white">{editId ? "लेखक संपादित करें" : "नया लेखक"}</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block">नाम</label>
                <input data-testid="author-name" className={input} style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block">पदनाम</label>
                <select data-testid="author-designation" className={input} style={inputStyle} value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })}>
                  {designations.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block">ईमेल</label>
                <input data-testid="author-email" className={input} style={inputStyle} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block">परिचय</label>
                <textarea rows={3} data-testid="author-bio" className={input} style={inputStyle} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setOpen(false)} className="px-5 py-2.5 rounded-xl text-sm text-slate-300" style={{ background: "var(--bg-hover)" }}>रद्द करें</button>
              <button data-testid="save-author-btn" onClick={save} className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: "var(--jg-red)" }}>सहेजें</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
