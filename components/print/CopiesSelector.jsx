"use client";

import { Minus, Plus } from "lucide-react";

export default function CopiesSelector({ copies, onChange }) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-text-primary">Copies</h2>

      <div className="inline-flex h-11 overflow-hidden rounded-lg border border-border bg-white">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, copies - 1))}
          disabled={copies <= 1}
          aria-label="Decrease copies"
          className="flex w-12 cursor-pointer items-center justify-center border-r border-border hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus size={17} />
        </button>

        <span className="flex w-16 items-center justify-center text-sm font-semibold text-text-primary">
          {copies}
        </span>

        <button
          type="button"
          onClick={() => onChange(Math.min(100, copies + 1))}
          disabled={copies >= 100}
          aria-label="Increase copies"
          className="flex w-12 cursor-pointer items-center justify-center border-l border-border hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={17} />
        </button>
      </div>
    </div>
  );
}
