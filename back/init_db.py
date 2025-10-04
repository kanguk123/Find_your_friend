"""
Database initialization script
Run this to create tables and populate with dummy data
"""
from app.database import init_db, get_db
from app.utils.dummy_data import initialize_dummy_data
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    logger.info("Creating database tables...")
    init_db()
    logger.info("✓ Tables created")

    logger.info("Initializing dummy data...")
    db = next(get_db())
    try:
        result = initialize_dummy_data(db, force=True)
        logger.info(f"✓ Dummy data initialized: {result}")
    finally:
        db.close()

    logger.info("✓ Database initialization complete!")
    logger.info("You can now run the server with: python run.py")
