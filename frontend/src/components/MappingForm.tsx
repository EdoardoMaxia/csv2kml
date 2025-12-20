type Props = {
  headers: string[];
  nameCol: string;
  latCol: string;
  lonCol: string;
  descCols: string[];
  onChangeName: (v: string) => void;
  onChangeLat: (v: string) => void;
  onChangeLon: (v: string) => void;
  onChangeDescCols: (v: string[]) => void;

  iconUrl: string;
  iconScale: number;
  iconColor: string;
  onChangeIconUrl: (v: string) => void;
  onChangeIconScale: (v: number) => void;
  onChangeIconColor: (v: string) => void;
};

import { googleEarthIcons } from "../constants/icons";

export function MappingForm({
  headers,
  nameCol,
  latCol,
  lonCol,
  descCols,
  onChangeName,
  onChangeLat,
  onChangeLon,
  onChangeDescCols,

  iconUrl,
  iconScale,
  iconColor,
  onChangeIconUrl,
  onChangeIconScale,
  onChangeIconColor,
}: Props) {
  const selectedPreset =
    googleEarthIcons.find((p) => p.url === iconUrl)?.url ?? "custom";

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Name column
          <select
            value={nameCol}
            onChange={(e) => onChangeName(e.target.value)}
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
            value={latCol}
            onChange={(e) => onChangeLat(e.target.value)}
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
            value={lonCol}
            onChange={(e) => onChangeLon(e.target.value)}
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

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Description columns (optional)
          <select
            multiple
            value={descCols}
            onChange={(e) => {
              const opts = Array.from(e.target.selectedOptions).map(
                (o) => o.value
              );
              onChangeDescCols(opts);
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
          Point styling (optional)
        </h3>

        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Google Earth icon
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {googleEarthIcons.map((p) => (
              <button
                type="button"
                key={p.url}
                onClick={() => onChangeIconUrl(p.url)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition hover:border-cyan-400 hover:ring-2 hover:ring-cyan-100 ${
                  selectedPreset === p.url
                    ? "border-cyan-400 ring-2 ring-cyan-100 bg-cyan-50/60"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <img
                  src={p.url}
                  alt={p.label}
                  className="h-6 w-6 object-contain"
                  loading="lazy"
                />
                <span className="text-slate-800">{p.label}</span>
              </button>
            ))}
          </div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Custom URL
            <input
              type="url"
              placeholder="https://.../icon.png"
              value={iconUrl}
              onChange={(e) => onChangeIconUrl(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Scale
            <input
              type="number"
              min={0.1}
              max={10}
              step={0.1}
              value={iconScale}
              onChange={(e) => onChangeIconScale(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
            />
          </label>

          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Color
            <input
              type="color"
              value={iconColor}
              onChange={(e) => onChangeIconColor(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-1 py-1"
            />
          </label>
        </div>
        <div className="text-xs text-slate-500">
          Tip: scale 1.0 is default. Color is sent as <code>#RRGGBB</code>
        </div>
      </div>
    </div>
  );
}
