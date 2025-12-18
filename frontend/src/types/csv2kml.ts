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
}