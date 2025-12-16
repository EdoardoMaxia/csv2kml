from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_csv_preview_returns_headers_and_rows():
    csv_content = "name,lat,lon\nA,41.9,12.5\nB,40.8,14.3\n"
    files = {"file": ("points.csv", csv_content, "text/csv")}

    r = client.post("/csv/preview?max_rows=10", files=files)
    assert r.status_code == 200

    data = r.json()
    assert data["headers"] == ["name", "lat", "lon"]
    assert data["rows"] == [["A", "41.9", "12.5"], ["B", "40.8", "14.3"]]
    assert data["detected_delimiter"] in [",", ";"]  # depends on sniff, but usually ","


def test_csv_preview_rejects_non_csv_extension():
    files = {"file": ("points.txt", "a,b\n1,2\n", "text/plain")}
    r = client.post("/csv/preview", files=files)
    assert r.status_code == 400
