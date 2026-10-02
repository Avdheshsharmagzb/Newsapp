import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/common";
import { useNavigate } from "react-router-dom";
import {
  FileText, CheckCircle2, FileEdit, Globe, Newspaper, Eye, Users, Tags, MessageSquare
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

const StatCard = ({ icon: Icon, label, value, color, i }) => (
  <div className="jg-surface p-5 stagger-in" style={{ animationDelay: `${i * 60}ms` }} data-testid={`stat-${label}`}>
    <div className="flex items-center justify-between">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${color}22` }}>
        <Icon size={22} style={{ color }} />
      </div>
    </div>
    <div className="mt-4 text-3xl font-black text-white font-ui">{value}</div>
    <div className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{label}</div>
  </div>
);

export default function Overview() {
  const [data, setData] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    api.get("/analytics/overview").then((r) => setData(r.data)).catch(() => {});
  }, []);

  if (!data) return <div className="text-slate-400">लोड हो रहा है...</div>;

  const stats = [
    { icon: FileText, label: "कुल समाचार", value: data.total, color: "#DC2626" },
    { icon: CheckCircle2, label: "प्रकाशित", value: data.published, color: "#16A34A" },
    { icon: FileEdit, label: "ड्राफ्ट", value: data.drafts, color: "#D97706" },
    { icon: Eye, label: "कुल व्यूज़", value: data.total_views, color: "#2563EB" },
    { icon: Globe, label: "वेबसाइट पर", value: data.web, color: "#0891B2" },
    { icon: Newspaper, label: "अखबार में", value: data.paper, color: "#7C3AED" },
    { icon: MessageSquare, label: "लंबित टिप्पणी", value: data.pending_comments, color: "#DB2777" },
    { icon: Users, label: "संवाददाता", value: data.authors, color: "#059669" },
  ];

  const maxPage = Math.max(1, ...data.page_status.map((p) => p.count));

  return (
    <div>
      <PageHeader title="मुख्य डैशबोर्ड" subtitle="वेबसाइट और अखबार — एक ही डेटाबेस का सारांश" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => <StatCard key={s.label} {...s} i={i} />)}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-6">
        {/* Newspaper page completion */}
        <div className="jg-surface p-6 xl:col-span-2 stagger-in" style={{ animationDelay: "120ms" }}>
          <h3 className="font-news font-bold text-xl text-white mb-1">८-पेज अखबार लेआउट स्थिति</h3>
          <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>प्रत्येक पृष्ठ पर निर्धारित समाचारों की संख्या</p>
          <div className="space-y-3">
            {data.page_status.map((p) => (
              <div key={p.page} className="flex items-center gap-3" data-testid={`page-status-${p.page}`}>
                <div className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                     style={{ background: p.count > 0 ? "var(--jg-red)" : "var(--bg-hover)" }}>{p.page}</div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-200">{p.title}</span>
                    <span style={{ color: "var(--text-muted)" }}>{p.count} समाचार</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-main)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${(p.count / maxPage) * 100}%`, background: "var(--jg-red)" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button data-testid="go-newspaper" onClick={() => nav("/newspaper")}
                  className="mt-6 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                  style={{ background: "var(--jg-red)" }}>
            अखबार व्यूअर खोलें →
          </button>
        </div>

        {/* By category */}
        <div className="jg-surface p-6 stagger-in" style={{ animationDelay: "180ms" }}>
          <h3 className="font-news font-bold text-xl text-white mb-5">श्रेणी अनुसार</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.by_category} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={70} tick={{ fill: "#94A3B8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "#33415555" }} contentStyle={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 10, color: "#fff" }} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {data.by_category.map((c, i) => <Cell key={i} fill={c.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top articles */}
      <div className="jg-surface p-6 mt-6 stagger-in" style={{ animationDelay: "240ms" }}>
        <h3 className="font-news font-bold text-xl text-white mb-4">सर्वाधिक पढ़े गए समाचार</h3>
        <div className="space-y-2">
          {data.top_articles.map((a, i) => (
            <div key={a.id} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: "var(--bg-main)" }} data-testid={`top-article-${i}`}>
              <span className="font-news font-black text-2xl w-8" style={{ color: "var(--jg-red)" }}>{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{a.title}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{a.category} · {a.author}</p>
              </div>
              <span className="flex items-center gap-1.5 text-sm shrink-0" style={{ color: "var(--text-muted)" }}>
                <Eye size={15} /> {a.views}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
