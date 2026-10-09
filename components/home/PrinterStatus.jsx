import { Printer } from "lucide-react";

export default function PrinterStatus() {
  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-xl border border-border bg-white px-4 py-4">
      <div className="flex items-center gap-3">
        <Printer size={20} strokeWidth={1.8} className="text-text-secondary" />

        <span className="text-[13px] text-text-secondary">
          Printer: HP LaserJet 3055
        </span>
      </div>

      <div className="flex items-center gap-2 text-[13px] font-semibold text-success">
        <span className="h-2 w-2 rounded-full bg-success" />
        Demo Ready
      </div>
    </div>
  );
}
