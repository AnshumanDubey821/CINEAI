"""
Routes: /movies  and  /movie/{id}
"""
from fastapi import APIRouter, HTTPException, Query, Path
from model.recommender import recommender
from schemas.validators import sanitize_string

router = APIRouter(prefix="/movies", tags=["Movies"])


@router.get("/")
def list_movies(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=1000, description="Items per page"),
):
    """
    Paginated list of all movies.

    Example: GET /movies?page=1&per_page=20
    """
    return recommender.get_all_movies(page=page, per_page=per_page)


@router.get("/trending")
def trending_movies(n: int = Query(20, ge=1, le=100)):
    """
    Return the most popular / highly-rated movies using a Bayesian average score.

    Example: GET /movies/trending?n=10
    """
    movies = recommender.get_trending(n=n)
    return {"count": len(movies), "movies": movies}


@router.get("/search")
def search_movies(
    q: str = Query(..., min_length=1, max_length=100, description="Search query"),
    n: int = Query(20, ge=1, le=100),
):
    """
    Search movies by title (case-insensitive substring match).

    Example: GET /movies/search?q=dark+knight
    """
    clean_q = sanitize_string(q)
    if not clean_q:
        raise HTTPException(status_code=400, detail="Invalid search query")

    movies = recommender.search_movies(query=clean_q, n=n)
    return {"query": clean_q, "count": len(movies), "movies": movies}


@router.get("/genres")
def list_genres():
    """Return all unique genres present in the dataset."""
    return {"genres": recommender.get_genres()}


@router.get("/{movie_id}")
def get_movie(movie_id: int = Path(..., ge=1, description="Movie ID")):
    """
    Fetch details for a single movie.

    Example: GET /movies/1
    """
    movie = recommender.get_movie_by_id(movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail=f"Movie {movie_id} not found")
    return movie
