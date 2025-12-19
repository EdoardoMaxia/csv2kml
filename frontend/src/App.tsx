import { useMemo, useState } from "react";
import type { LinksMapping, PointsMapping, Preview } from "./types/csv2kml";
import { csvPreview, generateKmlLinks, generateKmlPoints } from "./api/csv2kml";
import { downloadBlob } from "./utils/download";
import { FileUpload } from "./components/FileUpload";
import { ErrorBanner } from "./components/ErrorBanner";
import { MappingForm } from "./components/MappingForm";
import { CsvPreviewTable } from "./components/CsvPreviewTable";
import { Tabs } from "./components/Tabs";
import { LinksMappingForm } from "./components/LinksMappingForm";

function isValidHexColor(v: string) {
  return /^#[0-9a-fA-F]{6}$/.test(v);
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);

  // Points mapping
  const [nameCol, setNameCol] = useState("");
  const [latCol, setLatCol] = useState("");
  const [lonCol, setLonCol] = useState("");
  const [descCols, setDescCols] = useState<string[]>([]);

  // Points styling
  const [iconUrl, setIconUrl] = useState("");
  const [iconScale, setIconScale] = useState<number>(1.0);
  const [iconColor, setIconColor] = useState("#00AAFF"); // ✅ fixed

  // UI state
  const [error, setError] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingKml, setLoadingKml] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<"points" | "links">("points");

  // Links mapping
  const [linksMapping, setLinksMapping] = useState<LinksMapping>({
    a_lat_col: "",
    a_lon_col: "",
    b_lat_col: "",
    b_lon_col: "",
    link_name_col: undefined,
    description_cols: [],
    line_color: "#00AAFF",
    line_width: 2.0,
  });

  const canGeneratePoints = useMemo(() => {
    return !!file && !!preview && !!nameCol && !!latCol && !!lonCol;
  }, [file, preview, nameCol, latCol, lonCol]);

  const canGenerateLinks = useMemo(() => {
    return (
      !!file &&
      !!preview &&
      !!linksMapping.a_lat_col &&
      !!linksMapping.a_lon_col &&
      !!linksMapping.b_lat_col &&
      !!linksMapping.b_lon_col
    );
  }, [file, preview, linksMapping]);

  async function onSelectFile(f: File | null) {
    // Reset UI state
    setError("");
    setPreview(null);
    setActiveTab("points");

    // Reset points mapping
    setNameCol("");
    setLatCol("");
    setLonCol("");
    setDescCols([]);

    // Reset points styling
    setIconUrl("");
    setIconScale(1.0);
    setIconColor("#00AAFF");

    // Reset links mapping
    setLinksMapping({
      a_lat_col: "",
      a_lon_col: "",
      b_lat_col: "",
      b_lon_col: "",
      link_name_col: undefined,
      description_cols: [],
      line_color: "#00AAFF",
      line_width: 2.0,
    });

    setFile(f);
    if (!f) return;

    try {
      setLoadingPreview(true);
      const p = await csvPreview(f, 20);
      setPreview(p);

      // Auto-pick common headers for POINTS
      const lower = p.headers.map((h) => h.toLowerCase());
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

      // (opzionale) auto-pick LINKS se trovi a_lat/a_lon/b_lat/b_lon
      const pickExact = (candidates: string[]) => {
        const idx = lower.findIndex((h) => candidates.includes(h));
        return idx >= 0 ? p.headers[idx] : "";
      };

      setLinksMapping((prev) => ({
        ...prev,
        a_lat_col: pickExact(["a_lat", "lat_a", "from_lat"]) || prev.a_lat_col,
        a_lon_col:
          pickExact(["a_lon", "lon_a", "lng_a", "from_lon", "from_lng"]) ||
          prev.a_lon_col,
        b_lat_col: pickExact(["b_lat", "lat_b", "to_lat"]) || prev.b_lat_col,
        b_lon_col:
          pickExact(["b_lon", "lon_b", "lng_b", "to_lon", "to_lng"]) ||
          prev.b_lon_col,
      }));
    } catch (e: any) {
      setError(e.message ?? "Preview error");
    } finally {
      setLoadingPreview(false);
    }
  }

  async function onGenerate() {
    if (!file) return;
    setError("");

    // Frontend validation (quick)
    if (activeTab === "points") {
      if (iconScale <= 0 || iconScale > 10) {
        setError("icon_scale must be between 0 and 10");
        return;
      }
      if (iconColor && !isValidHexColor(iconColor)) {
        setError("icon_color must be in format #RRGGBB");
        return;
      }
    } else {
      const lw = linksMapping.line_width ?? 2.0;
      if (lw <= 0 || lw > 50) {
        setError("line_width must be between 0 and 50");
        return;
      }
      const lc = linksMapping.line_color ?? "#00AAFF";
      if (lc && !isValidHexColor(lc)) {
        setError("line_color must be in format #RRGGBB");
        return;
      }
    }

    try {
      setLoadingKml(true);

      if (activeTab === "points") {
        const mapping: PointsMapping = {
          name_col: nameCol,
          lat_col: latCol,
          lon_col: lonCol,
          description_cols: descCols,
        };

        const trimmedUrl = iconUrl.trim();
        if (trimmedUrl) mapping.icon_url = trimmedUrl;
        if (iconScale !== 1.0) mapping.icon_scale = iconScale;
        if (iconColor) mapping.icon_color = iconColor;

        const { blob, filename } = await generateKmlPoints(file, mapping);
        downloadBlob(blob, filename);
      } else {
        const mapping: LinksMapping = {
          ...linksMapping,
          description_cols: linksMapping.description_cols ?? [],
          line_color: linksMapping.line_color ?? "#00AAFF",
          line_width: linksMapping.line_width ?? 2.0,
        };

        const { blob, filename } = await generateKmlLinks(file, mapping);
        downloadBlob(blob, filename);
      }
    } catch (e: any) {
      setError(e.message ?? "KML generation error");
    } finally {
      setLoadingKml(false);
    }
  }

  const buttonDisabled =
    loadingKml ||
    (activeTab === "points" ? !canGeneratePoints : !canGenerateLinks);

  const buttonLabel = loadingKml
    ? "Generating..."
    : activeTab === "points"
    ? "Generate Points KML"
    : "Generate Links KML";

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

      {/* Tabs always visible (even before preview is okay, but you need preview to generate) */}
      <Tabs active={activeTab} onChange={setActiveTab} />

      {preview && (
        <>
          <div style={{ marginBottom: 12, color: "#555" }}>
            <b>File:</b> {preview.filename} — <b>Delimiter:</b>{" "}
            {preview.detected_delimiter}
          </div>

          {activeTab === "points" ? (
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
          ) : (
            <LinksMappingForm
              headers={preview.headers}
              mapping={linksMapping}
              onChange={setLinksMapping}
            />
          )}

          <button
            onClick={onGenerate}
            disabled={buttonDisabled}
            style={{ padding: "10px 16px" }}
          >
            {buttonLabel}
          </button>

          <CsvPreviewTable headers={preview.headers} rows={preview.rows} />
        </>
      )}
    </div>
  );
}
