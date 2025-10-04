"""
Seed database with real NASA exoplanet data from CSV
"""
import os
import sys
import pandas as pd
import numpy as np
import random
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, get_db
from app.models.planet import Planet
from app.schemas.planet import PlanetStatus


def load_csv_data(csv_path: str) -> pd.DataFrame:
    """
    Load and validate CSV data

    Args:
        csv_path: Path to the CSV file

    Returns:
        Loaded DataFrame
    """
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CSV file not found: {csv_path}")

    print(f"[INFO] Loading CSV from {csv_path}...")
    df = pd.read_csv(csv_path)

    print(f"[INFO] Loaded {len(df)} rows, {len(df.columns)} columns")

    # Validate required columns
    required_cols = ["rowid", "disposition", "ra", "dec"]
    missing_cols = [col for col in required_cols if col not in df.columns]

    if missing_cols:
        raise ValueError(f"Missing required columns: {missing_cols}")

    return df


def normalize_disposition(disposition: str) -> PlanetStatus:
    """
    Normalize disposition string to PlanetStatus enum

    Args:
        disposition: Raw disposition string

    Returns:
        PlanetStatus enum value
    """
    disposition = str(disposition).strip().upper()

    if disposition == "CONFIRMED":
        return PlanetStatus.CONFIRMED
    elif disposition == "FALSE POSITIVE":
        return PlanetStatus.FALSE_POSITIVE
    elif disposition == "CANDIDATE":
        return PlanetStatus.CANDIDATE
    else:
        raise ValueError(f"Unknown disposition: {disposition}")


def extract_features(row: pd.Series) -> dict:
    """
    Extract numeric features from a row, excluding metadata columns

    Args:
        row: DataFrame row

    Returns:
        Dictionary of feature name -> value
    """
    # Columns to exclude from features
    exclude_cols = ["rowid", "disposition", "ra", "dec"]

    # Extract only numeric columns (excluding metadata)
    features = {}
    for col in row.index:
        if col not in exclude_cols:
            value = row[col]

            # Only include numeric values
            if pd.api.types.is_numeric_dtype(type(value)):
                # Handle NaN values
                if pd.isna(value):
                    features[col] = None
                else:
                    features[col] = float(value)

    return features


def seed_planets(csv_path: str, batch_size: int = 500):
    """
    Seed planets table with data from CSV

    Args:
        csv_path: Path to the CSV file
        batch_size: Number of rows to insert per batch
    """
    # Load CSV
    df = load_csv_data(csv_path)

    # Normalize disposition column
    print("[INFO] Normalizing disposition values...")
    df["disposition"] = df["disposition"].astype(str).str.strip().str.upper()

    # Create database tables
    print("[INFO] Creating database tables...")
    Base.metadata.create_all(bind=engine)

    # Get database session
    db = next(get_db())

    try:
        total_rows = len(df)
        inserted_count = 0
        skipped_count = 0
        error_count = 0

        print(f"[INFO] Inserting {total_rows} planets into database...")

        for idx, row in df.iterrows():
            try:
                # Extract data
                rowid = int(row["rowid"])
                disposition = normalize_disposition(row["disposition"])
                ra = float(row["ra"])
                dec = float(row["dec"])
                features = extract_features(row)

                # Generate random r value for 3D visualization (0.5 to 2.0)
                r = random.uniform(0.5, 2.0)

                # Create Planet object
                planet = Planet(
                    rowid=rowid,
                    ra=ra,
                    dec=dec,
                    r=r,
                    disposition=disposition,
                    features=features
                )

                db.add(planet)

                # Commit in batches
                if (idx + 1) % batch_size == 0:
                    db.commit()
                    inserted_count += batch_size
                    print(f"[PROGRESS] Inserted {inserted_count}/{total_rows} planets ({inserted_count/total_rows*100:.1f}%)")

            except IntegrityError as e:
                db.rollback()
                skipped_count += 1
                print(f"[WARNING] Skipping duplicate rowid={row.get('rowid', 'N/A')}")

            except Exception as e:
                db.rollback()
                error_count += 1
                print(f"[ERROR] Failed to insert row {idx}: {str(e)}")

        # Final commit
        db.commit()
        inserted_count = total_rows - skipped_count - error_count

        print("\n" + "=" * 60)
        print(f"[SUCCESS] Database seeding completed!")
        print(f"  Total rows:     {total_rows}")
        print(f"  Inserted:       {inserted_count}")
        print(f"  Skipped:        {skipped_count}")
        print(f"  Errors:         {error_count}")
        print("=" * 60)

        # Show sample data
        print("\n[INFO] Sample planets:")
        sample_planets = db.query(Planet).limit(5).all()
        for planet in sample_planets:
            print(f"  - Planet(id={planet.id}, rowid={planet.rowid}, disposition={planet.disposition}, ra={planet.ra:.2f}, dec={planet.dec:.2f})")

        # Show statistics by disposition
        print("\n[INFO] Distribution by disposition:")
        for status in [PlanetStatus.CONFIRMED, PlanetStatus.FALSE_POSITIVE, PlanetStatus.CANDIDATE]:
            count = db.query(Planet).filter(Planet.disposition == status).count()
            print(f"  - {status.value}: {count}")

    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] Fatal error during seeding: {str(e)}")
        raise

    finally:
        db.close()


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description="Seed database with NASA exoplanet data")
    parser.add_argument(
        "--csv",
        type=str,
        default="../ai/all_test_validation.csv",
        help="Path to CSV file (default: ../ai/all_test_validation.csv)"
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=500,
        help="Batch size for inserts (default: 500)"
    )

    args = parser.parse_args()

    # Resolve CSV path
    csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), args.csv))

    if not os.path.exists(csv_path):
        print(f"[ERROR] CSV file not found: {csv_path}")
        print(f"[INFO] Please ensure the CSV file exists or specify the correct path with --csv")
        sys.exit(1)

    print("=" * 60)
    print("NASA Exoplanet Database Seeder")
    print("=" * 60)
    print(f"CSV File: {csv_path}")
    print(f"Batch Size: {args.batch_size}")
    print("=" * 60 + "\n")

    # Seed database
    seed_planets(csv_path, args.batch_size)


if __name__ == "__main__":
    main()
