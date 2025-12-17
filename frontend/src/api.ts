const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

if (!API_BASE_URL) throw new Error("VITE_API_BASE_URL is not set");


export async function csvPreview(file: File, maxRows = 20) {
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch(`${API_BASE_URL}/csv/preview?max_rows=${maxRows}`, {
        method: "POST",
        body: fd,
    });

    if (!res.ok){
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Preview failed (${res.status})`);
    }
    
    return res.json() as Promise<{
        filename: string;
        headers: string[];
        rows: string[][];
        max_rows: number;
        detected_delimiter: string;
    }>;
}


export async function generateKmlPoints(file: File, mapping: unknown) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("mapping", JSON.stringify(mapping));

    const res = await fetch(`${API_BASE_URL}/kml/points`, {
        method: "POST",
        body: fd,
    });


    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `KML generation failed (${res.status})`);
    }

    const blob = await res.blob();
    const contentDisposition = res.headers.get("content-disposition") || "";
    const match = contentDisposition.match(/filename="([^"]+)"/);
    const filename = match?.[1] ?? "points.kml";

    return { blob, filename };
}