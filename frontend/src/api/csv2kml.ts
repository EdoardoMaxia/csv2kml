import type { PointsMapping, Preview, LinksMapping } from "../types/csv2kml";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

function getDetailMessage(fallback: string, resStatus: number, err: any) {
    return err?.detail ?? `${fallback} (${resStatus})`;
}

export async function  csvPreview(file: File, maxRows = 20): Promise<Preview> {
    const fd = new FormData();
    fd.append("file", file)

    const res = await fetch(`${API_BASE_URL}/csv/preview?max_rows=${maxRows}`, {
        method: "POST",
        body: fd,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(getDetailMessage("Preview failed", res.status, err));
    }

    return (await res.json()) as Preview;
}

export async function generateKmlPoints(file: File, mapping: PointsMapping) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("mapping", JSON.stringify(mapping));

    const res = await fetch(`${API_BASE_URL}/kml/points`, {
        method: "POST",
        body: fd,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(getDetailMessage("KML generation failed", res.status, err));
    }

    const blob = await res.blob();
    const contentDisposition = res.headers.get("content-disposition") || "";
    const match = contentDisposition.match(/filename="([^"]+)"/);
    const filename = match?.[1] ?? "points.kml";

    return { blob, filename};
}

export async function generateKmlLinks(file: File, mapping: LinksMapping) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("mapping", JSON.stringify(mapping));

    const res = await fetch(`${API_BASE_URL}/kml/links`, {
        method: "POST",
        body: fd,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(getDetailMessage("KML links generation failed", res.status, err));
    }

    const blob = await res.blob();
    const contentDisposition = res.headers.get("content-disposition") || "";
    const match = contentDisposition.match(/filename="([^"]+)"/);
    const filename = match?.[1] ?? "links.kml";

    return { blob, filename}
}