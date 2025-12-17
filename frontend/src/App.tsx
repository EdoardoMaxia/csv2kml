import { useMemo, useState } from "react";
import { csvPreview, generateKmlPoints } from "./api";

type Preview = {
  filename: string;
  headers: string[];
  rows: string[][];
  max_rows: number;
  detected_delimiter: string;
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);

  const [nameCol, setNameCol] = useState("");
  const [latCol, setLatCol] = useState("");
  const [lonCol, setLonCol] = useState("");
  const [descCols, setDescCols] = useState<string[]>([]);

  const [error, setError] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingKml, setLoadingKml] = useState(false);

  const canGenerate = useMemo(() => {
    return !!file && !!preview && !!nameCol && !!latCol && !!lonCol;
  }, [file, preview, nameCol, latCol, lonCol]);

  async function onSelectFile(f: File | null) {
    setError("");
    setPreview(null);
    setNameCol("");
    setLatCol("");
    setLonCol("");
    setDescCols([]);
    setFile(f);

    if (!f) return;

    try {
      setLoadingPreview(true);
      const p = await csvPreview(f, 20);
      setPreview(p);

      // small convenience: auto-select if common names exist
      const lower = p.headers.map((h) => h.toLowerCase());
      const pick = (candidates: string[]) => {
        const idx = lower.findIndex((h) => candidates.includes(h));
        return idx >= 0 ? p.headers[idx] : "";
      };

      setNameCol(
        pick(["name", "nome", "point", "punto"]) || p.headers[0] || ""
      );
      setLatCol(pick(["lat", "latitude", "latitudine"]));
      setLonCol(pick(["lon", "lng", "longitude", "longitudine"]));
    } catch (e: any) {
      setError(e.message ?? "Preview error");
    } finally {
      setLoadingPreview(false);
    }
  }

  async function onGenerateKml() {
    if (!file) return;
    setError("");

    const mapping = {
      name_col: nameCol,
      lat_col: latCol,
      lon_col: lonCol,
      description_cols: descCols,
    };

    try {
      setLoadingKml(true);
      const { blob, filename } = await generateKmlPoints(file, mapping);
      downloadBlob(blob, filename);
    } catch (e: any) {
      setError(e.message ?? "KML generation error");
    } finally {
      setLoadingKml(false);
    }
  }

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 1100,
        margin: "0 auto",
        fontFamily: "system-ui",
      }}
    >
      <h1 style={{ marginBottom: 8 }}>csv2kml</h1>
      <p style={{ marginTop: 0, color: "#555" }}>
        Upload a CSV → preview → map columns → download KML.
      </p>

      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => onSelectFile(e.target.files?.[0] ?? null)}
        />
        {loadingPreview && <span>Loading preview…</span>}
      </div>

      {error && (
        <div
          style={{
            padding: 12,
            background: "#ffecec",
            border: "1px solid #ffb3b3",
            marginBottom: 16,
          }}
        >
          <b>Error:</b> {error}
        </div>
      )}

      {preview && (
        <>
          <div style={{ marginBottom: 12, color: "#555" }}>
            <b>File:</b> {preview.filename} — <b>Delimiter:</b>{" "}
            {preview.detected_delimiter}
          </div>

          {/* Mapping form */}
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
                onChange={(e) => setNameCol(e.target.value)}
                style={{ width: "100%" }}
              >
                <option value="">-- select --</option>
                {preview.headers.map((h) => (
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
                onChange={(e) => setLatCol(e.target.value)}
                style={{ width: "100%" }}
              >
                <option value="">-- select --</option>
                {preview.headers.map((h) => (
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
                onChange={(e) => setLonCol(e.target.value)}
                style={{ width: "100%" }}
              >
                <option value="">-- select --</option>
                {preview.headers.map((h) => (
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
                  setDescCols(opts);
                }}
                style={{ width: "100%", height: 120 }}
              >
                {preview.headers.map((h) => (
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

          <button
            onClick={onGenerateKml}
            disabled={!canGenerate || loadingKml}
            style={{ padding: "10px 16px" }}
          >
            {loadingKml ? "Generating…" : "Generate KML"}
          </button>

          {/* Preview table */}
          <h2 style={{ marginTop: 24 }}>Preview</h2>
          <div style={{ overflowX: "auto", border: "1px solid #ddd" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {preview.headers.map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: 8,
                        borderBottom: "1px solid #ddd",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, idx) => (
                  <tr key={idx}>
                    {preview.headers.map((_, cidx) => (
                      <td
                        key={cidx}
                        style={{
                          padding: 8,
                          borderBottom: "1px solid #f0f0f0",
                        }}
                      >
                        {row[cidx] ?? ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
