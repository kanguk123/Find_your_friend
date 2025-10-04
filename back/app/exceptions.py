"""
Custom exceptions and global exception handlers
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from typing import Union
import logging

logger = logging.getLogger(__name__)


# Custom Exceptions
class BaseAPIException(Exception):
    """Base exception for all API errors"""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class NotFoundException(BaseAPIException):
    """Resource not found exception"""
    def __init__(self, resource: str, identifier: Union[int, str]):
        message = f"{resource} with identifier '{identifier}' not found"
        super().__init__(message, status_code=status.HTTP_404_NOT_FOUND)


class AlreadyExistsException(BaseAPIException):
    """Resource already exists exception"""
    def __init__(self, resource: str, identifier: Union[int, str]):
        message = f"{resource} with identifier '{identifier}' already exists"
        super().__init__(message, status_code=status.HTTP_409_CONFLICT)


class InvalidDataException(BaseAPIException):
    """Invalid data exception"""
    def __init__(self, message: str):
        super().__init__(message, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)


class AIServiceException(BaseAPIException):
    """AI service communication exception"""
    def __init__(self, message: str = "AI service is unavailable"):
        super().__init__(message, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)


class DatabaseException(BaseAPIException):
    """Database operation exception"""
    def __init__(self, message: str = "Database operation failed"):
        super().__init__(message, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Exception Handlers
async def base_api_exception_handler(request: Request, exc: BaseAPIException):
    """Handler for custom API exceptions"""
    logger.error(f"API Exception: {exc.message}", extra={
        "path": request.url.path,
        "method": request.method,
        "status_code": exc.status_code
    })

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.message,
            "errors": [{
                "message": exc.message,
                "error_type": exc.__class__.__name__
            }]
        }
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handler for Pydantic validation errors"""
    errors = []
    for error in exc.errors():
        errors.append({
            "field": " -> ".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "error_type": error["type"]
        })

    logger.warning(f"Validation Error: {errors}", extra={
        "path": request.url.path,
        "method": request.method
    })

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": "Validation error occurred",
            "errors": errors
        }
    )


async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """Handler for SQLAlchemy database errors"""
    logger.error(f"Database Error: {str(exc)}", extra={
        "path": request.url.path,
        "method": request.method
    }, exc_info=True)

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "Database operation failed",
            "errors": [{
                "message": "An error occurred while processing the database operation",
                "error_type": "DatabaseError"
            }]
        }
    )


async def general_exception_handler(request: Request, exc: Exception):
    """Handler for unhandled exceptions"""
    logger.error(f"Unhandled Exception: {str(exc)}", extra={
        "path": request.url.path,
        "method": request.method
    }, exc_info=True)

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "An unexpected error occurred",
            "errors": [{
                "message": str(exc) if logger.level == logging.DEBUG else "Internal server error",
                "error_type": "InternalServerError"
            }]
        }
    )
