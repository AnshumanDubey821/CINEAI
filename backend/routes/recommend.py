"""
Routes: /recommend
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from model.recommender import recommender

router = APIRouter(prefix="/recommend", tags=["Recommendations"])


# ── Request / Response schemas ────────────────────────────────────────────────

class RecommendByMovieRequest(BaseModel):
    movie_id: int = Field(..., description="MovieLens movieId to base recommendations on")
    n: int = Field(10, ge=1, le=50, description="Number of recommendations")
    method: str = Field(
        "hybrid",
        description="Filtering method: 'content' | 'collaborative' | 'hybrid'",
    )


class RecommendByGenreRequest(BaseModel):
    genre: str = Field(..., description="Genre name, e.g. 'Action'")
    n: int = Field(10, ge=1, le=200)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/by-movie")
def recommend_by_movie(req: RecommendByMovieRequest):
    """
    Recommend movies similar to a given movie.

    **Methods:**
    - `content`      → TF-IDF cosine similarity on genres + title
    - `collaborative`→ Item-item similarity from user rating patterns
    - `hybrid`       → Interleaved blend of both (default)

    **Example request:**
    ```json
    { "movie_id": 1, "n": 8, "method": "hybrid" }
    ```
    """
    if req.method not in ("content", "collaborative", "hybrid"):
        raise HTTPException(
            status_code=400,
            detail="method must be one of: content, collaborative, hybrid",
        )

    seed_movie = recommender.get_movie_by_id(req.movie_id)
    if not seed_movie:
        raise HTTPException(status_code=404, detail=f"Movie {req.movie_id} not found")

    recs = recommender.recommend_by_movie(
        movie_id=req.movie_id,
        n=req.n,
        method=req.method,
    )
    return {
        "seed_movie": seed_movie,
        "method": req.method,
        "count": len(recs),
        "recommendations": recs,
    }


@router.post("/by-genre")
def recommend_by_genre(req: RecommendByGenreRequest):
    """
    Recommend top-rated movies for a given genre.

    **Example request:**
    ```json
    { "genre": "Sci-Fi", "n": 10 }
    ```
    """
    recs = recommender.recommend_by_genre(genre=req.genre, n=req.n)
    return {
        "genre": req.genre,
        "count": len(recs),
        "recommendations": recs,
    }


@router.get("/by-genre")
def recommend_by_genre_get(
    genre: str = Query(..., description="Genre name, e.g. 'Action'"),
    n: int = Query(100, ge=1, le=200),
):
    """
    GET version of recommend_by_genre for easy browser/frontend use.

    Example: GET /recommend/by-genre?genre=Action&n=50
    """
    recs = recommender.recommend_by_genre(genre=genre, n=n)
    return {
        "genre": genre,
        "count": len(recs),
        "recommendations": recs,
    }


@router.get("/similar/{movie_id}")
def similar_movies_get(
    movie_id: int,
    n: int = Query(10, ge=1, le=50),
    method: str = Query("hybrid"),
):
    """
    GET-friendly version of recommend_by_movie (for browser testing).

    Example: GET /recommend/similar/1?n=8&method=content
    """
    seed_movie = recommender.get_movie_by_id(movie_id)
    if not seed_movie:
        raise HTTPException(status_code=404, detail=f"Movie {movie_id} not found")

    recs = recommender.recommend_by_movie(movie_id=movie_id, n=n, method=method)
    return {
        "seed_movie": seed_movie,
        "method": method,
        "count": len(recs),
        "recommendations": recs,
    }
