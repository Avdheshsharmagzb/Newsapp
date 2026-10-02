import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/common";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

export default function Analytics() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/analytics/overview").then((r) => setData(r.data)); }, []);
  if (!data) return <div className="text-slate-400">लोड हो रहा है...</div>;

  const targetData = [
    { name: "वेबसाइट", value: data.web, color: "#0891B2" },
    { name: "अखबार", value: data.paper, color: "#7C3AED" },
  ];

  return (
    <div>
      <PageHeader title="रिपोर्ट्स एवं एनालिटिक्स" subtitle="वेबसाइट बनाम अखबार वितरण, श्रेणियाँ और शीर्ष समाचार" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="jg-surface p-6 stagger-in">
          <h3 className="font-news font-bold text-xl text-white mb-5">वेबसाइट बनाम अखबार वितरण</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={targetData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} innerRadius={55} paddingAngle={3}>
                {targetData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 10, color: "#fff" }} />
              <Legend wrapperStyle={{ color: "#94A3B8" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="jg-surface p-6 stagger-in" style={{ animationDelay: "80ms" }}>
          <h3 className="font-news font-bold text-xl text-white mb-5">श्रेणी अनुसार समाचार</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.by_category}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: "#33415555" }} contentStyle={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 10, color: "#fff" }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {data.by_category.map((c, i) => <Cell key={i} fill={c.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="jg-surface p-6 lg:col-span-2 stagger-in" style={{ animationDelay: "160ms" }}>
          <h3 className="font-news font-bold text-xl text-white mb-5">८-पेज अखबार — पृष्ठवार समाचार संख्या</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.page_status}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="title" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: "#33415555" }} contentStyle={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 10, color: "#fff" }} />
              <Bar dataKey="count" fill="#DC2626" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
