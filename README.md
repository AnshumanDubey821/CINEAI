# 🎬 CineAI — Movie Recommendation System

A full-stack machine learning movie recommendation system built with **FastAPI** (Python) and **React**.
Uses the **MovieLens** dataset with **Content-Based Filtering** (TF-IDF + cosine similarity)
and **Collaborative Filtering** (item-item similarity from user ratings).

---

## 📁 Project Structure

```
movie-recommender/
├── backend/
│   ├── main.py                  ← FastAPI app entry point
│   ├── requirements.txt         ← Python dependencies
│   ├── data/
│   │   ├── movies.csv           ← Movie titles + genres
│   │   ├── ratings.csv          ← User ratings
│   │   └── generate_data.py     ← Script to regenerate synthetic data
│   ├── model/
│   │   └── recommender.py       ← ML engine (TF-IDF + Collaborative)
│   └── routes/
│       ├── movies.py            ← /movies endpoints
│       └── recommend.py         ← /recommend endpoints
│
└── frontend/
    ├── package.json
    └── src/
        ├── App.js
        ├── index.js / index.css
        ├── utils/
        │   └── api.js           ← Axios API helpers
        ├── components/
        │   ├── Navbar.jsx/css
        │   ├── Footer.jsx/css
        │   ├── MovieCard.jsx/css
        │   ├── MovieGrid.jsx/css
        │   └── SectionHeader.jsx/css
        └── pages/
            ├── HomePage.jsx/css
            ├── MovieDetailPage.jsx/css
            ├── RecommendPage.jsx/css
            └── BrowsePage.jsx/css
```

---

## ⚙️ Prerequisites

- **Python 3.9+** — https://www.python.org/downloads/
- **Node.js 18+** — https://nodejs.org/
- **VS Code** — https://code.visualstudio.com/
- **Git** (optional)

---

## 🚀 Step-by-Step Setup in VS Code

### 1. Open the Project

```bash
# Open VS Code in the project root
code movie-recommender
```

---

### 2. Backend Setup

Open a **new terminal** in VS Code (`Ctrl+`` ` or Terminal → New Terminal`):

```bash
# Navigate to backend
cd backend

# (Recommended) Create a virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

# Install all Python dependencies
pip install -r requirements.txt
```

#### Using Real MovieLens Data (Recommended)

Download the MovieLens dataset and replace the generated CSV files:

```bash
# Option A: Download ml-latest-small (100k ratings, 9k movies)
# Go to: https://grouplens.org/datasets/movielens/latest/
# Download ml-latest-small.zip, extract it, then:
cp ml-latest-small/movies.csv backend/data/movies.csv
cp ml-latest-small/ratings.csv backend/data/ratings.csv

# Option B: Use the synthetic data already in backend/data/ (389 movies, ~14k ratings)
# No action needed — it works out of the box.
```

#### Start the Backend Server

```bash
# Make sure you're in the backend/ directory
uvicorn main:app --reload --port 8000
```

You should see:
```
🎬 Loading movie recommendation engine…
✅ Engine ready!
INFO:     Uvicorn running on http://127.0.0.1:8000
```

**📖 Interactive API docs:** http://localhost:8000/docs

---

### 3. Frontend Setup

Open a **second terminal** in VS Code:

```bash
# Navigate to frontend
cd frontend

# Install Node.js dependencies
npm install

# Start the React development server
npm start
```

The app opens automatically at **http://localhost:3000** 🎉

---

## 🌐 API Endpoints

### Movies

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/movies/` | All movies (paginated) |
| GET | `/movies/trending?n=20` | Top-rated trending movies |
| GET | `/movies/search?q=dark+knight` | Search by title |
| GET | `/movies/genres` | All unique genres |
| GET | `/movies/{id}` | Single movie details |

### Recommendations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/recommend/by-movie` | Recommend by movie ID |
| POST | `/recommend/by-genre` | Recommend by genre |
| GET | `/recommend/similar/{id}` | GET version of by-movie |

---

## 📬 Sample API Requests & Responses

### GET `/movies/trending?n=3`

```json
{
  "count": 3,
  "movies": [
    {
      "movieId": 99,
      "title": "Fight Club (1999)",
      "clean_title": "Fight Club",
      "genres": "Drama|Mystery|Thriller",
      "genre_list": ["Drama", "Mystery", "Thriller"],
      "year": 1999,
      "avg_rating": 4.3,
      "rating_count": 58,
      "popularity": 0.9821
    }
  ]
}
```

### POST `/recommend/by-movie`

**Request:**
```json
{
  "movie_id": 3,
  "n": 5,
  "method": "hybrid"
}
```

**Response:**
```json
{
  "seed_movie": {
    "movieId": 3,
    "clean_title": "The Dark Knight",
    "genres": "Action|Crime|Drama",
    "avg_rating": 4.5
  },
  "method": "hybrid",
  "count": 5,
  "recommendations": [
    {
      "movieId": 71,
      "clean_title": "The Dark Knight Rises",
      "genres": "Action|Crime|Drama|Thriller",
      "avg_rating": 4.1,
      "rating_count": 44
    },
    ...
  ]
}
```

### POST `/recommend/by-genre`

**Request:**
```json
{ "genre": "Sci-Fi", "n": 5 }
```

**Response:**
```json
{
  "genre": "Sci-Fi",
  "count": 5,
  "recommendations": [
    { "movieId": 11, "clean_title": "Inception", "genres": "Action|Adventure|Sci-Fi", "avg_rating": 4.4 },
    ...
  ]
}
```

---

## 🧠 ML Logic Explained

### 1. Content-Based Filtering (TF-IDF)

**How it works:**
1. Each movie gets a "content string" — genres repeated twice (for emphasis) + title words.
2. A **TF-IDF vectorizer** converts each string into a high-dimensional vector where each dimension represents a term's importance.
3. **Cosine similarity** is computed between all movie vectors.
4. For a query movie, we return the top-N most similar ones.

**Why it works well:**
- Recommends movies with similar genres and thematic content.
- Fast (pre-computed similarity matrix).
- Works even for new movies with no rating history.

**Example:** "The Dark Knight" → other *Action|Crime|Drama* films like "No Country for Old Men", "Heat".

---

### 2. Collaborative Filtering (Item-Item)

**How it works:**
1. Build a **user × movie rating matrix** (users as columns, movies as rows).
2. Fill missing ratings with the per-movie mean (item-based imputation).
3. Compute **cosine similarity between movie rows** (not users) — this is *item-item CF*.
4. Movies rated similarly by the same users end up with high similarity scores.

**Why it works well:**
- Captures taste patterns beyond genre — "users who loved Interstellar also loved Arrival".
- Discovers non-obvious connections between films.

**Limitation:** Suffers from the *cold-start problem* — new movies with few ratings get poor collaborative scores.

---

### 3. Hybrid Method

Interleaves results from both methods (content-based first, collaborative second) and deduplicates.

This combines:
- The *precision* of content-based (genre-accurate)
- The *serendipity* of collaborative (unexpected but user-validated picks)

---

## 🎨 Frontend Features

| Feature | Details |
|---------|---------|
| 🏠 Homepage | Hero search, trending movies, genre browser |
| 🔍 Live Search | Debounced search with instant dropdown results |
| 🎬 Movie Detail | Full movie info, rating bar, similar movies by 3 ML methods |
| 🤖 Recommender | Pick movie + ML algorithm + count slider |
| 🎭 Genre Mode | Browse top movies by any genre |
| 📖 Browse | Paginated movie catalog with search + genre filters |
| 💀 Skeleton UI | Shimmer loading placeholders on all grids |
| 📱 Responsive | Mobile-friendly layout |

---

## 🔧 Troubleshooting

**Backend won't start:**
```bash
# Make sure venv is activated and dependencies installed
pip install -r requirements.txt
# Check Python version
python --version  # needs 3.9+
```

**Frontend won't connect to API:**
- Ensure backend is running on port 8000
- Check `frontend/src/utils/api.js` baseURL (should be `http://localhost:8000`)
- CORS is already configured in `backend/main.py` for `localhost:3000`

**`npm install` fails:**
```bash
# Try clearing cache
npm cache clean --force
npm install
```

**Port conflicts:**
```bash
# Backend on different port
uvicorn main:app --reload --port 8001
# Then update frontend/src/utils/api.js baseURL to http://localhost:8001
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI, Python 3.9+ |
| ML | Scikit-learn (TF-IDF, cosine_similarity) |
| Data | Pandas, NumPy |
| Server | Uvicorn (ASGI) |
| Frontend | React 18, React Router v6 |
| HTTP | Axios |
| Styling | Pure CSS with CSS variables |
| Fonts | Playfair Display + DM Sans |

---

## 🗺️ Upgrading to Real MovieLens Data

For a production-quality recommender, download the full MovieLens dataset:

```
https://grouplens.org/datasets/movielens/latest/
```

- **ml-latest-small**: 100k ratings, ~9k movies (fast, good for dev)
- **ml-latest**: 33M ratings, ~87k movies (best quality, slower to train)

Replace `backend/data/movies.csv` and `backend/data/ratings.csv`.
The recommender will automatically use the new data on next startup.
