"""
Rate Limiter Middleware for FastAPI
====================================
Sliding-window token bucket rate limiter to protect API endpoints and API keys.
"""
import time
import os
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from fastapi import Request

# Get rate limit from environment variable (default: 60 requests per minute)
RATE_LIMIT = int(os.getenv("RATE_LIMIT_PER_MINUTE", 60))
WINDOW_SECONDS = 60


class RateLimiterMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, rate_limit: int = RATE_LIMIT, window: int = WINDOW_SECONDS):
        super().__init__(app)
        self.rate_limit = rate_limit
        self.window = window
        self.client_requests = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for static docs and health checks
        path = request.url.path
        if path in ["/docs", "/openapi.json", "/favicon.ico", "/health"]:
            return await call_next(request)

        # Identify client by IP address or API key header
        client_ip = request.client.host if request.client else "127.0.0.1"
        api_key = request.headers.get("X-API-Key") or client_ip

        now = time.time()
        window_start = now - self.window

        # Clean old timestamps
        timestamps = [t for t in self.client_requests[api_key] if t > window_start]
        self.client_requests[api_key] = timestamps

        if len(timestamps) >= self.rate_limit:
            retry_after = int(self.window - (now - timestamps[0]))
            headers = {
                "X-RateLimit-Limit": str(self.rate_limit),
                "X-RateLimit-Remaining": "0",
                "Retry-After": str(max(1, retry_after)),
            }
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Too Many Requests",
                    "message": f"Rate limit exceeded ({self.rate_limit} requests per minute). Please try again in {max(1, retry_after)} seconds.",
                    "retry_after": max(1, retry_after)
                },
                headers=headers
            )

        # Record this request timestamp
        self.client_requests[api_key].append(now)

        response = await call_next(request)

        # Add rate limit headers to response
        remaining = self.rate_limit - len(self.client_requests[api_key])
        response.headers["X-RateLimit-Limit"] = str(self.rate_limit)
        response.headers["X-RateLimit-Remaining"] = str(max(0, remaining))

        return response
