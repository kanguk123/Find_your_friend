"""
Unified API response schemas for consistency
"""
from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel


T = TypeVar('T')


class APIResponse(BaseModel, Generic[T]):
    """Unified API response structure"""
    success: bool
    message: str
    data: Optional[T] = None

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Operation completed successfully",
                "data": {}
            }
        }


class ErrorDetail(BaseModel):
    """Error detail structure"""
    field: Optional[str] = None
    message: str
    error_type: Optional[str] = None


class ErrorResponse(BaseModel):
    """Error response structure"""
    success: bool = False
    message: str
    errors: Optional[list[ErrorDetail]] = None

    class Config:
        json_schema_extra = {
            "example": {
                "success": False,
                "message": "Validation error occurred",
                "errors": [
                    {
                        "field": "planet_id",
                        "message": "Planet not found",
                        "error_type": "NotFoundError"
                    }
                ]
            }
        }


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response structure"""
    success: bool
    message: str
    data: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Data retrieved successfully",
                "data": [],
                "total": 500,
                "page": 1,
                "page_size": 50,
                "total_pages": 10
            }
        }
