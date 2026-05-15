type StatCardProps = {
  label: string;
  value: number | string;
  helper?: string;
  tone?: "default" | "critical" | "success";
};

const toneClasses = {
  default: "bg-slate-50 text-slate-700",
  critical: "bg-rose-50 text-rose-700",
  success: "bg-emerald-50 text-emerald-700"
};

export default function StatCard({ label, value, helper, tone = "default" }: StatCardProps) {
  return (
    <article className="panel p-5">
      <div className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]}`}>
        {label}
      </div>
      <p className="mt-4 text-3xl font-semibold text-slate-950">{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-500">{helper}</p> : null}
    </article>
  );
}
