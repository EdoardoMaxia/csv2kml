export type Preview = {
    filename: string;
    headers: string[];
    rows: string[][]
    max_rows: number;
    detected_delimiter: string;
};


export type PointsMapping = {
    name_col: string;
    lat_col: string;
    lon_col: string;
    description_cols: string[];

    icon_url?: string;
    icon_scale?: number; // default 1.0 if omitted
    icon_color?: string; // "#RRGGBB"
}