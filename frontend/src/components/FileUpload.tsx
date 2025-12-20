import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Props = {
  onSelectFile: (f: File | null) => void;
  loading: boolean;
};

export function FileUpload({ onSelectFile, loading }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Upload CSV</CardTitle>
        <CardDescription>
          Select a CSV file to preview and generate KML.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <Input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => onSelectFile(e.target.files?.[0] ?? null)}
          disabled={loading}
        />

        {loading && (
          <div className="text-sm text-muted-foreground">Loading preview…</div>
        )}

        <div className="text-sm text-muted-foreground">
          Tip: include columns for points (name/lat/lon) and/or links (A/B
          lat/lon).
        </div>
      </CardContent>
    </Card>
  );
}
