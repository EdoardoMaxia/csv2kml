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
  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <label>
          Name column
          <select
            value={nameCol}
            onChange={(e) => onChangeName(e.target.value)}
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
          Latitude column
          <select
            value={latCol}
            onChange={(e) => onChangeLat(e.target.value)}
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
          Longitude column
          <select
            value={lonCol}
            onChange={(e) => onChangeLon(e.target.value)}
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
      </div>

      <div style={{ marginBottom: 16 }}>
        <label>
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
        <h3 style={{ margin: "8px 0" }}>Point styling (optional)</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr",
            gap: 12,
          }}
        >
          <label>
            Icon URL
            <input
              type="url"
              placeholder="https://.../icon.png"
              value={iconUrl}
              onChange={(e) => onChangeIconUrl(e.target.value)}
              style={{ width: "100%" }}
            />
          </label>

          <label>
            Scale
            <input
              type="number"
              min={0.1}
              max={10}
              step={0.1}
              value={iconScale}
              onChange={(e) => onChangeIconScale(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </label>

          <label>
            Color
            <input
              type="color"
              value={iconColor}
              onChange={(e) => onChangeIconColor(e.target.value)}
              style={{ width: "100%", height: 36 }}
            />
          </label>
        </div>
        <div style={{ color: "#777", marginTop: 6 }}>
          Tip: scale 1.0 is default. Color is sent as <code>#RRGGBB</code>
        </div>
      </div>
    </>
  );
}
