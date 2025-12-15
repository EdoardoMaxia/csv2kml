from fastapi import APIRouter
from app.api.routes import router as health_router

router = APIRouter()

router.include_router(health_router)