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