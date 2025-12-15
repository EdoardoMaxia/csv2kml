# csv2kml

A small web application to convert CSV files into KML, with full control over how CSV columns are mapped to KML points and links.

Designed as a learning playground for software engineering and DevOps best practices, but also useful in real-world GIS / network planning workflows.

---

## Features (planned)

- **CSV → KML points**
  - Upload a CSV file
  - Map CSV columns to:
    - point name
    - latitude
    - longitude
    - description (optional, can be built from multiple columns)
  - Configure point style (icon, color, size)

- **CSV → KML links (LineString)**
  - Define which columns represent:
    - endpoint A (id, latitude, longitude)
    - endpoint B (id, latitude, longitude)
  - Configure line style (color, width, pattern)
  - Optional link metadata (e.g. capacity, status)

- **Reusable configurations**
  - Save a mapping configuration as JSON
  - Load an existing configuration and apply it to a new CSV

---

## Tech Stack

- **Backend**
  - Python
  - FastAPI
  - pydantic for data validation
  - pytest for testing

- **Frontend**
  - React + TypeScript
  - Vite
  - A lightweight UI library (e.g. MUI / Chakra UI)

- **DevOps / Tooling**
  - Docker & docker-compose
  - GitHub Actions for CI (lint + tests + build)
  - (Future) Deployment to a cloud environment (e.g. Azure Web App / Container Apps)

---

## High-level Architecture

- The **frontend** is responsible for:
  - CSV upload and preview (first lines)
  - Letting the user define mapping rules and styles
  - Sending a structured request to the backend to generate KML
  - Handling download of the resulting KML file

- The **backend** is responsible for:
  - Validating the CSV file
  - Translating mapping rules into an internal domain model:
    - `Point`, `Link`, `KmlStyle`, `KmlDocument`, ...
  - Generating KML as XML
  - Optionally storing / loading mapping configurations

Documentation for the architecture and use cases can be found in the [`docs/`](./docs) folder.

---

## Project Goals

This project is also meant as a sandbox to practice:

- Requirements analysis and documentation
- Clean architecture / domain-driven design (on a small scale)
- Good Git practices and branching strategies
- Automated testing and CI
- Containerization and deployment

---

## Roadmap (high level)

- [ ] Initialize backend (FastAPI skeleton)
- [ ] Initialize frontend (React + Vite + TypeScript)
- [ ] CSV upload & preview (frontend)
- [ ] Simple CSV → KML points conversion (backend + frontend)
- [ ] Add styles for points
- [ ] Add links (LineString) generation
- [ ] Add configuration save/load
- [ ] Improve UI/UX and validation
- [ ] Add end-to-end tests
- [ ] Containerization and CI/CD

---

## Getting Started

> ⚠️ Work in progress. Instructions will be updated as the project evolves.


## Backend – Local Development

### Requirements
- Python 3.12+

### Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .\.venv\Scripts\activate
pip install -r requirements.txt

```

## Run backend
```bash
cd backend
uvicorn app.main:app --reload

```

## Run tests
```bash
cd backend
pytest

```