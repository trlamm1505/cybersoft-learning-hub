"""Main application entry point for Task 30 Final Handover & Defense Service."""

from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse

from src.config import API_TITLE, API_VERSION, API_DESCRIPTION, CORS_ORIGINS
from src.routes.health import router as health_router
from src.routes.handover import router as handover_router

app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description=API_DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health_router)
app.include_router(handover_router)

# Mount Static Portal
PORTAL_DIR = Path(__file__).resolve().parent.parent / "portal"
if PORTAL_DIR.exists():
    app.mount("/portal", StaticFiles(directory=str(PORTAL_DIR), html=True), name="portal")


@app.get("/")
def root():
    return RedirectResponse(url="/portal/")
