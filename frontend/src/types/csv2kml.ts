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
};


export type LinksMapping = {
    a_lat_col: string;
    a_lon_col: string;
    b_lat_col: string;
    b_lon_col: string;

    link_name_col?: string;
    description_cols: string[];

    line_color?: string; // "#RRGGBB"
    line_width?: number; // default 2.0
};
