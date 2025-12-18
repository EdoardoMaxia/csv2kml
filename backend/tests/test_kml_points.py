import json

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_kml_points_happy_path():
    csv_content = "name,lat,lon,site\nA,41.9,12.5,S1\nB,40.8,14.3,S2\n"
    mapping = {
        "name_col": "name",
        "lat_col": "lat",
        "lon_col": "lon",
        "description_cols": ["site"],
    }

    files = {"file": ("point.csv", csv_content, "text/csv")}
    data = {"mapping": json.dumps(mapping)}

    r = client.post("/kml/points", files=files, data=data)
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("application/vnd.google-earth.kml+xml")

    body = r.text
    # Basic assertions
    assert "<kml" in body
    assert "<Placemark>" in body
    assert "A" in body and "B" in body
    # KML coordinates order is lon,lat,0
    assert "<coordinates>12.5,41.9,0</coordinates>" in body
    assert "<coordinates>14.3,40.8,0</coordinates>" in body


def test_kml_points_missing_required_column():
    csv_content = "name,lat\nA,41.9\n"
    mapping = {"name_col": "name", "lat_col": "lat", "lon_col": "lon"}

    files = {"file": ("points.csv", csv_content, "text/csv")}
    data = {"mapping": json.dumps(mapping)}

    r = client.post("/kml/points", files=files, data=data)
    assert r.status_code == 400
    assert "Missing required columns" in r.json()["detail"]


def test_kml_points_with_style():
    csv_content = "name,lat,lon\nA,41.9,12.5\n"
    mapping = {
        "name_col": "name",
        "lat_col": "lat",
        "lon_col": "lon",
        "description_cols": [],
        "icon_url": "https://example.com/icon.png",
        "icon_scale": 1.2,
        "icon_color": "#FF0000",
    }

    files = {"file": ("points.csv", csv_content, "text/csv")}
    data = {"mapping": json.dumps(mapping)}
    r = client.post("/kml/points", files=files, data=data)

    assert r.status_code == 200
    body = r.text
    assert '<Style id="pointStyle">' in body
    assert "<styleUrl>#pointStyle</styleUrl>" in body
    # #FF0000 -> ff0000ff (aa bb gg rr) where bb=00 gg=00 rr=ff
    assert "<color>ff0000ff</color>" in body
    assert "<scale>1.2</scale>" in body
    assert "https://example.com/icon.png" in body


def test_kml_points_invalid_color():
    csv_content = "name,lat,lon\nA,41.9,12.5\n"
    mapping = {"name_col": "name", "lat_col": "lat", "lon_col": "lon", "icon_color": "red"}

    files = {"file": ("points.csv", csv_content, "text/csv")}
    data = {"mapping": json.dumps(mapping)}
    r = client.post("/kml/points", files=files, data=data)

    assert r.status_code == 400
    assert "icon_color must be in format #RRGGBB" in r.json()["detail"]
