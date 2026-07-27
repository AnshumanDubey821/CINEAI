"""
routes/timeofday.py
====================
Time-of-Day Movie Recommendations
----------------------------------
Maps the current hour (or a user-supplied time_slot) to genre profiles and
mood descriptors, then returns top-N movies weighted by both genre fit and
popularity score.

Time slots and their genre/mood logic:
  morning   (05-11)  → Light, uplifting, inspiring  (Animation, Comedy, Biography, Family, Music)
  afternoon (12-16)  → Engaging, adventurous, social (Action, Adventure, Thriller, Sci-Fi, Sport)
  evening   (17-21)  → Rich, dramatic, thought-provoking (Drama, Crime, Mystery, Romance, History)
  night     (22-04)  → Intense, atmospheric, dark   (Horror, Thriller, Mystery, Film-Noir, Fantasy)
"""

from fastapi import APIRouter, Query, HTTPException
from datetime import datetime, timezone
from typing import Optional
from model.recommender import recommender

router = APIRouter(prefix="/recommend/time", tags=["Time-Based Recommendations"])

# ── Slot definitions ──────────────────────────────────────────────────────────
TIME_SLOTS = {
    "morning": {
        "hours":        range(5, 12),
        "label":        "Good Morning ☀️",
        "tagline":      "Start your day with something uplifting",
        "mood":         "Uplifting & Inspiring",
        "description":  "Light-hearted films to energise your morning — think laughter, wonder, and feel-good stories.",
        "primary_genres":   ["Animation", "Comedy", "Family", "Music"],
        "secondary_genres": ["Biography", "Adventure", "Musical"],
        "emoji":        "🌅",
        "palette":      "morning",   # used by frontend for theming
        "weights": {
            "Animation": 1.6, "Comedy": 1.5, "Family": 1.4,
            "Music": 1.3, "Musical": 1.3, "Biography": 1.2, "Adventure": 1.1,
        },
    },
    "afternoon": {
        "hours":        range(12, 17),
        "label":        "Good Afternoon 🌤️",
        "tagline":      "Perfect films for a wide-awake afternoon",
        "mood":         "Action-Packed & Adventurous",
        "description":  "High-energy picks to keep your afternoon exciting — blockbusters, thrillers, and epic adventures.",
        "primary_genres":   ["Action", "Adventure", "Sci-Fi", "Sport"],
        "secondary_genres": ["Thriller", "Comedy", "Fantasy"],
        "emoji":        "☀️",
        "palette":      "afternoon",
        "weights": {
            "Action": 1.6, "Adventure": 1.5, "Sci-Fi": 1.4,
            "Sport": 1.3, "Thriller": 1.2, "Comedy": 1.1, "Fantasy": 1.1,
        },
    },
    "evening": {
        "hours":        range(17, 22),
        "label":        "Good Evening 🌆",
        "tagline":      "Settle in for something rich and rewarding",
        "mood":         "Dramatic & Thought-Provoking",
        "description":  "Deep, compelling storytelling for your evening wind-down — dramas, romance, and cinematic masterpieces.",
        "primary_genres":   ["Drama", "Crime", "Romance", "History"],
        "secondary_genres": ["Mystery", "Biography", "War"],
        "emoji":        "🌆",
        "palette":      "evening",
        "weights": {
            "Drama": 1.6, "Crime": 1.4, "Romance": 1.4,
            "History": 1.3, "Mystery": 1.2, "Biography": 1.2, "War": 1.1,
        },
    },
    "night": {
        "hours":        None,          # catch-all for 22-23 and 0-4
        "label":        "Good Night 🌙",
        "tagline":      "Late-night cinema for the night owl in you",
        "mood":         "Intense & Atmospheric",
        "description":  "Dark, gripping films for those who stay up late — psychological thrillers, horror, and noir.",
        "primary_genres":   ["Horror", "Thriller", "Mystery", "Fantasy"],
        "secondary_genres": ["Crime", "Sci-Fi", "Drama"],
        "emoji":        "🌙",
        "palette":      "night",
        "weights": {
            "Horror": 1.6, "Thriller": 1.5, "Mystery": 1.4,
            "Fantasy": 1.3, "Crime": 1.2, "Sci-Fi": 1.1, "Drama": 1.0,
        },
    },
}


def hour_to_slot(hour: int) -> str:
    """Map an hour (0-23) to a slot name."""
    for slot, cfg in TIME_SLOTS.items():
        if cfg["hours"] is not None and hour in cfg["hours"]:
            return slot
    return "night"   # 22-04 default


def get_slot_recommendations(slot: str, n: int) -> list:
    """
    Score every movie by combining:
      - Genre weight   (how well the movie fits the slot)
      - Popularity     (Bayesian average score)
    Returns top-n sorted by composite score.
    """
    cfg = TIME_SLOTS[slot]
    weights = cfg["weights"]
    all_movies = recommender.movies_df.copy()

    def score(row):
        genres = row["genres"].split("|")
        genre_score = max(
            (weights.get(g, 0.0) for g in genres),
            default=0.0,
        )
        pop = float(row["popularity_score"])
        # Blend: 60% genre fit, 40% popularity
        return genre_score * 0.6 + pop * 0.4

    all_movies["time_score"] = all_movies.apply(score, axis=1)
    # Only include movies that match at least one weighted genre
    eligible = all_movies[all_movies["time_score"] > 0].copy()
    top = eligible.sort_values("time_score", ascending=False).head(n)
    return recommender._rows_to_dicts(top)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/now")
def recommend_now(n: int = Query(12, ge=1, le=50)):
    """
    Auto-detect current server time and return slot + recommendations.

    Example: GET /recommend/time/now?n=12
    """
    hour = datetime.now().hour
    slot = hour_to_slot(hour)
    cfg  = TIME_SLOTS[slot]
    recs = get_slot_recommendations(slot, n)

    return {
        "current_hour":  hour,
        "slot":          slot,
        "label":         cfg["label"],
        "tagline":       cfg["tagline"],
        "mood":          cfg["mood"],
        "description":   cfg["description"],
        "emoji":         cfg["emoji"],
        "palette":       cfg["palette"],
        "primary_genres": cfg["primary_genres"],
        "count":         len(recs),
        "recommendations": recs,
    }


@router.get("/slot/{slot_name}")
def recommend_by_slot(
    slot_name: str,
    n: int = Query(12, ge=1, le=50),
):
    """
    Get recommendations for a specific time slot regardless of current time.
    slot_name must be one of: morning, afternoon, evening, night

    Example: GET /recommend/time/slot/morning?n=10
    """
    slot_name = slot_name.lower()
    if slot_name not in TIME_SLOTS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid slot '{slot_name}'. Choose from: morning, afternoon, evening, night",
        )

    cfg  = TIME_SLOTS[slot_name]
    recs = get_slot_recommendations(slot_name, n)

    return {
        "slot":          slot_name,
        "label":         cfg["label"],
        "tagline":       cfg["tagline"],
        "mood":          cfg["mood"],
        "description":   cfg["description"],
        "emoji":         cfg["emoji"],
        "palette":       cfg["palette"],
        "primary_genres": cfg["primary_genres"],
        "count":         len(recs),
        "recommendations": recs,
    }


@router.get("/all")
def all_slot_previews(n: int = Query(6, ge=1, le=20)):
    """
    Return a preview of recommendations for all four slots at once.
    Useful for the frontend homepage widget.

    Example: GET /recommend/time/all?n=6
    """
    result = {}
    current_hour = datetime.now().hour
    current_slot = hour_to_slot(current_hour)

    for slot, cfg in TIME_SLOTS.items():
        recs = get_slot_recommendations(slot, n)
        result[slot] = {
            "slot":          slot,
            "label":         cfg["label"],
            "tagline":       cfg["tagline"],
            "mood":          cfg["mood"],
            "description":   cfg["description"],
            "emoji":         cfg["emoji"],
            "palette":       cfg["palette"],
            "primary_genres": cfg["primary_genres"],
            "is_current":    slot == current_slot,
            "count":         len(recs),
            "recommendations": recs,
        }

    return {
        "current_hour": current_hour,
        "current_slot": current_slot,
        "slots": result,
    }
