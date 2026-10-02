import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader, StatusBadge } from "@/components/common";
import { toast } from "sonner";
import { Check, Ban, Trash2 } from "lucide-react";

const TABS = [
  { k: "", label: "सभी" },
  { k: "pending", label: "लंबित" },
  { k: "approved", label: "अनुमोदित" },
  { k: "spam", label: "स्पैम" },
];

export default function Comments() {
  const [comments, setComments] = useState([]);
  const [tab, setTab] = useState("");

  const load = (t) => api.get("/comments", { params: t ? { status: t } : {} }).then((r) => setComments(r.data));
  useEffect(() => { load(tab); }, [tab]);

  const setStatus = async (id, status) => { await api.put(`/comments/${id}/status`, null, { params: { status } }); toast.success("अपडेट हुआ"); load(tab); };
  const del = async (id) => { await api.delete(`/comments/${id}`); toast.success("हटाया गया"); load(tab); };

  return (
    <div>
      <PageHeader title="टिप्पणी समीक्षा" subtitle="पाठकों की टिप्पणियाँ अनुमोदित करें, स्पैम चिह्नित करें या हटाएँ" />

      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map((t) => (
          <button key={t.k} data-testid={`comment-tab-${t.k || "all"}`} onClick={() => setTab(t.k)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold ${tab === t.k ? "text-white" : "text-slate-300"}`}
                  style={{ background: tab === t.k ? "var(--jg-red)" : "var(--bg-surface)" }}>{t.label}</button>
        ))}
      </div>

      <div className="space-y-3">
        {comments.map((c, i) => (
          <div key={c.id} className="jg-surface p-5 stagger-in" style={{ animationDelay: `${i * 40}ms` }} data-testid={`comment-${c.id}`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="text-white font-semibold">{c.author_name}</span>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-slate-300 text-sm">{c.content}</p>
                {c.article_title && <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>समाचार: {c.article_title}</p>}
              </div>
              <div className="flex gap-2">
                <button data-testid={`approve-comment-${c.id}`} onClick={() => setStatus(c.id, "approved")}
                        className="p-2 rounded-lg hover:bg-slate-700" style={{ color: "#16A34A" }} title="अनुमोदित"><Check size={18} /></button>
                <button data-testid={`spam-comment-${c.id}`} onClick={() => setStatus(c.id, "spam")}
                        className="p-2 rounded-lg hover:bg-slate-700" style={{ color: "#D97706" }} title="स्पैम"><Ban size={18} /></button>
                <button data-testid={`delete-comment-${c.id}`} onClick={() => del(c.id)}
                        className="p-2 rounded-lg hover:bg-slate-700" style={{ color: "#F87171" }} title="हटाएँ"><Trash2 size={18} /></button>
              </div>
            </div>
          </div>
        ))}
        {comments.length === 0 && <div className="jg-surface py-16 text-center" style={{ color: "var(--text-muted)" }}>कोई टिप्पणी नहीं</div>}
      </div>
    </div>
  );
}
