"""
FastAPI main application
Exoplanet Discovery API - NASA Hackathon
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
import logging

from app.config import settings
from app.database import init_db, get_db
from app.exceptions import (
    BaseAPIException,
    base_api_exception_handler,
    validation_exception_handler,
    sqlalchemy_exception_handler,
    general_exception_handler
)
from app.routers import planets, predict, model, upload, reward
from app.utils.dummy_data import initialize_dummy_data

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    # Exoplanet Discovery API

    A comprehensive API for exoplanet discovery and classification using AI/ML models.

    ## Features

    ### 🌍 Planet Management
    - Browse and search exoplanet candidates
    - Filter by probability, status, and coordinates
    - 3D visualization support (RA, Dec, r → x, y, z)

    ### 🤖 AI Predictions
    - Researcher mode: Detailed analysis with feature contributions
    - Beginner mode: Simple probability and confidence
    - Batch predictions for multiple planets

    ### 🔧 Model Management
    - Train new models with custom hyperparameters
    - Retrain from existing models
    - Track model versions and metrics
    - Feature importance and correlation analysis

    ### 📊 Data Upload
    - CSV dataset upload and preprocessing
    - Automatic data cleaning and standardization
    - Optional model retraining with new data

    ### 🎁 Reward System
    - Point tracking for discoveries
    - 3-tier upgrade system
    - Integration with gamified frontend

    ## Current Mode

    **Using dummy data for development** - Real AI model integration pending
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    debug=settings.DEBUG
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
app.add_exception_handler(BaseAPIException, base_api_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Include routers
app.include_router(planets.router)
app.include_router(predict.router)
app.include_router(model.router)
app.include_router(upload.router)
app.include_router(reward.router)


@app.on_event("startup")
async def startup_event():
    """Initialize database and load dummy data on startup"""
    logger.info("Starting up Exoplanet Discovery API...")

    # Create tables
    init_db()
    logger.info("Database tables created")

    # Initialize dummy data if enabled
    if settings.USE_DUMMY_DATA:
        db = next(get_db())
        try:
            result = initialize_dummy_data(db, force=False)
            logger.info(f"Dummy data initialization: {result}")
        finally:
            db.close()

    logger.info("Startup complete!")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Exoplanet Discovery API...")


@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "mode": "dummy_data" if settings.USE_DUMMY_DATA else "production",
        "docs": "/docs",
        "endpoints": {
            "planets": "/planets",
            "predictions": "/predict",
            "models": "/model",
            "upload": "/upload",
            "rewards": "/reward"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
