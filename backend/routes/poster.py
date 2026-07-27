"""
Routes: /poster
==============
Proxy endpoint for fetching high-resolution posters using server-side hidden API keys.
"""
from fastapi import APIRouter, Query
import urllib.request
import urllib.parse
import json
import re
import os

router = APIRouter(prefix="/poster", tags=["Poster Proxy"])

# Load API Key from environment or fallback
OMDB_API_KEY = os.getenv("OMDB_API_KEY", "trilogy")


@router.get("/fetch")
def fetch_poster(
    title: str = Query(..., description="Movie clean title"),
    year: str = Query(None, description="Release year"),
):
    """
    Server-side poster fetcher proxy.
    Hides OMDb API keys from the frontend client.
    """
    clean_t = re.sub(r"\s*\(\d{4}\)$", "", title).strip() if title else ""
    if not clean_t:
        return {"poster": None}

    encoded_title = urllib.parse.quote(clean_t)
    year_param = f"&y={year}" if year else ""
    url = f"https://www.omdbapi.com/?t={encoded_title}{year_param}&apikey={OMDB_API_KEY}"

    try:
        req = urllib.request.Request(url, headers={"User-Agent": "CineAI-Backend/1.0"})
        with urllib.request.urlopen(req, timeout=4) as res:
            data = json.loads(res.read().decode("utf-8"))
            if data and data.get("Poster") and data.get("Poster") != "N/A":
                return {"poster": data["Poster"], "source": "omdb_exact"}

        # Fuzzy search fallback
        url_search = f"https://www.omdbapi.com/?s={encoded_title}&apikey={OMDB_API_KEY}"
        req_s = urllib.request.Request(url_search, headers={"User-Agent": "CineAI-Backend/1.0"})
        with urllib.request.urlopen(req_s, timeout=4) as res_s:
            data_s = json.loads(res_s.read().decode("utf-8"))
            if data_s and data_s.get("Search") and len(data_s["Search"]) > 0:
                found_poster = data_s["Search"][0].get("Poster")
                if found_poster and found_poster != "N/A":
                    return {"poster": found_poster, "source": "omdb_fuzzy"}
    except Exception as e:
        print(f"[Poster Proxy Warning] Failed to fetch poster for '{clean_t}': {e}")

    return {"poster": None}
