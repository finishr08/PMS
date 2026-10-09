"use client";

export default function PageSelector({
  pageMode,
  setPageMode,
  pageRange,
  setPageRange,
  error,
}) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-text-primary">Pages</h2>

      <div className="space-y-3">
        <label className="flex cursor-pointer items-center gap-3 text-sm text-text-primary">
          <input
            type="radio"
            name="pageMode"
            value="all"
            checked={pageMode === "all"}
            onChange={() => setPageMode("all")}
            className="h-4 w-4 accent-primary"
          />
          All pages
        </label>

        <label className="flex cursor-pointer items-center gap-3 text-sm text-text-primary">
          <input
            type="radio"
            name="pageMode"
            value="custom"
            checked={pageMode === "custom"}
            onChange={() => setPageMode("custom")}
            className="h-4 w-4 accent-primary"
          />
          Custom range
        </label>

        <input
          type="text"
          value={pageRange}
          onChange={(e) => setPageRange(e.target.value)}
          onFocus={() => setPageMode("custom")}
          disabled={pageMode !== "custom"}
          placeholder="1-3, 5, 8-10"
          aria-label="Custom page range"
          aria-invalid={!!error}
          className="app-input w-full disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
        />

        {error && (
          <p role="alert" className="text-xs text-error">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
