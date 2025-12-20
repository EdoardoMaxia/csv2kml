import { useMemo, useState } from "react";
import type {
  LinksMapping,
  PointsMapping,
  Preview,
  DedupeConfig,
  GraphMapping,
} from "./types/csv2kml";
import {
  csvPreview,
  generateKmlLinks,
  generateKmlPoints,
  generateKmlGraph,
} from "./api/csv2kml";
import { downloadBlob } from "./utils/download";
import { FileUpload } from "./components/FileUpload";
import { ErrorBanner } from "./components/ErrorBanner";
import { MappingForm } from "./components/MappingForm";
import { CsvPreviewTable } from "./components/CsvPreviewTable";
import { LinksMappingForm } from "./components/LinksMappingForm";
import { DedupeControls } from "./components/DedupeControls";
import { GraphNodesForm } from "./components/GraphNodesForm";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  const [iconColor, setIconColor] = useState("#00AAFF");

  // UI state
  const [error, setError] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingKml, setLoadingKml] = useState(false);

  // Tabs (single source of truth, used by shadcn Tabs)
  const [activeTab, setActiveTab] = useState<"points" | "links" | "graph">(
    "points"
  );

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

  // Graph nodes
  const [graphNodeA, setGraphNodeA] = useState({
    name_col: "",
    lat_col: "",
    lon_col: "",
  });
  const [graphNodeB, setGraphNodeB] = useState({
    name_col: "",
    lat_col: "",
    lon_col: "",
  });

  // Dedupe
  const [dedupe, setDedupe] = useState<DedupeConfig>({
    mode: "coords",
    precision: 6,
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

  const canGenerateGraph = useMemo(() => {
    const aOk = !!(
      graphNodeA.name_col &&
      graphNodeA.lat_col &&
      graphNodeA.lon_col
    );
    const bOk = !!(
      graphNodeB.name_col &&
      graphNodeB.lat_col &&
      graphNodeB.lon_col
    );
    return !!file && !!preview && aOk && bOk && canGenerateLinks;
  }, [file, preview, graphNodeA, graphNodeB, canGenerateLinks]);

  async function onSelectFile(f: File | null) {
    setError("");
    setPreview(null);
    setActiveTab("points");

    // reset points
    setNameCol("");
    setLatCol("");
    setLonCol("");
    setDescCols([]);
    setIconUrl("");
    setIconScale(1.0);
    setIconColor("#00AAFF");

    // reset links
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

    // reset graph
    setGraphNodeA({ name_col: "", lat_col: "", lon_col: "" });
    setGraphNodeB({ name_col: "", lat_col: "", lon_col: "" });
    setDedupe({ mode: "coords", precision: 6 });

    setFile(f);
    if (!f) return;

    try {
      setLoadingPreview(true);
      const p = await csvPreview(f, 20);
      setPreview(p);

      const lower = p.headers.map((h) => h.toLowerCase());
      const pick = (candidates: string[]) => {
        const idx = lower.findIndex((h) => candidates.includes(h));
        return idx >= 0 ? p.headers[idx] : "";
      };

      // points
      setNameCol(
        pick(["name", "nome", "point", "punto", "node", "nodo"]) ||
          p.headers[0] ||
          ""
      );
      setLatCol(pick(["lat", "latitude", "latitudine"]));
      setLonCol(pick(["lon", "lng", "longitude", "longitudine"]));

      // graph nodes A/B
      setGraphNodeA({
        name_col: pick(["name_a", "a_name", "from_name", "node_a"]),
        lat_col: pick(["a_lat", "lat_a", "from_lat"]),
        lon_col: pick(["a_lon", "lng_a", "lon_a", "from_lon", "from_lng"]),
      });

      setGraphNodeB({
        name_col: pick(["name_b", "b_name", "to_name", "node_b"]),
        lat_col: pick(["b_lat", "lat_b", "to_lat"]),
        lon_col: pick(["b_lon", "lng_b", "lon_b", "to_lon", "to_lng"]),
      });

      // links auto-pick (optional)
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

    const validatePointsStyling = () => {
      if (iconScale <= 0 || iconScale > 10) {
        setError("icon_scale must be between 0 and 10");
        return false;
      }
      if (iconColor && !isValidHexColor(iconColor)) {
        setError("icon_color must be in format #RRGGBB");
        return false;
      }
      return true;
    };

    const validateLinksStyling = () => {
      const lw = linksMapping.line_width ?? 2.0;
      if (lw <= 0 || lw > 50) {
        setError("line_width must be between 0 and 50");
        return false;
      }
      const lc = linksMapping.line_color ?? "#00AAFF";
      if (lc && !isValidHexColor(lc)) {
        setError("line_color must be in format #RRGGBB");
        return false;
      }
      return true;
    };

    const buildPointsMapping = (): PointsMapping => {
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
      return mapping;
    };

    const buildLinksMapping = (): LinksMapping => ({
      ...linksMapping,
      description_cols: linksMapping.description_cols ?? [],
      line_color: linksMapping.line_color ?? "#00AAFF",
      line_width: linksMapping.line_width ?? 2.0,
    });

    // validation by tab
    if (activeTab === "points") {
      if (!validatePointsStyling()) return;
    } else if (activeTab === "links") {
      if (!validateLinksStyling()) return;
    } else {
      if (!validatePointsStyling()) return;
      if (!validateLinksStyling()) return;
      if (
        dedupe.mode === "coords" &&
        (dedupe.precision < 0 || dedupe.precision > 12)
      ) {
        setError("dedupe.precision must be between 0 and 12");
        return;
      }
    }

    try {
      setLoadingKml(true);

      if (activeTab === "points") {
        const { blob, filename } = await generateKmlPoints(
          file,
          buildPointsMapping()
        );
        downloadBlob(blob, filename);
        return;
      }

      if (activeTab === "links") {
        const { blob, filename } = await generateKmlLinks(
          file,
          buildLinksMapping()
        );
        downloadBlob(blob, filename);
        return;
      }

      // graph
      const graphMapping: GraphMapping = {
        points: {
          nodes: [graphNodeA, graphNodeB],
          description_cols: descCols,
          icon_url: iconUrl.trim() || undefined,
          icon_scale: iconScale !== 1.0 ? iconScale : undefined,
          icon_color: iconColor || undefined,
        },
        links: buildLinksMapping(),
        dedupe,
      };

      const { blob, filename } = await generateKmlGraph(file, graphMapping);
      downloadBlob(blob, filename);
    } catch (e: any) {
      setError(e.message ?? "KML generation error");
    } finally {
      setLoadingKml(false);
    }
  }

  const buttonDisabled =
    loadingKml ||
    (activeTab === "points"
      ? !canGeneratePoints
      : activeTab === "links"
      ? !canGenerateLinks
      : !canGenerateGraph);

  const buttonLabel = loadingKml
    ? "Generating..."
    : activeTab === "points"
    ? "Generate Points KML"
    : activeTab === "links"
    ? "Generate Links KML"
    : "Generate Graph KML";

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-2 text-2xl font-semibold">csv2kml</div>
      <div className="mb-6 text-sm text-muted-foreground">
        Upload a CSV → preview → map columns → download KML.
      </div>

      <FileUpload onSelectFile={onSelectFile} loading={loadingPreview} />
      <ErrorBanner message={error} />

      {preview && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">Mapping</CardTitle>
            <CardDescription>
              <span className="font-medium">File:</span> {preview.filename}
              <span className="mx-2">•</span>
              <span className="font-medium">Delimiter:</span>{" "}
              {preview.detected_delimiter}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Tabs
              value={activeTab}
              onValueChange={(v) =>
                setActiveTab(v as "points" | "links" | "graph")
              }
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="points">Points</TabsTrigger>
                <TabsTrigger value="links">Links</TabsTrigger>
                <TabsTrigger value="graph">Graph</TabsTrigger>
              </TabsList>

              <TabsContent value="points" className="mt-4">
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
              </TabsContent>

              <TabsContent value="links" className="mt-4">
                <LinksMappingForm
                  headers={preview.headers}
                  mapping={linksMapping}
                  onChange={setLinksMapping}
                />
              </TabsContent>

              <TabsContent value="graph" className="mt-4 space-y-6">
                <div className="text-sm text-muted-foreground">
                  Configure <span className="font-medium">Point A</span>,{" "}
                  <span className="font-medium">Point B</span> and{" "}
                  <span className="font-medium">Links</span>, then generate a
                  single combined KML.
                </div>

                <GraphNodesForm
                  headers={preview.headers}
                  nodeA={graphNodeA}
                  nodeB={graphNodeB}
                  onChangeNodeA={setGraphNodeA}
                  onChangeNodeB={setGraphNodeB}
                />

                <div className="rounded-lg border p-4">
                  <div className="mb-3 font-medium">
                    Point styling (optional)
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <label className="space-y-1">
                      <div className="text-sm font-medium">Icon URL</div>
                      <input
                        className="h-9 w-full rounded-md border px-3"
                        type="url"
                        placeholder="https://.../icon.png"
                        value={iconUrl}
                        onChange={(e) => setIconUrl(e.target.value)}
                      />
                    </label>

                    <label className="space-y-1">
                      <div className="text-sm font-medium">Scale</div>
                      <input
                        className="h-9 w-full rounded-md border px-3"
                        type="number"
                        min={0.1}
                        max={10}
                        step={0.1}
                        value={iconScale}
                        onChange={(e) => setIconScale(Number(e.target.value))}
                      />
                    </label>

                    <label className="space-y-1">
                      <div className="text-sm font-medium">Color</div>
                      <input
                        className="h-9 w-full rounded-md border px-3"
                        type="color"
                        value={iconColor}
                        onChange={(e) => setIconColor(e.target.value)}
                      />
                    </label>
                  </div>
                </div>

                <LinksMappingForm
                  headers={preview.headers}
                  mapping={linksMapping}
                  onChange={setLinksMapping}
                />
                <DedupeControls value={dedupe} onChange={setDedupe} />
              </TabsContent>
            </Tabs>

            <div className="flex items-center gap-3">
              <Button onClick={onGenerate} disabled={buttonDisabled}>
                {buttonLabel}
              </Button>
              <div className="text-sm text-muted-foreground">
                Output will be downloaded as a{" "}
                <span className="font-medium">.kml</span> file.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {preview && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">Preview</CardTitle>
            <CardDescription>First rows from the uploaded CSV.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <CsvPreviewTable headers={preview.headers} rows={preview.rows} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
