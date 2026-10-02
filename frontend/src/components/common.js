export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7 stagger-in">
      <div>
        <h1 className="font-news font-black text-3xl sm:text-4xl text-white leading-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm" style={{ color: "var(--text-muted)" }}>{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    published: { t: "प्रकाशित", c: "#16A34A" },
    draft: { t: "ड्राफ्ट", c: "#D97706" },
    approved: { t: "अनुमोदित", c: "#16A34A" },
    pending: { t: "लंबित", c: "#D97706" },
    spam: { t: "स्पैम", c: "#DC2626" },
  };
  const v = map[status] || { t: status, c: "#94A3B8" };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ background: `${v.c}22`, color: v.c }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: v.c }} />
      {v.t}
    </span>
  );
}

export function TargetBadge({ target }) {
  const map = {
    website: "वेबसाइट", newspaper: "अखबार", both: "दोनों",
  };
  return (
    <span className="px-2.5 py-1 rounded-md text-xs font-medium"
          style={{ background: "var(--bg-hover)", color: "var(--text-main)" }}>
      {map[target] || target}
    </span>
  );
}
