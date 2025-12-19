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
    <>
      <h3 style={{ margin: "8px 0" }}>Links mapping</h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <label>
          A latitude column
          <select
            value={mapping.a_lat_col}
            onChange={(e) => set({ a_lat_col: e.target.value })}
            style={{ width: "100%" }}
          >
            <option value="">-- select --</option>
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </label>

        <label>
          A longitude column
          <select
            value={mapping.a_lon_col}
            onChange={(e) => set({ a_lon_col: e.target.value })}
            style={{ width: "100%" }}
          >
            <option value="">-- select --</option>
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </label>

        <label>
          B latitude column
          <select
            value={mapping.b_lat_col}
            onChange={(e) => set({ b_lat_col: e.target.value })}
            style={{ width: "100%" }}
          >
            <option value="">-- select --</option>
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </label>

        <label>
          B longitude column
          <select
            value={mapping.b_lon_col}
            onChange={(e) => set({ b_lon_col: e.target.value })}
            style={{ width: "100%" }}
          >
            <option value="">-- select --</option>
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </label>

        <label>
          Link name column (optional)
          <select
            value={mapping.link_name_col ?? ""}
            onChange={(e) =>
              set({ link_name_col: e.target.value || undefined })
            }
            style={{ width: "100%" }}
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

      <div style={{ marginBottom: 16 }}>
        <label>
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
            style={{ width: "100%", height: 120 }}
          >
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </label>
        <div style={{ color: "#777", marginTop: 6 }}>
          Hold <b>Ctrl</b> (Windows) / <b>Cmd</b> (Mac) to select multiple.
        </div>
      </div>

      <div
        style={{
          marginBottom: 16,
          borderTop: "1px solid #eee",
          paddingTop: 12,
        }}
      >
        <h3 style={{ margin: "8px 0" }}>Line style (optional)</h3>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <label>
            Line color
            <input
              type="color"
              value={mapping.line_color ?? "#00AAFF"}
              onChange={(e) => set({ line_color: e.target.value })}
              style={{ width: "100%", height: 36 }}
            />
          </label>

          <label>
            Line width
            <input
              type="number"
              min={0.5}
              max={50}
              step={0.5}
              value={mapping.line_width ?? 2.0}
              onChange={(e) => set({ line_width: Number(e.target.value) })}
              style={{ width: "100%" }}
            />
          </label>
        </div>
      </div>
    </>
  );
}
