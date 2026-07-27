"""
Movie Recommendation Engine
============================
Implements two complementary ML techniques:

1. Content-Based Filtering
   - Builds a TF-IDF matrix from movie genres (+ title tokens).
   - Uses cosine similarity to find movies with the most similar content profile.
   - Fast lookup via a pre-computed similarity matrix.

2. Collaborative Filtering (User-Item)
   - Builds a user × movie rating matrix, fills missing ratings with the per-movie mean.
   - Computes movie–movie cosine similarity on the filled matrix.
   - Given an input movie, returns other movies that were rated similarly by users.

The final /recommend endpoint blends both lists (content first, collaborative second)
and deduplicates to surface diverse high-quality recommendations.
"""

import os
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Optional
import re

# ── Data paths ────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

MOVIES_PATH  = os.path.join(DATA_DIR, "movies.csv")
RATINGS_PATH = os.path.join(DATA_DIR, "ratings.csv")


class MovieRecommender:
    """Unified recommendation engine: content-based + collaborative filtering."""

    def __init__(self):
        self.movies_df: Optional[pd.DataFrame] = None
        self.ratings_df: Optional[pd.DataFrame] = None
        self.content_sim: Optional[np.ndarray] = None   # shape (n_movies, n_movies)
        self.collab_sim:  Optional[np.ndarray] = None   # shape (n_movies, n_movies)
        self.movie_index: Dict[int, int] = {}            # movieId → row index
        self._is_loaded = False

    # ── Loading & preprocessing ────────────────────────────────────────────────

    def load_data(self):
        """Load CSVs and run preprocessing + model fitting."""
        self.movies_df  = pd.read_csv(MOVIES_PATH)
        self.ratings_df = pd.read_csv(RATINGS_PATH)

        # Load movie overviews dict
        overviews_path = os.path.join(os.path.dirname(BASE_DIR), 'frontend', 'src', 'utils', 'movie_overviews.json')
        if os.path.exists(overviews_path):
            import json
            with open(overviews_path, 'r', encoding='utf-8') as f:
                self.overviews_dict = json.load(f)
        else:
            self.overviews_dict = {}

        self._preprocess()
        self._build_content_model()
        self._build_collaborative_model()

        # Build lookup: movieId → positional index in movies_df
        self.movie_index = {mid: idx for idx, mid in enumerate(self.movies_df["movieId"])}
        self._is_loaded = True
        print(f"[Recommender] Loaded {len(self.movies_df)} movies, "
              f"{len(self.ratings_df)} ratings.")

    def _preprocess(self):
        """Clean data and derive helper columns."""
        # Extract year from title like "Movie Name (1994)"
        self.movies_df["year"] = (
            self.movies_df["title"]
            .str.extract(r"\((\d{4})\)$")
            .astype(float)
        )
        # Clean title: remove trailing (year)
        self.movies_df["clean_title"] = (
            self.movies_df["title"]
            .str.replace(r"\s*\(\d{4}\)$", "", regex=True)
            .str.strip()
        )
        # Genre list for display
        self.movies_df["genre_list"] = (
            self.movies_df["genres"]
            .str.split("|")
        )

        # Aggregate ratings stats per movie
        stats = (
            self.ratings_df
            .groupby("movieId")["rating"]
            .agg(avg_rating="mean", rating_count="count")
            .reset_index()
        )
        stats["avg_rating"] = stats["avg_rating"].round(2)
        self.movies_df = self.movies_df.merge(stats, on="movieId", how="left")
        self.movies_df["avg_rating"]   = self.movies_df["avg_rating"].fillna(3.0)
        self.movies_df["rating_count"] = self.movies_df["rating_count"].fillna(0).astype(int)

        # Popularity score (for trending endpoint) – Bayesian average
        C = self.movies_df["avg_rating"].mean()
        m = self.movies_df["rating_count"].quantile(0.25)
        self.movies_df["popularity_score"] = (
            (self.movies_df["rating_count"] / (self.movies_df["rating_count"] + m))
            * self.movies_df["avg_rating"]
            + (m / (self.movies_df["rating_count"] + m)) * C
        ).round(4)

    # ── Content-Based Model ────────────────────────────────────────────────────

    def _build_content_model(self):
        """
        Build TF-IDF representation from genres + title tokens.
        Genre pipe-characters are replaced with spaces so each genre becomes a term.
        """
        def content_string(row):
            # Repeat genres to increase their weight vs title words
            genres_text = row["genres"].replace("|", " ").lower()
            title_text  = re.sub(r"[^a-z0-9 ]", " ",
                                  row["clean_title"].lower())
            return f"{genres_text} {genres_text} {title_text}"

        self.movies_df["content"] = self.movies_df.apply(content_string, axis=1)

        tfidf = TfidfVectorizer(
            ngram_range=(1, 2),
            min_df=1,
            stop_words="english",
        )
        tfidf_matrix = tfidf.fit_transform(self.movies_df["content"])
        self.content_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)

    # ── Collaborative Filtering Model ─────────────────────────────────────────

    def _build_collaborative_model(self):
        """
        Item-Item collaborative filtering:
        1. Build user-item rating matrix.
        2. Fill missing values with item (movie) mean rating.
        3. Compute cosine similarity between item vectors.
        """
        # Pivot: rows = movies, columns = users
        pivot = self.ratings_df.pivot_table(
            index="movieId",
            columns="userId",
            values="rating"
        )
        # Align with movies_df order
        pivot = pivot.reindex(self.movies_df["movieId"])
        # Fill NaN with column (user) mean, then row (movie) mean as fallback
        pivot = pivot.fillna(pivot.mean(axis=0))
        row_means = pivot.mean(axis=1)
        for col in pivot.columns:
            pivot[col] = pivot[col].fillna(row_means)
        pivot = pivot.fillna(3.0)

        self.collab_sim = cosine_similarity(pivot.values, pivot.values)

    # ── Recommendation Methods ─────────────────────────────────────────────────

    def _sim_recommendations(
        self,
        movie_idx: int,
        sim_matrix: np.ndarray,
        n: int,
    ) -> List[int]:
        """Return row-indices of top-n most similar movies (excluding itself)."""
        scores = list(enumerate(sim_matrix[movie_idx]))
        scores.sort(key=lambda x: x[1], reverse=True)
        # Skip index 0 (itself)
        return [idx for idx, _ in scores[1: n + 1]]

    def recommend_by_movie(
        self,
        movie_id: int,
        n: int = 10,
        method: str = "hybrid",
    ) -> List[Dict]:
        """
        Recommend movies similar to a given movie.

        Parameters
        ----------
        movie_id : int  – MovieLens movieId
        n        : int  – number of results
        method   : str  – 'content' | 'collaborative' | 'hybrid'
        """
        if movie_id not in self.movie_index:
            return []

        idx = self.movie_index[movie_id]

        if method == "content":
            indices = self._sim_recommendations(idx, self.content_sim, n)
        elif method == "collaborative":
            indices = self._sim_recommendations(idx, self.collab_sim, n)
        else:  # hybrid: interleave content + collaborative, deduplicate
            c_indices = self._sim_recommendations(idx, self.content_sim, n * 2)
            cf_indices = self._sim_recommendations(idx, self.collab_sim, n * 2)
            seen, indices = set(), []
            for pair in zip(c_indices, cf_indices):
                for i in pair:
                    if i not in seen:
                        seen.add(i)
                        indices.append(i)
            indices = indices[:n]

        return self._rows_to_dicts(self.movies_df.iloc[indices])

    def recommend_by_genre(self, genre: str, n: int = 10) -> List[Dict]:
        """Return top-n movies matching a genre, sorted by popularity."""
        mask = self.movies_df["genres"].str.contains(genre, case=False, na=False)
        subset = self.movies_df[mask].sort_values("popularity_score", ascending=False)
        return self._rows_to_dicts(subset.head(n))

    def search_movies(self, query: str, n: int = 20) -> List[Dict]:
        """Case-insensitive substring search on clean_title."""
        mask = self.movies_df["clean_title"].str.contains(
            re.escape(query), case=False, na=False
        )
        subset = self.movies_df[mask].sort_values("popularity_score", ascending=False)
        return self._rows_to_dicts(subset.head(n))

    def get_trending(self, n: int = 20) -> List[Dict]:
        """Return top-n popular movies (Bayesian-scored)."""
        # Only consider movies with at least 5 ratings
        subset = self.movies_df[self.movies_df["rating_count"] >= 5]
        top = subset.sort_values("popularity_score", ascending=False).head(n)
        return self._rows_to_dicts(top)

    def get_movie_by_id(self, movie_id: int) -> Optional[Dict]:
        """Fetch a single movie record by movieId."""
        row = self.movies_df[self.movies_df["movieId"] == movie_id]
        if row.empty:
            return None
        return self._row_to_dict(row.iloc[0])

    def get_all_movies(self, page: int = 1, per_page: int = 50) -> Dict:
        """Paginated list of all movies."""
        total = len(self.movies_df)
        start = (page - 1) * per_page
        end   = start + per_page
        subset = self.movies_df.iloc[start:end]
        return {
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page,
            "movies": self._rows_to_dicts(subset),
        }

    def get_genres(self) -> List[str]:
        """Return sorted list of all unique genres."""
        all_genres: set = set()
        for genres in self.movies_df["genres"].dropna():
            all_genres.update(genres.split("|"))
        return sorted(all_genres)

    # ── Serialisation helpers ──────────────────────────────────────────────────

    def _row_to_dict(self, row: pd.Series) -> Dict:
        mid_str = str(int(row["movieId"]))
        overview = self.overviews_dict.get(mid_str, "") if hasattr(self, 'overviews_dict') else ""
        return {
            "movieId":       int(row["movieId"]),
            "title":         row["title"],
            "clean_title":   row["clean_title"],
            "genres":        row["genres"],
            "genre_list":    row["genre_list"] if isinstance(row["genre_list"], list)
                             else row["genres"].split("|"),
            "year":          int(row["year"]) if pd.notna(row["year"]) else None,
            "avg_rating":    float(row["avg_rating"]),
            "rating_count":  int(row["rating_count"]),
            "popularity":    float(row["popularity_score"]),
            "overview":      overview,
        }

    def _rows_to_dicts(self, df: pd.DataFrame) -> List[Dict]:
        return [self._row_to_dict(row) for _, row in df.iterrows()]


# ── Singleton (imported by FastAPI app) ───────────────────────────────────────
recommender = MovieRecommender()
