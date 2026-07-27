"""
Movie Recommendation System — FastAPI Backend
=============================================
Start with:  uvicorn main:app --reload --port 8000
Docs at:     http://localhost:8000/docs
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Load .env file if present
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    try:
        from dotenv import load_dotenv
        load_dotenv(env_path)
    except ImportError:
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                if "=" in line and not line.startswith("#"):
                    k, v = line.strip().split("=", 1)
                    os.environ[k] = v

from model.recommender import recommender
from routes.movies    import router as movies_router
from routes.recommend import router as recommend_router
from routes.timeofday import router as timeofday_router
from routes.poster    import router as poster_router
from middleware.rate_limiter import RateLimiterMiddleware
from middleware.waf import WAFMiddleware


# ── Lifespan: load ML model once at startup ───────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[+] Loading movie recommendation engine...")
    recommender.load_data()
    print("[+] Engine ready!")
    yield
    print("[+] Shutting down.")


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="🎬 Movie Recommendation API",
    description=(
        "Content-based + Collaborative Filtering recommendation system "
        "built on the MovieLens dataset with WAF, Rate Limiting, and Server-Side Validation."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# Register WAF & Rate Limiter Middlewares
app.add_middleware(WAFMiddleware)
app.add_middleware(RateLimiterMiddleware)

# Allow the React dev server (port 3000) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(movies_router)
app.include_router(recommend_router)
app.include_router(timeofday_router)
app.include_router(poster_router)


# ── Health / Root ─────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "status": "ok",
        "message": "Movie Recommendation API is running 🎬",
        "waf_protection": "enabled (SQLi, XSS, Path Traversal, Bot Protection)",
        "rate_limiting": "enabled (60 req/min)",
        "docs": "/docs",
        "endpoints": ["/movies", "/movies/trending", "/movies/search", "/recommend/by-movie", "/recommend/by-genre", "/poster/fetch"],
    }


@app.get("/health", tags=["Health"])
def health():
    return {
        "status": "healthy",
        "waf_status": "active",
        "model_loaded": recommender._is_loaded,
        "movies_count": len(recommender.movies_df) if recommender.movies_df is not None else 0,
        "rate_limit_per_minute": os.getenv("RATE_LIMIT_PER_MINUTE", 60),
    }
