import type { GraphNodeSpec } from "../types/csv2kml";

type Props = {
  headers: string[];
  nodeA: GraphNodeSpec;
  nodeB: GraphNodeSpec;
  onChangeNodeA: (n: GraphNodeSpec) => void;
  onChangeNodeB: (n: GraphNodeSpec) => void;
};

function NodeBlock({
  title,
  headers,
  value,
  onChange,
}: {
  title: string;
  headers: string[];
  value: GraphNodeSpec;
  onChange: (n: GraphNodeSpec) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm ring-1 ring-slate-100 space-y-3">
      <div className="text-sm font-semibold text-slate-900">{title}</div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Name column
          <select
            value={value.name_col}
            onChange={(e) => onChange({ ...value, name_col: e.target.value })}
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
          Latitude column
          <select
            value={value.lat_col}
            onChange={(e) => onChange({ ...value, lat_col: e.target.value })}
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
          Longitude column
          <select
            value={value.lon_col}
            onChange={(e) => onChange({ ...value, lon_col: e.target.value })}
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
      </div>
    </div>
  );
}

export function GraphNodesForm({
  headers,
  nodeA,
  nodeB,
  onChangeNodeA,
  onChangeNodeB,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="text-sm font-semibold text-slate-900">Graph points</div>
        <div className="text-sm text-slate-600">
          Select columns for <b>Point A</b> and <b>Point B</b>. Both will be
          deduplicated.
        </div>
      </div>

      <NodeBlock
        title="Point A"
        headers={headers}
        value={nodeA}
        onChange={onChangeNodeA}
      />
      <NodeBlock
        title="Point B"
        headers={headers}
        value={nodeB}
        onChange={onChangeNodeB}
      />
    </div>
  );
}
