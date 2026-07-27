"""
Server-Side Input Validation & Sanitization Schemas
===================================================
Pydantic schemas and string sanitizers for FastAPI endpoints.
"""
import html
import re
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal


def sanitize_string(text: str) -> str:
    """Strip HTML tags and escape special entities."""
    if not text:
        return ""
    # Strip HTML tags
    clean = re.sub(r"<[^>]*>", "", text)
    # HTML entity escape
    clean = html.escape(clean)
    return clean.strip()


class PaginationSchema(BaseModel):
    page: int = Field(default=1, ge=1, description="Page number must be >= 1")
    per_page: int = Field(default=50, ge=1, le=100, description="Items per page must be between 1 and 100")


class SearchQuerySchema(BaseModel):
    query: str = Field(..., min_length=1, max_length=100, description="Search query string")
    n: int = Field(default=20, ge=1, le=100, description="Number of results")

    @field_validator("query")
    @classmethod
    def sanitize_query(cls, v: str) -> str:
        clean = sanitize_string(v)
        if not clean:
            raise ValueError("Invalid search query string")
        return clean


class MovieReviewSchema(BaseModel):
    movie_id: int = Field(..., ge=1, description="Valid Movie ID")
    rating: float = Field(..., ge=1.0, le=5.0, description="Rating score between 1.0 and 5.0")
    review_text: Optional[str] = Field(None, max_length=1000, description="Review text (max 1000 chars)")

    @field_validator("review_text")
    @classmethod
    def sanitize_review(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        return sanitize_string(v)


class RecommendationRequestSchema(BaseModel):
    movie_id: Optional[int] = Field(None, ge=1)
    genre: Optional[str] = Field(None, max_length=50)
    method: Literal["hybrid", "content", "collaborative"] = Field(default="hybrid")
    n: int = Field(default=12, ge=1, le=50)

    @field_validator("genre")
    @classmethod
    def sanitize_genre(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        return sanitize_string(v)
