import json
import xml.etree.ElementTree as ET

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_kml_graph_happy_path_and_dedupe_coords():
    csv_content = (
        "name_a,a_lat,a_lon,name_b,b_lat,b_lon,description\n"
        "A,41.9,12.5,B,40.8,14.3,first\n"
        "A,41.9,12.5,C,47.7,44.5,second\n"
    )

    mapping = {
        "points": {
            "nodes": [
                {"name_col": "name_a", "lat_col": "a_lat", "lon_col": "a_lon"},
                {"name_col": "name_b", "lat_col": "b_lat", "lon_col": "b_lon"},
            ],
            "description_cols": ["description"],
            "icon_color": "#00AAFF",
            "icon_scale": 1.2,
        },
        "links": {
            "a_lat_col": "a_lat",
            "a_lon_col": "a_lon",
            "b_lat_col": "b_lat",
            "b_lon_col": "b_lon",
            "description_cols": ["description"],
            "line_color": "#FF0000",
            "line_width": 3.0,
        },
        "dedupe": {"mode": "coords", "precision": 6},
    }

    files = {"file": ("graph.csv", csv_content, "text/csv")}
    data = {"mapping": json.dumps(mapping)}
    r = client.post("/kml/graph", files=files, data=data)

    assert r.status_code == 200
    body = r.text

    # XML must be valid
    ET.fromstring(body)

    # Must contain folders
    assert "<name>Points</name>" in body
    assert "<name>Links</name>" in body

    # At least 2 links
    assert body.count("<LineString>") == 2

    # Points: coords dedupe keeps A once; total unique coords: A, B, C => 3 points
    assert body.count("<Point>") == 3

    # Styles referenced
    assert '<Style id="pointStyle">' in body
    assert '<Style id="lineStyle">' in body
