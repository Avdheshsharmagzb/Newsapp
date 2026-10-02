import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/common";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X } from "lucide-react";

export default function Categories() {
  const [cats, setCats] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", color: "#DC2626", order: 0 });
  const [editId, setEditId] = useState(null);

  const load = () => api.get("/categories").then((r) => setCats(r.data));
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name.trim()) { toast.error("नाम आवश्यक है"); return; }
    if (editId) await api.put(`/categories/${editId}`, form);
    else await api.post("/categories", form);
    toast.success("सहेजा गया"); setOpen(false); load();
  };
  const del = async (id) => { await api.delete(`/categories/${id}`); toast.success("हटाया गया"); load(); };

  const input = "w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none";
  const inputStyle = { background: "var(--bg-main)", border: "1px solid var(--border)" };

  return (
    <div>
      <PageHeader title="श्रेणी प्रबंधन" subtitle="समाचार श्रेणियाँ जोड़ें और रंग निर्धारित करें">
        <button data-testid="add-category-btn" onClick={() => { setForm({ name: "", color: "#DC2626", order: cats.length + 1 }); setEditId(null); setOpen(true); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: "var(--jg-red)" }}>
          <Plus size={18} /> नई श्रेणी
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cats.map((c, i) => (
          <div key={c.id} className="jg-surface p-5 flex items-center justify-between stagger-in" style={{ animationDelay: `${i * 40}ms` }} data-testid={`category-${c.id}`}>
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl" style={{ background: c.color }} />
              <div>
                <p className="text-white font-semibold">{c.name}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>क्रम #{c.order}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button data-testid={`edit-category-${c.id}`} onClick={() => { setForm({ name: c.name, color: c.color, order: c.order }); setEditId(c.id); setOpen(true); }}
                      className="p-2 rounded-lg hover:bg-slate-700" style={{ color: "#60A5FA" }}><Pencil size={16} /></button>
              <button data-testid={`delete-category-${c.id}`} onClick={() => del(c.id)} className="p-2 rounded-lg hover:bg-slate-700" style={{ color: "#F87171" }}><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)" }}>
          <div className="jg-surface w-full max-w-md p-7" data-testid="category-modal">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-news font-bold text-xl text-white">{editId ? "श्रेणी संपादित करें" : "नई श्रेणी"}</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block">नाम</label>
                <input data-testid="category-name" className={input} style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-300 mb-1.5 block">रंग</label>
                  <input type="color" data-testid="category-color" className="w-full h-11 rounded-xl bg-transparent cursor-pointer" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1.5 block">क्रम</label>
                  <input type="number" data-testid="category-order" className={input} style={inputStyle} value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setOpen(false)} className="px-5 py-2.5 rounded-xl text-sm text-slate-300" style={{ background: "var(--bg-hover)" }}>रद्द करें</button>
              <button data-testid="save-category-btn" onClick={save} className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: "var(--jg-red)" }}>सहेजें</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
