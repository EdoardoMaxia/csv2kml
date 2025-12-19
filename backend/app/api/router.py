from fastapi import APIRouter
from app.api.routes import router as health_router
from app.api.csv import router as csv_router
from app.api.kml import router as kml_router
from app.api.kml_links import router as kml_links_router

router = APIRouter()

router.include_router(health_router)
router.include_router(csv_router)
router.include_router(kml_router)
router.include_router(kml_links_router)