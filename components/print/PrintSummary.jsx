import { FileText, Copy, Layers, Printer } from "lucide-react";

export default function PrintSummary({ pagesPerCopy, copies, totalSheets }) {
  const items = [
    {
      label: "Pages per copy",
      value: pagesPerCopy ?? "—",
      icon: FileText,
    },
    {
      label: "Copies",
      value: copies,
      icon: Copy,
    },
    {
      label: "Estimated sheets",
      value: totalSheets ?? "—",
      icon: Layers,
    },
    {
      label: "Printer",
      value: "HP LaserJet 3055",
      icon: Printer,
    },
  ];

  return (
    <aside className="h-full rounded-xl border border-border bg-[#f7faff] px-5 py-6">
      <h2 className="mb-7 text-lg font-bold text-text-primary">
        Print Summary
      </h2>

      <div className="space-y-7">
        {items.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-light">
              <Icon size={19} className="text-text-secondary" />
            </div>

            <div className="min-w-0">
              <p className="text-xs text-text-secondary">{label}</p>

              <p className="mt-1 wrap-break-words text-sm font-semibold text-text-primary">
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
