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
    </>
  );
}
