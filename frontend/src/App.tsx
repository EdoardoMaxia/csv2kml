import { useMemo, useState } from "react";
import type { PointsMapping, Preview } from "./types/csv2kml";
import { csvPreview, generateKmlPoints } from "./api/csv2kml";
import { downloadBlob } from "./utils/download";
import { FileUpload } from "./components/FileUpload";
import { ErrorBanner } from "./components/ErrorBanner";
import { MappingForm } from "./components/MappingForm";
import { CsvPreviewTable } from "./components/CsvPreviewTable";

function isValidHexColor(v: string) {
  return /^#[0-9a-fA-F]{6}$/.test(v);
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);

  const [nameCol, setNameCol] = useState("");
  const [latCol, setLatCol] = useState("");
  const [lonCol, setLonCol] = useState("");
  const [descCols, setDescCols] = useState<string[]>([]);

  const [iconUrl, setIconUrl] = useState("");
  const [iconScale, setIconScale] = useState<number>(1.0);
  const [iconColor, setIconColor] = useState("##00AAFF");

  const [error, setError] = useState("");
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
    setIconUrl("");
    setIconScale(1.0);
    setIconColor("#00AAFF");
    setFile(f);

    if (!f) return;

    try {
      setLoadingPreview(true);
      const p = await csvPreview(f, 20);
      setPreview(p);

      // Auto-pick common headers
      const lower = p.headers.map((h) => h.toLocaleLowerCase());
      const pick = (candidates: string[]) => {
        const idx = lower.findIndex((h) => candidates.includes(h));
        return idx >= 0 ? p.headers[idx] : "";
      };

      setNameCol(
        pick(["name", "nome", "point", "punto", "node", "nodo"]) ||
          p.headers[0] ||
          ""
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

    const mapping: PointsMapping = {
      name_col: nameCol,
      lat_col: latCol,
      lon_col: lonCol,
      description_cols: descCols,
      icon_url: iconUrl,
      icon_scale: iconScale,
      icon_color: iconColor,
    };

    // Add styling only if user set something meaningful (keeps backqard compatibility)
    const trimmedUrl = iconUrl.trim();
    if (trimmedUrl) mapping.icon_url = trimmedUrl;

    if (iconScale <= 0 || iconScale > 10) {
      setError("icon_scale must be between 0 and 10");
      return;
    }
    if (iconColor && !isValidHexColor(iconColor)) {
      setError("icon_color must be in format #RRGGBB");
      return;
    }

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

      <FileUpload onSelectFile={onSelectFile} loading={loadingPreview} />

      <ErrorBanner message={error} />

      {preview && (
        <>
          <div style={{ marginBottom: 12, color: "#555" }}>
            <b>File:</b> {preview.filename} - <b>Delimiter:</b>{" "}
            {preview.detected_delimiter}
          </div>
          <MappingForm
            headers={preview.headers}
            nameCol={nameCol}
            latCol={latCol}
            lonCol={lonCol}
            descCols={descCols}
            onChangeName={setNameCol}
            onChangeLat={setLatCol}
            onChangeLon={setLonCol}
            onChangeDescCols={setDescCols}
            iconUrl={iconUrl}
            iconColor={iconColor}
            iconScale={iconScale}
            onChangeIconUrl={setIconUrl}
            onChangeIconColor={setIconColor}
            onChangeIconScale={setIconScale}
          />

          <button
            onClick={onGenerateKml}
            disabled={!canGenerate || loadingKml}
            style={{ padding: "10px 16px" }}
          >
            {loadingKml ? "Generating..." : "Generate KML"}
          </button>

          <CsvPreviewTable headers={preview.headers} rows={preview.rows} />
        </>
      )}
    </div>
  );
}
