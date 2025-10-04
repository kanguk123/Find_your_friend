"""
Coordinate conversion utilities for 3D visualization
"""
import numpy as np
from typing import Tuple
from app.schemas.planet import Coordinates3D


def ra_dec_to_xyz(ra: float, dec: float, r: float = 1.0) -> Coordinates3D:
    """
    Convert celestial coordinates (RA, Dec, r) to Cartesian coordinates (x, y, z)

    Args:
        ra: Right Ascension in degrees (0-360)
        dec: Declination in degrees (-90 to 90)
        r: Distance/radius for depth visualization

    Returns:
        Coordinates3D object with x, y, z values
    """
    # Convert degrees to radians
    ra_rad = np.radians(ra)
    dec_rad = np.radians(dec)

    # Convert to Cartesian coordinates
    x = r * np.cos(dec_rad) * np.cos(ra_rad)
    y = r * np.cos(dec_rad) * np.sin(ra_rad)
    z = r * np.sin(dec_rad)

    return Coordinates3D(x=float(x), y=float(y), z=float(z))


def xyz_to_ra_dec(x: float, y: float, z: float) -> Tuple[float, float, float]:
    """
    Convert Cartesian coordinates (x, y, z) to celestial coordinates (RA, Dec, r)

    Args:
        x, y, z: Cartesian coordinates

    Returns:
        Tuple of (ra, dec, r) in degrees
    """
    r = np.sqrt(x**2 + y**2 + z**2)
    dec = np.degrees(np.arcsin(z / r)) if r > 0 else 0.0
    ra = np.degrees(np.arctan2(y, x))

    # Normalize RA to 0-360 range
    if ra < 0:
        ra += 360

    return float(ra), float(dec), float(r)


def normalize_coordinates(ra: float, dec: float) -> Tuple[float, float]:
    """
    Normalize RA and Dec values to valid ranges

    Args:
        ra: Right Ascension
        dec: Declination

    Returns:
        Tuple of (normalized_ra, normalized_dec)
    """
    # Normalize RA to 0-360
    ra = ra % 360
    if ra < 0:
        ra += 360

    # Clamp Dec to -90 to 90
    dec = max(-90, min(90, dec))

    return ra, dec


def calculate_angular_distance(ra1: float, dec1: float, ra2: float, dec2: float) -> float:
    """
    Calculate angular distance between two celestial coordinates

    Args:
        ra1, dec1: First coordinate (degrees)
        ra2, dec2: Second coordinate (degrees)

    Returns:
        Angular distance in degrees
    """
    ra1_rad = np.radians(ra1)
    dec1_rad = np.radians(dec1)
    ra2_rad = np.radians(ra2)
    dec2_rad = np.radians(dec2)

    # Haversine formula
    delta_ra = ra2_rad - ra1_rad
    delta_dec = dec2_rad - dec1_rad

    a = np.sin(delta_dec / 2)**2 + np.cos(dec1_rad) * np.cos(dec2_rad) * np.sin(delta_ra / 2)**2
    c = 2 * np.arcsin(np.sqrt(a))

    return float(np.degrees(c))
