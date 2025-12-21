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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { googleEarthIcons } from "./constants/icons";

// opzionale: se usi lucide-react già presente in shadcn stack
import {
  Upload,
  Table,
  MapPin,
  Share2,
  Network,
  Download,
  Sparkles,
  Info,
} from "lucide-react";

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

  // Tabs
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

  const activeMeta = useMemo(() => {
    if (!preview) return null;
    if (activeTab === "points") {
      return {
        title: "Points",
        icon: <MapPin className="h-4 w-4" />,
        ready: canGeneratePoints,
        hint: "Name + Lat + Lon are required.",
      };
    }
    if (activeTab === "links") {
      return {
        title: "Links",
        icon: <Share2 className="h-4 w-4" />,
        ready: canGenerateLinks,
        hint: "Both endpoints A/B must have Lat/Lon.",
      };
    }
    return {
      title: "Graph",
      icon: <Network className="h-4 w-4" />,
      ready: canGenerateGraph,
      hint: "Requires Nodes A/B + Links mapping.",
    };
  }, [
    activeTab,
    preview,
    canGeneratePoints,
    canGenerateLinks,
    canGenerateGraph,
  ]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-amber-50/40 text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-12 top-12 h-72 w-72 rounded-full bg-cyan-200/50 blur-3xl" />
        <div className="absolute bottom-[-140px] right-[-60px] h-96 w-96 rounded-full bg-amber-200/50 blur-[140px]" />
      </div>

      <div className="relative">
        {/* top app bar */}
        <div className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white shadow-lg ring-1 ring-slate-100">
                <Sparkles className="h-5 w-5 text-cyan-600" />
              </div>
              <div className="leading-tight">
                <div className="text-xs uppercase tracking-[0.28em] text-slate-500">
                  csv to kml
                </div>
                <div className="text-lg font-semibold tracking-tight text-slate-900">
                  Spatial toolkit
                </div>
              </div>
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <Badge
                variant="secondary"
                className="gap-1 border border-slate-200 bg-white text-slate-700"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload
              </Badge>
              <Badge
                variant="secondary"
                className="gap-1 border border-slate-200 bg-white text-slate-700"
              >
                <Table className="h-3.5 w-3.5" />
                Preview
              </Badge>
              <Badge
                variant="secondary"
                className="gap-1 border border-slate-200 bg-white text-slate-700"
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </Badge>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
          {/* hero */}
          <Card className="rounded-3xl border-none bg-white/80 shadow-xl ring-1 ring-slate-100">
            <CardHeader className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                Guided workflow
              </div>
              <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                Convert your CSV into a styled KML in minutes
              </CardTitle>
              <CardDescription className="max-w-3xl text-slate-600">
                Upload a CSV, map columns once, and export KML for Google Earth
                or any GIS workflow. A calmer layout with clear steps and muted
                cards keeps everything readable.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="text-sm font-medium">1) Upload CSV</div>
                  <FileUpload
                    onSelectFile={onSelectFile}
                    loading={loadingPreview}
                  />
                  {error ? (
                    <ErrorBanner message={error} />
                  ) : (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Tip</AlertTitle>
                      <AlertDescription>
                        Headers are auto-detected. You can still override
                        mappings in the next step.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-medium">2) Status</div>
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm ring-1 ring-slate-100">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">
                          File
                        </div>
                        <div className="font-medium">
                          {preview?.filename ?? "No file selected"}
                        </div>
                        <div className="text-sm text-slate-600 font-mono">
                          {preview
                            ? `Delimiter: ${preview.detected_delimiter} | Headers: ${preview.headers.length}`
                            : "Upload a CSV to start."}
                        </div>
                      </div>

                      {preview ? (
                        <Badge className="gap-1" variant="secondary">
                          Ready
                        </Badge>
                      ) : (
                        <Badge className="gap-1" variant="outline">
                          Waiting
                        </Badge>
                      )}
                    </div>

                    <Separator className="my-4" />

                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Points mapping
                        </span>
                        <span
                          className={
                            canGeneratePoints
                              ? "font-medium"
                              : "text-muted-foreground"
                          }
                        >
                          {canGeneratePoints ? "OK" : "Missing fields"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Links mapping
                        </span>
                        <span
                          className={
                            canGenerateLinks
                              ? "font-medium"
                              : "text-muted-foreground"
                          }
                        >
                          {canGenerateLinks ? "OK" : "Missing fields"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Graph mapping
                        </span>
                        <span
                          className={
                            canGenerateGraph
                              ? "font-medium"
                              : "text-muted-foreground"
                          }
                        >
                          {canGenerateGraph ? "OK" : "Missing fields"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* workspace */}
          {preview && (
            <div className="grid gap-6 lg:grid-cols-[minmax(520px,1fr)_550px]">
              {/* left: mapping */}
              <Card className="rounded-3xl border-none bg-white/80 shadow-xl ring-1 ring-slate-100">
                <CardHeader className="space-y-2">
                  <CardTitle className="text-lg font-semibold text-slate-900">
                    Mapping workspace
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Choose your target (Points / Links / Graph), map columns,
                    then export.
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
                    <TabsList className="grid w-full grid-cols-3 rounded-xl bg-slate-100 p-1">
                      <TabsTrigger
                        value="points"
                        className="rounded-lg data-[state=active]:bg-background"
                      >
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="h-4 w-4" /> Points
                        </span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="links"
                        className="rounded-lg data-[state=active]:bg-background"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Share2 className="h-4 w-4" /> Links
                        </span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="graph"
                        className="rounded-lg data-[state=active]:bg-background"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Network className="h-4 w-4" /> Graph
                        </span>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="points" className="mt-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">Points</div>
                        <Badge
                          variant={canGeneratePoints ? "secondary" : "outline"}
                        >
                          {canGeneratePoints ? "Ready" : "Needs mapping"}
                        </Badge>
                      </div>

                      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm ring-1 ring-slate-100">
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
                      </div>
                    </TabsContent>

                    <TabsContent value="links" className="mt-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">Links</div>
                        <Badge
                          variant={canGenerateLinks ? "secondary" : "outline"}
                        >
                          {canGenerateLinks ? "Ready" : "Needs mapping"}
                        </Badge>
                      </div>

                      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 shadow-inner">
                        <LinksMappingForm
                          headers={preview.headers}
                          mapping={linksMapping}
                          onChange={setLinksMapping}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="graph" className="mt-5 space-y-6">
                      <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 text-sm text-muted-foreground">
                        Configure <span className="font-medium">Node A</span>,{" "}
                        <span className="font-medium">Node B</span>, and{" "}
                        <span className="font-medium">Links</span>, then export
                        a single combined KML.
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold">Nodes</div>
                          <Badge
                            variant={canGenerateGraph ? "secondary" : "outline"}
                          >
                            {canGenerateGraph ? "Ready" : "Incomplete"}
                          </Badge>
                        </div>
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm ring-1 ring-slate-100">
                          <GraphNodesForm
                            headers={preview.headers}
                            nodeA={graphNodeA}
                            nodeB={graphNodeB}
                            onChangeNodeA={setGraphNodeA}
                            onChangeNodeB={setGraphNodeB}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="text-sm font-semibold">Links</div>
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm ring-1 ring-slate-100">
                          <LinksMappingForm
                            headers={preview.headers}
                            mapping={linksMapping}
                            onChange={setLinksMapping}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="text-sm font-semibold">Dedupe</div>
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm ring-1 ring-slate-100">
                          <DedupeControls value={dedupe} onChange={setDedupe} />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="text-sm font-semibold">
                          Point styling (Graph)
                        </div>
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm ring-1 ring-slate-100 space-y-3">
                          <div className="space-y-2">
                            <div className="text-xs uppercase tracking-wide text-slate-500">
                              Google Earth icon
                            </div>
                            <div className="grid gap-2 sm:grid-cols-3">
                              {googleEarthIcons.map((p) => (
                                <button
                                  type="button"
                                  key={p.url}
                                  onClick={() => setIconUrl(p.url)}
                                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition hover:border-cyan-400 hover:ring-2 hover:ring-cyan-100 ${
                                    iconUrl === p.url
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
                                  <span className="text-slate-800">
                                    {p.label}
                                  </span>
                                </button>
                              ))}
                            </div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Custom URL
                              <Input
                                placeholder="https://example.com/icon.png"
                                value={iconUrl}
                                onChange={(e) => setIconUrl(e.target.value)}
                                className="mt-1"
                              />
                            </label>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                              <div className="text-xs uppercase tracking-wide text-slate-500">
                                Icon scale (0.1–10)
                              </div>
                              <Input
                                type="number"
                                min={0.1}
                                max={10}
                                step={0.1}
                                value={iconScale}
                                onChange={(e) =>
                                  setIconScale(Number(e.target.value))
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs uppercase tracking-wide text-slate-500">
                                Icon color
                              </div>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="color"
                                  className="h-10 w-16 p-1"
                                  value={iconColor}
                                  onChange={(e) => setIconColor(e.target.value)}
                                />
                                <div className="text-xs text-slate-600">
                                  {iconColor}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="text-xs text-slate-500">
                            Graph exports reuse these point settings so nodes
                            and links stay consistent.
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* sticky action bar */}
                  <div className="sticky bottom-4 z-10 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-lg backdrop-blur">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          {activeMeta?.icon}
                          {activeMeta?.title} export
                          <Badge
                            variant={
                              activeMeta?.ready ? "secondary" : "outline"
                            }
                            className="ml-1"
                          >
                            {activeMeta?.ready ? "Ready" : "Not ready"}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {activeMeta?.hint} Output will download as{" "}
                          <span className="font-medium">.kml</span>.
                        </div>
                      </div>

                      <Button
                        onClick={onGenerate}
                        disabled={buttonDisabled}
                        className="gap-2 px-6"
                      >
                        <Download className="h-4 w-4" />
                        {buttonLabel}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* right: preview table */}
              <Card className="rounded-3xl border-none bg-white/80 shadow-xl ring-1 ring-slate-100">
                <CardHeader className="space-y-2">
                  <CardTitle className="text-lg font-semibold text-slate-900">
                    Data preview
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    First rows from the uploaded CSV.
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="rounded-2xl border border-slate-200/80 bg-white/80">
                    <ScrollArea className="h-[520px] w-full">
                      <div className="min-w-[1400px] p-3">
                        <div className="overflow-x-auto rounded-xl shadow-sm ring-1 ring-slate-100">
                          <CsvPreviewTable
                            headers={preview.headers}
                            rows={preview.rows}
                          />
                        </div>
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>

                  <div className="mt-3 text-xs text-muted-foreground">
                    Tip: if your CSV is wide, scroll horizontally inside the
                    table.
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
