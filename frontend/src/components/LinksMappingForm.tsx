import type { LinksMapping } from "../types/csv2kml";

type Props = {
  headers: string[];
  mapping: LinksMapping;
  onChange: (next: LinksMapping) => void;
};

export function LinksMappingForm({ headers, mapping, onChange }: Props) {
  const set = (patch: Partial<LinksMapping>) =>
    onChange({ ...mapping, ...patch });

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-900">Links mapping</h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          A latitude column
          <select
            value={mapping.a_lat_col}
            onChange={(e) => set({ a_lat_col: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 shadow-inner focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
          >
            <option value="">-- select --</option>
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          A longitude column
          <select
            value={mapping.a_lon_col}
            onChange={(e) => set({ a_lon_col: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 shadow-inner focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
          >
            <option value="">-- select --</option>
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          B latitude column
          <select
            value={mapping.b_lat_col}
            onChange={(e) => set({ b_lat_col: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 shadow-inner focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
          >
            <option value="">-- select --</option>
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          B longitude column
          <select
            value={mapping.b_lon_col}
            onChange={(e) => set({ b_lon_col: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 shadow-inner focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
          >
            <option value="">-- select --</option>
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 sm:col-span-2">
          Link name column (optional)
          <select
            value={mapping.link_name_col ?? ""}
            onChange={(e) =>
              set({ link_name_col: e.target.value || undefined })
            }
            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 shadow-inner focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
          >
            <option value="">-- none --</option>
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Description columns (optional)
          <select
            multiple
            value={mapping.description_cols}
            onChange={(e) => {
              const opts = Array.from(e.target.selectedOptions).map(
                (o) => o.value
              );
              set({ description_cols: opts });
            }}
            className="mt-1 h-32 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 shadow-inner focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
          >
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </label>
        <div className="text-xs text-slate-500">
          Hold <b>Ctrl</b> (Windows) / <b>Cmd</b> (Mac) to select multiple.
        </div>
      </div>

      <div className="space-y-3 border-t border-slate-200 pt-3">
        <h3 className="text-sm font-semibold text-slate-900">
          Line style (optional)
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Line color
            <input
              type="color"
              value={mapping.line_color ?? "#00AAFF"}
              onChange={(e) => set({ line_color: e.target.value })}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-1 py-1"
            />
          </label>

          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Line width
            <input
              type="number"
              min={0.5}
              max={50}
              step={0.5}
              value={mapping.line_width ?? 2.0}
              onChange={(e) => set({ line_width: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
